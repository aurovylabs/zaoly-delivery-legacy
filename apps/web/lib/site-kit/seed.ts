/**
 * Resolve Site Kit seed for Pull/Reset.
 * Spec: site-kit-kit-pull.md · SK-S4 atom fork fallback
 */
import type { SceneMasterVariant } from '@zaoly/contracts'
import {
  atomBaseTypeFromOverrideId,
  isNamespacedAtomOverrideId,
} from '@zaoly/site-kit/composition-codegen'
import { createSceneNodeId, defaultChildForType } from '../scene/ops'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'
import { readSiteKitOverride } from './override-store'
import {
  deserializeSiteKitComposition,
  type SiteKitCompositionNode,
} from './sync-tree'
import type { KitSeedPayload } from './pull-merge'
import { findSiteKitEntry } from './write'

function asComposition(raw: unknown): SiteKitCompositionNode | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as { type?: unknown }
  if (typeof rec.type !== 'string') return null
  return raw as SiteKitCompositionNode
}

export async function resolveSiteKitSeed(
  componentId: string,
  options?: { cwd?: string },
): Promise<KitSeedPayload | { ok: false; error: string; code: string }> {
  const id = componentId.trim()
  if (!id) {
    return { ok: false, code: 'empty', error: 'componentId required' }
  }

  const override = await readSiteKitOverride(id, options)
  if (override?.composition) {
    const composition = asComposition(override.composition)
    if (composition) {
      const root = deserializeSiteKitComposition(composition, createSceneNodeId)
      let variants: SceneMasterVariant[] | undefined
      let defaultVariantId: string | undefined
      if (override.variants && override.variants.length >= 2) {
        const fallbackType = atomBaseTypeFromOverrideId(id) ?? id
        variants = override.variants.map((v) => ({
          id: v.id,
          name: v.name,
          root: deserializeSiteKitComposition(
            asComposition(v.composition) ?? { type: fallbackType, props: {} },
            createSceneNodeId,
          ),
        }))
        defaultVariantId =
          override.defaultVariantId &&
          variants.some((v) => v.id === override.defaultVariantId)
            ? override.defaultVariantId
            : variants[0]!.id
      }
      const kitRevision = `override:${override.updatedAt ?? 'unknown'}`
      return {
        componentId: id,
        kitRevision,
        root,
        ...(variants ? { variants, defaultVariantId } : {}),
      }
    }
  }

  // SK-S4: Collection fork miss → fall back to global seed atom.
  if (isNamespacedAtomOverrideId(id)) {
    const base = atomBaseTypeFromOverrideId(id)
    if (base) return resolveSiteKitSeed(base, options)
  }

  if (isSiteKitInsertableType(id) || findSiteKitEntry(id)) {
    const root = defaultChildForType(id)
    return {
      componentId: id,
      kitRevision: `catalog:${id}`,
      root,
    }
  }

  if (id.startsWith('Composition')) {
    return {
      ok: false,
      code: 'missing-override',
      error: `No override for ${id}`,
    }
  }

  return { ok: false, code: 'unknown-component', error: `Unknown kit id: ${id}` }
}

/**
 * Lightweight seed stamp for Kit drift probes (no tree deserialize).
 * Spec: site-kit-kit-pull.md
 */
export async function resolveSiteKitSeedRevision(
  componentId: string,
  options?: { cwd?: string },
): Promise<{ componentId: string; kitRevision: string } | { ok: false; code: string }> {
  const id = componentId.trim()
  if (!id) return { ok: false, code: 'empty' }

  const override = await readSiteKitOverride(id, options)
  if (override?.composition) {
    return {
      componentId: id,
      kitRevision: `override:${override.updatedAt ?? 'unknown'}`,
    }
  }

  if (isNamespacedAtomOverrideId(id)) {
    const base = atomBaseTypeFromOverrideId(id)
    if (base) return resolveSiteKitSeedRevision(base, options)
  }

  if (isSiteKitInsertableType(id) || findSiteKitEntry(id)) {
    return { componentId: id, kitRevision: `catalog:${id}` }
  }

  if (id.startsWith('Composition')) {
    return { ok: false, code: 'missing-override' }
  }
  return { ok: false, code: 'unknown-component' }
}
