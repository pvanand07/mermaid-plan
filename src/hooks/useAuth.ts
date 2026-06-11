import { useCallback, useEffect, useState } from 'react'

export interface AuthUser {
  id: string
  email: string | null
  givenName: string | null
  familyName: string | null
  picture: string | null
}

export interface AuthState {
  loading: boolean
  authEnabled: boolean
  authenticated: boolean
  user: AuthUser | null
  refresh: () => Promise<void>
}

interface AuthMeResponse {
  authEnabled: boolean
  authenticated: boolean
  user?: AuthUser
}

async function fetchAuthState(): Promise<Pick<AuthState, 'authEnabled' | 'authenticated' | 'user'>> {
  try {
    const response = await fetch('/api/auth/me', { credentials: 'include' })
    if (!response.ok) {
      return { authEnabled: false, authenticated: false, user: null }
    }

    const data = (await response.json()) as AuthMeResponse
    return {
      authEnabled: data.authEnabled,
      authenticated: data.authenticated,
      user: data.user ?? null,
    }
  } catch {
    return { authEnabled: false, authenticated: false, user: null }
  }
}

export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true)
  const [authEnabled, setAuthEnabled] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const next = await fetchAuthState()
    setAuthEnabled(next.authEnabled)
    setAuthenticated(next.authenticated)
    setUser(next.user)
    setLoading(false)
  }, [])

  useEffect(() => {
    let cancelled = false

    void fetchAuthState().then((next) => {
      if (cancelled) return
      setAuthEnabled(next.authEnabled)
      setAuthenticated(next.authenticated)
      setUser(next.user)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return { loading, authEnabled, authenticated, user, refresh }
}
