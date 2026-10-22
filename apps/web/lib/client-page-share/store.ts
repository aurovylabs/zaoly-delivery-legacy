/**
 * Durable Client Page Share store (JSON file or Postgres when ZAOLY_DATABASE_URL set).
 * Spec: specs/domain/client-page-share.md (P1+P2)
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { paths } from '../paths'
import {
  getScenePool,
  isPostgresSceneStore,
} from '../scene/pg-store'
import type { ClientShareSnapshot } from './snapshot'
import {
  generateClientPageShareToken,
  hashClientPageShareToken,
} from './token'
import { hashClientSharePassword } from './password'
import { normalizeShareEmailList } from './email'
import type { ClientShareGuestComment } from './guest-comments'

export type ClientShareAccessMode = 'link' | 'password' | 'email_allowlist'
export type ClientShareContentMode = 'pinned_revision' | 'live_head'

/** Suite E2 room status — only `approved` may enter ClientRoom. */
export type ClientShareRoomStatus = 'shared' | 'approved' | 'revoked'

export type ClientPageShareRecord = {
  id: string
  platformProjectId: string
  sceneId: string
  tokenHash: string
  /**
   * Plain `crs_` token retained for authenticated manager re-copy in the editor.
   * Never returned on public resolve routes. Older rows may be null.
   */
  tokenPlain: string | null
  pageIds: string[]
  contentMode: ClientShareContentMode
  snapshot: ClientShareSnapshot
  accessMode: ClientShareAccessMode
  passwordHash: string | null
  emailAllowlist: string[]
  commentsEnabled: boolean
  guestComments: ClientShareGuestComment[]
  expiresAt: string | null
  revokedAt: string | null
  /** Suite E2 — set when designer approves stand for ClientRoom. */
  approvedAt: string | null
  approvedByUserId: string | null
  createdByUserId: string
  label: string | null
  createdAt: string
  updatedAt: string
}

export type ClientPageSharePublicMeta = {
  id: string
  sceneId: string
  platformProjectId: string
  pageIds: string[]
  accessMode: ClientShareAccessMode
  contentMode: ClientShareContentMode
  expiresAt: string | null
  label: string | null
  createdAt: string
  revoked: boolean
  approved: boolean
  approvedAt: string | null
  status: ClientShareRoomStatus
  emailAllowlistCount: number
  commentsEnabled: boolean
  guestCommentCount: number
}

type StoreFile = {
  version: 1
  updatedAt: string
  shares: ClientPageShareRecord[]
}

const memory = new Map<string, ClientPageShareRecord>()
let hydrated = false
let durableEnabled = true
let pgSchemaReady: Promise<void> | null = null

function resolveStorePath(): string {
  const env = process.env[paths.envClientPageShareStorePath]?.trim()
  if (env) return path.isAbsolute(env) ? env : path.join(process.cwd(), env)
  return path.join(process.cwd(), paths.clientPageShareStoreRelPath)
}

function loadFromDisk(): void {
  if (hydrated) return
  hydrated = true
  if (!durableEnabled) return
  try {
    const file = resolveStorePath()
    if (!fs.existsSync(file)) return
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as StoreFile
    if (!Array.isArray(parsed.shares)) return
    for (const row of parsed.shares) {
      if (row?.id && row?.tokenHash) {
        memory.set(row.id, {
          ...row,
          tokenPlain:
            typeof (row as ClientPageShareRecord).tokenPlain === 'string'
              ? (row as ClientPageShareRecord).tokenPlain
              : null,
          emailAllowlist: Array.isArray(row.emailAllowlist) ? row.emailAllowlist : [],
          commentsEnabled: Boolean(row.commentsEnabled),
          guestComments: Array.isArray(row.guestComments) ? row.guestComments : [],
          contentMode: row.contentMode === 'live_head' ? 'live_head' : 'pinned_revision',
          accessMode:
            row.accessMode === 'email_allowlist' || row.accessMode === 'link'
              ? row.accessMode
              : 'password',
          approvedAt:
            typeof (row as ClientPageShareRecord).approvedAt === 'string'
              ? (row as ClientPageShareRecord).approvedAt
              : null,
          approvedByUserId:
            typeof (row as ClientPageShareRecord).approvedByUserId === 'string'
              ? (row as ClientPageShareRecord).approvedByUserId
              : null,
        })
      }
    }
  } catch {
    // ignore corrupt file
  }
}

