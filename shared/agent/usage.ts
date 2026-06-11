export interface AgentUsageInputTokensDetails {
  cachedTokens?: number
}

export interface AgentUsageOutputTokensDetails {
  reasoningTokens?: number
}

export interface AgentUsageCostDetails {
  upstreamInferenceCost?: number | null
  upstreamInferenceInputCost?: number
  upstreamInferenceOutputCost?: number
}

/** Mirrors OpenRouter Usage — https://github.com/OpenRouterTeam/typescript-sdk/blob/main/src/models/usage.ts */
export interface AgentUsageRecord {
  inputTokens?: number
  inputTokensDetails?: AgentUsageInputTokensDetails
  outputTokens?: number
  outputTokensDetails?: AgentUsageOutputTokensDetails
  totalTokens?: number
  cost?: number | null
  costDetails?: AgentUsageCostDetails
  isByok?: boolean
}
