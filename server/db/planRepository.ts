import type { RateLimitBucket } from '../config.js'
import { getDatabase } from './sqlite.js'
import type { AgentUsageScope, PlanLimits, PlanRow } from './types.js'

function parsePlanLimits(json: string): PlanLimits {
  return JSON.parse(json) as PlanLimits
}

export function getPlan(planId: string): PlanRow | undefined {
  return getDatabase()
    .prepare('SELECT * FROM plans WHERE id = ?')
    .get(planId) as PlanRow | undefined
}

export function getPlanLimits(planId: string): PlanLimits | undefined {
  const plan = getPlan(planId)
  if (!plan) return undefined
  return parsePlanLimits(plan.limits_json)
}

export function getScopeLimits(
  planId: string,
  scope: AgentUsageScope,
): RateLimitBucket | undefined {
  const limits = getPlanLimits(planId)
  return limits?.[scope]
}

export function getMonthlyCostCap(planId: string): number | null {
  const plan = getPlan(planId)
  return plan?.monthly_cost_cap_usd ?? null
}
