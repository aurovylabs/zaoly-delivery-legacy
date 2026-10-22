/**
 * Palette / layer drop planners + container type helpers (W5c).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import {
  EDITOR_PALETTE_GROUP_TYPES,
  type CompositionScene,
  type SceneNode,
  type SceneNodeId,
} from '@zaoly/contracts'
import { slotOf } from './slots'
import { rejectIfBoardChrome } from './scene-board'
import {
  findPageIdForNode,
  materializeScenePages,
} from './scene-pages'
import { defaultChildForType } from './scene-insert-defaults'
import {
  findNode,
  findParent,
  hasAncestorType,
  isNodeOrAncestorLocked,
} from './scene-tree'

export const SCENE_CONTAINER_TYPES = [
  'Stack',
  'Grid',
  'Card',
  'Field',
  'Panel',
  'ScrollArea',
  'FormSection',
  'CardActions',
  'FilterRow',
  'RankedList',
  'StepStrip',
  'ChannelStack',
  'ChannelLane',
  'EventFooter',
  'EntityCard',
  'KpiStrip',
  'DivergingBar',
  'PrintPage',
  'PrintChapter',
  'PrintChipRow',
  'PrintTwoColumn',
  'PrintRankedList',
  'PrintLedger',
  'PrintTraitBars',
  'PrintPersonaCard',
  'PrintPersonaGrid',
  'PrintTable',
  'PrintSteps',
  // Site Kit (specs/domain/site-kit.md) — layout drop targets for nested atoms
  'SiteContainer',
  'SiteStack',
  'SiteGrid',
  'SiteTable',
  'SiteTableRow',
  'SiteTableCell',
] as const

export function isSceneContainerType(type: string): boolean {
  return (SCENE_CONTAINER_TYPES as readonly string[]).includes(type)
}

export function isPrintPaletteType(type: string): boolean {
  return (EDITOR_PALETTE_GROUP_TYPES.print as readonly string[]).includes(type)
}

/** Palette click/drag: wrap print types in PrintPage when the parent is not already on a page. */
export function paletteChildForInsert(
  root: SceneNode,
  parentId: SceneNodeId,
  type: string,
): { child: SceneNode; selectId: string } {
  const inner = defaultChildForType(type)
  if (type === 'PrintPage' || !isPrintPaletteType(type)) {
    return { child: inner, selectId: inner.id }
  }
  if (hasAncestorType(root, parentId, 'PrintPage')) {
    return { child: inner, selectId: inner.id }
  }
  const page = defaultChildForType('PrintPage')
  const chrome = (page.children ?? []).filter((child) => slotOf(child) !== 'body')
  page.children = [...chrome, inner]
  return { child: page, selectId: inner.id }
}

export type PaletteDropEdge = 'before' | 'after' | 'into'

export type InsertPlan =
  | { ok: true; parentId: SceneNodeId; index: number }
  | { ok: false; reason: string }

export function dropEdgeFromPoint(
  isContainer: boolean,
  clientY: number,
  top: number,
  height: number,
  clientX?: number,
  left?: number,
  width?: number,
  direction?: string,
): PaletteDropEdge {
  if (
    direction === 'row' &&
    clientX !== undefined &&
    left !== undefined &&
    width !== undefined &&
    width > 0
  ) {
    const relX = (clientX - left) / width
    if (isContainer) {
      if (relX < 0.25) return 'before'
      if (relX > 0.75) return 'after'
      return 'into'
    }
    return relX < 0.5 ? 'before' : 'after'
  }
  if (height <= 0) return isContainer ? 'into' : 'after'
  const rel = (clientY - top) / height
  if (isContainer) {
    if (rel < 0.25) return 'before'
    if (rel > 0.75) return 'after'
    return 'into'
  }
  return rel < 0.5 ? 'before' : 'after'
}

export function planPaletteDrop(
  scene: CompositionScene,
  targetId: SceneNodeId,
  edge: PaletteDropEdge,
  root: SceneNode = scene.root,
): InsertPlan {
  const target = findNode(root, targetId)
  if (!target) return { ok: false, reason: `Unknown node: ${targetId}` }

  if (edge === 'into' || target.id === root.id) {
    if (!isSceneContainerType(target.type)) {
      return { ok: false, reason: 'Drop target does not accept children' }
    }
    if (isNodeOrAncestorLocked(root, target.id)) {
      return { ok: false, reason: `Node is locked: ${target.id}` }
    }
    const index =
      edge === 'before' && target.id === root.id
        ? 0
        : target.children?.length ?? 0
    return { ok: true, parentId: target.id, index }
  }

  const located = findParent(root, target.id)
  if (!located) return { ok: false, reason: `Unknown node: ${targetId}` }
  if (isNodeOrAncestorLocked(root, located.parent.id)) {
    return { ok: false, reason: `Node is locked: ${located.parent.id}` }
  }
  return {
    ok: true,
    parentId: located.parent.id,
    index: edge === 'before' ? located.index : located.index + 1,
  }
}

