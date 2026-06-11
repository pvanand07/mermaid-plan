import { randomUUID } from 'node:crypto'
import { config } from '../config.js'
import { getPlan } from './planRepository.js'
import { getDatabase } from './sqlite.js'
import type { UserRow } from './types.js'

export interface KindeProfileInput {
  id: string
  email?: string | null
  given_name?: string | null
  family_name?: string | null
  picture?: string | null
}

function nowIso(): string {
  return new Date().toISOString()
}

function assertPlanExists(planId: string): void {
  if (!getPlan(planId)) {
    throw new Error(`Unknown plan: ${planId}`)
  }
}

export function getUserById(id: string): UserRow | undefined {
  return getDatabase().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

export function getUserByKindeId(kindeId: string): UserRow | undefined {
  return getDatabase()
    .prepare('SELECT * FROM users WHERE kinde_id = ?')
    .get(kindeId) as UserRow | undefined
}

export function upsertKindeUser(
  profile: KindeProfileInput,
  planId: string = config.defaultUserPlanId,
): UserRow {
  assertPlanExists(planId)
  const ts = nowIso()
  const existing = getUserByKindeId(profile.id)

  if (existing) {
    getDatabase()
      .prepare(
        `UPDATE users SET
          email = ?, given_name = ?, family_name = ?, picture = ?,
          plan_id = ?, updated_at = ?, last_seen_at = ?
        WHERE id = ?`,
      )
      .run(
        profile.email ?? null,
        profile.given_name ?? null,
        profile.family_name ?? null,
        profile.picture ?? null,
        planId,
        ts,
        ts,
        existing.id,
      )
    return getUserById(existing.id)!
  }

  const id = randomUUID()
  getDatabase()
    .prepare(
      `INSERT INTO users (
        id, kinde_id, anonymous_key, email, given_name, family_name, picture,
        plan_id, created_at, updated_at, last_seen_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      profile.id,
      profile.email ?? null,
      profile.given_name ?? null,
      profile.family_name ?? null,
      profile.picture ?? null,
      planId,
      ts,
      ts,
      ts,
    )

  return getUserById(id)!
}

export function getOrCreateAnonymousUser(anonymousKey: string): UserRow {
  const planId = config.anonymousPlanId
  assertPlanExists(planId)
  const ts = nowIso()

  const existing = getDatabase()
    .prepare('SELECT * FROM users WHERE anonymous_key = ?')
    .get(anonymousKey) as UserRow | undefined

  if (existing) {
    getDatabase()
      .prepare('UPDATE users SET last_seen_at = ?, updated_at = ? WHERE id = ?')
      .run(ts, ts, existing.id)
    return getUserById(existing.id)!
  }

  const id = randomUUID()
  getDatabase()
    .prepare(
      `INSERT INTO users (
        id, kinde_id, anonymous_key, email, given_name, family_name, picture,
        plan_id, created_at, updated_at, last_seen_at
      ) VALUES (?, NULL, ?, NULL, NULL, NULL, NULL, ?, ?, ?, ?)`,
    )
    .run(id, anonymousKey, planId, ts, ts, ts)

  return getUserById(id)!
}

export function touchUserLastSeen(userId: string): void {
  const ts = nowIso()
  getDatabase()
    .prepare('UPDATE users SET last_seen_at = ?, updated_at = ? WHERE id = ?')
    .run(ts, ts, userId)
}
