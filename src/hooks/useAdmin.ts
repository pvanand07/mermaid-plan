import { useCallback, useEffect, useState } from 'react'

export interface AdminPlan {
  id: string
  name: string
  monthly_cost_cap_usd: number | null
}

export interface AdminUserRow {
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
    daily: Array<{ day: string; requests: number; costUsd: number; tokens: number }>
    topUsersByCost: Array<{
      userId: string
      email: string | null
      displayName: string
      planId: string
      monthCostUsd: number
      monthRequests: number
    }>
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: 'include', ...init })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
    throw new Error(body.message ?? body.error ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export function useAdminAccess() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchJson<{ isAdmin: boolean }>('/api/admin/me')
      .then((data) => {
        if (!cancelled) setIsAdmin(data.isAdmin)
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { loading, isAdmin }
}

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [plans, setPlans] = useState<AdminPlan[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [analyticsData, usersData, plansData] = await Promise.all([
        fetchJson<AdminAnalytics>('/api/admin/analytics'),
        fetchJson<{ users: AdminUserRow[] }>('/api/admin/users?limit=200'),
        fetchJson<{ plans: AdminPlan[] }>('/api/admin/plans'),
      ])
      setAnalytics(analyticsData)
      setUsers(usersData.users)
      setPlans(plansData.plans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateUserPlan = useCallback(
    async (userId: string, planId: string) => {
      await fetchJson(`/api/admin/users/${userId}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? {
                ...user,
                planId,
                planName: plans.find((plan) => plan.id === planId)?.name ?? planId,
              }
            : user,
        ),
      )
    },
    [plans],
  )

  return { loading, error, analytics, users, plans, refresh, updateUserPlan }
}
