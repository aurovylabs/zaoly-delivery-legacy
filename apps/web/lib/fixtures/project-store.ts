import type {
  CreateProjectInput,
  ProjectDetail,
  ProjectSummary,
  UpdateProjectInput,
} from '@zaoly/contracts'
import { UNASSIGNED_PROJECT_ID } from '@zaoly/contracts'
import { isPostgresProjectStore } from '../project/pg-store'

const UNASSIGNED_PROJECT: ProjectDetail = {
  id: UNASSIGNED_PROJECT_ID,
  name: 'Unassigned',
  status: 'archived',
  platformProjectId: 'plx-local-unassigned',
  capabilityStatus: 'pending',
  lastActivityAt: null,
  compositionCount: 0,
  description: 'Reserved bucket for future orphans (Wave 3 unused).',
}

let projects: ProjectDetail[] = [{ ...UNASSIGNED_PROJECT }]

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 32) || 'project'
  )
}

function toSummary(p: ProjectDetail): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    platformProjectId: p.platformProjectId,
    capabilityStatus: p.capabilityStatus,
    lastActivityAt: p.lastActivityAt,
    compositionCount: p.compositionCount,
    ownerUserId: p.ownerUserId ?? null,
  }
}

function clone(p: ProjectDetail): ProjectDetail {
  return { ...p }
}

async function dbApi() {
  return import('../project/pg-store')
}

function memoryListProjects(): ProjectSummary[] {
  return projects
    .filter((p) => p.id !== UNASSIGNED_PROJECT_ID && p.status !== 'archived')
    .map(toSummary)
}

function memoryGetProject(id: string): ProjectDetail | null {
  const found = projects.find((p) => p.id === id)
  return found ? clone(found) : null
}

function memoryGetProjectByPlatformId(platformProjectId: string): ProjectDetail | null {
  const found = projects.find((p) => p.platformProjectId === platformProjectId)
  return found ? clone(found) : null
}

function memoryCreateProject(input: CreateProjectInput): ProjectDetail {
  const name = input.name.trim()
  if (!name) throw new Error('name_required')

  const platformProjectId =
    input.platformProjectId?.trim() || `plx-local-${slugify(name)}-${Date.now().toString(36)}`

  if (projects.some((p) => p.platformProjectId === platformProjectId)) {
    throw new Error('platform_project_exists')
  }

  const project: ProjectDetail = {
    id: `proj-${Date.now().toString(36)}`,
    name,
    status: 'active',
    platformProjectId,
    capabilityStatus: 'pending',
    lastActivityAt: null,
    compositionCount: 0,
    description: (input.description ?? '').trim(),
    ownerUserId: input.ownerUserId?.trim() || null,
    platformCompanyId: input.platformCompanyId?.trim() || null,
  }

  projects = [project, ...projects]
  return clone(project)
}

function memoryUpsertByPlatformProjectId(
  platformProjectId: string,
  input: {
    name: string
    domain?: string | null
    status?: 'active' | 'archived'
    ownerUserId?: string
    platformCompanyId?: string
  },
): ProjectDetail {
  const existing = projects.find((p) => p.platformProjectId === platformProjectId)
  if (existing) {
    const next: ProjectDetail = {
      ...existing,
      name: input.name.trim() || existing.name,
      status: input.status === 'archived' ? 'archived' : 'active',
      capabilityStatus: 'in_sync',
      domain:
        input.domain != null && String(input.domain).trim()
          ? String(input.domain).trim()
          : existing.domain,
      ownerUserId: input.ownerUserId?.trim() || existing.ownerUserId,
      platformCompanyId: input.platformCompanyId?.trim() || existing.platformCompanyId,
    }
    projects = projects.map((p) => (p.id === existing.id ? next : p))
    return clone(next)
  }

  const project: ProjectDetail = {
    id: `proj-${Date.now().toString(36)}`,
    name: input.name.trim(),
    status: input.status === 'archived' ? 'archived' : 'active',
    platformProjectId,
    capabilityStatus: 'in_sync',
    lastActivityAt: null,
    compositionCount: 0,
    description: '',
    domain:
      input.domain != null && String(input.domain).trim() ? String(input.domain).trim() : null,
    ownerUserId: input.ownerUserId?.trim() || null,
    platformCompanyId: input.platformCompanyId?.trim() || null,
  }
  projects = [project, ...projects]
  return clone(project)
}

function memoryApplyPlatformBinding(
  projectId: string,
  binding: { platformProjectId: string; capabilityStatus?: ProjectDetail['capabilityStatus'] },
): ProjectDetail | null {
  if (projectId === UNASSIGNED_PROJECT_ID) return null
  const idx = projects.findIndex((p) => p.id === projectId)
  if (idx < 0) return null

  const platformProjectId = binding.platformProjectId.trim()
  if (projects.some((p) => p.platformProjectId === platformProjectId && p.id !== projectId)) {
    throw new Error('platform_project_exists')
  }

  const current = projects[idx]!
  const next: ProjectDetail = {
    ...current,
    platformProjectId,
    capabilityStatus: binding.capabilityStatus ?? 'in_sync',
  }
  projects = projects.map((p, i) => (i === idx ? next : p))
  return clone(next)
}

