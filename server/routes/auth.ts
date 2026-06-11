import { Hono } from 'hono'
import { config } from '../config.js'
import { kindeClient } from '../kinde/client.js'
import { createSessionManager } from '../kinde/sessionManager.js'

function kindeNotConfigured(c: { json: (body: unknown, status?: number) => Response }) {
  return c.json(
    {
      error: 'Auth not configured',
      message: 'Set KINDE_CLIENT_ID, KINDE_CLIENT_SECRET, and KINDE_ISSUER_URL to enable sign-in.',
    },
    503,
  )
}

export const authRoutes = new Hono()

authRoutes.get('/login', async (c) => {
  if (!config.kinde.isConfigured) return kindeNotConfigured(c)

  const sessionManager = createSessionManager(c)
  const loginUrl = await kindeClient.login(sessionManager)
  return c.redirect(loginUrl.toString())
})

authRoutes.get('/register', async (c) => {
  if (!config.kinde.isConfigured) return kindeNotConfigured(c)

  const sessionManager = createSessionManager(c)
  const registerUrl = await kindeClient.register(sessionManager)
  return c.redirect(registerUrl.toString())
})

authRoutes.get('/callback', async (c) => {
  if (!config.kinde.isConfigured) return kindeNotConfigured(c)

  const sessionManager = createSessionManager(c)
  const url = new URL(c.req.url)
  await kindeClient.handleRedirectToApp(sessionManager, url)
  return c.redirect(config.kinde.logoutRedirectUrl)
})

authRoutes.get('/logout', async (c) => {
  if (!config.kinde.isConfigured) return kindeNotConfigured(c)

  const sessionManager = createSessionManager(c)
  const logoutUrl = await kindeClient.logout(sessionManager)
  return c.redirect(logoutUrl.toString())
})

authRoutes.get('/me', async (c) => {
  if (!config.kinde.isConfigured) {
    return c.json({ authEnabled: false, authenticated: false })
  }

  const sessionManager = createSessionManager(c)
  const authenticated = await kindeClient.isAuthenticated(sessionManager)

  if (!authenticated) {
    return c.json({ authEnabled: true, authenticated: false })
  }

  const profile = await kindeClient.getUserProfile(sessionManager)
  return c.json({
    authEnabled: true,
    authenticated: true,
    user: {
      id: profile.id,
      email: profile.email,
      givenName: profile.given_name,
      familyName: profile.family_name,
      picture: profile.picture,
    },
  })
})
