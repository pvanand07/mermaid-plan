import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { applyTieredRateLimits } from './middleware/rateLimits.js'
import { agentRoutes } from './routes/agent.js'

export const app = new Hono()

const allowedOrigins = new Set(config.corsOrigins)

app.use(
  '/api/*',
  cors({
    origin: (origin) => (allowedOrigins.has(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
    maxAge: 86_400,
  }),
)

if (config.rateLimit.enabled) {
  applyTieredRateLimits(app, '/api/health', 'health')
  applyTieredRateLimits(app, '/api/agent/*', 'global')
}

app.get('/api/health', (c) =>
  c.json({
    ok: true,
    agentConfigured: config.isConfigured,
    defaultModel: config.defaultModel,
  }),
)

app.route('/api/agent', agentRoutes)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((error, c) => {
  console.error('[server]', error)
  return c.json({ error: 'Internal server error' }, 500)
})
