/**
 * Persist admin SMTP settings in Postgres.
 * Spec: `specs/domain/zaoly-system-mail.md`
 */
import 'server-only'
import { getScenePool, isPostgresSceneStore } from '../scene/pg-store'
import { ensureUsersSchema } from '../users/user-store'
import { paths } from '../paths'
import { encryptSmtpSecret } from './smtp-crypto'
import {
  isSmtpTlsMode,
  isValidSmtpEmail,
  type SmtpDbSettings,
  type SmtpTlsMode,
} from './smtp-types'

function isAvailable(): boolean {
  return isPostgresSceneStore()
}

let settingsSchemaReady: Promise<void> | null = null

export async function ensureSystemSettingsSchema(): Promise<void> {
  if (!isAvailable()) return
  if (!settingsSchemaReady) {
    settingsSchemaReady = (async () => {
      await ensureUsersSchema()
      const pool = getScenePool()
      await pool.query(`
        CREATE TABLE IF NOT EXISTS zaoly_system_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
      `)
    })()
  }
  await settingsSchemaReady
}

type SmtpJson = {
  enabled?: boolean
  host?: string
  port?: number
  user?: string
  passCipher?: string
  from?: string
  fromName?: string
  tls?: string
}

function rowToSettings(value: unknown): SmtpDbSettings | null {
  if (!value || typeof value !== 'object') return null
  const v = value as SmtpJson
  return {
    enabled: Boolean(v.enabled),
    host: typeof v.host === 'string' ? v.host : '',
    port: typeof v.port === 'number' && Number.isFinite(v.port) ? v.port : paths.smtpDefaultPort,
    user: typeof v.user === 'string' ? v.user : '',
    passCipher: typeof v.passCipher === 'string' ? v.passCipher : '',
    from: typeof v.from === 'string' ? v.from : '',
    fromName: typeof v.fromName === 'string' ? v.fromName : paths.smtpDefaultFromName,
    tls: isSmtpTlsMode(v.tls) ? v.tls : paths.smtpDefaultTls,
  }
}

export async function loadSmtpDbSettings(): Promise<SmtpDbSettings | null> {
  if (!isAvailable()) return null
  await ensureSystemSettingsSchema()
  const r = await getScenePool().query<{ value: unknown }>(
    `SELECT value FROM zaoly_system_settings WHERE key = $1`,
    [paths.smtpSettingsKey],
  )
  return rowToSettings(r.rows[0]?.value)
}

export type SaveSmtpInput = {
  enabled: boolean
  host?: string
  port?: number
  user?: string
  pass?: string | null
  from?: string
  fromName?: string
  tls?: SmtpTlsMode
  updatedBy: string | null
}

export async function saveSmtpDbSettings(input: SaveSmtpInput): Promise<SmtpDbSettings> {
  if (!isAvailable()) throw new Error('auth_not_configured')
  await ensureSystemSettingsSchema()
  const prev = await loadSmtpDbSettings()
  if (input.enabled) {
    const host = (input.host ?? prev?.host ?? '').trim()
    const from = (input.from ?? prev?.from ?? '').trim()
    if (!host) throw new Error('smtp_host_required')
    if (!isValidSmtpEmail(from)) throw new Error('smtp_from_invalid')
  }
  let passCipher = prev?.passCipher ?? ''
  if (typeof input.pass === 'string' && input.pass.length > 0) {
    passCipher = encryptSmtpSecret(input.pass)
  }
  const next: SmtpDbSettings = {
    enabled: input.enabled,
    host: (input.host ?? prev?.host ?? '').trim(),
    port:
      typeof input.port === 'number' && Number.isFinite(input.port)
        ? input.port
        : (prev?.port ?? paths.smtpDefaultPort),
    user: (input.user ?? prev?.user ?? '').trim(),
    passCipher,
    from: (input.from ?? prev?.from ?? '').trim(),
    fromName: (input.fromName ?? prev?.fromName ?? paths.smtpDefaultFromName).trim(),
    tls: input.tls && isSmtpTlsMode(input.tls) ? input.tls : (prev?.tls ?? paths.smtpDefaultTls),
  }
  await getScenePool().query(
    `INSERT INTO zaoly_system_settings (key, value, updated_at, updated_by)
     VALUES ($1, $2::jsonb, NOW(), $3)
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       updated_at = NOW(),
       updated_by = EXCLUDED.updated_by`,
    [paths.smtpSettingsKey, JSON.stringify(next), input.updatedBy],
  )
  return next
}
