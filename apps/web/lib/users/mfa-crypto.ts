import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { getAuthSecret } from '../auth-secret'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12

function keyFromAuthSecret(): Buffer {
  return createHash('sha256').update(`zaoly-mfa:${getAuthSecret()}`, 'utf8').digest()
}

/** Seal UTF-8 plaintext → `v1.<ivB64>.<tagB64>.<ctB64>`. */
export function sealMfaSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, keyFromAuthSecret(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

export function openMfaSecret(sealed: string): string | null {
  const parts = sealed.split('.')
  if (parts.length !== 4 || parts[0] !== 'v1') return null
  try {
    const iv = Buffer.from(parts[1], 'base64url')
    const tag = Buffer.from(parts[2], 'base64url')
    const ct = Buffer.from(parts[3], 'base64url')
    const decipher = createDecipheriv(ALGO, keyFromAuthSecret(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
