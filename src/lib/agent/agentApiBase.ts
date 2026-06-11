function normalizeBaseUrl(url: string | undefined): string {
  if (!url?.trim()) return ''
  const trimmed = url.trim().replace(/\/$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

/** Empty in dev (Vite proxies /api); set via VITE_DIAGRAM_AGENT_URL in production builds. */
export const AGENT_API_BASE = normalizeBaseUrl(import.meta.env.VITE_DIAGRAM_AGENT_URL)

export function agentApiUrl(path: string): string {
  return `${AGENT_API_BASE}${path}`
}
