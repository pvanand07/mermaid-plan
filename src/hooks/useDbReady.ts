import { useEffect, useState } from 'react'
import { ensureDbReady } from '../lib/db/ensureDbReady'

export function useDbReady() {
  const [ready, setReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ensureDbReady()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err instanceof Response
              ? err.statusText || 'Database unavailable'
              : err instanceof Error
                ? err.message
                : 'Database unavailable'
          setDbError(message)
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { ready, dbError, loading: !ready }
}
