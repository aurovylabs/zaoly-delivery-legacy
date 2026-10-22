import type { CompositionScene } from '@zaoly/contracts'
import { createSceneNodeId } from './ops'
import { listScenes, upsertScene } from './scene-store'
import { createZaolyDefaultLandingScene } from './zaoly-default-landing-scene'

function pickLatestScene(scenes: CompositionScene[]): CompositionScene {
  return [...scenes].sort((a, b) =>
    (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''),
  )[0]!
}

/**
 * Ensure the viewer owns at least one composition — personal Zaoly landing.
 * Idempotent: returns the latest owned scene when any exist.
 * Spec: zaoly-user-management.md · editor-workspace.md (P79)
 */
export async function ensureStarterLandingForUser(
  ownerUserId: string,
): Promise<CompositionScene | null> {
  const id = ownerUserId.trim()
  if (!id) return null
  try {
    const owned = (await listScenes()).filter((s) => s.ownerUserId?.trim() === id)
    if (owned.length > 0) return pickLatestScene(owned)

    const landing = createZaolyDefaultLandingScene(null)
    return await upsertScene({
      ...landing,
      id: createSceneNodeId('scene'),
      ownerUserId: id,
      platformProjectId: null,
    })
  } catch {
    return null
  }
}

/** Best-effort provision after account create — never fails signup. */
export function voidEnsureStarterLandingForUser(ownerUserId: string): void {
  void ensureStarterLandingForUser(ownerUserId)
}
