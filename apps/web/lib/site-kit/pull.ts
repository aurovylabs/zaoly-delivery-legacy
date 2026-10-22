/**
 * Apply Pull/Reset to Masters (+ Instance remaps).
 * Spec: site-kit-kit-pull.md
 *
 * Server-only module (imports seed → override-store → Postgres).
 * Client editors MUST import `mergeSiteKitPullIntoScene` from `./pull-merge`.
 */
import type { CompositionScene, SceneMaster } from '@zaoly/contracts'
import {
  applyVariantRemapsToSceneRoot,
  collectPullableMasters,
  kitComponentIdForMaster,
  pullMasterSchema,
  resetMasterFromSeed,
  type KitSeedPayload,
  type PullMode,
  type VariantRemap,
} from './pull-merge'
import { resolveSiteKitSeed } from './seed'

export type PullRequestResult =
  | {
      ok: true
      masters: SceneMaster[]
      sceneRoot?: CompositionScene['root']
      updated: number
      unchanged: number
      reset: number
      remaps: VariantRemap[]
    }
  | { ok: false; code: string; error: string }

function isSeedError(
  seed: KitSeedPayload | { ok: false; error: string; code: string },
): seed is { ok: false; error: string; code: string } {
  return 'ok' in seed && seed.ok === false
}

export async function applySiteKitPull(input: {
  mode: PullMode
  masters: SceneMaster[]
  sceneRoot?: CompositionScene['root']
  platformProjectId?: string | null
}): Promise<PullRequestResult> {
  const pullable = collectPullableMasters(input.masters)
  if (!pullable.length) {
    return { ok: false, code: 'empty', error: 'No Site Kit masters to pull' }
  }

  const byId = new Map(input.masters.map((m) => [m.id, m]))
  let updated = 0
  let unchanged = 0
  let reset = 0
  const remaps: VariantRemap[] = []

  for (const master of pullable) {
    const componentId = kitComponentIdForMaster(master, input.platformProjectId)!
    const seed = await resolveSiteKitSeed(componentId)
    if (isSeedError(seed)) {
      return { ok: false, code: seed.code, error: seed.error }
    }

    const result =
      input.mode === 'reset'
        ? resetMasterFromSeed(master, seed)
        : pullMasterSchema(master, seed)

    byId.set(master.id, result.master)
    remaps.push(...result.remaps)
    if (!result.changed) unchanged += 1
    else if (input.mode === 'reset') reset += 1
    else updated += 1
  }

  let sceneRoot = input.sceneRoot
  if (input.mode === 'reset' && sceneRoot && remaps.length) {
    sceneRoot = applyVariantRemapsToSceneRoot(sceneRoot, remaps)
  }

  return {
    ok: true,
    masters: input.masters.map((m) => byId.get(m.id) ?? m),
    ...(sceneRoot ? { sceneRoot } : {}),
    updated,
    unchanged,
    reset,
    remaps,
  }
}

/** @deprecated Import from `./pull-merge` in client code. */
export { mergeSiteKitPullIntoScene } from './pull-merge'
