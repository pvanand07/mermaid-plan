function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value === '1' || value.toLowerCase() === 'true'
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid positive integer: ${value}`)
  }
  return Math.floor(parsed)
}

function normalizeOrigin(url: string): string {
  const trimmed = url.trim().replace(/\/$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function parseOrigins(value: string | undefined): string[] {
  const defaults = ['http://localhost:5173', 'http://127.0.0.1:5173']
  if (!value?.trim()) return defaults
  return value
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
}

function resolveCorsOrigins(): string[] {
  const appUrl = process.env.APP_URL?.trim()
  if (appUrl) return [normalizeOrigin(appUrl)]
  return parseOrigins(process.env.CORS_ORIGINS)
}

export type RateLimitWindow = 'minute' | 'hour' | 'day' | 'week' | 'month'

export type RateLimitBucket = Record<RateLimitWindow, number>

function rateLimitBucket(prefix: string, defaults: RateLimitBucket): RateLimitBucket {
  return {
    minute: parsePositiveInt(process.env[`${prefix}_PER_MIN`], defaults.minute),
    hour: parsePositiveInt(process.env[`${prefix}_PER_HOUR`], defaults.hour),
    day: parsePositiveInt(process.env[`${prefix}_PER_DAY`], defaults.day),
    week: parsePositiveInt(process.env[`${prefix}_PER_WEEK`], defaults.week),
    month: parsePositiveInt(process.env[`${prefix}_PER_MONTH`], defaults.month),
  }
}

const rateLimitBuckets = {
  health: rateLimitBucket('RATE_LIMIT_HEALTH', {
    minute: 120,
    hour: 1_000,
    day: 5_000,
    week: 20_000,
    month: 30_000, // 1.5× week
  }),
  global: rateLimitBucket('RATE_LIMIT_AGENT_GLOBAL', {
    minute: 25,
    hour: 180,
    day: 700,
    week: 3_000,
    month: 4_500, // 1.5× week
  }),
  chat: rateLimitBucket('RATE_LIMIT_CHAT', {
    minute: 3,
    hour: 10,
    day: 30,
    week: 100,
    month: 150, // 1.5× week
  }),
  stream: rateLimitBucket('RATE_LIMIT_STREAM', {
    minute: 4,
    hour: 20,
    day: 100,
    week: 400,
    month: 600, // 1.5× week
  }),
  continue: rateLimitBucket('RATE_LIMIT_CONTINUE', {
    minute: 10,
    hour: 75,
    day: 300,
    week: 1_250,
    month: 1_875, // 1.5× week
  }),
} as const

function parseAdminEmails(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function resolveSiteUrl(): string {
  const siteUrl = process.env.KINDE_SITE_URL?.trim() || process.env.APP_URL?.trim()
  if (siteUrl) return normalizeOrigin(siteUrl)
  return 'http://localhost:5173'
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? '127.0.0.1',
  sqlite: {
    path: process.env.SQLITE_PATH ?? './data/mermaid-studio.db',
  },
  anonymousPlanId: process.env.ANONYMOUS_PLAN_ID ?? 'anonymous',
  defaultUserPlanId: process.env.DEFAULT_USER_PLAN_ID ?? 'free',
  adminEmails: parseAdminEmails(process.env.ADMIN_EMAILS),
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  defaultModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  corsOrigins: resolveCorsOrigins(),
  trustProxy: parseBoolean(process.env.TRUST_PROXY, false),
  isProduction: process.env.NODE_ENV === 'production',
  rateLimit: {
    enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, true),
    buckets: rateLimitBuckets,
  },
  kinde: {
    clientId: process.env.KINDE_CLIENT_ID ?? '',
    clientSecret: process.env.KINDE_CLIENT_SECRET ?? '',
    issuerUrl: normalizeOrigin(process.env.KINDE_ISSUER_URL ?? 'https://elevatics.kinde.com'),
    siteUrl: resolveSiteUrl(),
    get redirectUrl() {
      return `${this.siteUrl}/api/auth/callback`
    },
    get logoutRedirectUrl() {
      return this.siteUrl
    },
    get isConfigured() {
      return Boolean(this.clientId && this.clientSecret)
    },
  },
  get isConfigured() {
    return Boolean(this.openRouterApiKey)
  },
}

export function assertApiKey(): string {
  return requireEnv('OPENROUTER_API_KEY', config.openRouterApiKey || undefined)
}
