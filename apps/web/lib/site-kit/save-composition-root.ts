/**
 * Resolve and validate the scene subtree saved as a Site Kit composition.
 * Spec: site-kit-compositions.md
 */
import type { SceneBreakpointId, SceneMaster, SceneNode } from '@zaoly/contracts'
import type { InspectTokenOption } from '../inspect/token-catalog'
import {
  expandInstanceNode,
  isInstanceNode,
} from '../scene/expand-instances'
import { resolveMasterDefinitionRoot } from '../scene/master-variants'
import {
  validateCompositionName,
  validateCompositionTree,
  validateNamedCompositionVariants,
  type CompositionNamedVariant,
} from './composition-write-validation'
import { coerceEditorNodeToSiteKit } from './coerce-editor-tree-to-site-kit'
import {
  masterForKitSave,
  serializeMasterNamedVariantsForKit,
  validateSiteKitExportSceneRoot,
} from './master-kit-export'
import {
  serializeSiteKitComposition,
  type SiteKitCompositionNode,
} from './sync-tree'

export type SiteKitSaveValidationError = {
  ok: false
  code: string
  error: string
}

export type SiteKitSavePreparedPayload = {
  ok: true
  exportName: string
  masterId: string
  root: SiteKitCompositionNode
  named: {
    variants: CompositionNamedVariant[]
    defaultVariantId: string
    axes?: { id: string; name: string; values: string[] }[]
  } | null
}

/** Scene node to serialize — always the full Master / Instance root, never a partial child. */
export function resolveSiteKitCompositionSaveRoot(input: {
  selected: SceneNode
  persisted: SceneNode | null
  masterEditId?: string | null
  masters?: SceneMaster[]
}):
  | { ok: true; root: SceneNode; master: SceneMaster }
  | SiteKitSaveValidationError {
  const master = (() => {
    if (input.masterEditId) {
      return masterForKitSave(
        input.masters,
        input.selected,
        input.masterEditId,
      )
    }
    if (input.persisted && isInstanceNode(input.persisted)) {
      return input.masters?.find((m) => m.id === input.persisted!.instanceOf) ?? null
    }
    return masterForKitSave(input.masters, input.selected, null)
  })()
  if (!master) {
    return {
      ok: false,
      code: 'invalid-selection',
      error: 'Select an unsynced custom Master or its Instance root',
    }
  }

  if (input.masterEditId) {
    const variantRoot = resolveMasterDefinitionRoot(master)
    if (input.selected.id !== variantRoot.id) {
      return {
        ok: false,
        code: 'invalid-selection',
        error: 'Select the Master root to save the full composition',
      }
    }
    return { ok: true, root: variantRoot, master }
  }

  if (input.persisted && isInstanceNode(input.persisted)) {
    if (input.persisted.instanceOf !== master.id) {
      return {
        ok: false,
        code: 'invalid-selection',
        error: 'Select the Instance root of your custom Master',
      }
    }
    return {
      ok: true,
      root: expandInstanceNode(input.persisted, input.masters),
      master,
    }
  }

  return {
    ok: false,
    code: 'invalid-selection',
    error: 'Select the Instance root of your custom Master',
  }
}

export function prepareSiteKitCompositionSavePayload(input: {
  name: string
  selected: SceneNode
  persisted: SceneNode | null
  masterEditId?: string | null
  masters?: SceneMaster[]
  breakpoint?: SceneBreakpointId
  tokenCatalog?: InspectTokenOption[]
}): SiteKitSavePreparedPayload | SiteKitSaveValidationError {
  const nameCheck = validateCompositionName(input.name)
  if (!nameCheck.ok) return nameCheck

  const rootCheck = resolveSiteKitCompositionSaveRoot(input)
  if (!rootCheck.ok) return rootCheck

  const exportCheck = validateSiteKitExportSceneRoot(rootCheck.root, input.masters)
  if (!exportCheck.ok) return exportCheck

  // Editor wrap chrome (Stack/Grid) and nested Masters may still carry non–Site-Kit
  // types after Instance expand — coerce before serialize/validate.
  const exportRoot = coerceEditorNodeToSiteKit(exportCheck.root)

  const serializeOpts = {
    breakpoint: input.breakpoint,
    tokenCatalog: input.tokenCatalog,
  }
  const root = serializeSiteKitComposition(exportRoot, serializeOpts)
  const treeCheck = validateCompositionTree(root)
  if (!treeCheck.ok) return treeCheck

  const namedRaw = serializeMasterNamedVariantsForKit(rootCheck.master, {
    ...serializeOpts,
    masters: input.masters,
  })

  let named: SiteKitSavePreparedPayload['named'] = null
  if (namedRaw) {
    const variantCheck = validateNamedCompositionVariants(
      namedRaw.variants,
      nameCheck.exportName,
    )
    if (!variantCheck.ok) return variantCheck
    for (const v of namedRaw.variants) {
      const check = validateCompositionTree(v.composition)
      if (!check.ok) {
        return {
          ok: false,
          code: 'invalid-tree',
          error: `Variant "${v.name}": ${check.error}`,
        }
      }
    }
    if (input.masterEditId) {
      const defaultComposition = namedRaw.variants.find(
        (v) => v.id === namedRaw.defaultVariantId,
      )?.composition
      if (
        defaultComposition &&
        JSON.stringify(defaultComposition) !== JSON.stringify(root)
      ) {
        return {
          ok: false,
          code: 'invalid-variants',
          error: 'Default variant does not match the saved root',
        }
      }
    }
    named = {
      variants: namedRaw.variants.map((v) => ({
        id: v.id,
        name: v.name,
        composition: v.composition,
        ...(v.combination ? { combination: { ...v.combination } } : {}),
      })),
      defaultVariantId: namedRaw.defaultVariantId,
      ...(namedRaw.axes?.length
        ? {
            axes: namedRaw.axes.map((a) => ({
              id: a.id,
              name: a.name,
              values: [...a.values],
            })),
          }
        : {}),
    }
  }

  return { ok: true, exportName: nameCheck.exportName, masterId: rootCheck.master.id, root, named }
}
