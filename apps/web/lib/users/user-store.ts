import 'server-only'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import {
  ensureScenesSchema,
  getScenePool,
  isPostgresSceneStore,
} from '../scene/pg-store'
import { paths } from '../paths'
import { envGet } from '../env-resolve'
import { zaolyPublicUrl } from '../runtime-config'
import {
  assertPasswordPolicy,
  hashPassword,
  verifyPassword,
} from './password'

export type AppRole = 'admin' | 'member' | 'platform_admin'

export function isStaffRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'platform_admin'
}

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  return role === 'platform_admin'
}

export function parseAppRole(raw: string | null | undefined): AppRole | null {
  if (raw === 'admin' || raw === 'member' || raw === 'platform_admin') return raw
  return null
}
export type SceneMemberRole = 'editor' | 'viewer'

export type ZaolyUser = {
  id: string
  email: string
  name: string | null
  role: AppRole
  disabled: boolean
  createdAt: string
  lastLoginAt: string | null
}

export type ZaolyUserAccountFlags = {
  hasPassword: boolean
  emailVerified: boolean
}

type UserRow = {
  id: string
  email: string
  name: string | null
  password_hash: string | null
  role: string
  disabled: boolean
  created_at: Date | string
  last_login_at: Date | string | null
  google_sub?: string | null
  email_verified_at?: Date | string | null
}

let schemaReady: Promise<void> | null = null
let bootstrapReady: Promise<void> | null = null

export function isZaolyUserStoreAvailable(): boolean {
  return isPostgresSceneStore()
}

export async function ensureUsersSchema(): Promise<void> {
  if (!isZaolyUserStoreAvailable()) {
    throw new Error('ZAOLY_DATABASE_URL required for user store')
  }
  if (!schemaReady) {
    schemaReady = (async () => {
      await ensureScenesSchema()
      const pool = getScenePool()
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT,
          password_hash TEXT,
          google_sub TEXT UNIQUE,
          role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'platform_admin')),
          disabled BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          last_login_at TIMESTAMPTZ
        )
      `)
      await pool.query(`ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL`)
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub TEXT`)
      // Widen role check for upgrades from admin|member-only installs.
      await pool.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`)
      await pool.query(`
        DO $$ BEGIN
          ALTER TABLE users
            ADD CONSTRAINT users_role_check
            CHECK (role IN ('admin', 'member', 'platform_admin'));
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$
      `)
      await pool.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_uidx
        ON users (google_sub) WHERE google_sub IS NOT NULL
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_invites (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL,
          role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
          accepted_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await pool.query(`
        CREATE INDEX IF NOT EXISTS user_invites_email_pending_idx
        ON user_invites (email) WHERE accepted_at IS NULL
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS scene_members (
          scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (scene_id, user_id)
        )
      `)
      await pool.query(`
        CREATE INDEX IF NOT EXISTS scene_members_user_idx
        ON scene_members (user_id)
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await pool.query(`
        CREATE INDEX IF NOT EXISTS password_reset_tokens_user_pending_idx
        ON password_reset_tokens (user_id) WHERE used_at IS NULL
      `)
      await pool.query(
        `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,
      )
      await pool.query(`
        CREATE TABLE IF NOT EXISTS email_verification_tokens (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)
      await pool.query(`
        CREATE INDEX IF NOT EXISTS email_verification_tokens_user_pending_idx
        ON email_verification_tokens (user_id) WHERE used_at IS NULL
      `)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_audit_events (
          id UUID PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          actor_user_id UUID NOT NULL,
          actor_email TEXT,
          action TEXT NOT NULL,
          target_user_id UUID,
          meta JSONB
        )
      `)
      await pool.query(`
        CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx
        ON admin_audit_events (created_at DESC, id DESC)
      `)
      await promoteConfiguredPlatformAdmins()
    })().catch((err) => {
      // Allow retry after Postgres comes back (do not cache a rejected bootstrap).
      schemaReady = null
      throw err
    })
  }
  await schemaReady
}

async function promoteConfiguredPlatformAdmins(): Promise<void> {
  const raw = envGet(paths.envZaolyPlatformAdminEmails)?.trim()
  if (!raw) return
  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'))
  if (!emails.length) return
  await getScenePool().query(
    `UPDATE users SET role = 'platform_admin'
     WHERE email = ANY($1::text[]) AND disabled = FALSE AND role <> 'platform_admin'`,
    [emails],
  )
}

function rowToUser(row: UserRow): ZaolyUser {
  const role = parseAppRole(row.role) ?? 'member'
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role,
    disabled: Boolean(row.disabled),
    createdAt: new Date(row.created_at).toISOString(),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
  }
}

export async function ensureBootstrapAdmin(): Promise<void> {
  if (!isZaolyUserStoreAvailable()) return
  if (!bootstrapReady) {
    bootstrapReady = (async () => {
      await ensureUsersSchema()
      const count = await getScenePool().query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM users`,
      )
      if (Number(count.rows[0]?.n ?? '0') > 0) return
      const email = envGet(paths.envZaolyBootstrapAdminEmail)?.trim().toLowerCase()
      const password = envGet(paths.envZaolyBootstrapAdminPassword) ?? ''
      if (!email || assertPasswordPolicy(password)) return
      const id = randomUUID()
      await getScenePool().query(
        `INSERT INTO users (id, email, name, password_hash, role, disabled)
         VALUES ($1, $2, $3, $4, 'admin', FALSE)`,
        [id, email, 'Admin', hashPassword(password)],
      )
      try {
        const { voidEnsureStarterLandingForUser } = await import(
          '../scene/user-starter-scene'
        )
        voidEnsureStarterLandingForUser(id)
      } catch {
        // Scene provision is best-effort; editor boot will ensure later.
      }
    })()
  }
  await bootstrapReady
}

