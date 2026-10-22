'use client'

/**
 * Palette catalog, Site Kit pattern hydrate, and token drop (W5j).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { CompositionScene, SceneNode, SceneOp } from '@zaoly/contracts'
import { paths } from '../../lib/paths'
import { isRealPlatformProjectId } from '../../lib/platform-project-id'
import { compositionComponentId } from '@zaoly/site-kit/composition-codegen'
import { paletteTypeIcon } from '../../lib/inspect/icons'
import {
  buildTokenBindOps,
  planTokenDrop,
  type BrandTokenDragPayload,
} from '../../lib/inspect/token-drop'
import {
  applyMasterEditOp,
  applyPaletteHydrateInsert,
  applyPaletteHydrateInsertIntoMaster,
  applySceneOp,
  createSceneNodeId,
  defaultChildForType,
  findMasterBySourceKey,
  findSceneNode,
  isNodeOrAncestorLocked,
  isSceneContainerType,
  planExpandAwarePaletteDrop,
  planPaletteDrop,
  resolveTokenDropTarget,
  type PaletteDropEdge,
} from '../../lib/scene/ops'
import { planBreakpointAwareInsertVisibility } from '../../lib/scene/breakpoint-visibility'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import {
  masterEditAllowsPaletteInsert,
  resolveMasterBoardDropTargetId,
} from '../../lib/scene/master-variants'
import { findMaster } from '../../lib/scene/expand-instances'
import { filterPaletteItems } from '../../lib/scene/palette-filter'
import {
  editorPaletteItems,
  groupCatalogPaletteItems,
  isEditorInsertableType,
  landingSectionPaletteItems,
  patternPaletteItems,
  resolveEditorInsertType,
  type EditorPaletteLayer,
} from '../../lib/scene/catalog-palette'
import { replaceSelection } from '../../lib/scene/selection'
import {
  dispatchOnboardingAction,
  rememberOnboardingInsertNodeId,
} from '../../lib/editor/onboarding'
import { zaolyLandingSectionMasters } from '../../lib/scene/zaoly-default-landing-scene'

export type EditorPalettePatternItem = {
  id: string
  label: string
  layer: EditorPaletteLayer
  insertType: string
}

export function useEditorPalette(args: {
  scene: CompositionScene
  sceneRef: { current: CompositionScene }
  selectedId: string | null
  workingRoot: (scene: CompositionScene) => SceneNode
  editingMasterIdRef: { current: string | null }
  editingVariantIdRef: { current: string | null }
  activeBreakpoint: EditorBreakpoint
  runOps: (ops: SceneOp[]) => void
  pushPresent: (next: CompositionScene, ops?: SceneOp[]) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setError: (message: string | null) => void
  t: (key: string, vars?: Record<string, string>) => string
}) {
  const {
    scene,
    sceneRef,
    selectedId,
    workingRoot,
    editingMasterIdRef,
    editingVariantIdRef,
    activeBreakpoint,
    runOps,
    pushPresent,
    setSelectedIds,
    setError,
    t,
  } = args

  const [paletteQuery, setPaletteQuery] = useState('')
  const [patternItems, setPatternItems] = useState<EditorPalettePatternItem[]>([])

  useEffect(() => {
    const collectionId = scene.platformProjectId?.trim()
    const query = isRealPlatformProjectId(collectionId)
      ? `?platformProjectId=${encodeURIComponent(collectionId!)}`
      : '?unscoped=1'
    void fetch(`${paths.routes.apiSiteKitCompositions}${query}`)
      .then((r) => r.json())
      .then((body: { compositions?: Array<{ exportName: string }> }) => {
        if (!body.compositions?.length) {
          setPatternItems([])
          return
        }
        setPatternItems(
          patternPaletteItems(body.compositions).map((item) => ({
            id: item.id,
            label: item.label,
            layer: item.layer,
            insertType: item.insertType,
          })),
        )
      })
      .catch(() => setPatternItems([]))
  }, [scene.platformProjectId])

  const paletteItems = useMemo(
    () =>
      filterPaletteItems(
        [
          ...editorPaletteItems().map((item) => ({
            id: item.id,
            label: item.label,
            layer: item.layer,
            icon: paletteTypeIcon(item.insertType),
          })),
          ...landingSectionPaletteItems().map((item) => ({
            id: item.id,
            label: item.label,
            layer: item.layer,
            icon: paletteTypeIcon('SiteStack'),
          })),
          ...patternItems.map((item) => ({
            id: item.id,
            label: item.label,
            layer: item.layer,
            icon: paletteTypeIcon('SiteStack'),
          })),
        ],
        paletteQuery,
      ),
    [paletteQuery, patternItems],
  )
  const paletteGroups = useMemo(() => groupCatalogPaletteItems(paletteItems), [paletteItems])

  async function resolveHydrateTemplate(
    type: string,
  ): Promise<{ sourceKey: string; root: SceneNode; name: string } | null> {
    const resolved = resolveEditorInsertType(type)
    if (resolved.startsWith('Composition:')) {
      const existing = findMasterBySourceKey(sceneRef.current.masters, resolved)
      if (existing) {
        return { sourceKey: resolved, root: existing.root, name: existing.name }
      }
      const exportName = resolved.slice('Composition:'.length)
      const starter = zaolyLandingSectionMasters().find((m) => m.sourceKey === resolved)
      if (starter) {
        return { sourceKey: resolved, root: starter.root, name: starter.name }
      }
      const componentId = compositionComponentId(exportName, scene.platformProjectId)
      try {
        const res = await fetch(paths.routes.apiSiteKitOverride(componentId))
        if (!res.ok) {
          setError(`Pattern ${exportName} unavailable`)
          return null
        }
        const body = (await res.json()) as {
          composition?: import('../../lib/site-kit/sync-tree').SiteKitCompositionNode
        }
        if (!body.composition?.type) {
          setError(`Pattern ${exportName} has no tree`)
          return null
        }
        const { deserializeSiteKitComposition } = await import('../../lib/site-kit/sync-tree')
        const root = deserializeSiteKitComposition(body.composition, createSceneNodeId)
        root.name = exportName
        return { sourceKey: resolved, root, name: exportName }
      } catch {
        setError(`Pattern ${exportName} failed to load`)
        return null
      }
    }
    const root = defaultChildForType(resolved)
    const name = resolved.replace(/^Site/, '') || resolved
    return { sourceKey: resolved, root, name }
  }

  function commitPaletteHydrate(
    template: { sourceKey: string; root: SceneNode; name: string },
    parentId: string,
    index?: number,
    masterRoute?: { masterId: string; variantId?: string },
  ): void {
    const editingMasterId = masterRoute?.masterId ?? editingMasterIdRef.current
    const editingVariantId =
      masterRoute?.variantId ?? editingVariantIdRef.current ?? undefined
    const result = editingMasterId
      ? applyPaletteHydrateInsertIntoMaster(
          sceneRef.current,
          editingMasterId,
          editingVariantId,
          {
            sourceKey: template.sourceKey,
            root: template.root,
            name: template.name,
            parentId,
            index,
          },
        )
      : applyPaletteHydrateInsert(sceneRef.current, {
          sourceKey: template.sourceKey,
          root: template.root,
          name: template.name,
          parentId,
          index,
        })
    if (!result.ok) {
      setError(result.reason)
      return
    }
    let nextScene = result.scene
    if (result.selectId) {
      for (const vis of planBreakpointAwareInsertVisibility(
        result.selectId,
        activeBreakpoint,
        scene.primaryBreakpoint === 'tablet' ||
          scene.primaryBreakpoint === 'mobile' ||
          scene.primaryBreakpoint === 'desktop'
          ? scene.primaryBreakpoint
          : 'desktop',
      )) {
        const applied = editingMasterId
          ? applyMasterEditOp(nextScene, editingMasterId, vis, editingVariantId)
          : applySceneOp(nextScene, vis)
        if (!applied.ok) {
          setError(applied.reason)
          return
        }
        nextScene = applied.scene
      }
    }
    setError(null)
    pushPresent(nextScene)
    if (result.selectId) {
      rememberOnboardingInsertNodeId(result.selectId)
      setSelectedIds(replaceSelection(result.selectId))
    }
    dispatchOnboardingAction('insert')
  }

  function onAdd(type: string) {
    const editingMasterId = editingMasterIdRef.current
    if (editingMasterId) {
      const master = findMaster(scene.masters, editingMasterId)
      if (master && !masterEditAllowsPaletteInsert(master)) {
        setError(
          'Site Kit atom Masters are sealed — nest components inside section Masters, or Detach',
        )
        return
      }
    }
    const root = workingRoot(scene)
    // Page mode: selected section Instance / expand container → Master-routed into.
    if (!editingMasterId && selectedId) {
      const into = planExpandAwarePaletteDrop(scene, selectedId, 'into', root)
      if (into.ok) {
        void resolveHydrateTemplate(type).then((template) => {
          if (!template) return
          commitPaletteHydrate(
            template,
            into.parentId,
            into.index,
            into.mode === 'master'
              ? { masterId: into.masterId, variantId: into.variantId }
              : undefined,
          )
        })
        return
      }
    }
    const primary = selectedId ? findSceneNode(scene, selectedId, root) : null
    const parentId =
      primary && isSceneContainerType(primary.type) ? primary.id : root.id
    if (isNodeOrAncestorLocked(root, parentId)) {
      setError(t('editor.lockedHint'))
      return
    }
    void resolveHydrateTemplate(type).then((template) => {
      if (!template) return
      commitPaletteHydrate(template, parentId)
    })
  }

  function onPaletteDrop(type: string, targetId: string, edge: PaletteDropEdge): void {
    if (!isEditorInsertableType(type)) return
    const current = sceneRef.current
    const root = workingRoot(current)
    const editingMasterId = editingMasterIdRef.current
    const editingVariantId = editingVariantIdRef.current
    if (editingMasterId) {
      const master = findMaster(current.masters, editingMasterId)
      if (master && !masterEditAllowsPaletteInsert(master)) {
        setError(
          'Site Kit atom Masters are sealed — nest components inside section Masters, or Detach',
        )
        return
      }
    }
    let dropTargetId = targetId
    if (editingMasterId && editingVariantId) {
      const mapped = resolveMasterBoardDropTargetId(targetId, root, editingVariantId)
      if (!mapped) {
        setError('Drop onto the active variant tile to insert')
        return
      }
      dropTargetId = mapped
    }
    // Master-Edit stays on the working root; page mode uses expand-aware routing
    // so landing section Instances accept into-drops via their Composition Master.
    const planned = editingMasterId
      ? (() => {
          const p = planPaletteDrop(current, dropTargetId, edge, root)
          return p.ok
            ? ({ ok: true as const, mode: 'page' as const, parentId: p.parentId, index: p.index })
            : p
        })()
      : planExpandAwarePaletteDrop(current, dropTargetId, edge, root)
    if (!planned.ok) {
      setError(planned.reason.startsWith('Node is locked:') ? t('editor.lockedHint') : planned.reason)
      return
    }
    void resolveHydrateTemplate(type).then((template) => {
      if (!template) return
      commitPaletteHydrate(
        template,
        planned.parentId,
        planned.index,
        planned.mode === 'master'
          ? { masterId: planned.masterId, variantId: planned.variantId }
          : undefined,
      )
    })
  }

  function onTokenDrop(payload: BrandTokenDragPayload, targetId: string): void {
    const current = sceneRef.current
    const root = workingRoot(current)
    const target = resolveTokenDropTarget(current, root, targetId)
    if (!target) return
    const planned = planTokenDrop(payload.type, target.nodeType)
    if (!planned.ok) return
    runOps(buildTokenBindOps(target.nodeId, planned.keys, payload.path))
    setSelectedIds(replaceSelection(target.nodeId))
    dispatchOnboardingAction('tokenBind')
  }

  return {
    paletteQuery,
    setPaletteQuery,
    patternItems,
    paletteItems,
    paletteGroups,
    onAdd,
    onPaletteDrop,
    onTokenDrop,
  }
}
