import 'server-only'
import { Pool } from 'pg'
import type { CompositionScene } from '@zaoly/contracts'
import { paths } from '../paths'
import { envGet } from '../env-resolve'
import { normalizeScene } from './scene-normalize'
import { normalizeSceneUpdatedAt } from './normalize-updated-at'

type SceneRow = {
  id: string
  name: string
  version: number
  platform_project_id: string | null
  owner_user_id: string | null
  active_breakpoint: string | null
  active_print_preset: string | null
  root: unknown
  masters: unknown | null
  comments: unknown | null
  pages: unknown | null
  active_page_id: string | null
  cover_page_id: string | null
  updated_at: Date | string
}

export function creationDatabaseUrl(): string | null {
  const raw = envGet(paths.envDatabaseUrl)?.trim()
  return raw || null
}

export function isPostgresSceneStore(): boolean {
  return Boolean(creationDatabaseUrl())
}

let pool: Pool | null = null
let schemaReady: Promise<void> | null = null

export function getScenePool(): Pool {
  const url = creationDatabaseUrl()
  if (!url) throw new Error(`${paths.envDatabaseUrl} is not set`)
  if (!pool) pool = new Pool({ connectionString: url, max: 5 })
  return pool
}

export async function ensureScenesSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getScenePool()
      .query(
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
      )
      .then(async () => {
        const pool = getScenePool()
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS active_print_preset TEXT`)
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS masters JSONB`)
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS comments JSONB`)
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS pages JSONB`)
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS active_page_id TEXT`)
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS cover_page_id TEXT`)
        await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS owner_user_id TEXT`)
        await pool.query(
          `CREATE INDEX IF NOT EXISTS scenes_owner_updated_idx
           ON scenes (owner_user_id, updated_at DESC)`,
        )
        await pool.query(
          `CREATE INDEX IF NOT EXISTS scenes_platform_updated_idx
           ON scenes (platform_project_id, updated_at DESC)`,
        )
      })
      .then(() => undefined)
      .catch((err) => {
        // Allow retry after Postgres comes back (do not cache a rejected bootstrap).
        schemaReady = null
        throw err
      })
  }
  await schemaReady
}

export function sceneFromPgRow(row: SceneRow): CompositionScene | null {
  return normalizeScene({
    id: row.id,
    name: row.name,
    version: 1,
    platformProjectId: row.platform_project_id,
    ownerUserId: row.owner_user_id,
    activeBreakpoint: row.active_breakpoint ?? undefined,
    activePrintPreset: row.active_print_preset ?? undefined,
    root: row.root,
    ...(row.masters != null ? { masters: row.masters } : {}),
    ...(row.comments != null ? { comments: row.comments } : {}),
    ...(row.pages != null ? { pages: row.pages } : {}),
    ...(row.active_page_id ? { activePageId: row.active_page_id } : {}),
    ...(row.cover_page_id ? { coverPageId: row.cover_page_id } : {}),
    updatedAt: normalizeSceneUpdatedAt(row.updated_at),
  })
}

const SCENE_SELECT =
  `SELECT id, name, version, platform_project_id, owner_user_id, active_breakpoint, active_print_preset, root, masters, comments, pages, active_page_id, cover_page_id, updated_at`

export async function pgListScenes(platformProjectId?: string | null): Promise<CompositionScene[]> {
  await ensureScenesSchema()
  const result = platformProjectId
    ? await getScenePool().query<SceneRow>(
        `${SCENE_SELECT} FROM scenes WHERE platform_project_id = $1 ORDER BY updated_at DESC`,
        [platformProjectId],
      )
    : await getScenePool().query<SceneRow>(
        `${SCENE_SELECT} FROM scenes ORDER BY updated_at DESC`,
      )
  return result.rows.map(sceneFromPgRow).filter((s): s is CompositionScene => Boolean(s))
}

export async function pgGetScene(id: string): Promise<CompositionScene | null> {
  await ensureScenesSchema()
  const result = await getScenePool().query<SceneRow>(
    `${SCENE_SELECT} FROM scenes WHERE id = $1`,
    [id],
  )
  const row = result.rows[0]
  return row ? sceneFromPgRow(row) : null
}

export async function pgUpsertScene(scene: CompositionScene): Promise<CompositionScene> {
  await ensureScenesSchema()
  await getScenePool().query(
    `INSERT INTO scenes (
       id, name, version, platform_project_id, owner_user_id, active_breakpoint, active_print_preset,
       root, masters, comments, pages, active_page_id, cover_page_id, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12, $13, $14::timestamptz)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       version = EXCLUDED.version,
       platform_project_id = EXCLUDED.platform_project_id,
       owner_user_id = EXCLUDED.owner_user_id,
       active_breakpoint = EXCLUDED.active_breakpoint,
       active_print_preset = EXCLUDED.active_print_preset,
       root = EXCLUDED.root,
       masters = EXCLUDED.masters,
       comments = EXCLUDED.comments,
       pages = EXCLUDED.pages,
       active_page_id = EXCLUDED.active_page_id,
       cover_page_id = EXCLUDED.cover_page_id,
       updated_at = EXCLUDED.updated_at`,
    [
      scene.id,
      scene.name,
      scene.version,
      scene.platformProjectId ?? null,
      scene.ownerUserId?.trim() || null,
      scene.activeBreakpoint ?? null,
      scene.activePrintPreset ?? null,
      JSON.stringify(scene.root),
      scene.masters?.length ? JSON.stringify(scene.masters) : null,
      scene.comments?.length ? JSON.stringify(scene.comments) : null,
      scene.pages?.length ? JSON.stringify(scene.pages) : null,
      scene.activePageId ?? null,
      scene.coverPageId?.trim() || null,
      scene.updatedAt,
    ],
  )
  return scene
}

export function pgCountFromResult(count: string | number | undefined): number {
  return Number(count ?? 0)
}

export async function pgSceneCount(): Promise<number> {
  await ensureScenesSchema()
  const result = await getScenePool().query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM scenes`)
  return pgCountFromResult(result.rows[0]?.count)
}

/** Hard-delete scene + version checkpoints when present. */
export async function pgDeleteScene(id: string): Promise<boolean> {
  await ensureScenesSchema()
  const pool = getScenePool()
  try {
    await pool.query(`DELETE FROM scene_versions WHERE scene_id = $1`, [id])
  } catch {
    // Table may not exist yet in fresh DBs — ignore.
  }
  const result = await pool.query(`DELETE FROM scenes WHERE id = $1`, [id])
  return (result.rowCount ?? 0) > 0
}

/** Test helper — drop cached pool (does not close remote connections in unit tests). */
export function __resetPgPoolForTests(): void {
  pool = null
  schemaReady = null
}
