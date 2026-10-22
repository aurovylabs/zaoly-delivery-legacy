import 'server-only'
import { randomUUID } from 'node:crypto'
import { paths } from '../paths'
import { getScenePool } from '../scene/pg-store'
import { ensureUsersSchema } from './user-store'

export type AdminAuditAction =
  | 'user.invite'
  | 'user.patch'
  | 'user.force_password_reset'
  | 'user.anonymize'
  | 'user.impersonate_start'
  | 'user.impersonate_stop'
  | 'user.mfa_enable'
  | 'user.mfa_disable'
  | 'user.webauthn_register'
  | 'user.webauthn_delete'
  | 'auth.denied'

export type AdminAuditEvent = {
  id: string
  at: string
  actorUserId: string
  actorEmail: string | null
  action: string
  targetUserId: string | null
  meta: Record<string, unknown> | null
}

type AuditRow = {
  id: string
  created_at: Date | string
  actor_user_id: string
  actor_email: string | null
  action: string
  target_user_id: string | null
  meta: unknown
}

function encodeAuditCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`, 'utf8').toString('base64url')
}

function decodeAuditCursor(cursor: string): { createdAt: string; id: string } | null {
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

function rowToEvent(row: AuditRow): AdminAuditEvent {
  return {
    id: row.id,
    at: new Date(row.created_at).toISOString(),
    actorUserId: row.actor_user_id,
    actorEmail: row.actor_email,
    action: row.action,
    targetUserId: row.target_user_id,
    meta:
      row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta)
        ? (row.meta as Record<string, unknown>)
        : null,
  }
}

export async function recordAdminAudit(input: {
  actorUserId: string
  actorEmail?: string | null
  action: AdminAuditAction
  targetUserId?: string | null
  meta?: Record<string, unknown> | null
}): Promise<void> {
  await ensureUsersSchema()
  await getScenePool().query(
    `INSERT INTO admin_audit_events
      (id, actor_user_id, actor_email, action, target_user_id, meta)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      randomUUID(),
      input.actorUserId,
      input.actorEmail ?? null,
      input.action,
      input.targetUserId ?? null,
      JSON.stringify(input.meta ?? null),
    ],
  )
}

/** Best-effort — never fail the primary admin mutation. */
export function voidRecordAdminAudit(
  input: Parameters<typeof recordAdminAudit>[0],
): void {
  void recordAdminAudit(input).catch(() => {
    /* ignore */
  })
}

export async function listAdminAudit(query: {
  limit?: number
  cursor?: string
} = {}): Promise<{ events: AdminAuditEvent[]; nextCursor: string | null }> {
  await ensureUsersSchema()
  const params: unknown[] = []
  const where: string[] = []
  if (query.cursor) {
    const decoded = decodeAuditCursor(query.cursor)
    if (decoded) {
      params.push(decoded.createdAt, decoded.id)
      where.push(
        `(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`,
      )
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const limit = Math.min(
    Math.max(
      1,
      Math.floor(query.limit ?? paths.adminAuditPageSizeDefault),
    ),
    paths.adminAuditPageSizeMax,
  )

  const r = await getScenePool().query<AuditRow>(
    `SELECT id, created_at, actor_user_id, actor_email, action, target_user_id, meta
     FROM admin_audit_events
     ${whereSql}
     ORDER BY created_at DESC, id DESC
     LIMIT ${limit + 1}`,
    params,
  )

  let rows = r.rows
  let nextCursor: string | null = null
  if (rows.length > limit) {
    const lastKept = rows[limit - 1]
    rows = rows.slice(0, limit)
    if (lastKept) {
      nextCursor = encodeAuditCursor(
        new Date(lastKept.created_at).toISOString(),
        lastKept.id,
      )
    }
  }

  return { events: rows.map(rowToEvent), nextCursor }
}
