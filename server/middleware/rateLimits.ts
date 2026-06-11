import type { MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import type { Hono } from 'hono'
import { config, type RateLimitWindow } from '../config.js'
import { getMonthlyCostCap, getScopeLimits } from '../db/planRepository.js'
import type { AgentUsageScope } from '../db/types.js'
import { countEventsInWindow, sumCostInMonth, windowStartIso } from '../db/usageRepository.js'
import { RATE_LIMIT_WINDOWS } from '../db/types.js'
import type { AppVariables } from './resolveUser.js'
import { clientIp } from './clientIp.js'

const WINDOW_MS: Record<RateLimitWindow, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
}

const RETRY_HINT: Record<RateLimitWindow, string> = {
  minute: 'in a little while',
  hour: 'in about an hour',
  day: 'later today',
  week: 'in a few days',
  month: 'later this month',
}

const SCOPE_REASON: Record<AgentUsageScope, string> = {
  stream: 'Too many chat messages were sent',
  continue: 'Too many diagram updates are in progress',
  global: 'AI usage limit reached',
  chat: 'This chat endpoint is temporarily unavailable',
}

function buildRateLimitError(scope: AgentUsageScope, window: RateLimitWindow): string {
  const reason = SCOPE_REASON[scope]
  const retry = RETRY_HINT[window]
  return `${reason}. Please try again ${retry}.`
}

function createHealthLimiter(window: RateLimitWindow, limit: number): MiddlewareHandler {
  return rateLimiter({
    windowMs: WINDOW_MS[window],
    limit,
    standardHeaders: 'draft-6',
    keyGenerator: (c) => `health:${window}:${clientIp(c)}`,
    handler: (c) => {
      const retryAfterSeconds = Math.ceil(WINDOW_MS[window] / 1000)
      return c.json(
        {
          error: `Too many health check requests. Please try again ${RETRY_HINT[window]}.`,
          scope: 'health',
          window,
          retryAfterSeconds,
        },
        429,
        { 'Retry-After': String(retryAfterSeconds) },
      )
    },
  })
}

export function planRateLimitMiddleware(scope: AgentUsageScope): MiddlewareHandler<{ Variables: AppVariables }> {
  return async (c, next) => {
    if (!config.rateLimit.enabled) {
      await next()
      return
    }

    const userId = c.get('userId')
    const planId = c.get('planId') ?? config.anonymousPlanId
    const limits = getScopeLimits(planId, scope)

    if (limits) {
      for (const window of RATE_LIMIT_WINDOWS) {
        const count = countEventsInWindow(userId, scope, windowStartIso(window))
        if (count >= limits[window]) {
          const retryAfterSeconds = Math.ceil(WINDOW_MS[window] / 1000)
          return c.json(
            {
              error: buildRateLimitError(scope, window),
              scope,
              window,
              planId,
              retryAfterSeconds,
            },
            429,
            { 'Retry-After': String(retryAfterSeconds) },
          )
        }
      }
    }

    const costCap = getMonthlyCostCap(planId)
    if (costCap !== null) {
      const spent = sumCostInMonth(userId)
      if (spent >= costCap) {
        return c.json(
          {
            error: 'Monthly AI spend limit reached for your plan. Please try again next month or upgrade.',
            scope: 'cost',
            planId,
            spentUsd: spent,
            capUsd: costCap,
          },
          429,
        )
      }
    }

    await next()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyHealthRateLimits(app: Hono<any>, path: string): void {
  if (!config.rateLimit.enabled) return
  const limits = config.rateLimit.buckets.health
  for (const window of RATE_LIMIT_WINDOWS) {
    app.use(path, createHealthLimiter(window, limits[window]))
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyPlanRateLimits(app: Hono<any>, path: string, scope: AgentUsageScope): void {
  app.use(path, planRateLimitMiddleware(scope))
}
