import { randomUUID } from 'node:crypto'
import type { AgentUsageRecord } from '../../shared/agent/usage.js'
import { insertUsageEvent } from '../db/usageRepository.js'
import type { AgentUsageScope } from '../db/types.js'

export interface RecordAgentUsageInput {
  userId: string
  scope: AgentUsageScope
  model: string
  usage?: AgentUsageRecord
  clientIp?: string | null
}

export function recordAgentUsage(input: RecordAgentUsageInput): void {
  const usage = input.usage
  insertUsageEvent({
    id: randomUUID(),
    userId: input.userId,
    scope: input.scope,
    model: input.model,
    inputTokens: usage?.inputTokens ?? 0,
    cachedTokens: usage?.inputTokensDetails?.cachedTokens ?? 0,
    outputTokens: usage?.outputTokens ?? 0,
    reasoningTokens: usage?.outputTokensDetails?.reasoningTokens ?? 0,
    totalTokens: usage?.totalTokens ?? 0,
    costUsd: usage?.cost ?? null,
    upstreamInferenceCostUsd: usage?.costDetails?.upstreamInferenceCost ?? null,
    upstreamInferenceInputCostUsd: usage?.costDetails?.upstreamInferenceInputCost ?? null,
    upstreamInferenceOutputCostUsd: usage?.costDetails?.upstreamInferenceOutputCost ?? null,
    isByok: usage?.isByok ?? false,
    clientIp: input.clientIp ?? null,
    createdAt: new Date().toISOString(),
  })
}
