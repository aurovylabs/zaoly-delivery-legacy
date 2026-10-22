/**
 * Signed impersonation cookie codec (no Next cookies()) — usable from proxy + routes.
 * Spec: `knowledge/zaoly-admin-hardening.md` P2 read-only impersonation.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getAuthSecret } from '../auth-secret'

export type ImpersonationPayload = {
  targetUserId: string
  actorUserId: string
  exp: number
  reason: string
}

function sign(body: string): string {
  return createHmac('sha256', getAuthSecret()).update(body).digest('base64url')
}

export function encodeImpersonationCookie(payload: ImpersonationPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  return `${body}.${sign(body)}`
}

export function decodeImpersonationCookie(
  raw: string | undefined | null,
): ImpersonationPayload | null {
  if (!raw) return null
  const idx = raw.lastIndexOf('.')
  if (idx <= 0) return null
  const body = raw.slice(0, idx)
  const sig = raw.slice(idx + 1)
  const expected = sign(body)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8'),
    ) as ImpersonationPayload
    if (
      typeof parsed.targetUserId !== 'string' ||
      typeof parsed.actorUserId !== 'string' ||
      typeof parsed.exp !== 'number' ||
      typeof parsed.reason !== 'string'
    ) {
      return null
    }
    if (parsed.exp * 1000 < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}
