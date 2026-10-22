/** Password hashing for Client Page Share (scrypt via node:crypto — no native addon). */
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scryptAsync = promisify(scrypt)

const SCRYPT_N_KEYLEN = 64
const SCRYPT_PREFIX = 'scrypt$'

export async function hashClientSharePassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scryptAsync(plain, salt, SCRYPT_N_KEYLEN)) as Buffer
  return `${SCRYPT_PREFIX}${salt}$${derived.toString('hex')}`
}

export async function verifyClientSharePassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  if (!stored.startsWith(SCRYPT_PREFIX)) return false
  const parts = stored.split('$')
  if (parts.length !== 3) return false
  const salt = parts[1]
  const expectedHex = parts[2]
  if (!salt || !expectedHex) return false
  const derived = (await scryptAsync(plain, salt, SCRYPT_N_KEYLEN)) as Buffer
  const expected = Buffer.from(expectedHex, 'hex')
  if (expected.length !== derived.length) return false
  return timingSafeEqual(expected, derived)
}