export type LayerDropPosition = 'before' | 'after' | 'into'

/** Plan reparent/reorder for LayersPanel DnD (live node move). */
export function planLayerDrop(
  scene: CompositionScene,
  draggedId: SceneNodeId,
  targetId: SceneNodeId,
  position: LayerDropPosition,
  root: SceneNode = scene.root,
): InsertPlan {
  if (!draggedId || draggedId === targetId) {
    return { ok: false, reason: 'Cannot drop on self' }
  }
  if (draggedId === root.id) {
    return { ok: false, reason: 'Cannot move root node' }
  }
  const dragged = findNode(root, draggedId)
  if (!dragged) return { ok: false, reason: `Unknown node: ${draggedId}` }
  if (isNodeOrAncestorLocked(root, draggedId)) {
    return { ok: false, reason: `Node is locked: ${draggedId}` }
  }

  const edge: PaletteDropEdge =
    position === 'into' ? 'into' : position === 'before' ? 'before' : 'after'
  const planned = planPaletteDrop(scene, targetId, edge, root)
  if (!planned.ok) return planned

  // Cycle: destination parent must not live under the dragged subtree.
  if (findNode(dragged, planned.parentId)) {
    return { ok: false, reason: 'Cannot move into own descendant' }
  }

  return planned
}

/** Plan cross-page layer DnD (Layers panel → Pages list or another page frame). */
export function planCrossPageLayerDrop(
  scene: CompositionScene,
  draggedId: SceneNodeId,
  toPageId: string,
  targetId?: SceneNodeId,
  position: LayerDropPosition = 'into',
): InsertPlan {
  if (!draggedId) return { ok: false, reason: 'Missing node id' }
  const working = materializeScenePages(scene)
  const fromPageId = findPageIdForNode(working, draggedId)
  if (!fromPageId) return { ok: false, reason: `Unknown node: ${draggedId}` }

  const toPage = working.pages?.find((p) => p.id === toPageId)
  if (!toPage) return { ok: false, reason: `Unknown page: ${toPageId}` }

  const fromPage = working.pages?.find((p) => p.id === fromPageId)
  if (!fromPage) return { ok: false, reason: `Unknown source page: ${fromPageId}` }

  if (draggedId === toPage.root.id || draggedId === fromPage.root.id) {
    return { ok: false, reason: 'Cannot move page root' }
  }

  if (isNodeOrAncestorLocked(fromPage.root, draggedId)) {
    return { ok: false, reason: `Node is locked: ${draggedId}` }
  }

  if (fromPageId === toPageId && targetId) {
    return planLayerDrop(working, draggedId, targetId, position, toPage.root)
  }

  if (!targetId || targetId === toPage.root.id) {
    const childrenLen = toPage.root.children?.length ?? 0
    return { ok: true, parentId: toPage.root.id, index: childrenLen }
  }

  const edge: PaletteDropEdge =
    position === 'into' ? 'into' : position === 'before' ? 'before' : 'after'
  const planned = planPaletteDrop({ ...working, root: toPage.root }, targetId, edge, toPage.root)
  if (!planned.ok) return planned

  const dragged = findNode(fromPage.root, draggedId)
  if (dragged && findNode(dragged, planned.parentId)) {
    return { ok: false, reason: 'Cannot move into own descendant' }
  }

  if (isNodeOrAncestorLocked(toPage.root, planned.parentId)) {
    return { ok: false, reason: `Node is locked: ${planned.parentId}` }
  }

  return planned
}

/** Node ids to move together when dragging one member of a multi-selection. */
export function crossPageLayerMoveIds(
  scene: CompositionScene,
  draggedId: SceneNodeId,
  selectedIds: SceneNodeId[],
): SceneNodeId[] {
  const working = materializeScenePages(scene)
  const candidates =
    selectedIds.includes(draggedId) && selectedIds.length > 1 ? selectedIds : [draggedId]
  const movable: SceneNodeId[] = []
  for (const id of candidates) {
    if (!id) continue
    const pageId = findPageIdForNode(working, id)
    if (!pageId) continue
    const page = working.pages?.find((p) => p.id === pageId)
    if (!page || id === page.root.id) continue
    if (isNodeOrAncestorLocked(page.root, id)) continue
    if (rejectIfBoardChrome(id) !== null) continue
    movable.push(id)
  }
  return movable.filter((id) => {
    const page = working.pages?.find((p) => findNode(p.root, id))
    if (!page) return false
    for (const other of movable) {
      if (other === id) continue
      const otherNode = findNode(page.root, other)
      if (otherNode && findNode(otherNode, id)) return false
    }
    return true
  })
}

