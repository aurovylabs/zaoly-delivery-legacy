'use client'

/**
 * Clipboard + structural selection / layer actions (W5h).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useRef, type Dispatch, type SetStateAction } from 'react'
import type { CompositionScene, SceneNode, SceneOp, WrapContainerType } from '@zaoly/contracts'
import type { LayersPanelReorderDropPosition } from '@zaoly/ui'
import {
  canUnwrapSelection,
  canWrapSelection,
  clipboardNodesFromSelection,
  cloneSceneNodeWithNewIds,
  createSceneNodeId,
  crossPageLayerMoveIds,
  findSceneNode,
  findSceneParent,
  isNodeOrAncestorLocked,
  isSceneContainerType,
  parseEditorClipboard,
  planCrossPageLayerDrop,
  planLayerDrop,
  planPasteInsert,
  serializeEditorClipboard,
  type LayerDropPosition,
} from '../../lib/scene/ops'
import { findNodeInTree, findParentInTree } from '../../lib/scene/expand-instances'
import { findPageIdForNode } from '../../lib/scene/scene-pages'
import { planNudgeOps } from '../../lib/scene/resize'
import { replaceSelection } from '../../lib/scene/selection'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import type { Bounds } from '../../lib/scene/selection'
import {
  planBreakpointAwareInsertVisibility,
  planBreakpointAwareRemove,
  planBreakpointAwareToggleHidden,
  secondaryRemoveIsHideOnly,
  secondaryStructureLockedReason,
} from '../../lib/scene/breakpoint-visibility'

import type { EditorMutateResult } from './use-editor-mutations'

export function useEditorStructure(args: {
  sceneRef: { current: CompositionScene }
  selectedIdsRef: { current: string[] }
  selectedIdRef: { current: string | null }
  selectedRef: { current: SceneNode | null | undefined }
  selectionBoundsRef: { current: Bounds | null }
  zoom: number
  activeBreakpoint: EditorBreakpoint
  workingRoot: (scene: CompositionScene) => SceneNode
  applyMutatingOp: (current: CompositionScene, op: SceneOp) => EditorMutateResult
  runOp: (op: SceneOp) => void
  runOps: (ops: SceneOp[]) => void
  pushPresent: (next: CompositionScene, ops?: SceneOp[]) => void
  enqueuePendingOp: (op: SceneOp) => void
  enqueuePendingOps: (ops: SceneOp[]) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setError: (message: string | null) => void
  pushToast: (toast: { message: string; tone?: 'ok' | 'error'; durationMs?: number }) => void
  rejectMutation: (reason: string) => void
  t: (key: string, vars?: Record<string, string>) => string
}) {
  const {
    sceneRef,
    selectedIdsRef,
    selectedIdRef,
    selectedRef,
    selectionBoundsRef,
    zoom,
    activeBreakpoint,
    workingRoot,
    applyMutatingOp,
    runOp,
    runOps,
    pushPresent,
    enqueuePendingOp,
    enqueuePendingOps,
    setSelectedIds,
    setError,
    pushToast,
    rejectMutation,
    t,
  } = args

  const clipboardRef = useRef<SceneNode[]>([])

  function breakpointLabel(): string {
    if (activeBreakpoint === 'tablet') return t('editor.breakpoint.tablet')
    if (activeBreakpoint === 'mobile') return t('editor.breakpoint.mobile')
    if (activeBreakpoint === 'print') return t('editor.breakpoint.print')
    return t('editor.breakpoint.desktop')
  }

  /** Wave F — refuse tree topology edits on tablet/mobile. */
  function scenePrimary() {
    const p = sceneRef.current.primaryBreakpoint
    return p === 'tablet' || p === 'mobile' || p === 'desktop' ? p : 'desktop'
  }

  function rejectIfSecondaryStructure(): boolean {
    if (!secondaryStructureLockedReason(activeBreakpoint, scenePrimary())) return false
    const message = t('editor.secondaryStructureLocked')
    setError(message)
    pushToast({ message, tone: 'error', durationMs: 3500 })
    return true
  }

  function removeSelectedNodes(): void {
    const current = sceneRef.current
    const root = workingRoot(current)
    const ids = selectedIdsRef.current.filter(
      (id) => id !== root.id && !isNodeOrAncestorLocked(root, id),
    )
    if (!ids.length) return
    let next = current
    let lastParentId: string | null = null
    const ops: SceneOp[] = []
    for (const id of ids) {
      const parent = findParentInTree(workingRoot(next), id)
      if (parent) lastParentId = parent.parent.id
      const node = findNodeInTree(workingRoot(next), id)
      if (!node) continue
      const planned = planBreakpointAwareRemove(node, activeBreakpoint, scenePrimary())
      for (const op of planned) {
        const result = applyMutatingOp(next, op)
        if (!result.ok) {
          rejectMutation(result.reason)
          return
        }
        next = result.scene
        ops.push(op)
      }
    }
    setError(null)
    pushPresent(next, ops)
    enqueuePendingOps(ops)
    setSelectedIds(replaceSelection(lastParentId ?? workingRoot(next).id))
    if (secondaryRemoveIsHideOnly(ops)) {
      pushToast({
        message: t('editor.secondaryDeleteHidden', { bp: breakpointLabel() }),
        tone: 'ok',
        durationMs: 2800,
      })
    }
  }

  function duplicateSelectedNodes(): void {
    const current = sceneRef.current
    const root = workingRoot(current)
    const ids = selectedIdsRef.current.filter((id) => id !== root.id)
    if (!ids.length) return
    let next = current
    const newIds: string[] = []
    const ops: SceneOp[] = []
    for (const id of ids) {
      const node = findNodeInTree(workingRoot(next), id)
      const parent = findParentInTree(workingRoot(next), id)
      if (!node || !parent || isNodeOrAncestorLocked(workingRoot(next), parent.parent.id)) continue
      const clone = cloneSceneNodeWithNewIds(node)
      const op = {
        op: 'insert_child' as const,
        parentId: parent.parent.id,
        child: clone,
        index: parent.index + 1,
      }
      const result = applyMutatingOp(next, op)
      if (!result.ok) {
        rejectMutation(result.reason)
        return
      }
      next = result.scene
      newIds.push(clone.id)
      ops.push(op)
      for (const vis of planBreakpointAwareInsertVisibility(
        clone.id,
        activeBreakpoint,
        scenePrimary(),
      )) {
        const visResult = applyMutatingOp(next, vis)
        if (!visResult.ok) {
          rejectMutation(visResult.reason)
          return
        }
        next = visResult.scene
        ops.push(vis)
      }
    }
    if (!newIds.length) return
    setError(null)
    pushPresent(next, ops)
    enqueuePendingOps(ops)
    setSelectedIds(newIds)
  }

  function copySelectedNodes(): boolean {
    const current = sceneRef.current
    const nodes = clipboardNodesFromSelection(current, selectedIdsRef.current, workingRoot(current))
    if (!nodes.length) return false
    clipboardRef.current = nodes
    const payload = serializeEditorClipboard(nodes)
    void navigator.clipboard?.writeText?.(payload).catch(() => undefined)
    return true
  }

  function pasteClipboardNodes(nodes: SceneNode[]): void {
    if (!nodes.length) {
      setError(t('editor.clipboardEmpty'))
      return
    }
    const current = sceneRef.current
    const planned = planPasteInsert(current, selectedIdRef.current, workingRoot(current))
    if (!planned.ok) {
      setError(planned.reason.startsWith('Node is locked:') ? t('editor.lockedHint') : planned.reason)
      return
    }
    let next = current
    let index = planned.index
    const newIds: string[] = []
    const ops: SceneOp[] = []
    for (const node of nodes) {
      const clone = cloneSceneNodeWithNewIds(node)
      const op = {
        op: 'insert_child' as const,
        parentId: planned.parentId,
        child: clone,
        index,
      }
      const result = applyMutatingOp(next, op)
      if (!result.ok) {
        rejectMutation(result.reason)
        return
      }
      next = result.scene
      newIds.push(clone.id)
      ops.push(op)
      for (const vis of planBreakpointAwareInsertVisibility(
        clone.id,
        activeBreakpoint,
        scenePrimary(),
      )) {
        const visResult = applyMutatingOp(next, vis)
        if (!visResult.ok) {
          rejectMutation(visResult.reason)
          return
        }
        next = visResult.scene
        ops.push(vis)
      }
      index += 1
    }
    setError(null)
    pushPresent(next, ops)
    enqueuePendingOps(ops)
    setSelectedIds(newIds)
  }

  function pasteSelectedNodes(): void {
    const memory = clipboardRef.current
    if (memory.length) {
      pasteClipboardNodes(memory)
      return
    }
    void navigator.clipboard?.readText?.()
      .then((raw) => {
        const parsed = parseEditorClipboard(raw)
        if (!parsed) {
          setError(t('editor.clipboardEmpty'))
          return
        }
        clipboardRef.current = parsed
        pasteClipboardNodes(parsed)
      })
      .catch(() => setError(t('editor.clipboardEmpty')))
  }

  function cutSelectedNodes(): void {
    if (!copySelectedNodes()) return
    removeSelectedNodes()
  }

  function wrapSelected(containerType: WrapContainerType): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const root = workingRoot(current)
    const ids = selectedIdsRef.current.filter((id) => id !== root.id)
    if (!canWrapSelection(current, ids, root)) return
    const containerId = createSceneNodeId(containerType.toLowerCase())
    const op = {
      op: 'wrap_nodes' as const,
      nodeIds: ids,
      containerType,
      containerId,
    }
    const result = applyMutatingOp(current, op)
    if (!result.ok) {
      rejectMutation(result.reason)
      return
    }
    setError(null)
    pushPresent(result.scene, [op])
    enqueuePendingOp(op)
    setSelectedIds(replaceSelection(containerId))
  }

  function unwrapSelected(): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const root = workingRoot(current)
    const ids = selectedIdsRef.current
    if (!canUnwrapSelection(current, ids, root)) return
    const id = ids[0]
    const node = findSceneNode(current, id, root)
    const parent = findSceneParent(current, id, root)
    const childIds = node?.children?.map((child) => child.id) ?? []
    const op = { op: 'unwrap_node' as const, nodeId: id }
    const result = applyMutatingOp(current, op)
    if (!result.ok) {
      rejectMutation(result.reason)
      return
    }
    setError(null)
    pushPresent(result.scene, [op])
    enqueuePendingOp(op)
    setSelectedIds(
      childIds.length ? childIds : replaceSelection(parent?.parent.id ?? root.id),
    )
  }

  function nudgeSelected(axis: 'width' | 'height', direction: 1 | -1): void {
    const node = selectedRef.current
    const current = sceneRef.current
    const root = workingRoot(current)
    if (!node || node.id === root.id) return
    if (isNodeOrAncestorLocked(root, node.id)) return
    const bounds = selectionBoundsRef.current
    const measured =
      axis === 'width'
        ? bounds
          ? bounds.width / zoom
          : 120
        : bounds
          ? bounds.height / zoom
          : 40
    const ops = planNudgeOps(
      node,
      axis,
      direction,
      measured,
      activeBreakpoint,
      scenePrimary(),
    )
    runOps(ops)
  }

  function moveLayer(id: string, delta: -1 | 1): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const root = workingRoot(current)
    if (isNodeOrAncestorLocked(root, id)) return
    const parent = findSceneParent(current, id, root)
    if (!parent) return
    const nextIndex = parent.index + delta
    if (nextIndex < 0 || nextIndex >= (parent.parent.children?.length ?? 0)) return
    runOp({ op: 'reorder_node', nodeId: id, index: nextIndex })
  }

  function onReorderDrop(
    id: string,
    targetId: string,
    position: LayersPanelReorderDropPosition,
  ): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const root = workingRoot(current)
    const target = findSceneNode(current, targetId, root)
    // Empty nest targets: treat any drop as into (matches LayersPanel empty-row UX).
    let edge = position
    if (
      target &&
      isSceneContainerType(target.type) &&
      !(target.children?.length) &&
      id !== targetId
    ) {
      edge = 'into'
    }
    const planned = planLayerDrop(current, id, targetId, edge, root)
    if (!planned.ok) {
      setError(planned.reason)
      return
    }
    const located = findSceneParent(current, id, root)
    if (
      located &&
      located.parent.id === planned.parentId &&
      located.index === planned.index
    ) {
      return
    }
    runOp({
      op: 'move_node',
      nodeId: id,
      parentId: planned.parentId,
      index: planned.index,
    })
  }

  function onCrossPageLayerDrop(
    draggedId: string,
    toPageId: string,
    targetId?: string,
    position: LayerDropPosition = 'into',
  ): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const moveIds = crossPageLayerMoveIds(current, draggedId, selectedIdsRef.current)
    if (!moveIds.length) return

    const planned = planCrossPageLayerDrop(current, draggedId, toPageId, targetId, position)
    if (!planned.ok) {
      setError(planned.reason)
      return
    }

    let next = current
    const movedIds: string[] = []
    let insertIndex = planned.index
    const ops: SceneOp[] = []

    for (const id of moveIds) {
      const fromPageId = findPageIdForNode(next, id)
      const plan =
        id === draggedId
          ? planned
          : planCrossPageLayerDrop(next, id, toPageId, planned.parentId, 'into')
      if (!plan.ok) {
        rejectMutation(plan.reason)
        return
      }
      const index = id === draggedId ? plan.index : insertIndex
      if (fromPageId === toPageId) {
        const op = {
          op: 'move_node' as const,
          nodeId: id,
          parentId: plan.parentId,
          index,
        }
        const result = applyMutatingOp(next, op)
        if (!result.ok) {
          rejectMutation(result.reason)
          return
        }
        next = result.scene
        ops.push(op)
      } else {
        const op = {
          op: 'move_node_to_page' as const,
          nodeId: id,
          toPageId,
          parentId: plan.parentId,
          index,
        }
        const result = applyMutatingOp(next, op)
        if (!result.ok) {
          rejectMutation(result.reason)
          return
        }
        next = result.scene
        ops.push(op)
      }
      movedIds.push(id)
      insertIndex = index + 1
    }

    setError(null)
    pushPresent(next, ops)
    enqueuePendingOps(ops)
    setSelectedIds(movedIds)
  }

  /** Nest primary selection into the previous sibling when that sibling is a container. */
  function nestSelectedIntoPreviousContainer(): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const root = workingRoot(current)
    const id = selectedIdsRef.current[selectedIdsRef.current.length - 1]
    if (!id || id === root.id) return
    if (isNodeOrAncestorLocked(root, id)) {
      setError(`Node is locked: ${id}`)
      return
    }
    const located = findSceneParent(current, id, root)
    if (!located || located.index <= 0) {
      setError('No previous container sibling to nest into')
      return
    }
    const prev = located.parent.children?.[located.index - 1]
    if (!prev || !isSceneContainerType(prev.type)) {
      setError('Previous layer is not a container (Stack / SiteContainer / …)')
      return
    }
    runOp({
      op: 'move_node',
      nodeId: id,
      parentId: prev.id,
      index: prev.children?.length ?? 0,
    })
  }

  /** Move primary selection out of its container (after the container among grandparent siblings). */
  function unnestSelected(): void {
    if (rejectIfSecondaryStructure()) return
    const current = sceneRef.current
    const root = workingRoot(current)
    const id = selectedIdsRef.current[selectedIdsRef.current.length - 1]
    if (!id || id === root.id) return
    const located = findSceneParent(current, id, root)
    if (!located) return
    const grand = findSceneParent(current, located.parent.id, root)
    if (!grand) {
      setError('Cannot unnest from root')
      return
    }
    runOp({
      op: 'move_node',
      nodeId: id,
      parentId: grand.parent.id,
      index: grand.index + 1,
    })
  }

  function toggleHidden(id: string): void {
    const current = sceneRef.current
    const node = findSceneNode(current, id, workingRoot(current))
    if (!node) return
    runOp(planBreakpointAwareToggleHidden(node, activeBreakpoint, scenePrimary()))
  }

  function toggleLocked(id: string): void {
    const current = sceneRef.current
    const node = findSceneNode(current, id, workingRoot(current))
    if (!node) return
    runOp({ op: 'set_flags', nodeId: id, locked: !node.locked })
  }

  return {
    clipboardRef,
    removeSelectedNodes,
    duplicateSelectedNodes,
    copySelectedNodes,
    pasteSelectedNodes,
    cutSelectedNodes,
    wrapSelected,
    unwrapSelected,
    nudgeSelected,
    moveLayer,
    onReorderDrop,
    onCrossPageLayerDrop,
    nestSelectedIntoPreviousContainer,
    unnestSelected,
    toggleHidden,
    toggleLocked,
  }
}
