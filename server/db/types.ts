import type { RateLimitBucket, RateLimitWindow } from '../config.js'

export type AgentUsageScope = 'stream' | 'continue' | 'chat' | 'global'

export type PlanLimits = Record<AgentUsageScope, RateLimitBucket>

export interface PlanRow {
  id: string
  name: string
  limits_json: string
  monthly_cost_cap_usd: number | null
}

export interface UserRow {
  id: string
  kinde_id: string | null
  anonymous_key: string | null
  email: string | null
  given_name: string | null
  family_name: string | null
  picture: string | null
  plan_id: string
  created_at: string
  updated_at: string
  last_seen_at: string
}

export interface UsageEventInsert {
  id: string
  userId: string
  scope: AgentUsageScope
  model: string
  inputTokens: number
  cachedTokens: number
  outputTokens: number
  reasoningTokens: number
  totalTokens: number
  costUsd: number | null
  upstreamInferenceCostUsd: number | null
  upstreamInferenceInputCostUsd: number | null
  upstreamInferenceOutputCostUsd: number | null
  isByok: boolean
  clientIp: string | null
  createdAt: string
}

export const RATE_LIMIT_WINDOWS: RateLimitWindow[] = ['minute', 'hour', 'day', 'week', 'month']
