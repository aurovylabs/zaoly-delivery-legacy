/**
 * When Inspect shows **Save as Site Kit component**.
 * Spec: site-kit-compositions.md · composition-masters.md
 */
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import { isInstanceNode } from '../scene/expand-instances'
import { resolveMasterDefinitionRoot } from '../scene/master-variants'
import { isSiteKitInsertableType, isSiteKitPaletteType } from '../scene/site-kit-palette'
import { masterForKitSave } from './master-kit-export'

/** Palette atom Master (SiteText, SiteButton, …) — synced via kit catalog / Publish. */
export function isPaletteKitMaster(master: SceneMaster | null | undefined): boolean {
  if (!master) return false
  const key = master.sourceKey?.trim()
  if (!key || key.startsWith('Composition:')) return false
  return isSiteKitPaletteType(key)
}

/** Scene Master created via Create Master, not yet exported (`Composition:{Name}`). */
export function isUnsyncedCompositionMaster(master: SceneMaster | null | undefined): boolean {
  if (!master) return false
  if (isPaletteKitMaster(master)) return false
  if (master.sourceKey?.trim().startsWith('Composition:')) return false
  return true
}

export function shouldShowSiteKitSaveComposition(input: {
  selected: SceneNode
  /** Persisted page / master-edit node (not expanded inspect subject). */
  persisted: SceneNode | null
  multi: boolean
  isRoot?: boolean
  sceneMasters?: SceneMaster[]
  masterEditId?: string | null
}): boolean {
  if (input.multi || input.isRoot) return false
  const { selected, persisted } = input
  if (!isSiteKitInsertableType(selected.type)) return false

  const master = masterForKitSave(input.sceneMasters, selected, input.masterEditId ?? null)

  if (input.masterEditId && isUnsyncedCompositionMaster(master)) {
    const variantRoot = master ? resolveMasterDefinitionRoot(master) : null
    return variantRoot != null && selected.id === variantRoot.id
  }

  if (persisted?.instanceOf && isInstanceNode(persisted)) {
    const instMaster = input.sceneMasters?.find((m) => m.id === persisted.instanceOf)
    return isUnsyncedCompositionMaster(instMaster)
  }

  return false
}
