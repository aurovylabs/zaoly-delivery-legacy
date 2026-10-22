import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'

/** Subset of SceneNodeView props used by memo equality (WS-2 / P100). */
export type SceneNodeViewMemoProps = {
  node: SceneNode
  selected: boolean
  /** Ghost outline on inactive breakpoint-compare tiles (Wave B). */
  compareGhost?: boolean
  peerHaloColor?: string | null
  peerHaloName?: string | null
  activeBreakpoint?: SceneBreakpointId
  boardFrameDraggingPageId?: string | null
  boardFrameDragBlocked?: boolean
  enableCanvasNodeDrag?: boolean
  insidePrintPage?: boolean
  listPaint?: unknown
}

/**
 * Memo compare for recursive SceneNodeView body.
 * Selection is per-node boolean — no selectedIds reference drill (P100).
 */
export function sceneNodeViewPropsAreEqual(
  prev: SceneNodeViewMemoProps,
  next: SceneNodeViewMemoProps,
): boolean {
  if (prev.node !== next.node) return false
  if (prev.selected !== next.selected) return false
  if (Boolean(prev.compareGhost) !== Boolean(next.compareGhost)) return false
  if (prev.peerHaloColor !== next.peerHaloColor) return false
  if (prev.peerHaloName !== next.peerHaloName) return false
  if (prev.activeBreakpoint !== next.activeBreakpoint) return false
  if (prev.boardFrameDraggingPageId !== next.boardFrameDraggingPageId) return false
  if (prev.boardFrameDragBlocked !== next.boardFrameDragBlocked) return false
  if (prev.enableCanvasNodeDrag !== next.enableCanvasNodeDrag) return false
  if (prev.insidePrintPage !== next.insidePrintPage) return false
  if (prev.listPaint !== next.listPaint) return false
  return true
}
