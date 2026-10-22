#!/usr/bin/env node
/**
 * Apply Zaoly local Postgres schema + optional bootstrap admin.
 * Spec: knowledge/zaoly-postgres.md · zaoly-user-management.md
 *
 * Usage:
 *   ZAOLY_DATABASE_URL=postgresql://zaoly:zaoly@localhost:5434/zaoly \
 *   ZAOLY_BOOTSTRAP_ADMIN_EMAIL=admin@example.com \
 *   ZAOLY_BOOTSTRAP_ADMIN_PASSWORD='at-least-10-chars' \
 *   node scripts/bootstrap-local-pg.mjs
 */
import { randomBytes, randomUUID, scryptSync } from 'node:crypto'
import pg from 'pg'

export const DEFAULT_LOCAL_DATABASE_URL =
  'postgresql://zaoly:zaoly@localhost:5434/zaoly'

export const EXPECTED_TABLES = [
  'scenes',
  'scene_versions',
  'projects',
  'site_kit_overrides',
  'scene_op_audit',
  'users',
  'user_invites',
  'scene_members',
  'creation_client_shares',
  'token_leaves',
]

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 32
const PASSWORD_MIN_LENGTH = 10

function hashPassword(password) {
  const salt = randomBytes(16)
  const key = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    platform_project_id TEXT,
    active_breakpoint TEXT,
    active_print_preset TEXT,
    root JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS active_print_preset TEXT`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS masters JSONB`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS comments JSONB`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS pages JSONB`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS active_page_id TEXT`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS cover_page_id TEXT`,
  `ALTER TABLE scenes ADD COLUMN IF NOT EXISTS owner_user_id TEXT`,
  `CREATE INDEX IF NOT EXISTS scenes_owner_updated_idx ON scenes (owner_user_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS scenes_platform_updated_idx ON scenes (platform_project_id, updated_at DESC)`,
  `CREATE TABLE IF NOT EXISTS scene_versions (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_auto_save BOOLEAN NOT NULL DEFAULT false,
    author_json JSONB NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 1,
    node_count INTEGER NOT NULL DEFAULT 0,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE (scene_id, version_number)
  )`,
  `CREATE INDEX IF NOT EXISTS scene_versions_scene_number_idx ON scene_versions (scene_id, version_number DESC)`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    platform_project_id TEXT NOT NULL UNIQUE,
    capability_status TEXT NOT NULL DEFAULT 'pending',
    last_activity_at TIMESTAMPTZ,
    composition_count INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    owner_user_id TEXT,
    platform_company_id TEXT,
    domain TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS site_kit_overrides (
    component_id TEXT PRIMARY KEY,
    body JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scene_op_audit (
    id BIGSERIAL PRIMARY KEY,
    scene_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    actor_label TEXT,
    mode TEXT NOT NULL,
    applied_count INTEGER NOT NULL DEFAULT 0,
    client_batch_id TEXT,
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS scene_op_audit_scene_created_idx ON scene_op_audit (scene_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password_hash TEXT,
    google_sub TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    disabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
  )`,
  `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_uidx ON users (google_sub) WHERE google_sub IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS user_invites (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS user_invites_email_pending_idx ON user_invites (email) WHERE accepted_at IS NULL`,
  `CREATE TABLE IF NOT EXISTS scene_members (
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scene_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS scene_members_user_idx ON scene_members (user_id)`,
  `CREATE TABLE IF NOT EXISTS creation_client_shares (
    id TEXT PRIMARY KEY,
    platform_project_id TEXT NOT NULL,
    scene_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    page_ids JSONB NOT NULL,
    content_mode TEXT NOT NULL,
    snapshot JSONB NOT NULL,
    access_mode TEXT NOT NULL,
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_by_user_id TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
  )`,
  `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS email_allowlist JSONB`,
  `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT false`,
  `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS guest_comments JSONB`,
  `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS token_plain TEXT`,
  `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`,
  `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS approved_by_user_id TEXT`,
  `CREATE TABLE IF NOT EXISTS token_leaves (
    path TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
]

export async function applyLocalPgSchema(client) {
  for (const sql of SCHEMA_STATEMENTS) {
    await client.query(sql)
  }
}

export async function ensureBootstrapAdmin(client, email, password) {
  const count = await client.query(`SELECT COUNT(*)::text AS n FROM users`)
  if (Number(count.rows[0]?.n ?? '0') > 0) return { created: false, reason: 'users_exist' }
  const normalized = String(email ?? '')
    .trim()
    .toLowerCase()
  if (!normalized || !password || password.length < PASSWORD_MIN_LENGTH) {
    return { created: false, reason: 'missing_bootstrap_env' }
  }
  await client.query(
    `INSERT INTO users (id, email, name, password_hash, role, disabled)
     VALUES ($1, $2, $3, $4, 'admin', FALSE)`,
    [randomUUID(), normalized, 'Admin', hashPassword(password)],
  )
  return { created: true, email: normalized }
}

export async function listPublicTables(client) {
  const r = await client.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  )
  return r.rows.map((row) => row.tablename)
}

async function main() {
  const url = process.env.ZAOLY_DATABASE_URL?.trim() || DEFAULT_LOCAL_DATABASE_URL
  const client = new pg.Client({ connectionString: url })
  await client.connect()
  try {
    await applyLocalPgSchema(client)
    const bootstrap = await ensureBootstrapAdmin(
      client,
      process.env.ZAOLY_BOOTSTRAP_ADMIN_EMAIL,
      process.env.ZAOLY_BOOTSTRAP_ADMIN_PASSWORD,
    )
    const tables = await listPublicTables(client)
    const missing = EXPECTED_TABLES.filter((name) => !tables.includes(name))
    if (missing.length) {
      throw new Error(`missing tables: ${missing.join(', ')}`)
    }
    console.log(JSON.stringify({ ok: true, tables: EXPECTED_TABLES, bootstrap }))
  } finally {
    await client.end()
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
