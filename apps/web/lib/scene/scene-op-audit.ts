import { isPostgresSceneStore, getScenePool, ensureScenesSchema } from './pg-store'

export type SceneOpAuditEntry = {
  sceneId: string
  actorUserId: string
  actorLabel?: string
  mode: 'session' | 'service'
  appliedCount: number
  clientBatchId?: string
  source?: 'scene_ops' | 'scene_import_html'
}

let auditSchemaReady: Promise<void> | null = null

async function ensureSceneOpAuditSchema(): Promise<void> {
  await ensureScenesSchema()
  if (!auditSchemaReady) {
    auditSchemaReady = getScenePool()
      .query(
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
      )
      .then(async () => {
        await getScenePool().query(
          `CREATE INDEX IF NOT EXISTS scene_op_audit_scene_created_idx
           ON scene_op_audit (scene_id, created_at DESC)`,
        )
      })
      .then(() => undefined)
  }
  await auditSchemaReady
}

function logStdout(entry: SceneOpAuditEntry): void {
  console.info('[scene-ops-audit]', {
    sceneId: entry.sceneId,
    actor: entry.actorUserId,
    actorLabel: entry.actorLabel ?? null,
    mode: entry.mode,
    appliedCount: entry.appliedCount,
    clientBatchId: entry.clientBatchId ?? null,
    source: entry.source ?? null,
    at: new Date().toISOString(),
  })
}

/**
 * Structured audit for scene op batches.
 * Always stdout; when Postgres scene store is configured, also durable insert
 * (best-effort — never fails the write path).
 */
export function logSceneOpAudit(entry: SceneOpAuditEntry): void {
  logStdout(entry)
  if (!isPostgresSceneStore()) return
  void persistSceneOpAudit(entry).catch((err) => {
    console.warn('[scene-ops-audit] persist failed', err)
  })
}

export async function persistSceneOpAudit(entry: SceneOpAuditEntry): Promise<void> {
  await ensureSceneOpAuditSchema()
  await getScenePool().query(
    `INSERT INTO scene_op_audit
      (scene_id, actor_user_id, actor_label, mode, applied_count, client_batch_id, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      entry.sceneId,
      entry.actorUserId,
      entry.actorLabel ?? null,
      entry.mode,
      entry.appliedCount,
      entry.clientBatchId ?? null,
      entry.source ?? null,
    ],
  )
}
