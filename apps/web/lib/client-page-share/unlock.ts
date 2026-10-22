/** HMAC unlock cookie for password-gated Client Page Shares. */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { clientPageShareUnlockSecret } from '../runtime-config'
import { paths } from '../paths'

const UNLOCK_TTL_SEC = 60 * 60 * 12 // 12h

export function mintClientShareUnlockToken(shareId: string): string {
  const exp = Math.floor(Date.now() / 1000) + UNLOCK_TTL_SEC
  const payload = `${shareId}.${exp}`
  const sig = createHmac('sha256', clientPageShareUnlockSecret())
    .update(payload)
    .digest('hex')
  return `${payload}.${sig}`
}

export function verifyClientShareUnlockToken(
  shareId: string,
  token: string | undefined | null,
): boolean {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [id, expStr, sig] = parts
  if (id !== shareId) return false
  const exp = Number.parseInt(expStr, 10)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false
  const payload = `${id}.${expStr}`
  const expected = createHmac('sha256', clientPageShareUnlockSecret())
    .update(payload)
    .digest('hex')
  try {
    const a = Buffer.from(sig, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function clientShareUnlockCookieOptions(maxAgeSec = UNLOCK_TTL_SEC) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
    name: paths.clientPageShareUnlockCookie,
  }
}
