import { db } from './mermaidStudioDb'

let dbReadyPromise: Promise<void> | null = null

export async function ensureDbReady(): Promise<void> {
  if (!dbReadyPromise) {
    dbReadyPromise = db
      .open()
      .then(() => undefined)
      .catch((err: unknown) => {
        dbReadyPromise = null
        const message = err instanceof Error ? err.message : 'Database unavailable'
        throw new Response(message, { status: 503, statusText: message })
      })
  }
  await dbReadyPromise
}
