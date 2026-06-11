import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app.js'
import { config } from './config.js'

serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,
  },
  (info) => {
    console.log(`Agent API listening on http://${info.address}:${info.port}`)
    if (!config.isConfigured) {
      console.warn('OPENROUTER_API_KEY is not set — agent endpoints will return 503')
    }
    if (!config.kinde.isConfigured) {
      console.warn('Kinde auth is not configured — sign-in and route protection are disabled')
    } else {
      console.log(`Kinde auth enabled (callback: ${config.kinde.redirectUrl})`)
    }
  },
)
