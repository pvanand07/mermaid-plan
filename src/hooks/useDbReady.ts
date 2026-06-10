import { useEffect, useState } from 'react'
import { db } from '../lib/db/mermaidStudioDb'

export function useDbReady() {
  const [ready, setReady] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    db.open()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setDbError(err instanceof Error ? err.message : 'Database unavailable')
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { ready, dbError, loading: !ready }
}