function persistToDisk(): void {
  if (!durableEnabled || isPostgresSceneStore()) return
  try {
    const file = resolveStorePath()
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const payload: StoreFile = {
      version: 1,
      updatedAt: new Date().toISOString(),
      shares: Array.from(memory.values()),
    }
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  } catch {
    // memory remains SoT
  }
}

async function ensurePgSchema(): Promise<void> {
  if (!isPostgresSceneStore()) return
  if (!pgSchemaReady) {
    pgSchemaReady = getScenePool()
      .query(
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
      )
      .then(async () => {
        await getScenePool().query(
          `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS email_allowlist JSONB`,
        )
        await getScenePool().query(
          `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT false`,
        )
        await getScenePool().query(
          `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS guest_comments JSONB`,
        )
        await getScenePool().query(
          `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS token_plain TEXT`,
        )
        await getScenePool().query(
          `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ`,
        )
        await getScenePool().query(
          `ALTER TABLE creation_client_shares ADD COLUMN IF NOT EXISTS approved_by_user_id TEXT`,
        )
      })
      .then(() => undefined)
  }
  await pgSchemaReady
}

function rowFromPg(row: Record<string, unknown>): ClientPageShareRecord {
  const mode = String(row.access_mode)
  const content = String(row.content_mode)
  return {
    id: String(row.id),
    platformProjectId: String(row.platform_project_id),
    sceneId: String(row.scene_id),
    tokenHash: String(row.token_hash),
    tokenPlain:
      typeof row.token_plain === 'string' && row.token_plain.length > 0
        ? String(row.token_plain)
        : null,
    pageIds: row.page_ids as string[],
    contentMode: content === 'live_head' ? 'live_head' : 'pinned_revision',
    snapshot: row.snapshot as ClientShareSnapshot,
    accessMode:
      mode === 'email_allowlist' || mode === 'link' ? mode : 'password',
    passwordHash: (row.password_hash as string | null) ?? null,
    emailAllowlist: Array.isArray(row.email_allowlist)
      ? (row.email_allowlist as string[])
      : [],
    commentsEnabled: Boolean(row.comments_enabled),
    guestComments: Array.isArray(row.guest_comments)
      ? (row.guest_comments as ClientShareGuestComment[])
      : [],
    expiresAt: row.expires_at
      ? new Date(row.expires_at as string | Date).toISOString()
      : null,
    revokedAt: row.revoked_at
      ? new Date(row.revoked_at as string | Date).toISOString()
      : null,
    approvedAt: row.approved_at
      ? new Date(row.approved_at as string | Date).toISOString()
      : null,
    approvedByUserId:
      typeof row.approved_by_user_id === 'string' && row.approved_by_user_id.length > 0
        ? String(row.approved_by_user_id)
        : null,
    createdByUserId: String(row.created_by_user_id),
    label: (row.label as string | null) ?? null,
    createdAt: new Date(row.created_at as string | Date).toISOString(),
    updatedAt: new Date(row.updated_at as string | Date).toISOString(),
  }
}

export function isClientShareActive(record: ClientPageShareRecord, now = Date.now()): boolean {
  if (record.revokedAt) return false
  if (record.expiresAt && Date.parse(record.expiresAt) <= now) return false
  return true
}

export function clientShareRoomStatus(record: ClientPageShareRecord): ClientShareRoomStatus {
  if (record.revokedAt) return 'revoked'
  if (record.approvedAt) return 'approved'
  return 'shared'
}

export function toPublicMeta(record: ClientPageShareRecord): ClientPageSharePublicMeta {
  const status = clientShareRoomStatus(record)
  return {
    id: record.id,
    sceneId: record.sceneId,
    platformProjectId: record.platformProjectId,
    pageIds: record.pageIds,
    accessMode: record.accessMode,
    contentMode: record.contentMode,
    expiresAt: record.expiresAt,
    label: record.label,
    createdAt: record.createdAt,
    revoked: Boolean(record.revokedAt),
    approved: status === 'approved',
    approvedAt: record.approvedAt,
    status,
    emailAllowlistCount: record.emailAllowlist.length,
    commentsEnabled: Boolean(record.commentsEnabled),
    guestCommentCount: record.guestComments?.length ?? 0,
  }
}

