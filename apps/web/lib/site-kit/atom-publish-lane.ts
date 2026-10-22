/**
 * SK-S4 atom Publish lane resolution (shared seed vs Collection fork).
 * Spec: specs/domain/site-kit-collection-scope.md · specs/api/site-kit-write.md
 */
import {
  atomForkComponentId,
  compositionScopeKey,
  isNamespacedAtomOverrideId,
  parseAtomOverrideId,
} from '@zaoly/site-kit/composition-codegen'
import { paths } from '../paths'
import { findSiteKitEntry } from './site-kit-catalog'

export type AtomPublishLane = 'seed' | 'fork'

export function isSiteKitSharedSeedWriteEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const raw = env[paths.envSiteKitSharedSeedWrite]?.trim().toLowerCase()
  return raw === '1' || raw === 'true' || raw === 'yes'
}

export type ResolvedAtomWriteTarget =
  | {
      ok: true
      lane: AtomPublishLane
      /** Catalog atom type (`SiteButton`) for CSF / composition.type. */
      baseComponentId: string
      /** Override store key (seed or `Atom~…`). */
      overrideId: string
      platformProjectId: string | null
      /** Patch shared `*.stories.tsx` only for seed lane. */
      patchDiskStory: boolean
    }
  | { ok: false; code: string; error: string }

/**
 * Resolve where an atom Write/Publish lands.
 * Default with Collection → fork. Seed requires shared-lane env + explicit/default `seed` lane.
 */
export function resolveAtomWriteTarget(input: {
  componentId: string
  publishLane?: AtomPublishLane | string | null
  platformProjectId?: string | null
  sharedSeedEnabled?: boolean
}): ResolvedAtomWriteTarget {
  const rawId = input.componentId.trim()
  if (!rawId) {
    return { ok: false, code: 'unknown-component', error: 'componentId required' }
  }

  const sharedSeedEnabled =
    input.sharedSeedEnabled ?? isSiteKitSharedSeedWriteEnabled()
  const requestedLane =
    input.publishLane === 'seed' || input.publishLane === 'fork'
      ? input.publishLane
      : null
  const pid = input.platformProjectId?.trim() || null

  if (isNamespacedAtomOverrideId(rawId)) {
    const parsed = parseAtomOverrideId(rawId)
    if (!parsed || !findSiteKitEntry(parsed.atomType)) {
      return {
        ok: false,
        code: 'unknown-component',
        error: `Unknown atom fork: ${rawId}`,
      }
    }
    if (requestedLane === 'seed') {
      return {
        ok: false,
        code: 'seed-lane-conflict',
        error: 'Namespaced Atom~ id cannot use publishLane=seed',
      }
    }
    if (pid && compositionScopeKey(pid) !== parsed.scopeKey) {
      return {
        ok: false,
        code: 'scope-mismatch',
        error: 'platformProjectId does not match Atom~ scopeKey',
      }
    }
    return {
      ok: true,
      lane: 'fork',
      baseComponentId: parsed.atomType,
      overrideId: rawId,
      platformProjectId: pid,
      patchDiskStory: false,
    }
  }

  if (!findSiteKitEntry(rawId)) {
    return {
      ok: false,
      code: 'unknown-component',
      error: `Unknown componentId: ${rawId}`,
    }
  }

  const lane: AtomPublishLane =
    requestedLane ?? (pid ? 'fork' : 'seed')

  if (lane === 'fork') {
    if (!pid) {
      return {
        ok: false,
        code: 'missing-platform-project-id',
        error: 'Collection platformProjectId required for atom fork Publish',
      }
    }
    return {
      ok: true,
      lane: 'fork',
      baseComponentId: rawId,
      overrideId: atomForkComponentId(rawId, pid),
      platformProjectId: pid,
      patchDiskStory: false,
    }
  }

  if (!sharedSeedEnabled) {
    return {
      ok: false,
      code: 'seed-write-forbidden',
      error:
        'Shared atom seed writes require ZAOLY_SITE_KIT_SHARED_SEED_WRITE=1 (kit shared lane). Prefer Collection fork or Save as Pattern.',
    }
  }

  return {
    ok: true,
    lane: 'seed',
    baseComponentId: rawId,
    overrideId: rawId,
    platformProjectId: null,
    patchDiskStory: true,
  }
}