function memorySetProjectCapabilityStatus(
  projectId: string,
  capabilityStatus: ProjectDetail['capabilityStatus'],
): ProjectDetail | null {
  const idx = projects.findIndex((p) => p.id === projectId)
  if (idx < 0) return null
  const next = { ...projects[idx]!, capabilityStatus }
  projects = projects.map((p, i) => (i === idx ? next : p))
  return clone(next)
}

function memoryUpdateProject(id: string, patch: UpdateProjectInput): ProjectDetail | null {
  if (id === UNASSIGNED_PROJECT_ID) return null
  const idx = projects.findIndex((p) => p.id === id)
  if (idx < 0) return null

  const current = projects[idx]!
  const next: ProjectDetail = {
    ...current,
    name: patch.name != null ? patch.name.trim() || current.name : current.name,
    description:
      patch.description != null ? patch.description.trim() : current.description,
  }
  projects = projects.map((p, i) => (i === idx ? next : p))
  return clone(next)
}

function memoryDeleteProject(id: string): boolean {
  if (id === UNASSIGNED_PROJECT_ID) return false
  const existed = projects.some((p) => p.id === id)
  if (!existed) return false
  projects = projects.filter((p) => p.id !== id)
  return true
}

function memoryArchiveProject(id: string): ProjectDetail | null {
  if (id === UNASSIGNED_PROJECT_ID) return null
  const idx = projects.findIndex((p) => p.id === id)
  if (idx < 0) return null
  const next: ProjectDetail = { ...projects[idx]!, status: 'archived' }
  projects = projects.map((p, i) => (i === idx ? next : p))
  return clone(next)
}

export function projectStoreBackend(): 'postgres' | 'memory' {
  return isPostgresProjectStore() ? 'postgres' : 'memory'
}

/** Unfiltered — prefer {@link listProjectsForViewer} for UI/API. */
export async function listProjects(): Promise<ProjectSummary[]> {
  if (isPostgresProjectStore()) return (await dbApi()).pgListProjects()
  return memoryListProjects()
}

/** Access model B: creator/owner + federation-accessible Collections only. */
export async function listProjectsForViewer(
  viewerId: string | null,
): Promise<ProjectSummary[]> {
  const { filterProjectsForViewer } = await import('../project-access')
  return filterProjectsForViewer(await listProjects(), viewerId)
}

export async function getProject(id: string): Promise<ProjectDetail | null> {
  if (isPostgresProjectStore()) return (await dbApi()).pgGetProject(id)
  return memoryGetProject(id)
}

export async function getProjectByPlatformId(
  platformProjectId: string,
): Promise<ProjectDetail | null> {
  if (isPostgresProjectStore()) {
    return (await dbApi()).pgGetProjectByPlatformId(platformProjectId)
  }
  return memoryGetProjectByPlatformId(platformProjectId)
}

export async function createProject(input: CreateProjectInput): Promise<ProjectDetail> {
  if (isPostgresProjectStore()) return (await dbApi()).pgCreateProject(input)
  return memoryCreateProject(input)
}

/** Upsert from suite provisioning PUT (platform project → CREATION mirror). */
export async function upsertByPlatformProjectId(
  platformProjectId: string,
  input: {
    name: string
    domain?: string | null
    status?: 'active' | 'archived'
    ownerUserId?: string
    platformCompanyId?: string
  },
): Promise<ProjectDetail> {
  if (isPostgresProjectStore()) {
    return (await dbApi()).pgUpsertByPlatformProjectId(platformProjectId, input)
  }
  return memoryUpsertByPlatformProjectId(platformProjectId, input)
}

export async function applyPlatformBinding(
  projectId: string,
  binding: { platformProjectId: string; capabilityStatus?: ProjectDetail['capabilityStatus'] },
): Promise<ProjectDetail | null> {
  if (isPostgresProjectStore()) {
    return (await dbApi()).pgApplyPlatformBinding(projectId, binding)
  }
  return memoryApplyPlatformBinding(projectId, binding)
}

export async function setProjectCapabilityStatus(
  projectId: string,
  capabilityStatus: ProjectDetail['capabilityStatus'],
): Promise<ProjectDetail | null> {
  if (isPostgresProjectStore()) {
    return (await dbApi()).pgSetProjectCapabilityStatus(projectId, capabilityStatus)
  }
  return memorySetProjectCapabilityStatus(projectId, capabilityStatus)
}

export async function updateProject(
  id: string,
  patch: UpdateProjectInput,
): Promise<ProjectDetail | null> {
  if (isPostgresProjectStore()) return (await dbApi()).pgUpdateProject(id, patch)
  return memoryUpdateProject(id, patch)
}

/** Soft-remove from hubs: set status archived (Collection lifecycle mirror). */
export async function archiveProject(id: string): Promise<ProjectDetail | null> {
  if (isPostgresProjectStore()) return (await dbApi()).pgArchiveProject(id)
  return memoryArchiveProject(id)
}

export async function deleteProject(id: string): Promise<boolean> {
  if (isPostgresProjectStore()) return (await dbApi()).pgDeleteProject(id)
  return memoryDeleteProject(id)
}

/** Test helper — reset in-memory store. */
export function __resetProjectStoreForTests(seed: ProjectDetail[] = []): void {
  projects = [{ ...UNASSIGNED_PROJECT }, ...seed.map((p) => ({ ...p }))]
}
