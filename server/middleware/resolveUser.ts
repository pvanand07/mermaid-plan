import { createHash } from 'node:crypto'
import { createMiddleware } from 'hono/factory'
import { config } from '../config.js'
import { kindeClient } from '../kinde/client.js'
import { createSessionManager } from '../kinde/sessionManager.js'
import { getOrCreateAnonymousUser, upsertKindeUser } from '../db/userRepository.js'
import { clientIp } from './clientIp.js'

export type AppVariables = {
  userId: string
  planId: string
  isAnonymous: boolean
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex')
}

export const resolveUser = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  let userId: string
  let planId: string
  let isAnonymous: boolean

  if (config.kinde.isConfigured) {
    const sessionManager = createSessionManager(c)
    const authenticated = await kindeClient.isAuthenticated(sessionManager)

    if (authenticated) {
      const profile = await kindeClient.getUserProfile(sessionManager)
      const user = upsertKindeUser({
        id: profile.id,
        email: profile.email,
        given_name: profile.given_name,
        family_name: profile.family_name,
        picture: profile.picture,
      })
      userId = user.id
      planId = user.plan_id
      isAnonymous = false
    } else {
      const ip = clientIp(c)
      const user = getOrCreateAnonymousUser(hashIp(ip))
      userId = user.id
      planId = user.plan_id
      isAnonymous = true
    }
  } else {
    const ip = clientIp(c)
    const user = getOrCreateAnonymousUser(hashIp(ip))
    userId = user.id
    planId = user.plan_id
    isAnonymous = true
  }

  c.set('userId', userId)
  c.set('planId', planId)
  c.set('isAnonymous', isAnonymous)
  await next()
})
