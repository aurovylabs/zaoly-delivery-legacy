import type { CompositionScene } from '@zaoly/contracts'
import {
  boardPagesForScene,
  computePageFrameBounds,
} from './scene-board'

export type BoardMinimapFrame = {
  pageId: string
  name: string
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

export type BoardMinimapWorldRect = {
  x: number
  y: number
  width: number
  height: number
}

export type BoardMinimapLayout = {
  scale: number
  offsetX: number
  offsetY: number
  width: number
  height: number
  boardBounds: { x: number; y: number; width: number; height: number }
}

/** Camera frustum in board/world CSS px (same space as page frames). */
export function boardMinimapCameraWorldRect(params: {
  zoom: number
  panX: number
  panY: number
  viewportWidth: number
  viewportHeight: number
}): BoardMinimapWorldRect | null {
  if (params.zoom <= 0) return null
  return {
    x: -params.panX / params.zoom,
    y: -params.panY / params.zoom,
    width: params.viewportWidth / params.zoom,
    height: params.viewportHeight / params.zoom,
  }
}

export function buildBoardMinimapFrames(
  scene: CompositionScene,
  activePageId: string,
  defaultArtboardWidth: number,
  defaultArtboardHeight: number,
): BoardMinimapFrame[] {
  const pages = boardPagesForScene(scene)
  return pages.map((page) => {
    const b = computePageFrameBounds(page, defaultArtboardWidth, defaultArtboardHeight, scene)
    return {
      pageId: page.id,
      name: page.name,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      active: page.id === activePageId,
    }
  })
}

/**
 * Fit page frames (and optional camera world rect) into the minimap widget.
 * Including the camera keeps the viewport overlay inside the widget when zoomed out.
 */
export function layoutBoardMinimap(
  frames: BoardMinimapFrame[],
  maxWidth = 168,
  maxHeight = 112,
  includeWorld?: BoardMinimapWorldRect | null,
): BoardMinimapLayout {
  if (!frames.length) {
    return {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      width: maxWidth,
      height: 48,
      boardBounds: { x: 0, y: 0, width: 1, height: 1 },
    }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const f of frames) {
    minX = Math.min(minX, f.x)
    minY = Math.min(minY, f.y)
    maxX = Math.max(maxX, f.x + f.width)
    maxY = Math.max(maxY, f.y + f.height)
  }
  if (
    includeWorld &&
    Number.isFinite(includeWorld.x) &&
    Number.isFinite(includeWorld.y) &&
    includeWorld.width > 0 &&
    includeWorld.height > 0
  ) {
    minX = Math.min(minX, includeWorld.x)
    minY = Math.min(minY, includeWorld.y)
    maxX = Math.max(maxX, includeWorld.x + includeWorld.width)
    maxY = Math.max(maxY, includeWorld.y + includeWorld.height)
  }
  const boardBounds = {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  }
  const pad = 4
  const innerW = Math.max(1, maxWidth - pad * 2)
  const innerH = Math.max(1, maxHeight - pad * 2)
  const scale = Math.min(innerW / boardBounds.width, innerH / boardBounds.height)
  return {
    scale,
    offsetX: -boardBounds.x,
    offsetY: -boardBounds.y,
    width: maxWidth,
    height: Math.max(48, Math.round(boardBounds.height * scale) + pad * 2),
    boardBounds,
  }
}

export function boardMinimapFrameStyle(
  frame: BoardMinimapFrame,
  layout: BoardMinimapLayout,
): { left: number; top: number; width: number; height: number } {
  return {
    left: (frame.x + layout.offsetX) * layout.scale + 4,
    top: (frame.y + layout.offsetY) * layout.scale + 4,
    width: Math.max(2, frame.width * layout.scale),
    height: Math.max(2, frame.height * layout.scale),
  }
}

export function boardMinimapViewportStyle(params: {
  layout: BoardMinimapLayout
  zoom: number
  panX: number
  panY: number
  viewportWidth: number
  viewportHeight: number
}): { left: number; top: number; width: number; height: number } | null {
  const camera = boardMinimapCameraWorldRect(params)
  if (!camera) return null
  const { layout } = params
  return {
    left: (camera.x + layout.offsetX) * layout.scale + 4,
    top: (camera.y + layout.offsetY) * layout.scale + 4,
    width: Math.max(4, camera.width * layout.scale),
    height: Math.max(4, camera.height * layout.scale),
  }
}

export function hitTestBoardMinimapFrame(
  frames: BoardMinimapFrame[],
  layout: BoardMinimapLayout,
  localX: number,
  localY: number,
): string | null {
  for (let i = frames.length - 1; i >= 0; i--) {
    const frame = frames[i]!
    const style = boardMinimapFrameStyle(frame, layout)
    if (
      localX >= style.left &&
      localX <= style.left + style.width &&
      localY >= style.top &&
      localY <= style.top + style.height
    ) {
      return frame.pageId
    }
  }
  return null
}

/** Convert minimap pointer delta (widget px) to board/world CSS px. */
export function boardMinimapWorldDeltaFromPointerDelta(
  dxLocal: number,
  dyLocal: number,
  layout: BoardMinimapLayout,
): { worldDx: number; worldDy: number } {
  const scale = layout.scale > 0 ? layout.scale : 1
  return { worldDx: dxLocal / scale, worldDy: dyLocal / scale }
}

/**
 * Apply a world-space camera move as canvas pan delta.
 * Moving the camera right in world space decreases panX (same convention as macOS Radar).
 */
export function boardMinimapPanDeltaFromWorldDelta(
  worldDx: number,
  worldDy: number,
  zoom: number,
): { dPanX: number; dPanY: number } {
  const z = zoom > 0 ? zoom : 1
  return { dPanX: -worldDx * z, dPanY: -worldDy * z }
}

/** True when local point hits the camera viewport overlay (for drag-pan). */
export function hitTestBoardMinimapViewport(
  layout: BoardMinimapLayout,
  zoom: number,
  panX: number,
  panY: number,
  viewportWidth: number,
  viewportHeight: number,
  localX: number,
  localY: number,
): boolean {
  const style = boardMinimapViewportStyle({
    layout,
    zoom,
    panX,
    panY,
    viewportWidth,
    viewportHeight,
  })
  if (!style) return false
  return (
    localX >= style.left &&
    localX <= style.left + style.width &&
    localY >= style.top &&
    localY <= style.top + style.height
  )
}
