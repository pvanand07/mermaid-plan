import { Hono } from 'hono'
import { getPlan, getPlanLimits } from '../db/planRepository.js'
import { getUserById } from '../db/userRepository.js'
import type { AgentUsageScope } from '../db/types.js'
import { RATE_LIMIT_WINDOWS } from '../db/types.js'
import { countEventsByWindow, monthStartIso, sumCostSince } from '../db/usageRepository.js'
import type { AppVariables } from '../middleware/resolveUser.js'
import { resolveUser } from '../middleware/resolveUser.js'

const USAGE_SCOPES: AgentUsageScope[] = ['stream', 'continue', 'chat', 'global']

export const usageRoutes = new Hono<{ Variables: AppVariables }>()

usageRoutes.use('*', resolveUser)

usageRoutes.get('/me', (c) => {
  const userId = c.get('userId')
  const user = getUserById(userId)
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  const plan = getPlan(user.plan_id)
  const limits = getPlanLimits(user.plan_id)

  const used: Record<string, Record<string, number>> = {}
  for (const scope of USAGE_SCOPES) {
    used[scope] = countEventsByWindow(userId, scope)
  }

  const monthUsd = sumCostSince(userId, monthStartIso())
  const costCap = plan?.monthly_cost_cap_usd ?? null

  return c.json({
    plan: {
      id: user.plan_id,
      name: plan?.name ?? user.plan_id,
      monthlyCostCapUsd: costCap,
    },
    limits,
    used,
    cost: {
      monthUsd,
      capUsd: costCap,
      remainingUsd: costCap !== null ? Math.max(0, costCap - monthUsd) : null,
    },
    windows: RATE_LIMIT_WINDOWS,
    isAnonymous: c.get('isAnonymous'),
    user: {
      id: user.id,
      email: user.email,
      givenName: user.given_name,
      familyName: user.family_name,
      picture: user.picture,
    },
    resetsAt: {
      month: monthStartIso(),
    },
  })
})
