'use client'

/**
 * Pan/zoom artboard host for Client Page Share preview (P7).
 * Spec: specs/domain/client-page-share.md · knowledge/client-page-share-p7-preview-canvas.md
 *
 * Preview is view-only: left-drag always pans (iframe does not steal pointers).
 * Comment pin mode overlays the artboard; Hand mode is the default camera.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasViewport } from '../../lib/zaoly-ui'
import {
  applyCanvasWheelGesture,
  CANVAS_ZOOM_STEP,
  clampCanvasZoom,
  fitCanvasToBounds,
  resolveCanvasWheelAnchor,
  zoomCanvasAboutPoint,
} from '../../lib/editor/canvas-navigation'
import {
  ClientShareGuestPins,
  isClientSharePinChromeTarget,
  type ShareGuestPinComment,
} from './client-share-guest-pins'

export type SharePreviewPageSize = {
  width: number
  height: number
}

type Props = {
  htmlSrc: string
  pageTitle: string
  artboard: SharePreviewPageSize
  comments: ShareGuestPinComment[]
  authorName: string
  onAuthorNameChange: (name: string) => void
  onPlaceComment: (input: { pinX: number; pinY: number; body: string }) => void
  zoomControlsRef?: React.MutableRefObject<SharePreviewZoomControls | null>
  onViewportChange?: (state: { zoom: number; pinMode: boolean }) => void
  /** Controlled pin mode from trail chrome (optional). */
  pinMode?: boolean
  onPinModeChange?: (next: boolean) => void
  /** Refresh comments when a pin opens (designer replies). */
  onPinOpen?: (commentId: string) => void
}

export type SharePreviewZoomControls = {
  zoom: number
  pinMode: boolean
  zoomIn: () => void
  zoomOut: () => void
  fit: () => void
  setZoom: (z: number) => void
  setPinMode: (next: boolean) => void
  togglePinMode: () => void
}

