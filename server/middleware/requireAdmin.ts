import { createMiddleware } from 'hono/factory'
import { config } from '../config.js'
import { getUserById } from '../db/userRepository.js'
import type { AppVariables } from './resolveUser.js'

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || config.adminEmails.length === 0) return false
  return config.adminEmails.includes(email.trim().toLowerCase())
}

export const requireAdmin = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  if (config.adminEmails.length === 0) {
    return c.json(
      {
        error: 'Admin not configured',
        message: 'Set ADMIN_EMAILS to enable the admin API.',
      },
      503,
    )
  }

  if (c.get('isAnonymous')) {
    return c.json({ error: 'Forbidden', message: 'Sign in with an admin account.' }, 403)
  }

  const user = getUserById(c.get('userId'))
  if (!user || !isAdminEmail(user.email)) {
    return c.json({ error: 'Forbidden', message: 'Admin access required.' }, 403)
  }

  await next()
})

export function checkIsAdmin(userId: string, isAnonymous: boolean): boolean {
  if (isAnonymous || config.adminEmails.length === 0) return false
  const user = getUserById(userId)
  return isAdminEmail(user?.email)
}