export async function countUsers(): Promise<number> {
  await ensureUsersSchema()
  const r = await getScenePool().query<{ n: string }>(`SELECT COUNT(*)::text AS n FROM users`)
  return Number(r.rows[0]?.n ?? '0')
}

export type UserDirectoryCounts = {
  total: number
  admins: number
  members: number
  disabled: number
}

export async function countUsersBreakdown(): Promise<UserDirectoryCounts> {
  await ensureUsersSchema()
  const r = await getScenePool().query<{
    total: string
    admins: string
    members: string
    disabled: string
  }>(`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE role IN ('admin', 'platform_admin') AND NOT disabled)::text AS admins,
      COUNT(*) FILTER (WHERE role = 'member' AND NOT disabled)::text AS members,
      COUNT(*) FILTER (WHERE disabled)::text AS disabled
    FROM users
  `)
  const row = r.rows[0]
  return {
    total: Number(row?.total ?? '0'),
    admins: Number(row?.admins ?? '0'),
    members: Number(row?.members ?? '0'),
    disabled: Number(row?.disabled ?? '0'),
  }
}

export type ZaolyUserDirectoryRow = ZaolyUser & {
  hasPassword: boolean
  hasGoogle: boolean
  ownedSceneCount: number
}

type UserDirectoryRow = UserRow & {
  owned_scene_count?: string | number | null
}

export type ListUsersQuery = {
  q?: string
  role?: AppRole
  disabled?: boolean
  /** When set, paginate; when omitted, return full list (compat). */
  limit?: number
  /** Opaque cursor: base64url of `createdAt|id` (exclusive lower bound). */
  cursor?: string
}

function encodeUserCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url')
}

function decodeUserCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8')
    const idx = raw.indexOf('|')
    if (idx <= 0) return null
    const createdAt = raw.slice(0, idx)
    const id = raw.slice(idx + 1)
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

export async function listUsers(): Promise<ZaolyUser[]> {
  const page = await listUsersPage({})
  return page.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    disabled: u.disabled,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
  }))
}

