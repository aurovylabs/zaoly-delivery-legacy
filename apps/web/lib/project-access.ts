/**
 * Access model B: local owner id on project mirrors (standalone Zaoly).
 */

import { auth } from '../auth'

export type ProjectAccessFields = {
  platformProjectId?: string | null
  ownerUserId?: string | null
}

export async function resolveViewerId(explicit?: string | null): Promise<string | null> {
  if (explicit?.trim()) return explicit.trim()
  const session = await auth()
  return session?.user?.id?.trim() || null
}

export function projectVisibleToOwner(
  project: ProjectAccessFields,
  viewerId: string,
): boolean {
  return Boolean(project.ownerUserId && project.ownerUserId === viewerId)
}

export async function filterProjectsForViewer<T extends ProjectAccessFields>(
  projects: T[],
  viewerId: string | null,
): Promise<T[]> {
  if (!viewerId) return []
  return projects.filter((p) => projectVisibleToOwner(p, viewerId))
}

export async function viewerCanAccessProject(
  project: ProjectAccessFields,
  viewerId: string | null,
): Promise<boolean> {
  if (!viewerId) return false
  return projectVisibleToOwner(project, viewerId)
}
