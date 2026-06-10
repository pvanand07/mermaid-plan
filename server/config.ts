function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '127.0.0.1',
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  defaultModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  get isConfigured() {
    return Boolean(this.openRouterApiKey)
  },
}

export function assertApiKey(): string {
  return requireEnv('OPENROUTER_API_KEY', config.openRouterApiKey || undefined)
}