export async function listUsersPage(
  query: ListUsersQuery = {},
): Promise<{ users: ZaolyUserDirectoryRow[]; nextCursor: string | null }> {
  await ensureUsersSchema()
  const params: unknown[] = []
  const where: string[] = []

  const q = query.q?.trim().toLowerCase()
  if (q) {
    params.push(`%${q}%`)
    where.push(
      `(LOWER(u.email) LIKE $${params.length} OR LOWER(COALESCE(u.name, '')) LIKE $${params.length})`,
    )
  }
  if (query.role === 'admin' || query.role === 'member' || query.role === 'platform_admin') {
    params.push(query.role)
    where.push(`u.role = $${params.length}`)
  }
  if (typeof query.disabled === 'boolean') {
    params.push(query.disabled)
    where.push(`u.disabled = $${params.length}`)
  }
  if (query.cursor) {
    const decoded = decodeUserCursor(query.cursor)
    if (decoded) {
      params.push(decoded.createdAt, decoded.id)
      where.push(
        `(u.created_at, u.id) > ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
      )
    }
  }

  const qualifiedWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const limit =
    typeof query.limit === 'number' && Number.isFinite(query.limit)
      ? Math.min(
          Math.max(1, Math.floor(query.limit)),
          paths.adminUsersPageSizeMax,
        )
      : null
  const limitSql = limit != null ? `LIMIT ${limit + 1}` : ''

  const r = await getScenePool().query<UserDirectoryRow>(
    `SELECT u.id, u.email, u.name, u.password_hash, u.google_sub, u.role, u.disabled,
            u.created_at, u.last_login_at,
            COALESCE(sc.n, 0)::int AS owned_scene_count
     FROM users u
     LEFT JOIN (
       SELECT owner_user_id, COUNT(*)::int AS n
       FROM scenes
       WHERE owner_user_id IS NOT NULL AND owner_user_id <> ''
       GROUP BY owner_user_id
     ) sc ON sc.owner_user_id = u.id::text
     ${qualifiedWhere}
     ORDER BY u.created_at ASC, u.id ASC
     ${limitSql}`,
    params,
  )

  let rows = r.rows
  let nextCursor: string | null = null
  if (limit != null && rows.length > limit) {
    const lastKept = rows[limit - 1]
    rows = rows.slice(0, limit)
    if (lastKept) {
      nextCursor = encodeUserCursor(
        new Date(lastKept.created_at).toISOString(),
        lastKept.id,
      )
    }
  }

  return {
    users: rows.map((row) => ({
      ...rowToUser(row),
      hasPassword: Boolean(row.password_hash),
      hasGoogle: Boolean(row.google_sub),
      ownedSceneCount: Number(row.owned_scene_count ?? 0),
    })),
    nextCursor,
  }
}

export async function getUserById(id: string): Promise<ZaolyUser | null> {
  await ensureUsersSchema()
  const r = await getScenePool().query<UserRow>(
    `SELECT id, email, name, password_hash, role, disabled, created_at, last_login_at
     FROM users WHERE id = $1`,
    [id],
  )
  const row = r.rows[0]
  return row ? rowToUser(row) : null
}

export async function getUserByEmail(email: string): Promise<ZaolyUser | null> {
  await ensureUsersSchema()
  const r = await getScenePool().query<UserRow>(
    `SELECT id, email, name, password_hash, role, disabled, created_at, last_login_at
     FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  )
  const row = r.rows[0]
  return row ? rowToUser(row) : null
}

export async function registerLocalMember(input: {
  email: string
  password: string
  name?: string
}): Promise<ZaolyUser> {
  await ensureUsersSchema()
  const policy = assertPasswordPolicy(input.password)
  if (policy) throw new Error(policy)
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) throw new Error('invalid_email')
  const existing = await getUserByEmail(email)
  if (existing && !existing.disabled) throw new Error('already_exists')
  if (existing?.disabled) throw new Error('already_exists')
  const id = randomUUID()
  const name = input.name?.trim() || null
  await getScenePool().query(
    `INSERT INTO users (id, email, name, password_hash, role, disabled)
     VALUES ($1, $2, $3, $4, 'member', FALSE)`,
    [id, email, name, hashPassword(input.password)],
  )
  const user = await getUserById(id)
  if (!user) throw new Error('create_failed')
  return user
}

/** Link or create a local member from a Google OAuth profile. */
export async function upsertGoogleMember(input: {
  googleSub: string
  email: string
  name?: string | null
}): Promise<{ user: ZaolyUser; created: boolean }> {
  await ensureUsersSchema()
  const googleSub = input.googleSub.trim()
  const email = input.email.trim().toLowerCase()
  if (!googleSub || !email) throw new Error('invalid_google_profile')

  const bySub = await getScenePool().query<UserRow>(
    `SELECT id, email, name, password_hash, role, disabled, created_at, last_login_at, google_sub
     FROM users WHERE google_sub = $1`,
    [googleSub],
  )
  if (bySub.rows[0]) {
    const row = bySub.rows[0]
    if (row.disabled) throw new Error('disabled')
    await getScenePool().query(
      `UPDATE users SET last_login_at = NOW(),
         email_verified_at = COALESCE(email_verified_at, NOW())
       WHERE id = $1`,
      [row.id],
    )
    return { user: rowToUser(row), created: false }
  }

  const byEmail = await getUserByEmail(email)
  if (byEmail) {
    if (byEmail.disabled) throw new Error('disabled')
    await getScenePool().query(
      `UPDATE users SET google_sub = $2, last_login_at = NOW(),
         name = COALESCE(name, $3),
         email_verified_at = COALESCE(email_verified_at, NOW())
       WHERE id = $1`,
      [byEmail.id, googleSub, input.name?.trim() || null],
    )
    const linked = await getUserById(byEmail.id)
    if (!linked) throw new Error('create_failed')
    return { user: linked, created: false }
  }

  const id = randomUUID()
  const name = input.name?.trim() || null
  await getScenePool().query(
    `INSERT INTO users (id, email, name, password_hash, google_sub, role, disabled, last_login_at, email_verified_at)
     VALUES ($1, $2, $3, NULL, $4, 'member', FALSE, NOW(), NOW())`,
    [id, email, name, googleSub],
  )
  const created = await getUserById(id)
  if (!created) throw new Error('create_failed')
  return { user: created, created: true }
}

export async function validateLocalCredentials(
  email: string,
  password: string,
): Promise<ZaolyUser | null> {
  await ensureBootstrapAdmin()
  await ensureUsersSchema()
  const r = await getScenePool().query<UserRow>(
    `SELECT id, email, name, password_hash, role, disabled, created_at, last_login_at
     FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  )
  const row = r.rows[0]
  if (!row || row.disabled) return null
  if (!verifyPassword(password, row.password_hash)) return null
  await getScenePool().query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [row.id])
  return rowToUser(row)
}

export async function updateUserName(id: string, name: string): Promise<ZaolyUser | null> {
  await ensureUsersSchema()
  const r = await getScenePool().query<UserRow>(
    `UPDATE users SET name = $2 WHERE id = $1
     RETURNING id, email, name, password_hash, role, disabled, created_at, last_login_at`,
    [id, name],
  )
  const row = r.rows[0]
  return row ? rowToUser(row) : null
}

export async function patchAdminUser(
  id: string,
  patch: { disabled?: boolean; role?: AppRole },
): Promise<ZaolyUser | null> {
  await ensureUsersSchema()
  const demotesStaff =
    patch.disabled === true ||
    (patch.role != null && !isStaffRole(patch.role))
  if (demotesStaff) {
    const staff = await getScenePool().query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM users
       WHERE role IN ('admin', 'platform_admin') AND disabled = FALSE AND id <> $1`,
      [id],
    )
    const otherStaff = Number(staff.rows[0]?.n ?? '0')
    const target = await getUserById(id)
    if (target && isStaffRole(target.role) && otherStaff === 0) {
      throw new Error('last_admin')
    }
  }
  const r = await getScenePool().query<UserRow>(
    `UPDATE users SET
       disabled = COALESCE($2, disabled),
       role = COALESCE($3, role)
     WHERE id = $1
     RETURNING id, email, name, password_hash, role, disabled, created_at, last_login_at`,
    [id, patch.disabled ?? null, patch.role ?? null],
  )
  const row = r.rows[0]
  return row ? rowToUser(row) : null
}

