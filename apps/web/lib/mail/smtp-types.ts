/**
 * System mail types + SMTP config resolution.
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
export type SmtpTlsMode = 'starttls' | 'tls' | 'none'

export type SmtpConfig = {
  host: string
  port: number
  user: string | null
  pass: string | null
  from: string
  fromName: string
  tls: SmtpTlsMode
}

export type SmtpPublicStatus = {
  configured: boolean
  source: 'db' | 'env' | 'none'
  /** True when host env owns SMTP (`ZAOLY_SMTP_MANAGED`) — Settings edit disabled. */
  managed: boolean
  host: string | null
  port: number
  user: string | null
  from: string | null
  fromName: string | null
  tls: SmtpTlsMode
  passwordSet: boolean
  dbEnabled: boolean
}

export type SmtpDbSettings = {
  enabled: boolean
  host: string
  port: number
  user: string
  /** Ciphertext from `encryptSmtpSecret` — empty when unset. */
  passCipher: string
  from: string
  fromName: string
  tls: SmtpTlsMode
}

export function isSmtpTlsMode(value: unknown): value is SmtpTlsMode {
  return value === 'starttls' || value === 'tls' || value === 'none'
}

export function isValidSmtpEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())
}
