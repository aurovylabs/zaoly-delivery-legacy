/** Short-lived editor launch codes — specs/domain/auth-bridge.md · auth-hardening-w2.md */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { getAuthSecret } from './auth-secret'
import { paths } from './paths'
import {
  ensureRedisConnected,
  getRedisPublisher,
  launchCodeRedisKey,
} from './redis/zaoly-redis'
import { isRedisConfigured } from './runtime-config'

export type LaunchCodeClaims = {
  userId: string
  email: string
  name: string | null
  platformProjectId: string | null
  jti: string
  exp: number
}

type StoredCode = LaunchCodeClaims & { consumed: boolean }

const memoryStore = new Map<string, StoredCode>()

function launchSigningSecret(): string {
  const dedicated = process.env[paths.envLaunchTokenSecret]?.trim()
  if (dedicated && dedicated.length >= 32) return dedicated
  return getAuthSecret()
}

function b64url(buf: Buffer | string): string {
  const b = typeof buf === 'string' ? Buffer.from(buf, 'utf8') : buf
  return b.toString('base64url')
}

function signPayload(payloadB64: string): string {
  return createHmac('sha256', launchSigningSecret()).update(payloadB64).digest('base64url')
}

function purgeExpiredMemory(now = Date.now()): void {
  for (const [jti, row] of memoryStore) {
    if (row.exp * 1000 <= now || row.consumed) memoryStore.delete(jti)
  }
}

async function putClaims(claims: LaunchCodeClaims, ttlSeconds: number): Promise<void> {
  if (!isRedisConfigured()) {
    memoryStore.set(claims.jti, { ...claims, consumed: false })
    return
  }
  const redis = getRedisPublisher()
  if (!(await ensureRedisConnected(redis)) || !redis) {
    throw new Error('launch_store_unavailable')
  }
  const ttl = Math.max(1, Math.floor(ttlSeconds))
  await redis.set(launchCodeRedisKey(claims.jti), JSON.stringify(claims), 'EX', ttl)
}

async function takeClaims(jti: string): Promise<LaunchCodeClaims | null> {
  if (!isRedisConfigured()) {
    const row = memoryStore.get(jti)
    if (!row || row.consumed) return null
    row.consumed = true
    memoryStore.set(jti, row)
    return {
      userId: row.userId,
      email: row.email,
      name: row.name,
      platformProjectId: row.platformProjectId,
      jti: row.jti,
      exp: row.exp,
    }
  }
  const redis = getRedisPublisher()
  if (!(await ensureRedisConnected(redis)) || !redis) {
    throw new Error('launch_store_unavailable')
  }
  const raw = await redis.getdel(launchCodeRedisKey(jti))
  if (!raw) return null
  try {
    return JSON.parse(raw) as LaunchCodeClaims
  } catch {
    return null
  }
}

export async function mintLaunchCode(input: {
  userId: string
  email: string
  name?: string | null
  platformProjectId?: string | null
  ttlSeconds?: number
}): Promise<{ launchCode: string; expiresAt: string; claims: LaunchCodeClaims }> {
  purgeExpiredMemory()
  const ttl = input.ttlSeconds ?? paths.editorLaunchCodeTtlSeconds
  const exp = Math.floor(Date.now() / 1000) + ttl
  const jti = randomBytes(16).toString('hex')
  const claims: LaunchCodeClaims = {
    userId: input.userId.trim(),
    email: input.email.trim().toLowerCase(),
    name: input.name?.trim() || null,
    platformProjectId: input.platformProjectId?.trim() || null,
    jti,
    exp,
  }
  if (!claims.userId || !claims.email) {
    throw new Error('user_required')
  }
  await putClaims(claims, ttl)
  const payloadB64 = b64url(JSON.stringify(claims))
  const sig = signPayload(payloadB64)
  return {
    launchCode: `${payloadB64}.${sig}`,
    expiresAt: new Date(exp * 1000).toISOString(),
    claims,
  }
}

export type RedeemLaunchCodeResult =
  | { ok: true; claims: LaunchCodeClaims }
  | { ok: false; error: 'invalid' | 'expired' | 'consumed' | 'store_unavailable' }

export async function redeemLaunchCode(launchCode: string): Promise<RedeemLaunchCodeResult> {
  purgeExpiredMemory()
  const raw = launchCode?.trim()
  if (!raw || !raw.includes('.')) return { ok: false, error: 'invalid' }
  const [payloadB64, sig] = raw.split('.')
  if (!payloadB64 || !sig) return { ok: false, error: 'invalid' }

  const expected = signPayload(payloadB64)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, error: 'invalid' }
  }

  let claims: LaunchCodeClaims
  try {
    claims = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as LaunchCodeClaims
  } catch {
    return { ok: false, error: 'invalid' }
  }

  if (!claims?.jti || !claims.email || !claims.userId || typeof claims.exp !== 'number') {
    return { ok: false, error: 'invalid' }
  }
  if (claims.exp * 1000 <= Date.now()) {
    if (!isRedisConfigured()) memoryStore.delete(claims.jti)
    return { ok: false, error: 'expired' }
  }

  try {
    const row = await takeClaims(claims.jti)
    if (!row) return { ok: false, error: 'consumed' }
    return {
      ok: true,
      claims: {
        userId: row.userId,
        email: row.email,
        name: row.name,
        platformProjectId: row.platformProjectId,
        jti: row.jti,
        exp: row.exp,
      },
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'launch_store_unavailable') {
      return { ok: false, error: 'store_unavailable' }
    }
    throw err
  }
}

/** Test helper */
export function __resetLaunchCodeStoreForTests(): void {
  memoryStore.clear()
}
