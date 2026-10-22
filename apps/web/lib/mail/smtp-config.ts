/**
 * Resolve SMTP from admin DB override or env.
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import { paths } from '../paths'
import { envGet } from '../env-resolve'
import { decryptSmtpSecret } from './smtp-crypto'
import {
  isSmtpTlsMode,
  isValidSmtpEmail,
  type SmtpConfig,
  type SmtpDbSettings,
  type SmtpPublicStatus,
  type SmtpTlsMode,
} from './smtp-types'

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw?.trim()) return fallback
  const n = Number.parseInt(raw.trim(), 10)
  if (!Number.isFinite(n) || n < 1 || n > 65535) return fallback
  return n
}

function parseTls(raw: string | undefined): SmtpTlsMode {
  const v = raw?.trim().toLowerCase()
  if (isSmtpTlsMode(v)) return v
  return paths.smtpDefaultTls
}

export function smtpConfigFromEnv(): SmtpConfig | null {
  const host = envGet(paths.envZaolySmtpHost)?.trim() || ''
  const from = envGet(paths.envZaolySmtpFrom)?.trim() || ''
  if (!host || !isValidSmtpEmail(from)) return null
  const user = envGet(paths.envZaolySmtpUser)?.trim() || null
  const pass = envGet(paths.envZaolySmtpPass) ?? null
  return {
    host,
    port: parsePort(envGet(paths.envZaolySmtpPort), paths.smtpDefaultPort),
    user: user || null,
    pass: pass && pass.length > 0 ? pass : null,
    from,
    fromName: envGet(paths.envZaolySmtpFromName)?.trim() || paths.smtpDefaultFromName,
    tls: parseTls(envGet(paths.envZaolySmtpTls)),
  }
}

export function smtpConfigFromDb(settings: SmtpDbSettings | null): SmtpConfig | null {
  if (!settings?.enabled) return null
  const host = settings.host.trim()
  const from = settings.from.trim()
  if (!host || !isValidSmtpEmail(from)) return null
  const pass = settings.passCipher ? decryptSmtpSecret(settings.passCipher) : null
  return {
    host,
    port: settings.port > 0 ? settings.port : paths.smtpDefaultPort,
    user: settings.user.trim() || null,
    pass: pass && pass.length > 0 ? pass : null,
    from,
    fromName: settings.fromName.trim() || paths.smtpDefaultFromName,
    tls: isSmtpTlsMode(settings.tls) ? settings.tls : paths.smtpDefaultTls,
  }
}

/** Hosted Zaoly sets this so env SMTP cannot be overridden in Settings. */
export function isSmtpManagedByHost(): boolean {
  const raw = envGet(paths.envZaolySmtpManaged)?.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on'
}

export function resolveSmtpConfig(db: SmtpDbSettings | null): {
  config: SmtpConfig | null
  source: SmtpPublicStatus['source']
} {
  const fromEnv = smtpConfigFromEnv()
  // Managed host (zaoly.app): env is SSOT.
  if (isSmtpManagedByHost()) {
    if (fromEnv) return { config: fromEnv, source: 'env' }
    return { config: null, source: 'none' }
  }
  // Self-host: optional DB override, else env, else none.
  const fromDb = smtpConfigFromDb(db)
  if (fromDb) return { config: fromDb, source: 'db' }
  if (fromEnv) return { config: fromEnv, source: 'env' }
  return { config: null, source: 'none' }
}

export function toSmtpPublicStatus(
  db: SmtpDbSettings | null,
  resolved: { config: SmtpConfig | null; source: SmtpPublicStatus['source'] },
): SmtpPublicStatus {
  const c = resolved.config
  const env = smtpConfigFromEnv()
  const managed = isSmtpManagedByHost()
  return {
    configured: Boolean(c),
    source: resolved.source,
    managed,
    host: c?.host ?? db?.host ?? env?.host ?? null,
    port: c?.port ?? db?.port ?? env?.port ?? paths.smtpDefaultPort,
    user: c?.user ?? (db?.user || null) ?? env?.user ?? null,
    from: c?.from ?? db?.from ?? env?.from ?? null,
    fromName: c?.fromName ?? db?.fromName ?? env?.fromName ?? paths.smtpDefaultFromName,
    tls: c?.tls ?? db?.tls ?? env?.tls ?? paths.smtpDefaultTls,
    passwordSet: Boolean(
      (resolved.source === 'db' && db?.passCipher) ||
        (resolved.source === 'env' && envGet(paths.envZaolySmtpPass)) ||
        (db?.passCipher && db.enabled),
    ),
    dbEnabled: Boolean(db?.enabled),
  }
}
