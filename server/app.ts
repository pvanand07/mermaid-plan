import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from './config.js'
import { agentRoutes } from './routes/agent.js'

export const app = new Hono()

app.use(
  '/api/*',
  cors({
    origin: (origin) =>
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : '',
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  }),
)

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