export type CreateClientShareInput = {
  platformProjectId: string
  sceneId: string
  pageIds: string[]
  snapshot: ClientShareSnapshot
  accessMode: ClientShareAccessMode
  contentMode?: ClientShareContentMode
  password?: string
  emailAllowlist?: string[]
  commentsEnabled?: boolean
  expiresInDays?: number | null
  label?: string | null
  createdByUserId: string
  maxTtlDays: number
}

export async function createClientPageShare(
  input: CreateClientShareInput,
): Promise<{ record: ClientPageShareRecord; token: string }> {
  loadFromDisk()
  await ensurePgSchema()

  const ttl =
    input.expiresInDays == null
      ? paths.clientPageShareDefaultTtlDays
      : input.expiresInDays
  if (ttl <= 0 || ttl > input.maxTtlDays) {
    throw new Error('ttl_invalid')
  }

  const contentMode: ClientShareContentMode =
    input.contentMode === 'live_head' ? 'live_head' : 'pinned_revision'

  let passwordHash: string | null = null
  let emailAllowlist: string[] = []
  if (input.accessMode === 'password') {
    if (!input.password?.trim()) throw new Error('password_required')
    passwordHash = await hashClientSharePassword(input.password)
  } else if (input.accessMode === 'email_allowlist') {
    emailAllowlist = normalizeShareEmailList(input.emailAllowlist ?? [])
    if (emailAllowlist.length === 0) throw new Error('email_allowlist_required')
  }

  const token = generateClientPageShareToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttl * 24 * 60 * 60 * 1000).toISOString()
  const record: ClientPageShareRecord = {
    id: randomUUID(),
    platformProjectId: input.platformProjectId,
    sceneId: input.sceneId,
    tokenHash: hashClientPageShareToken(token),
    tokenPlain: token,
    pageIds: input.pageIds,
    contentMode,
    snapshot: input.snapshot,
    accessMode: input.accessMode,
    passwordHash,
    emailAllowlist,
    commentsEnabled: Boolean(input.commentsEnabled),
    guestComments: [],
    expiresAt,
    revokedAt: null,
    approvedAt: null,
    approvedByUserId: null,
    createdByUserId: input.createdByUserId,
    label: input.label?.trim() || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }

  if (isPostgresSceneStore()) {
    await getScenePool().query(
      `INSERT INTO creation_client_shares (
        id, platform_project_id, scene_id, token_hash, token_plain, page_ids, content_mode,
        snapshot, access_mode, password_hash, email_allowlist, comments_enabled,
        guest_comments, expires_at, revoked_at, approved_at, approved_by_user_id,
        created_by_user_id, label, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6::jsonb,$7,$8::jsonb,$9,$10,$11::jsonb,$12,$13::jsonb,$14,$15,$16,$17,$18,$19,$20,$21
      )`,
      [
        record.id,
        record.platformProjectId,
        record.sceneId,
        record.tokenHash,
        record.tokenPlain,
        JSON.stringify(record.pageIds),
        record.contentMode,
        JSON.stringify(record.snapshot),
        record.accessMode,
        record.passwordHash,
        JSON.stringify(record.emailAllowlist),
        record.commentsEnabled,
        JSON.stringify(record.guestComments),
        record.expiresAt,
        null,
        null,
        null,
        record.createdByUserId,
        record.label,
        record.createdAt,
        record.updatedAt,
      ],
    )
  } else {
    memory.set(record.id, record)
    persistToDisk()
  }

  return { record, token }
}