export function ClientSharePreviewStage({
  htmlSrc,
  pageTitle,
  artboard,
  comments,
  authorName,
  onAuthorNameChange,
  onPlaceComment,
  zoomControlsRef,
  onViewportChange,
  pinMode: pinModeProp,
  onPinModeChange,
  onPinOpen,
}: Props) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState(0.5)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [pinModeLocal, setPinModeLocal] = useState(false)
  const [dragging, setDragging] = useState(false)
  const pinMode = pinModeProp ?? pinModeLocal
  const setPinMode = useCallback(
    (next: boolean) => {
      onPinModeChange?.(next)
      if (pinModeProp === undefined) setPinModeLocal(next)
    },
    [onPinModeChange, pinModeProp],
  )

  const dragRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const cameraRef = useRef({ zoom: 0.5, panX: 0, panY: 0 })
  cameraRef.current = { zoom, panX, panY }
  const fittedForSrc = useRef<string | null>(null)

  const fit = useCallback(() => {
    const el = shellRef.current
    if (!el) return
    const vw = el.clientWidth
    const vh = el.clientHeight
    if (vw < 40 || vh < 40) return
    const next = fitCanvasToBounds({
      viewportWidth: vw,
      viewportHeight: vh,
      bounds: { x: 0, y: 0, width: artboard.width, height: artboard.height },
      padding: 72,
    })
    setZoom(next.zoom)
    setPanX(next.panX)
    setPanY(next.panY)
  }, [artboard.height, artboard.width])

  useEffect(() => {
    // Fit once per page html; ResizeObserver only re-fits if never fitted yet
    // or shell was near-zero (first paint).
    const el = shellRef.current
    const run = () => {
      if (fittedForSrc.current !== htmlSrc) {
        fit()
        if (shellRef.current && shellRef.current.clientWidth > 40) {
          fittedForSrc.current = htmlSrc
        }
      }
    }
    run()
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      if (fittedForSrc.current !== htmlSrc) run()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [fit, htmlSrc])

  const zoomAboutCenter = useCallback((nextZoom: number) => {
    const el = shellRef.current
    const cam = cameraRef.current
    const anchorX = el ? el.clientWidth / 2 : 400
    const anchorY = el ? el.clientHeight / 2 : 300
    const next = zoomCanvasAboutPoint({
      zoom: cam.zoom,
      panX: cam.panX,
      panY: cam.panY,
      nextZoom,
      anchorX,
      anchorY,
    })
    setZoom(next.zoom)
    setPanX(next.panX)
    setPanY(next.panY)
  }, [])

  useEffect(() => {
    onViewportChange?.({ zoom, pinMode })
  }, [onViewportChange, pinMode, zoom])

  useEffect(() => {
    if (!zoomControlsRef) return
    zoomControlsRef.current = {
      zoom,
      pinMode,
      zoomIn: () => zoomAboutCenter(cameraRef.current.zoom * CANVAS_ZOOM_STEP),
      zoomOut: () => zoomAboutCenter(cameraRef.current.zoom / CANVAS_ZOOM_STEP),
      fit: () => {
        fittedForSrc.current = null
        fit()
        fittedForSrc.current = htmlSrc
      },
      setZoom: (z) => zoomAboutCenter(clampCanvasZoom(z)),
      setPinMode,
      togglePinMode: () => setPinMode(!pinMode),
    }
  }, [fit, htmlSrc, pinMode, setPinMode, zoom, zoomAboutCenter, zoomControlsRef])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinMode(false)
      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return
        e.preventDefault()
        setPinMode(!pinMode)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pinMode, setPinMode])

  useEffect(() => {
    const root = shellRef.current
    if (!root) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const cam = cameraRef.current
      const canvas = root.querySelector('.ds-canvas-viewport')
      const anchor =
        canvas instanceof HTMLElement
          ? resolveCanvasWheelAnchor(canvas, e.clientX, e.clientY)
          : null
      const rect = root.getBoundingClientRect()
      const next = applyCanvasWheelGesture({
        zoom: cam.zoom,
        panX: cam.panX,
        panY: cam.panY,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        anchorX: anchor?.anchorX ?? e.clientX - rect.left,
        anchorY: anchor?.anchorY ?? e.clientY - rect.top,
      })
      setZoom(next.zoom)
      setPanX(next.panX)
      setPanY(next.panY)
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    return () => root.removeEventListener('wheel', onWheel)
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return
    // Pin mode: left click places a pin (handled by pin layer). Middle still pans.
    if (pinMode && e.button === 0) return
    // Never steal pin bubble / popover / draft interactions for camera pan.
    if (isClientSharePinChromeTarget(e.target)) return
    e.preventDefault()
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: cameraRef.current.panX,
      panY: cameraRef.current.panY,
    }
    setDragging(true)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    } catch {
      // jsdom / older hosts
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    setPanX(drag.panX + (e.clientX - drag.x))
    setPanY(drag.panY + (e.clientY - drag.y))
  }
  const endDrag = (e: React.PointerEvent) => {
    dragRef.current = null
    setDragging(false)
    try {
      ;(e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId)
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={shellRef}
      className="creation-share-preview-stage"
      data-testid="client-share-preview-stage"
      data-pin-mode={pinMode ? 'true' : 'false'}
      data-dragging={dragging ? 'true' : 'false'}
      style={{
        cursor: pinMode ? 'crosshair' : dragging ? 'grabbing' : 'grab',
      }}
    >
      <CanvasViewport
        className="creation-share-preview-canvas creation-editor-canvas"
        data-testid="client-share-canvas"
        zoom={zoom}
        panX={panX}
        panY={panY}
        artboardWidth={artboard.width}
        artboardHeight={artboard.height}
        aria-label={pageTitle}
        style={{ height: '100%', width: '100%' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div
          className="creation-share-preview-artboard"
          data-testid="client-share-artboard"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          <iframe
            title={pageTitle}
            src={htmlSrc}
            data-testid="client-share-frame"
            // Preview is camera-first: never let the iframe steal drag/pan.
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              display: 'block',
              pointerEvents: 'none',
              background: '#fff',
            }}
          />
          <ClientShareGuestPins
            comments={comments}
            pinMode={pinMode}
            authorName={authorName}
            onAuthorNameChange={onAuthorNameChange}
            onPlace={(input) => {
              onPlaceComment(input)
              setPinMode(false)
            }}
            onExitPinMode={() => setPinMode(false)}
            onPinOpen={onPinOpen}
          />
        </div>
      </CanvasViewport>
    </div>
  )
}