/** Disable + scrub PII. Throws `last_admin` / `cannot_anonymize_self`. */
export async function anonymizeUser(
  id: string,
  actorUserId: string,
): Promise<ZaolyUser> {
  await ensureUsersSchema()
  if (id === actorUserId) throw new Error('cannot_anonymize_self')
  const target = await getUserById(id)
  if (!target) throw new Error('not_found')
  if (isStaffRole(target.role)) {
    const staff = await getScenePool().query<{ n: string }>(
      `SELECT COUNT(*)::text AS n FROM users
       WHERE role IN ('admin', 'platform_admin') AND disabled = FALSE AND id <> $1`,
      [id],
    )
    if (Number(staff.rows[0]?.n ?? '0') === 0) throw new Error('last_admin')
  }
  const anonEmail = `anon-${id}@${paths.anonymizedEmailDomain}`
  const r = await getScenePool().query<UserRow>(
    `UPDATE users SET
       disabled = TRUE,
       name = NULL,
       password_hash = NULL,
       google_sub = NULL,
       email = $2,
       role = 'member'
     WHERE id = $1
     RETURNING id, email, name, password_hash, role, disabled, created_at, last_login_at`,
    [id, anonEmail],
  )
  const row = r.rows[0]
  if (!row) throw new Error('not_found')
  return rowToUser(row)
}

