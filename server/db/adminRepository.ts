import { getPlan } from './planRepository.js'
import { getDatabase } from './sqlite.js'
import type { UserRow } from './types.js'
import { monthStartIso } from './usageRepository.js'

export interface AdminUserSummary {
  id: string
  email: string | null
  givenName: string | null
  familyName: string | null
  picture: string | null
  planId: string
  planName: string
  isAnonymous: boolean
  createdAt: string
  lastSeenAt: string
  monthRequests: number
  monthCostUsd: number
  monthTokens: number
}

export interface DailyUsagePoint {
  day: string
  requests: number
  costUsd: number
  tokens: number
}

export interface TopUserByCost {
  userId: string
  email: string | null
  displayName: string
  planId: string
  monthCostUsd: number
  monthRequests: number
}

export interface AdminAnalytics {
  users: {
    total: number
    byPlan: Array<{ planId: string; planName: string; count: number }>
    registered: number
    anonymous: number
  }
  usage: {
    requestsToday: number
    requestsMonth: number
    costMonthUsd: number
    tokensMonth: number
    daily: DailyUsagePoint[]
    topUsersByCost: TopUserByCost[]
  }
}

function displayName(user: {
  given_name: string | null
  family_name: string | null
  email: string | null
}): string {
  const name = [user.given_name, user.family_name].filter(Boolean).join(' ')
  return name || user.email || 'Anonymous'
}

export function listUsers(limit = 100, offset = 0): AdminUserSummary[] {
  const monthStart = monthStartIso()
  const rows = getDatabase()
    .prepare(
      `SELECT
        u.id,
        u.email,
        u.given_name,
        u.family_name,
        u.picture,
        u.plan_id,
        u.kinde_id,
        u.anonymous_key,
        u.created_at,
        u.last_seen_at,
        (
          SELECT COUNT(*) FROM usage_events e
          WHERE e.user_id = u.id AND e.created_at >= ?
        ) AS month_requests,
        (
          SELECT COALESCE(SUM(e.cost_usd), 0) FROM usage_events e
          WHERE e.user_id = u.id AND e.created_at >= ?
        ) AS month_cost_usd,
        (
          SELECT COALESCE(SUM(e.total_tokens), 0) FROM usage_events e
          WHERE e.user_id = u.id AND e.created_at >= ?
        ) AS month_tokens
      FROM users u
      ORDER BY u.last_seen_at DESC
      LIMIT ? OFFSET ?`,
    )
    .all(monthStart, monthStart, monthStart, limit, offset) as Array<{
      id: string
      email: string | null
      given_name: string | null
      family_name: string | null
      picture: string | null
      plan_id: string
      kinde_id: string | null
      anonymous_key: string | null
      created_at: string
      last_seen_at: string
      month_requests: number
      month_cost_usd: number
      month_tokens: number
    }>

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    givenName: row.given_name,
    familyName: row.family_name,
    picture: row.picture,
    planId: row.plan_id,
    planName: getPlan(row.plan_id)?.name ?? row.plan_id,
    isAnonymous: row.anonymous_key !== null,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    monthRequests: row.month_requests,
    monthCostUsd: row.month_cost_usd,
    monthTokens: row.month_tokens,
  }))
}

export function getAdminAnalytics(): AdminAnalytics {
  const db = getDatabase()
  const monthStart = monthStartIso()
  const dayStart = new Date()
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayStartIso = dayStart.toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()

  const totalUsers = (db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number })
    .count

  const registeredUsers = (
    db.prepare('SELECT COUNT(*) AS count FROM users WHERE kinde_id IS NOT NULL').get() as {
      count: number
    }
  ).count

  const byPlanRows = db
    .prepare(
      `SELECT u.plan_id AS planId, p.name AS planName, COUNT(*) AS count
       FROM users u
       JOIN plans p ON p.id = u.plan_id
       GROUP BY u.plan_id, p.name
       ORDER BY count DESC`,
    )
    .all() as Array<{ planId: string; planName: string; count: number }>

  const requestsToday = (
    db
      .prepare('SELECT COUNT(*) AS count FROM usage_events WHERE created_at >= ?')
      .get(dayStartIso) as { count: number }
  ).count

  const monthStats = db
    .prepare(
      `SELECT
        COUNT(*) AS requests,
        COALESCE(SUM(cost_usd), 0) AS cost,
        COALESCE(SUM(total_tokens), 0) AS tokens
       FROM usage_events
       WHERE created_at >= ?`,
    )
    .get(monthStart) as { requests: number; cost: number; tokens: number }

  const daily = db
    .prepare(
      `SELECT
        substr(created_at, 1, 10) AS day,
        COUNT(*) AS requests,
        COALESCE(SUM(cost_usd), 0) AS cost_usd,
        COALESCE(SUM(total_tokens), 0) AS tokens
       FROM usage_events
       WHERE created_at >= ?
       GROUP BY substr(created_at, 1, 10)
       ORDER BY day ASC`,
    )
    .all(thirtyDaysAgo) as Array<{
      day: string
      requests: number
      cost_usd: number
      tokens: number
    }>

  const topUsers = db
    .prepare(
      `SELECT
        u.id AS userId,
        u.email,
        u.given_name,
        u.family_name,
        u.plan_id AS planId,
        COALESCE(SUM(e.cost_usd), 0) AS month_cost_usd,
        COUNT(e.id) AS month_requests
       FROM users u
       LEFT JOIN usage_events e ON e.user_id = u.id AND e.created_at >= ?
       GROUP BY u.id
       ORDER BY month_cost_usd DESC, month_requests DESC
       LIMIT 10`,
    )
    .all(monthStart) as Array<{
      userId: string
      email: string | null
      given_name: string | null
      family_name: string | null
      planId: string
      month_cost_usd: number
      month_requests: number
    }>

  return {
    users: {
      total: totalUsers,
      byPlan: byPlanRows,
      registered: registeredUsers,
      anonymous: totalUsers - registeredUsers,
    },
    usage: {
      requestsToday,
      requestsMonth: monthStats.requests,
      costMonthUsd: monthStats.cost,
      tokensMonth: monthStats.tokens,
      daily: daily.map((row) => ({
        day: row.day,
        requests: row.requests,
        costUsd: row.cost_usd,
        tokens: row.tokens,
      })),
      topUsersByCost: topUsers.map((row) => ({
        userId: row.userId,
        email: row.email,
        displayName: displayName(row),
        planId: row.planId,
        monthCostUsd: row.month_cost_usd,
        monthRequests: row.month_requests,
      })),
    },
  }
}

export function updateUserPlan(userId: string, planId: string): UserRow | undefined {
  if (!getPlan(planId)) return undefined

  const ts = new Date().toISOString()
  const result = getDatabase()
    .prepare('UPDATE users SET plan_id = ?, updated_at = ? WHERE id = ?')
    .run(planId, ts, userId)

  if (result.changes === 0) return undefined
  return getDatabase()
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(userId) as UserRow | undefined
}
