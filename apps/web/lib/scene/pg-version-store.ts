/**
 * Postgres persistence for scene version checkpoints (W3).
 * Spec: specs/domain/version-store-durable-w3.md · editor-version-history.md
 */
import type {
  CompositionScene,
  SceneVersionAuthor,
  SceneVersionCheckpoint,
  SceneVersionSummary,
} from '@zaoly/contracts'
import { ensureScenesSchema, getScenePool, isPostgresSceneStore } from './pg-store'

export type VersionStoreBackend = 'postgres' | 'fs'

type VersionRow = {
  id: string
  scene_id: string
  version_number: number
  name: string
  description: string | null
  is_auto_save: boolean
  author_json: unknown
  page_count: number
  node_count: number
  snapshot: unknown
  created_at: Date | string
}

let versionsSchemaReady: Promise<void> | null = null

export function versionStoreBackend(): VersionStoreBackend {
  return isPostgresSceneStore() ? 'postgres' : 'fs'
}

export async function ensureSceneVersionsSchema(): Promise<void> {
  await ensureScenesSchema()
  if (!versionsSchemaReady) {
    versionsSchemaReady = getScenePool()
      .query(
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
      )
      .then(async () => {
        await getScenePool().query(
          `CREATE INDEX IF NOT EXISTS scene_versions_scene_number_idx
           ON scene_versions (scene_id, version_number DESC)`,
        )
      })
      .then(() => undefined)
  }
  await versionsSchemaReady
}

export function checkpointFromPgRow(row: VersionRow): SceneVersionCheckpoint | null {
  if (!row?.id || !row.scene_id || !row.snapshot) return null
  const author = row.author_json as SceneVersionAuthor
  if (!author?.id || !author?.name) return null
  return {
    id: row.id,
    sceneId: row.scene_id,
    versionNumber: Number(row.version_number),
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    isAutoSave: Boolean(row.is_auto_save),
    author,
    pageCount: Number(row.page_count) || 1,
    nodeCount: Number(row.node_count) || 0,
    createdAt:
      typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString(),
    snapshot: row.snapshot as CompositionScene,
  }
}

function toSummary(c: SceneVersionCheckpoint): SceneVersionSummary {
  return {
    id: c.id,
    sceneId: c.sceneId,
    versionNumber: c.versionNumber,
    name: c.name,
    description: c.description,
    isAutoSave: c.isAutoSave,
    author: c.author,
    pageCount: c.pageCount,
    nodeCount: c.nodeCount,
    createdAt: c.createdAt,
  }
}

export async function pgListSceneVersions(sceneId: string): Promise<SceneVersionSummary[]> {
  await ensureSceneVersionsSchema()
  const result = await getScenePool().query<VersionRow>(
    `SELECT id, scene_id, version_number, name, description, is_auto_save, author_json,
            page_count, node_count, snapshot, created_at
     FROM scene_versions
     WHERE scene_id = $1
     ORDER BY version_number DESC`,
    [sceneId],
  )
  return result.rows
    .map(checkpointFromPgRow)
    .filter((c): c is SceneVersionCheckpoint => Boolean(c))
    .map(toSummary)
}

export async function pgGetSceneVersion(
  sceneId: string,
  versionId: string,
): Promise<SceneVersionCheckpoint | null> {
  await ensureSceneVersionsSchema()
  const result = await getScenePool().query<VersionRow>(
    `SELECT id, scene_id, version_number, name, description, is_auto_save, author_json,
            page_count, node_count, snapshot, created_at
     FROM scene_versions
     WHERE scene_id = $1 AND id = $2
     LIMIT 1`,
    [sceneId, versionId],
  )
  const row = result.rows[0]
  return row ? checkpointFromPgRow(row) : null
}

export async function pgInsertSceneVersion(
  checkpoint: SceneVersionCheckpoint,
): Promise<SceneVersionCheckpoint> {
  await ensureSceneVersionsSchema()
  await getScenePool().query(
    `INSERT INTO scene_versions (
       id, scene_id, version_number, name, description, is_auto_save,
       author_json, page_count, node_count, snapshot, created_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7::jsonb, $8, $9, $10::jsonb, $11::timestamptz
     )`,
    [
      checkpoint.id,
      checkpoint.sceneId,
      checkpoint.versionNumber,
      checkpoint.name,
      checkpoint.description ?? null,
      checkpoint.isAutoSave,
      JSON.stringify(checkpoint.author),
      checkpoint.pageCount,
      checkpoint.nodeCount,
      JSON.stringify(checkpoint.snapshot),
      checkpoint.createdAt,
    ],
  )
  return checkpoint
}

export async function pgNextVersionNumber(sceneId: string): Promise<number> {
  await ensureSceneVersionsSchema()
  const result = await getScenePool().query<{ n: string }>(
    `SELECT COALESCE(MAX(version_number), 0)::text AS n FROM scene_versions WHERE scene_id = $1`,
    [sceneId],
  )
  return Number(result.rows[0]?.n ?? 0) + 1
}

/** Test helper — clear schema-ready latch (pool reset lives in pg-store). */
export function __resetSceneVersionsSchemaForTests(): void {
  versionsSchemaReady = null
}