function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function hashPasswordResetToken(token: string): string {
  return createHash('sha256').update(`zaoly-reset:${token}`).digest('hex')
}

function hashEmailVerifyToken(token: string): string {
  return createHash('sha256').update(`zaoly-verify:${token}`).digest('hex')
}

export async function getUserAccountFlags(
  id: string,
): Promise<ZaolyUserAccountFlags | null> {
  await ensureUsersSchema()
  const r = await getScenePool().query<{
    password_hash: string | null
    email_verified_at: Date | string | null
  }>(`SELECT password_hash, email_verified_at FROM users WHERE id = $1`, [id])
  const row = r.rows[0]
  if (!row) return null
  return {
    hasPassword: Boolean(row.password_hash),
    emailVerified: Boolean(row.email_verified_at),
  }
}

/** Set or change password for a signed-in user. Spec: zaoly-user-management.md */
export async function setSessionPassword(input: {
  userId: string
  password: string
  currentPassword?: string
}): Promise<ZaolyUser> {
  await ensureUsersSchema()
  const policy = assertPasswordPolicy(input.password)
  if (policy) throw new Error(policy)
  const r = await getScenePool().query<UserRow>(
    `SELECT id, email, name, password_hash, role, disabled, created_at, last_login_at
     FROM users WHERE id = $1 AND disabled = FALSE`,
    [input.userId],
  )
  const row = r.rows[0]
  if (!row) throw new Error('not_found')
  if (row.password_hash) {
    const current = input.currentPassword ?? ''
    if (!verifyPassword(current, row.password_hash)) {
      throw new Error('invalid_current_password')
    }
  }
  const updated = await getScenePool().query<UserRow>(
    `UPDATE users SET password_hash = $2 WHERE id = $1
     RETURNING id, email, name, password_hash, role, disabled, created_at, last_login_at`,
    [input.userId, hashPassword(input.password)],
  )
  const userRow = updated.rows[0]
  if (!userRow) throw new Error('not_found')
  return rowToUser(userRow)
}

/** Mint soft email-verify URL. Returns null when already verified or unknown. */
export async function createEmailVerification(input: {
  userId: string
}): Promise<{ email: string; verifyUrl: string; expiresAt: string } | null> {
  await ensureUsersSchema()
  const r = await getScenePool().query<UserRow & { email_verified_at: Date | string | null }>(
    `SELECT id, email, name, password_hash, role, disabled, created_at, last_login_at, email_verified_at
     FROM users WHERE id = $1 AND disabled = FALSE`,
    [input.userId],
  )
  const row = r.rows[0]
  if (!row || row.email_verified_at) return null
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashEmailVerifyToken(token)
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + paths.emailVerifyTtlSeconds * 1000)
  await getScenePool().query(
    `UPDATE email_verification_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [row.id],
  )
  await getScenePool().query(
    `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, row.id, tokenHash, expiresAt.toISOString()],
  )
  const verifyUrl = `${zaolyPublicUrl().replace(/\/$/, '')}${paths.routes.verifyEmail}?token=${encodeURIComponent(token)}`
  return { email: row.email, verifyUrl, expiresAt: expiresAt.toISOString() }
}

