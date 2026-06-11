import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { SessionManager } from '@kinde-oss/kinde-typescript-sdk'
import { config } from '../config.js'

const COOKIE_PREFIX = 'kinde_session_'
const REGISTRY_KEY = `${COOKIE_PREFIX}__keys`

const cookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'Lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
}

function readRegistry(c: Context): Set<string> {
  const raw = getCookie(c, REGISTRY_KEY)
  if (!raw) return new Set()
  try {
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

function writeRegistry(c: Context, keys: Set<string>) {
  if (keys.size === 0) {
    deleteCookie(c, REGISTRY_KEY, { path: '/' })
    return
  }
  setCookie(c, REGISTRY_KEY, JSON.stringify([...keys]), cookieOptions)
}

function cookieName(itemKey: string) {
  return `${COOKIE_PREFIX}${itemKey}`
}

export function createSessionManager(c: Context): SessionManager {
  return {
    async getSessionItem<T = unknown>(itemKey: string) {
      const raw = getCookie(c, cookieName(itemKey))
      if (!raw) return null
      try {
        return JSON.parse(raw) as T
      } catch {
        return raw as T
      }
    },
    async setSessionItem<T = unknown>(itemKey: string, itemValue: T) {
      const keys = readRegistry(c)
      keys.add(itemKey)
      writeRegistry(c, keys)
      setCookie(c, cookieName(itemKey), JSON.stringify(itemValue), cookieOptions)
    },
    async removeSessionItem(itemKey: string) {
      const keys = readRegistry(c)
      keys.delete(itemKey)
      writeRegistry(c, keys)
      deleteCookie(c, cookieName(itemKey), { path: '/' })
    },
    async destroySession() {
      const keys = readRegistry(c)
      for (const key of keys) {
        deleteCookie(c, cookieName(key), { path: '/' })
      }
      deleteCookie(c, REGISTRY_KEY, { path: '/' })
    },
  }
}
