import { NextResponse } from 'next/server'
import type { CompositionScene } from '@zaoly/contracts'
import { getProjectByPlatformId, listProjectsForViewer } from './fixtures/project-store'
import { viewerCanAccessProject } from './project-access'
import { isAuthBypassEnabled } from './runtime-config'
import { sortScenesByUpdatedAtDesc } from './scene/scene-summary'
import { getScene, listScenes } from './scene/scene-store'
import {
  getSceneMemberRole,
  listSceneMemberUserIds,
  type SceneMemberRole,
} from './users/user-store'

/**
 * Object-level scene ACL for Zaoly local users + scene_members.
 * Spec: zaoly-composition-persistence.md · zaoly-scene-share.md
 */

/** Seed/reseed leftover with no owner — claimable by first writer. */
export function isOrphanScene(
  scene: Pick<CompositionScene, 'ownerUserId'>,
): boolean {
  return !scene.ownerUserId?.trim()
}

/** First successful write claims ownership of an orphan scene. */
export function withClaimedOwnerIfOrphan(
  scene: CompositionScene,
  viewerId: string,
): CompositionScene {
  if (!isOrphanScene(scene)) return scene
  const id = viewerId.trim()
  if (!id) return scene
  return { ...scene, ownerUserId: id }
}

export async function viewerCanAccessPlatformProjectId(
  platformProjectId: string,
  viewerId: string,
): Promise<boolean> {
  const id = platformProjectId.trim()
  if (!id || !viewerId) return false
  const project = await getProjectByPlatformId(id)
  if (!project) return false
  return viewerCanAccessProject(project, viewerId)
}

export async function forbidUnlessPlatformProjectAccess(
  viewerId: string,
  platformProjectId: string | null | undefined,
  _opts?: { serviceMode?: boolean },
): Promise<NextResponse | null> {
  const pid = platformProjectId?.trim()
  if (!pid) return null
  if (await viewerCanAccessPlatformProjectId(pid, viewerId)) return null
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

function ownerMatches(
  scene: Pick<CompositionScene, 'ownerUserId'>,
  viewerId: string,
): boolean {
  const owner = scene.ownerUserId?.trim()
  return Boolean(owner && owner === viewerId)
}

export async function resolveSceneAccessRole(
  scene: Pick<CompositionScene, 'id' | 'ownerUserId'>,
  viewerId: string,
): Promise<'owner' | SceneMemberRole | null> {
  if (ownerMatches(scene, viewerId)) return 'owner'
  const member = await getSceneMemberRole(scene.id, viewerId)
  return member
}

async function sceneAllowedForViewer(
  scene: Pick<CompositionScene, 'id' | 'ownerUserId' | 'platformProjectId'>,
  viewerId: string,
): Promise<boolean> {
  if (ownerMatches(scene, viewerId)) return true
  const member = await getSceneMemberRole(scene.id, viewerId)
  if (member) return true
  if (isOrphanScene(scene)) {
    const pid = scene.platformProjectId?.trim()
    if (!pid) return true
    return viewerCanAccessPlatformProjectId(pid, viewerId)
  }
  if (isAuthBypassEnabled()) {
    const owner = scene.ownerUserId?.trim()
    if (owner && owner !== viewerId) return false
    const pid = scene.platformProjectId?.trim()
    if (!pid) return true
    return viewerCanAccessPlatformProjectId(pid, viewerId)
  }
  return false
}

export async function forbidUnlessSceneCollectionAccess(
  viewerId: string,
  scene: Pick<CompositionScene, 'id' | 'platformProjectId' | 'ownerUserId'>,
  _opts?: { serviceMode?: boolean },
): Promise<NextResponse | null> {
  if (await sceneAllowedForViewer(scene, viewerId)) return null
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

/** Write ops: owner or editor only; orphans are claimable. */
export async function forbidUnlessSceneWriteAccess(
  viewerId: string,
  scene: Pick<CompositionScene, 'id' | 'ownerUserId'>,
): Promise<NextResponse | null> {
  if (isOrphanScene(scene) && viewerId.trim()) return null
  const role = await resolveSceneAccessRole(scene, viewerId)
  if (role === 'owner' || role === 'editor') return null
  if (role === 'viewer') {
    return NextResponse.json({ error: 'forbidden', reason: 'read-only' }, { status: 403 })
  }
  return NextResponse.json({ error: 'forbidden' }, { status: 403 })
}

/** Load scene then enforce ACL. 404 before 403 when missing. */
export async function requireSceneForViewer(
  sceneId: string,
  viewerId: string,
  opts?: { serviceMode?: boolean },
): Promise<{ scene: CompositionScene } | NextResponse> {
  const scene = await getScene(sceneId)
  if (!scene) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  const denied = await forbidUnlessSceneCollectionAccess(viewerId, scene, opts)
  if (denied) return denied
  return { scene }
}

export function isSceneForViewer(
  value: { scene: CompositionScene } | NextResponse,
): value is { scene: CompositionScene } {
  return 'scene' in value
}

/** List scenes visible to the viewer (optionally narrowed to one Collection). */
export async function listScenesForViewer(
  viewerId: string,
  platformProjectId?: string | null,
): Promise<{ scenes: CompositionScene[] } | NextResponse> {
  const filterId = platformProjectId?.trim() || null
  if (filterId) {
    const denied = await forbidUnlessPlatformProjectAccess(viewerId, filterId)
    if (denied) return denied
    return { scenes: await listScenes(filterId) }
  }

  const all = await listScenes()
  const memberSceneIds = new Set(await listSceneMemberUserIds(viewerId))
  const projects = await listProjectsForViewer(viewerId)
  const projectIds = new Set(
    projects.map((p) => p.platformProjectId?.trim()).filter((id): id is string => Boolean(id)),
  )

  const filtered = sortScenesByUpdatedAtDesc(
    all.filter((s) => {
      const owner = s.ownerUserId?.trim()
      if (owner && owner === viewerId) return true
      if (memberSceneIds.has(s.id)) return true
      if (!owner) {
        const pid = s.platformProjectId?.trim()
        if (!pid) return true
        return projectIds.has(pid)
      }
      if (isAuthBypassEnabled()) {
        if (owner && owner !== viewerId) return false
        const pid = s.platformProjectId?.trim()
        if (!pid) return true
        return projectIds.has(pid)
      }
      return false
    }),
  )
  return { scenes: filtered }
}