export async function consumeEmailVerification(token: string): Promise<ZaolyUser> {
  await ensureUsersSchema()
  const tokenHash = hashEmailVerifyToken(token)
  const row = await getScenePool().query<{
    id: string
    user_id: string
    expires_at: Date | string
    used_at: Date | string | null
  }>(
    `SELECT id, user_id, expires_at, used_at FROM email_verification_tokens WHERE token_hash = $1`,
    [tokenHash],
  )
  const tokenRow = row.rows[0]
  if (!tokenRow) throw new Error('invalid_token')
  if (tokenRow.used_at) throw new Error('invalid_token')
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) throw new Error('token_expired')
  const updated = await getScenePool().query<UserRow>(
    `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW())
     WHERE id = $1 AND disabled = FALSE
     RETURNING id, email, name, password_hash, role, disabled, created_at, last_login_at`,
    [tokenRow.user_id],
  )
  const userRow = updated.rows[0]
  if (!userRow) throw new Error('invalid_token')
  await getScenePool().query(
    `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenRow.id],
  )
  return rowToUser(userRow)
}

export async function markEmailVerified(userId: string): Promise<void> {
  await ensureUsersSchema()
  await getScenePool().query(
    `UPDATE users SET email_verified_at = COALESCE(email_verified_at, NOW())
     WHERE id = $1 AND disabled = FALSE`,
    [userId],
  )
}

/** Mint a single-use password reset URL. Returns null when the email is unknown or disabled. */
export async function createPasswordReset(input: {
  email: string
}): Promise<{ email: string; resetUrl: string; expiresAt: string } | null> {
  await ensureUsersSchema()
  const email = input.email.trim().toLowerCase()
  const user = await getUserByEmail(email)
  if (!user || user.disabled) return null
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashPasswordResetToken(token)
  const id = randomUUID()
  const expiresAt = new Date(Date.now() + paths.passwordResetTtlSeconds * 1000)
  await getScenePool().query(
    `UPDATE password_reset_tokens SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [user.id],
  )
  await getScenePool().query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [id, user.id, tokenHash, expiresAt.toISOString()],
  )
  const resetUrl = `${zaolyPublicUrl().replace(/\/$/, '')}${paths.routes.resetPassword}?token=${encodeURIComponent(token)}`
  return { email: user.email, resetUrl, expiresAt: expiresAt.toISOString() }
}

export async function consumePasswordReset(input: {
  token: string
  password: string
}): Promise<ZaolyUser> {
  await ensureUsersSchema()
  const policy = assertPasswordPolicy(input.password)
  if (policy) throw new Error(policy)
  const tokenHash = hashPasswordResetToken(input.token)
  const row = await getScenePool().query<{
    id: string
    user_id: string
    expires_at: Date | string
    used_at: Date | string | null
  }>(
    `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1`,
    [tokenHash],
  )
  const tokenRow = row.rows[0]
  if (!tokenRow) throw new Error('invalid_token')
  if (tokenRow.used_at) throw new Error('invalid_token')
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) throw new Error('token_expired')
  const updated = await getScenePool().query<UserRow>(
    `UPDATE users SET password_hash = $2
     WHERE id = $1 AND disabled = FALSE
     RETURNING id, email, name, password_hash, role, disabled, created_at, last_login_at`,
    [tokenRow.user_id, hashPassword(input.password)],
  )
  const userRow = updated.rows[0]
  if (!userRow) throw new Error('invalid_token')
  await getScenePool().query(
    `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenRow.id],
  )
  return rowToUser(userRow)
}

export async function createInvite(input: {
  email: string
  role: AppRole
  invitedBy: string | null
}): Promise<{ inviteId: string; email: string; role: AppRole; expiresAt: string; inviteUrl: string; token: string }> {
  await ensureUsersSchema()
  const email = input.email.trim().toLowerCase()
  const existing = await getUserByEmail(email)
  if (existing && !existing.disabled) {
    throw new Error('already_exists')
  }
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashInviteToken(token)
  const inviteId = randomUUID()
  const expiresAt = new Date(Date.now() + paths.userInviteTtlSeconds * 1000)
  const invitedBy =
    input.invitedBy &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.invitedBy,
    )
      ? input.invitedBy
      : null
  await getScenePool().query(
    `DELETE FROM user_invites WHERE email = $1 AND accepted_at IS NULL`,
    [email],
  )
  await getScenePool().query(
    `INSERT INTO user_invites (id, email, role, token_hash, expires_at, invited_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [inviteId, email, input.role, tokenHash, expiresAt.toISOString(), invitedBy],
  )
  const inviteUrl = `${zaolyPublicUrl().replace(/\/$/, '')}${paths.routes.inviteAccept(token)}`
  return {
    inviteId,
    email,
    role: input.role,
    expiresAt: expiresAt.toISOString(),
    inviteUrl,
    token,
  }
}

