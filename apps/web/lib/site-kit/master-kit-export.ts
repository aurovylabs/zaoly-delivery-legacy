/**
 * Serialize Master named variants / Component Sets for Site Kit / Storybook save.
 * Spec: composition-masters.md · site-kit-compositions.md
 */
import type {
  SceneBreakpointId,
  SceneMaster,
  SceneMasterAxis,
  SceneNode,
} from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { expandSceneTree, collectUnresolvedInstances, findMaster } from '../scene/expand-instances'
import { sanitizeKitAxes } from '@zaoly/site-kit/master-variants'
import { listMasterVariants } from '../scene/master-variants'
import { coerceEditorNodeToSiteKit } from './coerce-editor-tree-to-site-kit'
import {
  serializeSiteKitComposition,
  type SiteKitCompositionNode,
} from './sync-tree'

export type KitNamedVariantPayload = {
  id: string
  name: string
  composition: SiteKitCompositionNode
  /** Phase 3 cell combination (axisId → value). */
  combination?: Record<string, string>
}

export type KitMasterAxesPayload = {
  axes: SceneMasterAxis[]
  variants: KitNamedVariantPayload[]
  defaultVariantId: string
}

export type SerializeMasterVariantsOptions = {
  breakpoint?: SceneBreakpointId
  tokenCatalog?: InspectTokenOption[]
  /** Full scene masters — expands nested palette Instances before serialize. */
  masters?: SceneMaster[]
}

/** Expand nested Instances so Site Kit save validates (palette atoms inside custom Masters). */
export function prepareSiteKitCompositionExportRoot(
  node: SceneNode,
  masters: SceneMaster[] | undefined,
): SceneNode {
  return expandSceneTree(node, masters)
}

export function validateSiteKitExportSceneRoot(
  node: SceneNode,
  masters: SceneMaster[] | undefined,
): { ok: true; root: SceneNode } | { ok: false; code: string; error: string } {
  const expanded = prepareSiteKitCompositionExportRoot(node, masters)
  const unresolved = collectUnresolvedInstances(expanded)
  if (!unresolved.length) return { ok: true, root: expanded }

  const first = unresolved[0]!
  const masterId = first.instanceOf ?? 'unknown'
  const stubText =
    typeof first.props?.children === 'string' ? first.props.children : ''
  if (stubText.startsWith('Circular master reference:')) {
    return {
      ok: false,
      code: 'circular-master',
      error: `Circular master reference: ${masterId}`,
    }
  }
  if (!findMaster(masters, masterId)) {
    return {
      ok: false,
      code: 'missing-master',
      error: `Missing master: ${masterId}`,
    }
  }
  return {
    ok: false,
    code: 'unresolved-instance',
    error: 'Could not expand all Instance nodes — reload the scene and try again',
  }
}

/** ≥2 named variants → export payload; otherwise null (single-tree save). */
export function serializeMasterNamedVariantsForKit(
  master: SceneMaster,
  options?: SerializeMasterVariantsOptions,
): { variants: KitNamedVariantPayload[]; defaultVariantId: string; axes?: SceneMasterAxis[] } | null {
  const listed = listMasterVariants(master)
  if (listed.length < 2) return null
  const serializeOpts = {
    breakpoint: options?.breakpoint,
    tokenCatalog: options?.tokenCatalog,
  }
  const axes = sanitizeKitAxes(
    master.axes?.map((a) => ({
      id: a.id,
      name: a.name,
      values: [...a.values],
    })),
  )
  const variants = listed.map((v) => {
    let combination = v.combination ? { ...v.combination } : undefined
    // Soft-fill single-axis cells from name when combination was never persisted.
    if (axes?.length === 1 && !combination) {
      const axis = axes[0]!
      if (axis.values.includes(v.name)) {
        combination = { [axis.id]: v.name }
      }
    }
    return {
      id: v.id,
      name: v.name,
      composition: serializeSiteKitComposition(
        coerceEditorNodeToSiteKit(
          prepareSiteKitCompositionExportRoot(v.root, options?.masters),
        ),
        serializeOpts,
      ),
      ...(combination ? { combination } : {}),
    }
  })
  const defaultVariantId =
    master.defaultVariantId && listed.some((v) => v.id === master.defaultVariantId)
      ? master.defaultVariantId
      : listed[0]!.id
  return {
    variants,
    defaultVariantId,
    ...(axes?.length ? { axes } : {}),
  }
}

/**
 * Phase 3 Component Set export: axes metadata + every cell composition.
 * Returns null when Master has no axes or fewer than 2 cells.
 */
export function serializeMasterComponentSetForKit(
  master: SceneMaster,
  options?: SerializeMasterVariantsOptions,
): KitMasterAxesPayload | null {
  if (!master.axes?.length) return null
  const base = serializeMasterNamedVariantsForKit(master, options)
  if (!base) return null
  return {
    axes: master.axes.map((a) => ({ id: a.id, name: a.name, values: [...a.values] })),
    variants: base.variants,
    defaultVariantId: base.defaultVariantId,
  }
}

/** Resolve Master for Instance / Master-Edit save. */
export function masterForKitSave(
  masters: SceneMaster[] | undefined,
  selected: SceneNode | null,
  masterEditId?: string | null,
): SceneMaster | null {
  if (!masters?.length) return null
  if (masterEditId) {
    return masters.find((m) => m.id === masterEditId) ?? null
  }
  if (selected?.instanceOf) {
    return masters.find((m) => m.id === selected.instanceOf) ?? null
  }
  return null
}
