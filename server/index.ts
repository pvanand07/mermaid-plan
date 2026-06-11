import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app.js'
import { config } from './config.js'
import { initDatabase } from './db/sqlite.js'

initDatabase()

serve(
  {
    fetch: app.fetch,
    hostname: config.host,
    port: config.port,
  },
  (info) => {
    console.log(`Agent API listening on http://${info.address}:${info.port}`)
    console.log(`SQLite database: ${config.sqlite.path}`)
    if (!config.isConfigured) {
      console.warn('OPENROUTER_API_KEY is not set — agent endpoints will return 503')
    }
    if (!config.kinde.isConfigured) {
      console.warn('Kinde auth is not configured — sign-in uses anonymous users only')
    } else {
      console.log(`Kinde auth enabled (callback: ${config.kinde.redirectUrl})`)
    }
  },
)
