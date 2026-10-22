import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  UpdateProjectInput,
} from '@zaoly/contracts'
import { UNASSIGNED_PROJECT_ID } from '@zaoly/contracts'
import { getScenePool, isPostgresSceneStore } from '../scene/pg-store'

export function isPostgresProjectStore(): boolean {
  return isPostgresSceneStore()
}

type ProjectRow = {
  id: string
  name: string
  status: string
  platform_project_id: string
  capability_status: string
  last_activity_at: Date | string | null
  composition_count: number
  description: string
  owner_user_id: string | null
  platform_company_id: string | null
  domain: string | null
  updated_at: Date | string
}

let schemaReady: Promise<void> | null = null

export async function ensureProjectsSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getScenePool()
      .query(
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
      )
      .then(async () => {
        const pool = getScenePool()
        await pool.query(`
          DO $$ BEGIN
            IF EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema()
                AND table_name = 'projects' AND column_name = 'owner_plexon_user_id'
            ) AND NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema()
                AND table_name = 'projects' AND column_name = 'owner_user_id'
            ) THEN
              ALTER TABLE projects RENAME COLUMN owner_plexon_user_id TO owner_user_id;
            END IF;
          END $$;
        `)
        await pool.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_user_id TEXT`)
      })
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null
        throw err
      })
  }
  await schemaReady
}

function rowToDetail(row: ProjectRow): ProjectDetail {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ProjectDetail['status'],
    platformProjectId: row.platform_project_id,
    capabilityStatus: row.capability_status as ProjectDetail['capabilityStatus'],
    lastActivityAt:
      row.last_activity_at == null
        ? null
        : typeof row.last_activity_at === 'string'
          ? row.last_activity_at
          : row.last_activity_at.toISOString(),
    compositionCount: row.composition_count,
    description: row.description,
    ownerUserId: row.owner_user_id,
    platformCompanyId: row.platform_company_id,
    domain: row.domain,
  }
}

function toSummary(detail: ProjectDetail): ProjectSummary {
  const { description: _d, platformCompanyId: _c, domain: _dom, ...summary } = detail
  return summary
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'project'
  )
}

export async function pgListProjects(): Promise<ProjectSummary[]> {
  await ensureProjectsSchema()
  const result = await getScenePool().query<ProjectRow>(
    `SELECT * FROM projects
     WHERE id <> $1 AND status <> 'archived'
     ORDER BY updated_at DESC`,
    [UNASSIGNED_PROJECT_ID],
  )
  return result.rows.map((row) => toSummary(rowToDetail(row)))
}

export async function pgGetProject(id: string): Promise<ProjectDetail | null> {
  await ensureProjectsSchema()
  const result = await getScenePool().query<ProjectRow>(
    `SELECT * FROM projects WHERE id = $1`,
    [id],
  )
  const row = result.rows[0]
  return row ? rowToDetail(row) : null
}

export async function pgGetProjectByPlatformId(
  platformProjectId: string,
): Promise<ProjectDetail | null> {
  await ensureProjectsSchema()
  const result = await getScenePool().query<ProjectRow>(
    `SELECT * FROM projects WHERE platform_project_id = $1`,
    [platformProjectId],
  )
  const row = result.rows[0]
  return row ? rowToDetail(row) : null
}

export async function pgCreateProject(input: CreateProjectInput): Promise<ProjectDetail> {
  await ensureProjectsSchema()
  const name = input.name.trim()
  if (!name) throw new Error('name_required')

  const platformProjectId =
    input.platformProjectId?.trim() || `plx-local-${slugify(name)}-${Date.now().toString(36)}`

  const existing = await pgGetProjectByPlatformId(platformProjectId)
  if (existing) throw new Error('platform_project_exists')

  const id = `proj-${Date.now().toString(36)}`
  const now = new Date().toISOString()
  await getScenePool().query(
    `INSERT INTO projects (
      id, name, status, platform_project_id, capability_status,
      last_activity_at, composition_count, description,
      owner_user_id, platform_company_id, domain, updated_at, created_at
    ) VALUES ($1,$2,'active',$3,'pending',NULL,0,$4,$5,$6,NULL,$7::timestamptz,$7::timestamptz)`,
    [
      id,
      name,
      platformProjectId,
      (input.description ?? '').trim(),
      input.ownerUserId?.trim() || null,
      input.platformCompanyId?.trim() || null,
      now,
    ],
  )
  const created = await pgGetProject(id)
  if (!created) throw new Error('create_failed')
  return created
}

export async function pgUpsertByPlatformProjectId(
  platformProjectId: string,
  input: {
    name: string
    domain?: string | null
    status?: 'active' | 'archived'
    ownerUserId?: string
    platformCompanyId?: string
  },
): Promise<ProjectDetail> {
  await ensureProjectsSchema()
  const existing = await pgGetProjectByPlatformId(platformProjectId)
  const now = new Date().toISOString()
  if (existing) {
    await getScenePool().query(
      `UPDATE projects SET
        name = $2,
        status = $3,
        capability_status = 'in_sync',
        domain = COALESCE($4, domain),
        owner_user_id = COALESCE($5, owner_user_id),
        platform_company_id = COALESCE($6, platform_company_id),
        updated_at = $7::timestamptz
       WHERE id = $1`,
      [
        existing.id,
        input.name.trim() || existing.name,
        input.status === 'archived' ? 'archived' : 'active',
        input.domain != null && String(input.domain).trim()
          ? String(input.domain).trim()
          : null,
        input.ownerUserId?.trim() || null,
        input.platformCompanyId?.trim() || null,
        now,
      ],
    )
    return (await pgGetProject(existing.id)) ?? existing
  }

  const id = `proj-${Date.now().toString(36)}`
  await getScenePool().query(
    `INSERT INTO projects (
      id, name, status, platform_project_id, capability_status,
      last_activity_at, composition_count, description,
      owner_user_id, platform_company_id, domain, updated_at, created_at
    ) VALUES ($1,$2,$3,$4,'in_sync',NULL,0,'',$5,$6,$7,$8::timestamptz,$8::timestamptz)`,
    [
      id,
      input.name.trim(),
      input.status === 'archived' ? 'archived' : 'active',
      platformProjectId,
      input.ownerUserId?.trim() || null,
      input.platformCompanyId?.trim() || null,
      input.domain != null && String(input.domain).trim() ? String(input.domain).trim() : null,
      now,
    ],
  )
  const created = await pgGetProject(id)
  if (!created) throw new Error('upsert_failed')
  return created
}

export async function pgApplyPlatformBinding(
  projectId: string,
  binding: { platformProjectId: string; capabilityStatus?: ProjectDetail['capabilityStatus'] },
): Promise<ProjectDetail | null> {
  if (projectId === UNASSIGNED_PROJECT_ID) return null
  await ensureProjectsSchema()
  const current = await pgGetProject(projectId)
  if (!current) return null

  const platformProjectId = binding.platformProjectId.trim()
  const clash = await pgGetProjectByPlatformId(platformProjectId)
  if (clash && clash.id !== projectId) throw new Error('platform_project_exists')

  const now = new Date().toISOString()
  await getScenePool().query(
    `UPDATE projects SET
      platform_project_id = $2,
      capability_status = $3,
      updated_at = $4::timestamptz
     WHERE id = $1`,
    [projectId, platformProjectId, binding.capabilityStatus ?? 'in_sync', now],
  )
  return pgGetProject(projectId)
}

export async function pgSetProjectCapabilityStatus(
  projectId: string,
  capabilityStatus: ProjectDetail['capabilityStatus'],
): Promise<ProjectDetail | null> {
  await ensureProjectsSchema()
  const now = new Date().toISOString()
  const result = await getScenePool().query(
    `UPDATE projects SET capability_status = $2, updated_at = $3::timestamptz
     WHERE id = $1 RETURNING id`,
    [projectId, capabilityStatus, now],
  )
  if (!result.rowCount) return null
  return pgGetProject(projectId)
}

export async function pgUpdateProject(
  id: string,
  patch: UpdateProjectInput,
): Promise<ProjectDetail | null> {
  if (id === UNASSIGNED_PROJECT_ID) return null
  await ensureProjectsSchema()
  const current = await pgGetProject(id)
  if (!current) return null
  const now = new Date().toISOString()
  await getScenePool().query(
    `UPDATE projects SET
      name = $2,
      description = $3,
      updated_at = $4::timestamptz
     WHERE id = $1`,
    [
      id,
      patch.name != null ? patch.name.trim() || current.name : current.name,
      patch.description != null ? patch.description.trim() : current.description,
      now,
    ],
  )
  return pgGetProject(id)
}

export async function pgArchiveProject(id: string): Promise<ProjectDetail | null> {
  if (id === UNASSIGNED_PROJECT_ID) return null
  const current = await pgGetProject(id)
  if (!current) return null
  await ensureProjectsSchema()
  const now = new Date().toISOString()
  await getScenePool().query(
    `UPDATE projects SET status = 'archived', updated_at = $2::timestamptz WHERE id = $1`,
    [id, now],
  )
  return pgGetProject(id)
}

export async function pgDeleteProject(id: string): Promise<boolean> {
  if (id === UNASSIGNED_PROJECT_ID) return false
  await ensureProjectsSchema()
  const result = await getScenePool().query(`DELETE FROM projects WHERE id = $1`, [id])
  return (result.rowCount ?? 0) > 0
}
