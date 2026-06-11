import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'
import { config } from '../config.js'

function firstForwardedIp(header: string | undefined): string | undefined {
  if (!header) return undefined
  const first = header.split(',')[0]?.trim()
  return first || undefined
}

export function clientIp(c: Context): string {
  if (config.trustProxy) {
    const forwarded =
      firstForwardedIp(c.req.header('x-forwarded-for')) ??
      firstForwardedIp(c.req.header('x-real-ip')) ??
      c.req.header('cf-connecting-ip')?.trim()

    if (forwarded) return forwarded
  }

  const info = getConnInfo(c)
  return info.remote.address ?? 'unknown'
}
