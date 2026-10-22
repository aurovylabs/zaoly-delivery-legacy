'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'
import {
  applyCanvasWheelGesture,
  CANVAS_ZOOM_STEP,
  clampCanvasZoom,
  resolveCanvasWheelAnchor,
  zoomCanvasAboutPoint,
} from '../../lib/editor/canvas-navigation'
import {
  createRafViewportCommit,
  type ViewportCommit,
  type ViewportTransform,
} from '../../lib/editor/viewport-gesture'
import { isEditableTarget } from './editor-boot'

export type EditorViewportState = {
  zoom: number
  panX: number
  panY: number
  panning: boolean
  marquee: import('../../lib/scene/selection').Bounds | null
  spaceDown: boolean
  panMode: boolean
  setZoom: Dispatch<SetStateAction<number>>
  setPanX: Dispatch<SetStateAction<number>>
  setPanY: Dispatch<SetStateAction<number>>
  setPanning: Dispatch<SetStateAction<boolean>>
  setMarquee: Dispatch<SetStateAction<import('../../lib/scene/selection').Bounds | null>>
  setSpaceDown: Dispatch<SetStateAction<boolean>>
  zoomPanRef: RefObject<ViewportTransform>
  commitViewport: ViewportCommit
  commitViewportImmediate: (next: Partial<ViewportTransform>) => void
  stepCanvasZoom: (direction: 'in' | 'out') => void
  zoomCanvasAtViewportCenter: (nextZoom: number) => void
}

export function useEditorViewportState(
  viewportRef: RefObject<HTMLDivElement | null>,
  opts?: {
    /** Clears presence follow and marks activity — call on every local pan/zoom. */
    onViewportGesture?: () => void
  },
): EditorViewportState {
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  const [marquee, setMarquee] = useState<import('../../lib/scene/selection').Bounds | null>(null)
  const onViewportGestureRef = useRef(opts?.onViewportGesture)
  onViewportGestureRef.current = opts?.onViewportGesture

  const zoomPanRef = useRef<ViewportTransform>({ zoom: 1, panX: 0, panY: 0 })
  zoomPanRef.current = { zoom, panX, panY }

  const applyViewport = useCallback((next: ViewportTransform) => {
    setZoom(next.zoom)
    setPanX(next.panX)
    setPanY(next.panY)
  }, [])

  const commitViewport = useRef<ViewportCommit>(
    createRafViewportCommit(() => zoomPanRef.current, applyViewport),
  ).current

  const commitViewportImmediate = useCallback(
    (partial: Partial<ViewportTransform>) => {
      applyViewport({ ...zoomPanRef.current, ...partial })
    },
    [applyViewport],
  )

  const zoomCanvasAtViewportCenter = useCallback(
    (nextZoom: number) => {
      onViewportGestureRef.current?.()
      const z0 = zoomPanRef.current
      const shell = viewportRef.current
      if (shell) {
        const canvas = shell.querySelector('[data-testid="creation-editor-canvas"]')
        const rect = shell.getBoundingClientRect()
        if (canvas instanceof HTMLElement) {
          const anchor = resolveCanvasWheelAnchor(
            canvas,
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
          )
          if (anchor) {
            commitViewportImmediate(
              zoomCanvasAboutPoint({ ...z0, nextZoom, ...anchor }),
            )
            return
          }
        }
      }
      commitViewportImmediate({ zoom: clampCanvasZoom(nextZoom) })
    },
    [commitViewportImmediate, viewportRef],
  )

  const stepCanvasZoom = useCallback(
    (direction: 'in' | 'out') => {
      const factor = direction === 'in' ? CANVAS_ZOOM_STEP : 1 / CANVAS_ZOOM_STEP
      zoomCanvasAtViewportCenter(zoomPanRef.current.zoom * factor)
    },
    [zoomCanvasAtViewportCenter],
  )

  useEffect(() => {
    const shell = viewportRef.current
    if (!shell) return
    const canvasShell = shell

    function onWheel(e: WheelEvent) {
      if (isEditableTarget(e.target)) return
      if (!canvasShell.contains(e.target as Node)) return
      const canvas = canvasShell.querySelector('[data-testid="creation-editor-canvas"]')
      if (!(canvas instanceof HTMLElement)) return

      e.preventDefault()
      onViewportGestureRef.current?.()
      const anchor = resolveCanvasWheelAnchor(canvas, e.clientX, e.clientY)
      if (!anchor) return

      const z0 = zoomPanRef.current
      const next = applyCanvasWheelGesture({
        zoom: z0.zoom,
        panX: z0.panX,
        panY: z0.panY,
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        anchorX: anchor.anchorX,
        anchorY: anchor.anchorY,
      })
      commitViewport(next)
    }

    canvasShell.addEventListener('wheel', onWheel, { passive: false })
    return () => canvasShell.removeEventListener('wheel', onWheel)
  }, [commitViewport, viewportRef])

  const panMode = spaceDown || panning

  return {
    zoom,
    panX,
    panY,
    panning,
    marquee,
    spaceDown,
    panMode,
    setZoom,
    setPanX,
    setPanY,
    setPanning,
    setMarquee,
    setSpaceDown,
    zoomPanRef,
    commitViewport,
    commitViewportImmediate,
    stepCanvasZoom,
    zoomCanvasAtViewportCenter,
  }
}
