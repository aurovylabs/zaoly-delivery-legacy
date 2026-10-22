import 'server-only'
import { getScenePool } from '../scene/pg-store'
import { openMfaSecret, sealMfaSecret } from './mfa-crypto'
import {
  buildOtpauthUrl,
  consumeRecoveryCode,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCodes,
  verifyTotpCode,
} from './mfa-totp'
import { ensureUsersSchema } from './user-store'

type MfaRow = {
  user_id: string
  totp_secret_enc: string | null
  totp_pending_enc: string | null
  recovery_hashes: unknown
  enabled_at: Date | string | null
}

let mfaSchemaReady: Promise<void> | null = null

export async function ensureMfaSchema(): Promise<void> {
  await ensureUsersSchema()
  if (!mfaSchemaReady) {
    mfaSchemaReady = (async () => {
      await getScenePool().query(`
        CREATE TABLE IF NOT EXISTS user_mfa (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          totp_secret_enc TEXT,
          totp_pending_enc TEXT,
          recovery_hashes JSONB NOT NULL DEFAULT '[]'::jsonb,
          enabled_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
    })()
  }
  await mfaSchemaReady
}

function parseHashes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string')
}

async function getRow(userId: string): Promise<MfaRow | null> {
  await ensureMfaSchema()
  const r = await getScenePool().query<MfaRow>(
    `SELECT user_id, totp_secret_enc, totp_pending_enc, recovery_hashes, enabled_at
     FROM user_mfa WHERE user_id = $1`,
    [userId],
  )
  return r.rows[0] ?? null
}

export async function isMfaEnabledForUser(userId: string): Promise<boolean> {
  const row = await getRow(userId)
  return Boolean(row?.totp_secret_enc && row.enabled_at)
}

export async function beginMfaSetup(userId: string, email: string): Promise<{
  secret: string
  otpauthUrl: string
}> {
  await ensureMfaSchema()
  const existing = await getRow(userId)
  if (existing?.totp_secret_enc && existing.enabled_at) {
    throw new Error('mfa_already_enabled')
  }
  const secret = generateTotpSecret()
  const sealed = sealMfaSecret(secret)
  await getScenePool().query(
    `INSERT INTO user_mfa (user_id, totp_pending_enc, totp_secret_enc, recovery_hashes, enabled_at, updated_at)
     VALUES ($1, $2, NULL, '[]'::jsonb, NULL, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       totp_pending_enc = EXCLUDED.totp_pending_enc,
       totp_secret_enc = NULL,
       recovery_hashes = '[]'::jsonb,
       enabled_at = NULL,
       updated_at = NOW()`,
    [userId, sealed],
  )
  return { secret, otpauthUrl: buildOtpauthUrl(secret, email) }
}

export async function confirmMfaSetup(
  userId: string,
  code: string,
): Promise<{ recoveryCodes: string[] }> {
  const row = await getRow(userId)
  if (!row?.totp_pending_enc) throw new Error('mfa_no_pending')
  if (row.totp_secret_enc && row.enabled_at) throw new Error('mfa_already_enabled')
  const secret = openMfaSecret(row.totp_pending_enc)
  if (!secret) throw new Error('mfa_secret_corrupt')
  if (!verifyTotpCode(secret, code)) throw new Error('mfa_invalid_code')
  const recoveryCodes = generateRecoveryCodes()
  const hashes = hashRecoveryCodes(recoveryCodes)
  await getScenePool().query(
    `UPDATE user_mfa SET
       totp_secret_enc = $2,
       totp_pending_enc = NULL,
       recovery_hashes = $3::jsonb,
       enabled_at = NOW(),
       updated_at = NOW()
     WHERE user_id = $1`,
    [userId, sealMfaSecret(secret), JSON.stringify(hashes)],
  )
  return { recoveryCodes }
}

export async function disableMfa(userId: string, code: string): Promise<void> {
  const row = await getRow(userId)
  if (!row?.totp_secret_enc || !row.enabled_at) throw new Error('mfa_not_enabled')
  const secret = openMfaSecret(row.totp_secret_enc)
  if (!secret) throw new Error('mfa_secret_corrupt')
  const hashes = parseHashes(row.recovery_hashes)
  if (verifyTotpCode(secret, code)) {
    await clearMfa(userId)
    return
  }
  const consumed = consumeRecoveryCode(code, hashes)
  if (!consumed.ok) throw new Error('mfa_invalid_code')
  await clearMfa(userId)
}

async function clearMfa(userId: string): Promise<void> {
  await ensureMfaSchema()
  await getScenePool().query(`DELETE FROM user_mfa WHERE user_id = $1`, [userId])
}

/** Verify TOTP or consume one recovery code. */
export async function verifyMfaLoginCode(userId: string, code: string): Promise<boolean> {
  const row = await getRow(userId)
  if (!row?.totp_secret_enc || !row.enabled_at) return true
  const secret = openMfaSecret(row.totp_secret_enc)
  if (!secret) return false
  if (verifyTotpCode(secret, code)) return true
  const hashes = parseHashes(row.recovery_hashes)
  const consumed = consumeRecoveryCode(code, hashes)
  if (!consumed.ok) return false
  await getScenePool().query(
    `UPDATE user_mfa SET recovery_hashes = $2::jsonb, updated_at = NOW() WHERE user_id = $1`,
    [userId, JSON.stringify(consumed.remaining)],
  )
  return true
}
