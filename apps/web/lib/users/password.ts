import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

/** Spec: zaoly-user-management.md — scrypt, min 10 chars. */
export const PASSWORD_MIN_LENGTH = 10

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 32

export function assertPasswordPolicy(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `password_too_short`
  }
  return null
}

/** Encode as `scrypt$n$r$p$saltB64$keyB64`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export function verifyPassword(password: string, encoded: string | null | undefined): boolean {
  if (!encoded || typeof encoded !== 'string') return false
  const parts = encoded.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  if (![n, r, p].every((x) => Number.isFinite(x) && x > 0)) return false
  let salt: Buffer
  let expected: Buffer
  try {
    salt = Buffer.from(parts[4], 'base64url')
    expected = Buffer.from(parts[5], 'base64url')
  } catch {
    return false
  }
  const actual = scryptSync(password, salt, expected.length, { N: n, r, p })
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}
