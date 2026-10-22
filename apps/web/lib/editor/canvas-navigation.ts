/** Figma-like canvas zoom limits (creation editor). */
export const CANVAS_ZOOM_MIN = 0.1
export const CANVAS_ZOOM_MAX = 4
export const CANVAS_ZOOM_STEP = 1.12

export type CanvasFitBounds = {
  x: number
  y: number
  width: number
  height: number
}

export function clampCanvasZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1
  return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, zoom))
}

/** Wheel deltaMode → CSS px (best-effort). */
export function normalizeWheelDelta(delta: number, deltaMode: number): number {
  if (deltaMode === 1) return delta * 16
  if (deltaMode === 2) return delta * 400
  return delta
}

/** Trackpad pinch (ctrl/meta + wheel) → multiplicative zoom factor. */
export function wheelZoomFactor(deltaY: number): number {
  return Math.exp(-deltaY * 0.008)
}

export function isPinchOrZoomWheel(e: { ctrlKey: boolean; metaKey: boolean }): boolean {
  return e.ctrlKey || e.metaKey
}

/**
 * Keep the world point under `anchor` fixed while changing zoom.
 * Anchor coords are in the artboard parent space (stage content, origin top-left of artboard).
 */
export function zoomCanvasAboutPoint(params: {
  zoom: number
  panX: number
  panY: number
  nextZoom: number
  anchorX: number
  anchorY: number
}): { zoom: number; panX: number; panY: number } {
  const zoom = clampCanvasZoom(params.nextZoom)
  const prev = Number.isFinite(params.zoom) && params.zoom > 0 ? params.zoom : 1
  const worldX = (params.anchorX - params.panX) / prev
  const worldY = (params.anchorY - params.panY) / prev
  return {
    zoom,
    panX: params.anchorX - worldX * zoom,
    panY: params.anchorY - worldY * zoom,
  }
}

/** Map pointer position to stage-local anchor for pan/zoom math. */
export function resolveCanvasWheelAnchor(
  canvasEl: HTMLElement,
  clientX: number,
  clientY: number,
): { anchorX: number; anchorY: number } | null {
  const stage = canvasEl.querySelector('.ds-canvas-viewport__stage')
  if (!(stage instanceof HTMLElement)) return null
  const rect = stage.getBoundingClientRect()
  const style = getComputedStyle(stage)
  const padL = parseFloat(style.paddingLeft) || 0
  const padT = parseFloat(style.paddingTop) || 0
  return {
    anchorX: clientX - rect.left - padL + stage.scrollLeft,
    anchorY: clientY - rect.top - padT + stage.scrollTop,
  }
}

export function applyCanvasWheelGesture(params: {
  zoom: number
  panX: number
  panY: number
  deltaX: number
  deltaY: number
  deltaMode: number
  ctrlKey: boolean
  metaKey: boolean
  anchorX: number
  anchorY: number
}): { zoom: number; panX: number; panY: number } {
  if (isPinchOrZoomWheel(params)) {
    const deltaY = normalizeWheelDelta(params.deltaY, params.deltaMode)
    const factor = wheelZoomFactor(deltaY)
    return zoomCanvasAboutPoint({
      zoom: params.zoom,
      panX: params.panX,
      panY: params.panY,
      nextZoom: params.zoom * factor,
      anchorX: params.anchorX,
      anchorY: params.anchorY,
    })
  }
  const dx = normalizeWheelDelta(params.deltaX, params.deltaMode)
  const dy = normalizeWheelDelta(params.deltaY, params.deltaMode)
  return {
    zoom: params.zoom,
    panX: params.panX - dx,
    panY: params.panY - dy,
  }
}

/** Fit a world-space rectangle into the viewport (artboard pad coords). */
export function fitCanvasToBounds(params: {
  viewportWidth: number
  viewportHeight: number
  bounds: CanvasFitBounds
  padding?: number
}): { zoom: number; panX: number; panY: number } {
  const pad = params.padding ?? 64
  const vw = Math.max(120, params.viewportWidth - pad)
  const vh = Math.max(120, params.viewportHeight - pad)
  const bw = Math.max(1, params.bounds.width)
  const bh = Math.max(1, params.bounds.height)
  const zoom = clampCanvasZoom(Math.min(vw / bw, vh / bh))
  const cx = params.bounds.x + bw / 2
  const cy = params.bounds.y + bh / 2
  return {
    zoom: Number(zoom.toFixed(2)),
    panX: vw / 2 - cx * zoom + pad / 2,
    panY: vh / 2 - cy * zoom + pad / 2,
  }
}
