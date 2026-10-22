/**
 * Encrypt SMTP passwords at rest (AES-256-GCM).
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync } from 'node:crypto'
import { paths } from '../paths'
import { envGet } from '../env-resolve'

const PREFIX = 'zaoly-smtp-v1'

function secretKey(): Buffer {
  const material =
    envGet(paths.envAuthSecret)?.trim() ||
    paths.authDevFallbackSecret
  return scryptSync(material, 'zaoly-smtp-settings', 32)
}

export function encryptSmtpSecret(plain: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', secretKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}.${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

export function decryptSmtpSecret(cipherText: string): string | null {
  const parts = cipherText.split('.')
  if (parts.length !== 4 || parts[0] !== PREFIX) return null
  try {
    const iv = Buffer.from(parts[1]!, 'base64url')
    const tag = Buffer.from(parts[2]!, 'base64url')
    const data = Buffer.from(parts[3]!, 'base64url')
    const decipher = createDecipheriv('aes-256-gcm', secretKey(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

/** Stable fingerprint so tests can assert round-trip without leaking secrets. */
export function smtpSecretFingerprint(plain: string): string {
  return createHash('sha256').update(plain).digest('hex').slice(0, 12)
}
