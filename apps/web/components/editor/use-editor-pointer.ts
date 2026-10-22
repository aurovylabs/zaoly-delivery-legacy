'use client'

/**
 * Canvas pointer interactions: pan, marquee, resize handles, page-frame drag (W5k).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useState, type Dispatch, type PointerEvent as ReactPointerEvent, type SetStateAction } from 'react'
import type { CompositionScene, PrintPresetId, SceneNode, SceneOp } from '@zaoly/contracts'
import {
  artboardCssSize,
  type EditorBreakpoint,
} from '../../lib/scene/breakpoints'
import {
  boardPagesForScene,
  clearBoardFrameDragPreviewDom,
  snapPageFramePosition,
  syncBoardFrameDragPreviewDom,
} from '../../lib/scene/scene-board'
import { applyResizeDelta, planResizeOps, type ResizeHandle } from '../../lib/scene/resize'
import { replaceSelection, selectIdsInMarquee, type Bounds } from '../../lib/scene/selection'
import {
  measureNodeBounds,
  type FrameDragSession,
  type MarqueeSession,
  type ResizeSession,
} from './editor-boot'
import type { SelectionBoundsSnapshot } from '../../lib/editor/selection-bounds-viewport'

export function useEditorPointer(args: {
  sceneRef: { current: CompositionScene }
  viewportRef: { current: HTMLDivElement | null }
  inspectRootRef: { current: SceneNode }
  zoomPanRef: { current: { zoom: number; panX: number; panY: number } }
  panOrigin: { current: { x: number; y: number; panX: number; panY: number } | null }
  resizeSession: { current: ResizeSession | null }
  marqueeSession: { current: MarqueeSession | null }
  frameDragSession: { current: FrameDragSession | null }
  zoom: number
  spaceDown: boolean
  activeBreakpoint: EditorBreakpoint
  activePrintPreset: PrintPresetId
  artboardHeight: number
  selected: SceneNode | null | undefined
  selectedIds: string[]
  selectionBounds: Bounds | null
  primaryLocked: boolean
  runOp: (op: SceneOp) => void
  runOps: (ops: SceneOp[]) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setPanning: (value: boolean) => void
  setMarquee: (value: Bounds | null) => void
  setSelectionBoundsSnapshot: Dispatch<SetStateAction<SelectionBoundsSnapshot | null>>
  commitViewport: (next: { panX: number; panY: number }) => void
  refreshSelectionBounds: () => void
}) {
  const {
    sceneRef,
    viewportRef,
    inspectRootRef,
    zoomPanRef,
    panOrigin,
    resizeSession,
    marqueeSession,
    frameDragSession,
    zoom,
    spaceDown,
    activeBreakpoint,
    activePrintPreset,
    artboardHeight,
    selected,
    selectedIds,
    selectionBounds,
    primaryLocked,
    runOp,
    runOps,
    setSelectedIds,
    setPanning,
    setMarquee,
    setSelectionBoundsSnapshot,
    commitViewport,
    refreshSelectionBounds,
  } = args

  const [frameDraggingPageId, setFrameDraggingPageId] = useState<string | null>(null)

  function boardFramePaintMetrics() {
    const size = artboardCssSize(activeBreakpoint, activePrintPreset)
    return {
      width: size.width,
      height: size.height ?? artboardHeight,
      pages: boardPagesForScene(sceneRef.current),
    }
  }

  function beginPan(clientX: number, clientY: number) {
    const z = zoomPanRef.current
    panOrigin.current = { x: clientX, y: clientY, panX: z.panX, panY: z.panY }
    setPanning(true)
  }

  function beginFrameDrag(pageId: string, event: ReactPointerEvent<HTMLElement>) {
    const page = sceneRef.current.pages?.find((p) => p.id === pageId)
    const frame = page?.frame ?? { x: 0, y: 0 }
    frameDragSession.current = {
      pageId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: frame.x,
      originY: frame.y,
    }
    setFrameDraggingPageId(pageId)
    event.preventDefault()
    event.stopPropagation()
    viewportRef.current?.setPointerCapture(event.pointerId)
  }

  function endFrameDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const session = frameDragSession.current
    if (!session || session.pointerId !== event.pointerId) return
    frameDragSession.current = null
    setFrameDraggingPageId(null)
    clearBoardFrameDragPreviewDom(viewportRef.current, session.pageId)
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    const dx = (event.clientX - session.startClientX) / zoomPanRef.current.zoom
    const dy = (event.clientY - session.startClientY) / zoomPanRef.current.zoom
    const rawX = session.originX + dx
    const rawY = session.originY + dy
    const { width, height, pages } = boardFramePaintMetrics()
    const snapped = snapPageFramePosition(
      session.pageId,
      rawX,
      rawY,
      pages,
      width,
      height,
    )
    const nextX = snapped.x
    const nextY = snapped.y
    if (nextX === session.originX && nextY === session.originY) return
    runOp({
      op: 'move_page_frame',
      pageId: session.pageId,
      x: nextX,
      y: nextY,
    })
    requestAnimationFrame(() => refreshSelectionBounds())
  }

  function onCanvasPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (resizeSession.current || frameDragSession.current) return
    const middle = e.button === 1
    if (middle || (e.button === 0 && spaceDown)) {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      beginPan(e.clientX, e.clientY)
      return
    }
    // Marquee on empty artboard (button 0, not on a node).
    if (e.button !== 0 || spaceDown) return
    const target = e.target
    if (!(target instanceof HTMLElement)) return
    if (target.closest('[data-node-id]')) return
    if (target.closest('[data-testid="selection-handles"]')) return
    const viewport = viewportRef.current
    if (!viewport) return
    const vr = viewport.getBoundingClientRect()
    const x = e.clientX - vr.left
    const y = e.clientY - vr.top
    marqueeSession.current = {
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      pointerId: e.pointerId,
    }
    setMarquee({ left: x, top: y, width: 0, height: 0 })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onCanvasPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (resizeSession.current) return
    if (frameDragSession.current) {
      const session = frameDragSession.current
      const dx = (e.clientX - session.startClientX) / zoomPanRef.current.zoom
      const dy = (e.clientY - session.startClientY) / zoomPanRef.current.zoom
      const { width, height, pages } = boardFramePaintMetrics()
      const snapped = snapPageFramePosition(
        session.pageId,
        session.originX + dx,
        session.originY + dy,
        pages,
        width,
        height,
      )
      syncBoardFrameDragPreviewDom(
        viewportRef.current,
        session.pageId,
        snapped.x,
        snapped.y,
      )
      return
    }
    if (panOrigin.current) {
      const dx = e.clientX - panOrigin.current.x
      const dy = e.clientY - panOrigin.current.y
      commitViewport({
        panX: panOrigin.current.panX + dx,
        panY: panOrigin.current.panY + dy,
      })
      return
    }
    const session = marqueeSession.current
    if (!session || session.pointerId !== e.pointerId) return
    const viewport = viewportRef.current
    if (!viewport) return
    const vr = viewport.getBoundingClientRect()
    session.currentX = e.clientX - vr.left
    session.currentY = e.clientY - vr.top
    const left = Math.min(session.startX, session.currentX)
    const top = Math.min(session.startY, session.currentY)
    setMarquee({
      left,
      top,
      width: Math.abs(session.currentX - session.startX),
      height: Math.abs(session.currentY - session.startY),
    })
  }

  function endResize() {
    const session = resizeSession.current
    const node = selected
    if (!session || !node || primaryLocked) {
      resizeSession.current = null
      return
    }
    const primary =
      sceneRef.current.primaryBreakpoint === 'tablet' ||
      sceneRef.current.primaryBreakpoint === 'mobile' ||
      sceneRef.current.primaryBreakpoint === 'desktop'
        ? sceneRef.current.primaryBreakpoint
        : 'desktop'
    const ops = planResizeOps(
      node,
      { width: Math.round(session.currentW), height: Math.round(session.currentH) },
      { width: session.layoutW, height: session.layoutH },
      activeBreakpoint,
      primary,
    )
    resizeSession.current = null
    runOps(ops)
    requestAnimationFrame(() => refreshSelectionBounds())
  }

  function endPan(e: ReactPointerEvent<HTMLDivElement>) {
    if (resizeSession.current) return
    if (frameDragSession.current) {
      endFrameDrag(e)
      return
    }
    if (marqueeSession.current && marqueeSession.current.pointerId === e.pointerId) {
      const session = marqueeSession.current
      const box: Bounds = {
        left: Math.min(session.startX, session.currentX),
        top: Math.min(session.startY, session.currentY),
        width: Math.abs(session.currentX - session.startX),
        height: Math.abs(session.currentY - session.startY),
      }
      marqueeSession.current = null
      setMarquee(null)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      if (box.width < 3 && box.height < 3) {
        setSelectedIds(replaceSelection(inspectRootRef.current.id))
        return
      }
      const viewport = viewportRef.current
      if (!viewport) return
      const hits = selectIdsInMarquee(
        sceneRef.current,
        box,
        (id) => measureNodeBounds(viewport, id),
        inspectRootRef.current,
      )
      setSelectedIds(hits.length ? hits : replaceSelection(inspectRootRef.current.id))
      return
    }
    if (!panOrigin.current) return
    panOrigin.current = null
    setPanning(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    requestAnimationFrame(() => refreshSelectionBounds())
  }

  function onHandlePointerDown(handle: ResizeHandle, event: ReactPointerEvent<HTMLSpanElement>) {
    if (!selected || !selectionBounds || primaryLocked) return
    if (selectedIds.length !== 1) return
    event.preventDefault()
    event.stopPropagation()
    const layoutW = selectionBounds.width / zoom
    const layoutH = selectionBounds.height / zoom
    const pointerId = event.pointerId
    resizeSession.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      layoutW,
      layoutH,
      currentW: layoutW,
      currentH: layoutH,
      bounds: selectionBounds,
      pointerId,
    }

    function onMove(ev: PointerEvent) {
      const session = resizeSession.current
      if (!session || session.pointerId !== pointerId) return
      const dx = (ev.clientX - session.startX) / zoom
      const dy = (ev.clientY - session.startY) / zoom
      const next = applyResizeDelta(
        { width: session.layoutW, height: session.layoutH },
        session.handle,
        dx,
        dy,
      )
      session.currentW = next.width
      session.currentH = next.height
      const z = zoomPanRef.current
      setSelectionBoundsSnapshot({
        bounds: {
          ...session.bounds,
          width: next.width * z.zoom,
          height: next.height * z.zoom,
        },
        panX: z.panX,
        panY: z.panY,
        zoom: z.zoom,
      })
    }

    function onUp(ev: PointerEvent) {
      if (resizeSession.current?.pointerId !== pointerId) return
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      void ev
      endResize()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return {
    frameDraggingPageId,
    beginFrameDrag,
    onCanvasPointerDown,
    onCanvasPointerMove,
    endPan,
    onHandlePointerDown,
  }
}
