import 'server-only'
import { randomUUID } from 'node:crypto'
import type { AuthenticatorTransport, CredentialDeviceType } from '@simplewebauthn/server'
import { getScenePool } from '../scene/pg-store'
import { ensureUsersSchema } from './user-store'

export type StoredWebAuthnCredential = {
  id: string
  userId: string
  credentialId: string
  publicKey: Uint8Array
  counter: number
  transports: AuthenticatorTransport[]
  deviceType: string | null
  backedUp: boolean
  createdAt: string
}

type CredRow = {
  id: string
  user_id: string
  credential_id: string
  public_key: Buffer
  counter: string | number
  transports: unknown
  device_type: string | null
  backed_up: boolean
  created_at: Date | string
}

let schemaReady: Promise<void> | null = null

export async function ensureWebAuthnSchema(): Promise<void> {
  await ensureUsersSchema()
  if (!schemaReady) {
    schemaReady = (async () => {
      await getScenePool().query(`
        CREATE TABLE IF NOT EXISTS user_webauthn_credentials (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          credential_id TEXT NOT NULL UNIQUE,
          public_key BYTEA NOT NULL,
          counter BIGINT NOT NULL DEFAULT 0,
          transports JSONB NOT NULL DEFAULT '[]'::jsonb,
          device_type TEXT,
          backed_up BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await getScenePool().query(`
        CREATE INDEX IF NOT EXISTS user_webauthn_credentials_user_idx
        ON user_webauthn_credentials (user_id)
      `)
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}

function rowToCred(row: CredRow): StoredWebAuthnCredential {
  const transports = Array.isArray(row.transports)
    ? (row.transports.filter((t) => typeof t === 'string') as AuthenticatorTransport[])
    : []
  return {
    id: row.id,
    userId: row.user_id,
    credentialId: row.credential_id,
    publicKey: new Uint8Array(row.public_key),
    counter: Number(row.counter),
    transports,
    deviceType: row.device_type,
    backedUp: Boolean(row.backed_up),
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export async function listWebAuthnCredentials(
  userId: string,
): Promise<StoredWebAuthnCredential[]> {
  await ensureWebAuthnSchema()
  const r = await getScenePool().query<CredRow>(
    `SELECT id, user_id, credential_id, public_key, counter, transports, device_type, backed_up, created_at
     FROM user_webauthn_credentials WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  )
  return r.rows.map(rowToCred)
}

export async function getWebAuthnCredentialByCredentialId(
  credentialId: string,
): Promise<StoredWebAuthnCredential | null> {
  await ensureWebAuthnSchema()
  const r = await getScenePool().query<CredRow>(
    `SELECT id, user_id, credential_id, public_key, counter, transports, device_type, backed_up, created_at
     FROM user_webauthn_credentials WHERE credential_id = $1`,
    [credentialId],
  )
  return r.rows[0] ? rowToCred(r.rows[0]) : null
}

export async function insertWebAuthnCredential(input: {
  userId: string
  credentialId: string
  publicKey: Uint8Array
  counter: number
  transports?: AuthenticatorTransport[]
  deviceType?: CredentialDeviceType | string
  backedUp?: boolean
}): Promise<StoredWebAuthnCredential> {
  await ensureWebAuthnSchema()
  const id = randomUUID()
  const r = await getScenePool().query<CredRow>(
    `INSERT INTO user_webauthn_credentials
      (id, user_id, credential_id, public_key, counter, transports, device_type, backed_up)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
     RETURNING id, user_id, credential_id, public_key, counter, transports, device_type, backed_up, created_at`,
    [
      id,
      input.userId,
      input.credentialId,
      Buffer.from(input.publicKey),
      input.counter,
      JSON.stringify(input.transports ?? []),
      input.deviceType ?? null,
      Boolean(input.backedUp),
    ],
  )
  return rowToCred(r.rows[0]!)
}

export async function updateWebAuthnCounter(
  credentialId: string,
  counter: number,
): Promise<void> {
  await ensureWebAuthnSchema()
  await getScenePool().query(
    `UPDATE user_webauthn_credentials SET counter = $2 WHERE credential_id = $1`,
    [credentialId, counter],
  )
}

export async function deleteWebAuthnCredential(
  userId: string,
  id: string,
): Promise<boolean> {
  await ensureWebAuthnSchema()
  const r = await getScenePool().query(
    `DELETE FROM user_webauthn_credentials WHERE id = $1 AND user_id = $2`,
    [id, userId],
  )
  return (r.rowCount ?? 0) > 0
}

export async function userHasWebAuthn(userId: string): Promise<boolean> {
  await ensureWebAuthnSchema()
  const r = await getScenePool().query<{ n: string }>(
    `SELECT COUNT(*)::text AS n FROM user_webauthn_credentials WHERE user_id = $1`,
    [userId],
  )
  return Number(r.rows[0]?.n ?? '0') > 0
}