export async function acceptInvite(input: {
  token: string
  password: string
  name?: string
}): Promise<ZaolyUser> {
  await ensureUsersSchema()
  const policy = assertPasswordPolicy(input.password)
  if (policy) throw new Error(policy)
  const tokenHash = hashInviteToken(input.token)
  const inv = await getScenePool().query<{
    id: string
    email: string
    role: string
    expires_at: Date | string
    accepted_at: Date | string | null
  }>(
    `SELECT id, email, role, expires_at, accepted_at FROM user_invites WHERE token_hash = $1`,
    [tokenHash],
  )
  const row = inv.rows[0]
  if (!row) throw new Error('invite_not_found')
  if (row.accepted_at) throw new Error('invite_used')
  if (new Date(row.expires_at).getTime() < Date.now()) throw new Error('invite_expired')
  const existing = await getUserByEmail(row.email)
  if (existing) throw new Error('already_exists')
  const id = randomUUID()
  const name = input.name?.trim() || null
  await getScenePool().query(
    `INSERT INTO users (id, email, name, password_hash, role, disabled, email_verified_at)
     VALUES ($1, $2, $3, $4, $5, FALSE, NOW())`,
    [id, row.email, name, hashPassword(input.password), row.role === 'admin' ? 'admin' : 'member'],
  )
  await getScenePool().query(
    `UPDATE user_invites SET accepted_at = NOW() WHERE id = $1`,
    [row.id],
  )
  const user = await getUserById(id)
  if (!user) throw new Error('create_failed')
  return user
}

export async function listSceneMemberUserIds(userId: string): Promise<string[]> {
  if (!isZaolyUserStoreAvailable()) return []
  await ensureUsersSchema()
  const r = await getScenePool().query<{ scene_id: string }>(
    `SELECT scene_id FROM scene_members WHERE user_id = $1`,
    [userId],
  )
  return r.rows.map((x) => x.scene_id)
}

export async function getSceneMemberRole(
  sceneId: string,
  userId: string,
): Promise<SceneMemberRole | null> {
  if (!isZaolyUserStoreAvailable()) return null
  await ensureUsersSchema()
  const r = await getScenePool().query<{ role: string }>(
    `SELECT role FROM scene_members WHERE scene_id = $1 AND user_id = $2`,
    [sceneId, userId],
  )
  const role = r.rows[0]?.role
  if (role === 'editor' || role === 'viewer') return role
  return null
}

export async function listSceneMembers(sceneId: string): Promise<
  Array<{
    userId: string
    email: string
    name: string | null
    role: SceneMemberRole
    createdAt: string
  }>
> {
  await ensureUsersSchema()
  const r = await getScenePool().query<{
    user_id: string
    email: string
    name: string | null
    role: string
    created_at: Date | string
  }>(
    `SELECT m.user_id, u.email, u.name, m.role, m.created_at
     FROM scene_members m
     JOIN users u ON u.id = m.user_id
     WHERE m.scene_id = $1
     ORDER BY m.created_at ASC`,
    [sceneId],
  )
  return r.rows.map((row) => ({
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role === 'editor' ? 'editor' : 'viewer',
    createdAt: new Date(row.created_at).toISOString(),
  }))
}

export async function upsertSceneMember(
  sceneId: string,
  userId: string,
  role: SceneMemberRole,
): Promise<void> {
  await ensureUsersSchema()
  await getScenePool().query(
    `INSERT INTO scene_members (scene_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (scene_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
    [sceneId, userId, role],
  )
}

export async function deleteSceneMember(sceneId: string, userId: string): Promise<boolean> {
  await ensureUsersSchema()
  const r = await getScenePool().query(
    `DELETE FROM scene_members WHERE scene_id = $1 AND user_id = $2`,
    [sceneId, userId],
  )
  return (r.rowCount ?? 0) > 0
}

export function requireAdmin(user: ZaolyUser | null): boolean {
  return Boolean(user && isStaffRole(user.role) && !user.disabled)
}
