import type { CompositionScene, CompositionSummary } from '@zaoly/contracts'
import type { ProjectSummary } from '@zaoly/contracts'
import { paths } from '../paths'
import { resolveCompositionCoverPageId } from './composition-cover'

/** Map a persisted scene to the hub/home list contract. */
export function sceneToCompositionSummary(scene: CompositionScene): CompositionSummary {
  return {
    id: scene.id,
    name: scene.name,
    updatedAt: scene.updatedAt,
    status: 'draft',
    platformProjectId: scene.platformProjectId ?? null,
    ownerUserId: scene.ownerUserId ?? null,
    projectId: null,
    previewPageId: resolveCompositionCoverPageId(scene),
  }
}

export function compositionEditorHref(comp: {
  id: string
  platformProjectId?: string | null
}): string {
  const q = new URLSearchParams()
  q.set('sceneId', comp.id)
  const platformId = comp.platformProjectId?.trim()
  if (platformId) q.set('platformProjectId', platformId)
  return `${paths.routes.editor}?${q.toString()}`
}

/** Scenes belonging to any of the viewer’s CREATION project Collections. */
export function filterScenesForProjects(
  scenes: CompositionScene[],
  projects: ProjectSummary[],
): CompositionScene[] {
  const ids = new Set(
    projects.map((p) => p.platformProjectId?.trim()).filter((id): id is string => Boolean(id)),
  )
  return scenes.filter((s) => {
    const pid = s.platformProjectId?.trim()
    return Boolean(pid && ids.has(pid))
  })
}

export function sortScenesByUpdatedAtDesc(scenes: CompositionScene[]): CompositionScene[] {
  return [...scenes].sort((a, b) => {
    const ta = a.updatedAt ? Date.parse(a.updatedAt) : 0
    const tb = b.updatedAt ? Date.parse(b.updatedAt) : 0
    if (tb !== ta) return tb - ta
    return a.name.localeCompare(b.name)
  })
}

/** Read-time compositionCount from scene store (no DB backfill). */
export function enrichProjectsWithSceneCounts<T extends ProjectSummary>(
  projects: T[],
  scenes: CompositionScene[],
): T[] {
  const counts = new Map<string, number>()
  for (const scene of scenes) {
    const pid = scene.platformProjectId?.trim()
    if (!pid) continue
    counts.set(pid, (counts.get(pid) ?? 0) + 1)
  }
  return projects.map((p) => ({
    ...p,
    compositionCount: counts.get(p.platformProjectId) ?? 0,
  }))
}
