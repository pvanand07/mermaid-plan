import { z } from 'zod'
import { Hono } from 'hono'
import {
  getAdminAnalytics,
  listUsers,
  updateUserPlan,
} from '../db/adminRepository.js'
import { getPlan } from '../db/planRepository.js'
import { getDatabase } from '../db/sqlite.js'
import { checkIsAdmin, requireAdmin } from '../middleware/requireAdmin.js'
import type { AppVariables } from '../middleware/resolveUser.js'
import { resolveUser } from '../middleware/resolveUser.js'

const updatePlanSchema = z.object({
  planId: z.string().min(1),
})

export const adminRoutes = new Hono<{ Variables: AppVariables }>()

adminRoutes.use('*', resolveUser)

adminRoutes.get('/me', (c) => {
  const isAdmin = checkIsAdmin(c.get('userId'), c.get('isAnonymous'))
  return c.json({ isAdmin })
})

adminRoutes.use('*', requireAdmin)

adminRoutes.get('/analytics', (c) => c.json(getAdminAnalytics()))

adminRoutes.get('/users', (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? 100), 500)
  const offset = Math.max(Number(c.req.query('offset') ?? 0), 0)
  const total = (getDatabase().prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number })
    .count

  return c.json({
    users: listUsers(limit, offset),
    total,
    limit,
    offset,
  })
})

adminRoutes.get('/plans', (c) => {
  const plans = getDatabase()
    .prepare('SELECT id, name, monthly_cost_cap_usd FROM plans ORDER BY id')
    .all()
  return c.json({ plans })
})

adminRoutes.patch('/users/:id/plan', async (c) => {
  const userId = c.req.param('id')
  const parsed = updatePlanSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
  }

  if (!getPlan(parsed.data.planId)) {
    return c.json({ error: 'Unknown plan' }, 400)
  }

  const user = updateUserPlan(userId, parsed.data.planId)
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      planId: user.plan_id,
    },
  })
})
