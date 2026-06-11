import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { applyHealthRateLimits, applyPlanRateLimits } from './middleware/rateLimits.js'
import { resolveUser, type AppVariables } from './middleware/resolveUser.js'
import { agentRoutes } from './routes/agent.js'
import { authRoutes } from './routes/auth.js'
import { usageRoutes } from './routes/usage.js'
import { adminRoutes } from './routes/admin.js'

export const app = new Hono<{ Variables: AppVariables }>()

const allowedOrigins = new Set(config.corsOrigins)

app.use(
  '/api/*',
  cors({
    origin: (origin) => (allowedOrigins.has(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    credentials: true,
    maxAge: 86_400,
  }),
)

if (config.rateLimit.enabled) {
  applyHealthRateLimits(app, '/api/health')
}

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    agentConfigured: config.isConfigured,
    defaultModel: config.defaultModel,
  }),
)

app.route('/api/auth', authRoutes)

app.use('/api/agent/*', resolveUser)
if (config.rateLimit.enabled) {
  applyPlanRateLimits(app, '/api/agent/*', 'global')
}
app.route('/api/agent', agentRoutes)

app.route('/api/usage', usageRoutes)
app.route('/api/admin', adminRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((error, c) => {
  console.error('[server]', error)
  return c.json({ error: 'Internal server error' }, 500)
})
