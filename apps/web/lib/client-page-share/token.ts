/** Client Page Share token helpers · Spec: client-page-share.md */
import { createHash, randomBytes } from 'node:crypto'
import { paths } from '../paths'

export function generateClientPageShareToken(): string {
  return `${paths.clientPageShareTokenPrefix}${randomBytes(32).toString('hex')}`
}

export function hashClientPageShareToken(plain: string): string {
  return createHash('sha256').update(plain.trim(), 'utf8').digest('hex')
}

export function isClientPageShareTokenShape(token: string): boolean {
  const t = token.trim()
  if (!t.startsWith(paths.clientPageShareTokenPrefix)) return false
  const hex = t.slice(paths.clientPageShareTokenPrefix.length)
  return /^[a-f0-9]{64}$/i.test(hex)
}
