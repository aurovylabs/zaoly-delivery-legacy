'use client'

/**
 * Board navigation: fit viewport + active page cycle (W5l).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useRef, type Dispatch, type SetStateAction } from 'react'
import type { CompositionScene, PrintPresetId, SceneOp } from '@zaoly/contracts'
import {
  fitCanvasToBounds,
  clampCanvasZoom,
} from '../../lib/editor/canvas-navigation'
import {
  artboardCssSize,
  type EditorBreakpoint,
} from '../../lib/scene/breakpoints'
import {
  boardPagesForScene,
  computeAllPageFramesBounds,
  computePageFrameBounds,
  cycleActivePageId,
} from '../../lib/scene/scene-board'
import {
  resolveActivePage,
  resolveActivePageId,
} from '../../lib/scene/scene-pages'
import { replaceSelection } from '../../lib/scene/selection'
import type { EditorMutateResult } from './use-editor-mutations'

export function useEditorBoardNav(args: {
  scene: CompositionScene
  sceneRef: { current: CompositionScene }
  viewportRef: { current: HTMLDivElement | null }
  sceneBoardMode: boolean
  /** Breakpoint Compare or Master Breakpoints matrix — wide board surface. */
  breakpointBoardMode: boolean
  /** Live board world size (compare / matrix / scene board). */
  boardCanvasSize: { width: number; height: number }
  editingMasterId: string | null
  activeBreakpoint: EditorBreakpoint
  activePrintPreset: PrintPresetId
  artboardHeight: number
  artboardWidth: number
  viewportArtboardHeight: number
  commitViewportImmediate: (next: { zoom: number; panX: number; panY: number }) => void
  applyMutatingOp: (current: CompositionScene, op: SceneOp) => EditorMutateResult
  rejectMutation: (reason: string) => void
  pushPresent: (next: CompositionScene, ops?: SceneOp[]) => void
  enqueuePendingOp: (op: SceneOp) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setError: (message: string | null) => void
}) {
  const {
    scene,
    sceneRef,
    viewportRef,
    sceneBoardMode,
    breakpointBoardMode,
    boardCanvasSize,
    editingMasterId,
    activeBreakpoint,
    activePrintPreset,
    artboardHeight,
    artboardWidth,
    viewportArtboardHeight,
    commitViewportImmediate,
    applyMutatingOp,
    rejectMutation,
    pushPresent,
    enqueuePendingOp,
    setSelectedIds,
    setError,
  } = args

  const fitToViewRef = useRef<() => void>(() => {})
  const fitAllFramesRef = useRef<() => void>(() => {})

  function fitToBoardCanvas() {
    const viewport = viewportRef.current
    if (!viewport) return
    const next = fitCanvasToBounds({
      viewportWidth: viewport.clientWidth,
      viewportHeight: viewport.clientHeight,
      bounds: {
        x: 0,
        y: 0,
        width: Math.max(1, boardCanvasSize.width),
        height: Math.max(1, boardCanvasSize.height),
      },
      padding: 64,
    })
    commitViewportImmediate(next)
  }

  function fitToActiveFrame() {
    const viewport = viewportRef.current
    if (!viewport) return
    if (breakpointBoardMode) {
      fitToBoardCanvas()
      return
    }
    const pad = 64
    const size = artboardCssSize(activeBreakpoint, activePrintPreset)
    const paintHeight = size.height ?? artboardHeight
    if (sceneBoardMode && boardPagesForScene(scene).length > 0) {
      const page = resolveActivePage(scene)
      if (!page) return
      const bounds = computePageFrameBounds(page, size.width, paintHeight)
      const next = fitCanvasToBounds({
        viewportWidth: viewport.clientWidth,
        viewportHeight: viewport.clientHeight,
        bounds,
        padding: pad,
      })
      commitViewportImmediate(next)
      return
    }
    const vw = Math.max(120, viewport.clientWidth - pad)
    const vh = Math.max(120, viewport.clientHeight - pad)
    const next = clampCanvasZoom(Math.min(vw / artboardWidth, vh / viewportArtboardHeight))
    commitViewportImmediate({ zoom: Number(next.toFixed(2)), panX: 0, panY: 0 })
  }

  function fitToAllFrames() {
    const viewport = viewportRef.current
    if (!viewport) return
    if (breakpointBoardMode) {
      fitToBoardCanvas()
      return
    }
    const pad = 64
    const size = artboardCssSize(activeBreakpoint, activePrintPreset)
    const paintHeight = size.height ?? artboardHeight
    if (sceneBoardMode && boardPagesForScene(scene).length > 1) {
      const bounds = computeAllPageFramesBounds(scene, size.width, paintHeight)
      const next = fitCanvasToBounds({
        viewportWidth: viewport.clientWidth,
        viewportHeight: viewport.clientHeight,
        bounds,
        padding: pad,
      })
      commitViewportImmediate(next)
      return
    }
    fitToActiveFrame()
  }

  fitToViewRef.current = fitToActiveFrame
  fitAllFramesRef.current = fitToAllFrames

  function activateBoardPage(pageId: string) {
    const op = { op: 'set_active_page' as const, pageId }
    const result = applyMutatingOp(sceneRef.current, op)
    if (!result.ok) {
      rejectMutation(result.reason)
      return
    }
    setError(null)
    pushPresent(result.scene, [op])
    enqueuePendingOp(op)
    const page = result.scene.pages?.find((p) => p.id === pageId)
    setSelectedIds(replaceSelection(page?.root.id ?? result.scene.root.id))
    requestAnimationFrame(() => fitToViewRef.current())
  }

  function cycleActivePage(direction: 1 | -1) {
    if (!sceneBoardMode || editingMasterId) return
    const pages = boardPagesForScene(sceneRef.current)
    if (pages.length < 2) return
    const activeId = resolveActivePageId(
      pages,
      sceneRef.current.activePageId,
    )
    const nextId = cycleActivePageId(pages, activeId, direction)
    if (!nextId || nextId === activeId) return
    activateBoardPage(nextId)
  }

  return {
    fitToViewRef,
    fitAllFramesRef,
    fitToActiveFrame,
    fitToAllFrames,
    activateBoardPage,
    cycleActivePage,
  }
}
