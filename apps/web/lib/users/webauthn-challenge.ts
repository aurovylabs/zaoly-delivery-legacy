/**
 * Short-lived WebAuthn challenge + login ticket store (in-process).
 * Spec: `zaoly-platform-admin-webauthn.md`
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getAuthSecret } from '../auth-secret'
import { paths } from '../paths'

type ChallengeRow = { challenge: string; userId: string; exp: number }

const challenges = new Map<string, ChallengeRow>()
const usedTickets = new Map<string, number>()

function prune(): void {
  const now = Date.now()
  for (const [k, v] of challenges) {
    if (v.exp <= now) challenges.delete(k)
  }
  for (const [k, exp] of usedTickets) {
    if (exp <= now) usedTickets.delete(k)
  }
}

export function putWebAuthnChallenge(
  key: string,
  challenge: string,
  userId: string,
): void {
  prune()
  challenges.set(key, {
    challenge,
    userId,
    exp: Date.now() + paths.webauthnChallengeTtlSeconds * 1000,
  })
}

export function takeWebAuthnChallenge(
  key: string,
): { challenge: string; userId: string } | null {
  prune()
  const row = challenges.get(key)
  if (!row) return null
  challenges.delete(key)
  if (row.exp <= Date.now()) return null
  return { challenge: row.challenge, userId: row.userId }
}

export function registrationChallengeKey(userId: string): string {
  return `reg:${userId}`
}

export function loginChallengeKey(email: string): string {
  return `login:${email.trim().toLowerCase()}`
}

/** One-time ticket after successful assertion → credentials authorize. */
export function mintWebAuthnTicket(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + paths.webauthnTicketTtlSeconds
  const jti = randomBytes(16).toString('base64url')
  const body = `${userId}.${exp}.${jti}`
  const sig = createHmac('sha256', getAuthSecret()).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function consumeWebAuthnTicket(ticket: string): string | null {
  prune()
  const parts = ticket.split('.')
  if (parts.length !== 4) return null
  const [userId, expStr, jti, sig] = parts
  if (!userId || !expStr || !jti || !sig) return null
  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return null
  const body = `${userId}.${expStr}.${jti}`
  const expected = createHmac('sha256', getAuthSecret()).update(body).digest('base64url')
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  } catch {
    return null
  }
  if (usedTickets.has(jti)) return null
  usedTickets.set(jti, exp * 1000)
  return userId
}

/** Test helper */
export function resetWebAuthnChallengeStoreForTests(): void {
  challenges.clear()
  usedTickets.clear()
}
