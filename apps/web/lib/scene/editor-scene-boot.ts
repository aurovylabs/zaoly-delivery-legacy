import type { CompositionScene } from '@zaoly/contracts'
import { paths } from '../paths'
import {
  createDepositLandingScene,
  DEPOSIT_LANDING_SCENE_ID,
  shouldReseedDepositLanding,
} from './deposit-landing-scene'
import { DEFAULT_EDITOR_SCENE_ID } from './demo-scene'
import { createSceneNodeId } from './ops'
import {
  createVaillantLandingScene,
  shouldReseedVaillantLanding,
  VAILLANT_LANDING_SCENE_ID,
} from './vaillant-landing-scene'
import {
  createZaolyDefaultLandingScene,
  shouldReseedZaolyDefaultLanding,
} from './zaoly-default-landing-scene'
import { getScene, listScenes, upsertScene } from './scene-store'
import { ensureStarterLandingForUser } from './user-starter-scene'

export type EditorSceneBootParams = {
  sceneId?: string
  platformProjectId?: string | null
  /** Session actor — prefers personal owned landing over shared scene-demo. */
  viewerUserId?: string | null
}

function pickLatestScene(scenes: CompositionScene[]): CompositionScene {
  return [...scenes].sort((a, b) =>
    (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
  )[0]!
}

function isZaolyDepositCollection(platformProjectId: string | null): boolean {
  return platformProjectId === paths.zaolyDepositPlatformProjectId
}

function isVaillantGroupCollection(platformProjectId: string | null): boolean {
  return platformProjectId === paths.vaillantGroupPlatformProjectId
}

/** Zaoly default landing for new Collections / first editor visit. */
function seedDefaultLanding(platformProjectId: string | null, id?: string): CompositionScene {
  const landing = createZaolyDefaultLandingScene(platformProjectId)
  return {
    ...landing,
    id: id?.trim() || (platformProjectId ? createSceneNodeId('scene') : DEFAULT_EDITOR_SCENE_ID),
  }
}

/** Soft-reseed must not wipe ACL ownership (orphan → forbidden snackbars). */
function withPreservedOwner(
  seed: CompositionScene,
  existing: CompositionScene | null | undefined,
): CompositionScene {
  const owner = existing?.ownerUserId?.trim()
  if (!owner) return seed
  return { ...seed, ownerUserId: owner }
}

/**
 * Resolve the scene document for `/editor` SSR boot.
 * Signed-in viewers without `?sceneId=` get their latest owned scene (or a
 * personal Zaoly landing via `ensureStarterLandingForUser`) — not a shared
 * global `scene-demo`. Legacy `scene-demo` remains for auth-bypass / empty store.
 * New Collections seed the Zaoly default landing. Zaoly Deposit / Vaillant
 * Group keep curated landings. Blank: `createEmptyArtboardScene` (hub create).
 */
export async function resolveEditorInitialScene(
  params: EditorSceneBootParams,
): Promise<CompositionScene> {
  const platformProjectId = params.platformProjectId ?? null
  const viewerUserId = params.viewerUserId?.trim() || null

  if (params.sceneId) {
    const existing = await getScene(params.sceneId)
    if (existing) {
      if (shouldReseedZaolyDefaultLanding(existing)) {
        return upsertScene(
          withPreservedOwner(
            seedDefaultLanding(platformProjectId, params.sceneId),
            existing,
          ),
        )
      }
      return existing
    }
    const fallback = isZaolyDepositCollection(platformProjectId)
      ? createDepositLandingScene(platformProjectId!)
      : isVaillantGroupCollection(platformProjectId)
        ? createVaillantLandingScene(platformProjectId!)
        : seedDefaultLanding(platformProjectId, params.sceneId)
    return { ...fallback, id: params.sceneId }
  }

  if (isZaolyDepositCollection(platformProjectId)) {
    const deposit = await getScene(DEPOSIT_LANDING_SCENE_ID)
    if (deposit) {
      if (shouldReseedDepositLanding(deposit)) {
        return upsertScene(
          withPreservedOwner(createDepositLandingScene(platformProjectId!), deposit),
        )
      }
      return deposit
    }
    return upsertScene(createDepositLandingScene(platformProjectId!))
  }

  if (isVaillantGroupCollection(platformProjectId)) {
    const vaillant = await getScene(VAILLANT_LANDING_SCENE_ID)
    if (vaillant) {
      if (shouldReseedVaillantLanding(vaillant)) {
        return upsertScene(
          withPreservedOwner(createVaillantLandingScene(platformProjectId!), vaillant),
        )
      }
      return vaillant
    }
    return upsertScene(createVaillantLandingScene(platformProjectId!))
  }

  if (platformProjectId) {
    const forProject = await listScenes(platformProjectId)
    if (forProject.length > 0) {
      const latest = pickLatestScene(forProject)
      if (shouldReseedZaolyDefaultLanding(latest)) {
        return upsertScene(
          withPreservedOwner(seedDefaultLanding(platformProjectId, latest.id), latest),
        )
      }
      return latest
    }
    const seeded = seedDefaultLanding(platformProjectId)
    return upsertScene(
      viewerUserId ? { ...seeded, ownerUserId: viewerUserId } : seeded,
    )
  }

  if (viewerUserId) {
    const personal = await ensureStarterLandingForUser(viewerUserId)
    if (personal) {
      if (shouldReseedZaolyDefaultLanding(personal)) {
        return upsertScene(
          withPreservedOwner(seedDefaultLanding(null, personal.id), personal),
        )
      }
      return personal
    }
  }

  const persisted = await getScene(DEFAULT_EDITOR_SCENE_ID)
  if (persisted) {
    if (shouldReseedZaolyDefaultLanding(persisted)) {
      return upsertScene(
        withPreservedOwner(seedDefaultLanding(null, DEFAULT_EDITOR_SCENE_ID), persisted),
      )
    }
    return persisted
  }

  return upsertScene(seedDefaultLanding(null))
}
