/**
 * Ensure Master + Instance for a page artboard, then prepare Site Kit save.
 * Spec: page-as-pattern.md · site-kit-compositions.md
 */
import type { CompositionScene, SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import { isRealPlatformProjectId } from '../platform-project-id'
import {
  findMaster,
  INSTANCE_TYPE,
  isInstanceNode,
} from '../scene/expand-instances'
import { applySceneOp } from '../scene/ops'
import { cloneSceneNodeWithNewIds } from '../scene/scene-clone'
import {
  materializeScenePages,
  resolveActivePageId,
} from '../scene/scene-pages'
import { createSceneNodeId } from '../scene/scene-tree'
import { normalizeCompositionName, validateCompositionName } from './composition-write-validation'
import { coerceEditorNodeToSiteKit } from './coerce-editor-tree-to-site-kit'
import {
  prepareCompositionFromScene,
} from './prepare-composition-from-scene'
import type {
  SiteKitSavePreparedPayload,
  SiteKitSaveValidationError,
} from './save-composition-root'

export type EnsurePageMasterResult =
  | {
      ok: true
      scene: CompositionScene
      masterId: string
      instanceNodeId: string
      pageId: string
    }
  | SiteKitSaveValidationError

export type PrepareCompositionFromPageResult =
  | (SiteKitSavePreparedPayload & {
      scene: CompositionScene
      instanceNodeId: string
      pageId: string
    })
  | SiteKitSaveValidationError

/** Promote page artboard root to Master Instance (create_master forbids page root). */
export function ensureMasterFromPageRoot(
  scene: CompositionScene,
  pageId: string,
  masterName: string,
): EnsurePageMasterResult {
  const materialized = materializeScenePages(structuredClone(scene))
  const pages = materialized.pages ?? []
  const page = pages.find((p) => p.id === pageId)
  if (!page?.root?.id) {
    return { ok: false, code: 'missing-page', error: `Unknown page: ${pageId}` }
  }

  const root = page.root
  if (isInstanceNode(root)) {
    const masterId = root.instanceOf
    if (!masterId) {
      return {
        ok: false,
        code: 'missing-master',
        error: 'Page Instance is missing instanceOf',
      }
    }
    const master = findMaster(materialized.masters, masterId)
    if (!master) {
      return {
        ok: false,
        code: 'missing-master',
        error: `Missing master for page Instance: ${masterId}`,
      }
    }
    const sk = master.sourceKey?.trim()
    if (sk && !sk.startsWith('Composition:')) {
      return {
        ok: false,
        code: 'invalid-page-root',
        error: 'Page root is a palette atom Instance — wrap content or detach before Save page as Pattern',
      }
    }
    return {
      ok: true,
      scene: materialized,
      masterId: master.id,
      instanceNodeId: root.id,
      pageId,
    }
  }

  const name = masterName.trim() || page.name.trim() || 'Page'
  const masterId = createSceneNodeId('master')
  const masterRoot = coerceEditorNodeToSiteKit(cloneSceneNodeWithNewIds(root))
  const instance: SceneNode = {
    id: root.id,
    type: INSTANCE_TYPE,
    name,
    instanceOf: masterId,
  }

  const nextPages = pages.map((p) => (p.id === pageId ? { ...p, root: instance } : p))
  const activeId = resolveActivePageId(nextPages, materialized.activePageId)
  const next: CompositionScene = {
    ...materialized,
    pages: nextPages,
    activePageId: activeId,
    root: activeId === pageId ? instance : materialized.root,
    masters: [
      ...(materialized.masters ?? []),
      { id: masterId, name, root: masterRoot },
    ],
  }

  return {
    ok: true,
    scene: next,
    masterId,
    instanceNodeId: instance.id,
    pageId,
  }
}

/** Rewrite custom Master definitions to Site Kit types (incl. variants). */
export function coerceAllCustomMastersOnScene(
  scene: CompositionScene,
): CompositionScene {
  const masters = (scene.masters ?? []).map((m) => {
    const sk = m.sourceKey?.trim()
    if (sk && !sk.startsWith('Composition:')) return m
    return {
      ...m,
      root: coerceEditorNodeToSiteKit(m.root),
      ...(m.variants?.length
        ? {
            variants: m.variants.map((v) => ({
              ...v,
              root: coerceEditorNodeToSiteKit(v.root),
            })),
          }
        : {}),
    }
  })
  return { ...scene, masters }
}

/** @deprecated Prefer coerceAllCustomMastersOnScene — nested Masters also need coerce. */
export function coerceMasterTreeOnScene(
  scene: CompositionScene,
  masterId: string,
): CompositionScene {
  const masters = scene.masters ?? []
  const nextMasters = masters.map((m) =>
    m.id === masterId ? { ...m, root: coerceEditorNodeToSiteKit(m.root) } : m,
  )
  return { ...scene, masters: nextMasters }
}

export function prepareCompositionFromPage(input: {
  scene: CompositionScene
  pageId: string
  name: string
  breakpoint?: SceneBreakpointId
}): PrepareCompositionFromPageResult {
  if (!isRealPlatformProjectId(input.scene.platformProjectId)) {
    return {
      ok: false,
      code: 'missing-platform-project-id',
      error: 'Bind a Collection before Save page as Pattern',
    }
  }

  const nameCheck = validateCompositionName(input.name)
  if (!nameCheck.ok) return nameCheck

  const ensured = ensureMasterFromPageRoot(
    input.scene,
    input.pageId,
    nameCheck.exportName,
  )
  if (!ensured.ok) return ensured

  const scene = coerceAllCustomMastersOnScene(ensured.scene)

  const prepared = prepareCompositionFromScene({
    scene,
    masterId: ensured.masterId,
    name: input.name,
    instanceNodeId: ensured.instanceNodeId,
    breakpoint: input.breakpoint,
  })
  if (!prepared.ok) return prepared

  return {
    ...prepared,
    scene,
    instanceNodeId: ensured.instanceNodeId,
    pageId: ensured.pageId,
  }
}

/** Unique PascalCase names for batch page saves. */
export function uniquePagePatternNames(
  pages: Array<{ id: string; name: string }>,
  preferred?: Record<string, string>,
): Record<string, string> {
  const used = new Set<string>()
  const out: Record<string, string> = {}
  for (const page of pages) {
    const raw = preferred?.[page.id]?.trim() || page.name.trim() || `Page`
    let base = normalizeCompositionName(raw)
    if (!/^[A-Z]/.test(base)) base = `Page${base}`
    let candidate = base.slice(0, 48) || 'Page'
    let n = 2
    while (used.has(candidate)) {
      const suffix = String(n++)
      candidate = `${base.slice(0, Math.max(1, 48 - suffix.length))}${suffix}`
    }
    used.add(candidate)
    out[page.id] = candidate
  }
  return out
}

/** Apply bind_master_composition onto a scene (client or server response shaping). */
export function bindPagePatternOnScene(
  scene: CompositionScene,
  masterId: string,
  exportName: string,
): { ok: true; scene: CompositionScene } | { ok: false; reason: string } {
  const result = applySceneOp(scene, {
    op: 'bind_master_composition',
    masterId,
    exportName,
  })
  if (!result.ok) return { ok: false, reason: result.reason }
  return { ok: true, scene: result.scene }
}
