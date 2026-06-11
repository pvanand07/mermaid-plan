import type { MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import type { Hono } from 'hono'
import { config, type RateLimitBucket, type RateLimitWindow } from '../config.js'
import { clientIp } from './clientIp.js'

const WINDOW_MS: Record<RateLimitWindow, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000, // 30-day rolling window
}

const WINDOW_ORDER: RateLimitWindow[] = ['minute', 'hour', 'day', 'week', 'month']

export type RateLimitScope = keyof typeof config.rateLimit.buckets

const RETRY_HINT: Record<RateLimitWindow, string> = {
  minute: 'in a little while',
  hour: 'in about an hour',
  day: 'later today',
  week: 'in a few days',
  month: 'later this month',
}

const SCOPE_REASON: Record<RateLimitScope, string> = {
  stream: 'Too many chat messages were sent',
  continue: 'Too many diagram updates are in progress',
  global: 'AI usage limit reached',
  chat: 'This chat endpoint is temporarily unavailable',
  health: 'Too many health check requests',
}

function buildRateLimitError(scope: RateLimitScope, window: RateLimitWindow): string {
  const reason = SCOPE_REASON[scope]
  const retry = RETRY_HINT[window]
  return `${reason}. Please try again ${retry}.`
}

function createWindowLimiter(
  scope: RateLimitScope,
  window: RateLimitWindow,
  limit: number,
): MiddlewareHandler {
  return rateLimiter({
    windowMs: WINDOW_MS[window],
    limit,
    standardHeaders: 'draft-6',
    keyGenerator: (c) => `${scope}:${window}:${clientIp(c)}`,
    handler: (c) => {
      const retryAfterSeconds = Math.ceil(WINDOW_MS[window] / 1000)
      return c.json(
        {
          error: buildRateLimitError(scope, window),
          scope,
          window,
          retryAfterSeconds,
        },
        429,
        { 'Retry-After': String(retryAfterSeconds) },
      )
    },
  })
}

export function tieredRateLimitMiddleware(
  scope: RateLimitScope,
  limits: RateLimitBucket,
): MiddlewareHandler[] {
  return WINDOW_ORDER.map((window) => createWindowLimiter(scope, window, limits[window]))
}

export function applyTieredRateLimits(app: Hono, path: string, scope: RateLimitScope): void {
  const limits = config.rateLimit.buckets[scope]
  for (const middleware of tieredRateLimitMiddleware(scope, limits)) {
    app.use(path, middleware)
  }
}