export async function listClientPageSharesForScene(
  sceneId: string,
): Promise<ClientPageShareRecord[]> {
  loadFromDisk()
  await ensurePgSchema()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `SELECT * FROM creation_client_shares WHERE scene_id = $1 ORDER BY created_at DESC`,
      [sceneId],
    )
    return rows.map((r) => rowFromPg(r as Record<string, unknown>))
  }
  return Array.from(memory.values())
    .filter((s) => s.sceneId === sceneId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getClientPageShareById(
  shareId: string,
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `SELECT * FROM creation_client_shares WHERE id = $1`,
      [shareId],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  return memory.get(shareId) ?? null
}

export async function getClientPageShareByToken(
  plainToken: string,
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  const hash = hashClientPageShareToken(plainToken)
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `SELECT * FROM creation_client_shares WHERE token_hash = $1`,
      [hash],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  for (const row of memory.values()) {
    if (row.tokenHash === hash) return row
  }
  return null
}

export async function revokeClientPageShare(
  shareId: string,
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  const now = new Date().toISOString()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `UPDATE creation_client_shares
       SET revoked_at = $2, updated_at = $2
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [shareId, now],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  const existing = memory.get(shareId)
  if (!existing || existing.revokedAt) return null
  const next = { ...existing, revokedAt: now, updatedAt: now }
  memory.set(shareId, next)
  persistToDisk()
  return next
}

/**
 * Mark share as approved for ClientRoom (Suite E2).
 * Create leaves status `shared`; only approve enters the room.
 */
export async function approveClientPageShare(
  shareId: string,
  actorUserId: string,
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  const actor = actorUserId?.trim()
  if (!actor) return null
  const now = new Date().toISOString()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `UPDATE creation_client_shares
       SET approved_at = $2, approved_by_user_id = $3, updated_at = $2
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [shareId, now, actor],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  const existing = memory.get(shareId)
  if (!existing || existing.revokedAt) return null
  const next = {
    ...existing,
    approvedAt: now,
    approvedByUserId: actor,
    updatedAt: now,
  }
  memory.set(shareId, next)
  persistToDisk()
  return next
}

export async function refreshClientPageShareSnapshot(
  shareId: string,
  snapshot: ClientShareSnapshot,
  pageIds: string[],
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  const now = new Date().toISOString()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `UPDATE creation_client_shares
       SET snapshot = $2::jsonb, page_ids = $3::jsonb, updated_at = $4
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [shareId, JSON.stringify(snapshot), JSON.stringify(pageIds), now],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  const existing = memory.get(shareId)
  if (!existing || existing.revokedAt) return null
  const next = {
    ...existing,
    snapshot,
    pageIds,
    updatedAt: now,
  }
  memory.set(shareId, next)
  persistToDisk()
  return next
}

export async function addGuestCommentToShare(
  shareId: string,
  comment: ClientShareGuestComment,
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  const existing = await getClientPageShareById(shareId)
  if (!existing || existing.revokedAt) return null
  // P7: allow guest pins even when mint-time commentsEnabled was false.
  if ((existing.guestComments?.length ?? 0) >= 200) return null
  const guestComments = [...(existing.guestComments ?? []), comment]
  const now = new Date().toISOString()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `UPDATE creation_client_shares
       SET guest_comments = $2::jsonb, updated_at = $3
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [shareId, JSON.stringify(guestComments), now],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  const next = { ...existing, guestComments, updatedAt: now }
  memory.set(shareId, next)
  persistToDisk()
  return next
}

/** Replace full guest_comments array (P9 designer reply mirror). */
export async function replaceGuestCommentsOnShare(
  shareId: string,
  guestComments: ClientShareGuestComment[],
): Promise<ClientPageShareRecord | null> {
  loadFromDisk()
  await ensurePgSchema()
  const existing = await getClientPageShareById(shareId)
  if (!existing || existing.revokedAt) return null
  const now = new Date().toISOString()
  if (isPostgresSceneStore()) {
    const { rows } = await getScenePool().query(
      `UPDATE creation_client_shares
       SET guest_comments = $2::jsonb, updated_at = $3
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [shareId, JSON.stringify(guestComments), now],
    )
    return rows[0] ? rowFromPg(rows[0] as Record<string, unknown>) : null
  }
  const next = { ...existing, guestComments, updatedAt: now }
  memory.set(shareId, next)
  persistToDisk()
  return next
}

/** Test helper — wipe memory + optionally disable disk. */
export function __resetClientPageShareStoreForTests(options?: {
  durable?: boolean
}): void {
  memory.clear()
  hydrated = false
  durableEnabled = options?.durable !== false
  pgSchemaReady = null
}
