import type { RateLimitWindow } from '../config.js'
import { getDatabase } from './sqlite.js'
import type { AgentUsageScope, UsageEventInsert } from './types.js'
import { RATE_LIMIT_WINDOWS } from './types.js'

const WINDOW_MS: Record<RateLimitWindow, number> = {
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 2_592_000_000,
}

export function windowStartIso(window: RateLimitWindow): string {
  return new Date(Date.now() - WINDOW_MS[window]).toISOString()
}

export function currentYearMonth(): string {
  const now = new Date()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  return `${now.getUTCFullYear()}-${month}`
}

export function monthStartIso(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

export function insertUsageEvent(event: UsageEventInsert): void {
  getDatabase()
    .prepare(
      `INSERT INTO usage_events (
        id, user_id, scope, model,
        input_tokens, cached_tokens, output_tokens, reasoning_tokens, total_tokens,
        cost_usd, upstream_inference_cost_usd,
        upstream_inference_input_cost_usd, upstream_inference_output_cost_usd,
        is_byok, client_ip, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      event.id,
      event.userId,
      event.scope,
      event.model,
      event.inputTokens,
      event.cachedTokens,
      event.outputTokens,
      event.reasoningTokens,
      event.totalTokens,
      event.costUsd,
      event.upstreamInferenceCostUsd,
      event.upstreamInferenceInputCostUsd,
      event.upstreamInferenceOutputCostUsd,
      event.isByok ? 1 : 0,
      event.clientIp,
      event.createdAt,
    )
}

export function countEventsInWindow(
  userId: string,
  scope: AgentUsageScope,
  sinceIso: string,
): number {
  const row = getDatabase()
    .prepare(
      `SELECT COUNT(*) AS count FROM usage_events
       WHERE user_id = ? AND scope = ? AND created_at >= ?`,
    )
    .get(userId, scope, sinceIso) as { count: number }
  return row.count
}

export function countEventsByWindow(
  userId: string,
  scope: AgentUsageScope,
): Record<RateLimitWindow, number> {
  const result = {} as Record<RateLimitWindow, number>
  for (const window of RATE_LIMIT_WINDOWS) {
    result[window] = countEventsInWindow(userId, scope, windowStartIso(window))
  }
  return result
}

export function sumCostSince(userId: string, sinceIso: string): number {
  const row = getDatabase()
    .prepare(
      `SELECT COALESCE(SUM(cost_usd), 0) AS total FROM usage_events
       WHERE user_id = ? AND created_at >= ?`,
    )
    .get(userId, sinceIso) as { total: number }
  return row.total
}

export function sumCostInMonth(userId: string): number {
  return sumCostSince(userId, monthStartIso())
}
