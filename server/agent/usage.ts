import type { AgentUsageRecord } from '../../shared/agent/usage.js'

interface RawUsage {
  inputTokens?: number
  inputTokensDetails?: { cachedTokens?: number }
  outputTokens?: number
  outputTokensDetails?: { reasoningTokens?: number }
  totalTokens?: number
  cost?: number | null
  costDetails?: {
    upstreamInferenceCost?: number | null
    upstreamInferenceInputCost?: number
    upstreamInferenceOutputCost?: number
  }
  isByok?: boolean
}

export function normalizeAgentUsage(raw: RawUsage | null | undefined): AgentUsageRecord | undefined {
  if (!raw) return undefined

  const hasTokens =
    raw.inputTokens !== undefined ||
    raw.outputTokens !== undefined ||
    raw.totalTokens !== undefined

  if (!hasTokens && raw.cost === undefined) return undefined

  return {
    inputTokens: raw.inputTokens,
    inputTokensDetails: raw.inputTokensDetails,
    outputTokens: raw.outputTokens,
    outputTokensDetails: raw.outputTokensDetails,
    totalTokens: raw.totalTokens,
    cost: raw.cost,
    costDetails: raw.costDetails,
    isByok: raw.isByok,
  }
}
