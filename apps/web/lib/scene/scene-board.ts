import type {
  CompositionScene,
  SceneBreakpointId,
  SceneNode,
  SceneNodeId,
  ScenePage,
  ScenePageFrame,
} from '@zaoly/contracts'
import {
  artboardCssSize,
  resolvePrintPreset,
  resolveSceneBreakpoint,
} from './breakpoints'

/** Gap between auto-placed page frames (CSS px) — `specs/domain/scene-board.md`. */
export const BOARD_PAGE_GAP = 120

/** Estimated label + gap above page body for fit math (CSS px). */
export const BOARD_FRAME_CHROME_HEIGHT = 32

/** Snap grid for frame drag (CSS px) — P81.1 preview. */
export const BOARD_FRAME_SNAP = 8

/** Magnetic align threshold to neighbor frame edges (CSS px) — Wave C / P81.1. */
export const BOARD_FRAME_ALIGN_THRESHOLD = 12

export function snapBoardFrameCoord(value: number): number {
  return Math.round(value / BOARD_FRAME_SNAP) * BOARD_FRAME_SNAP
}

/** Next/previous page id in `pages[]` order (wraps). */
export function resolvePageBreakpoint(
  page: ScenePage,
  scene: CompositionScene,
): SceneBreakpointId {
  return page.breakpoint ?? scene.activeBreakpoint ?? 'desktop'
}

/** Artboard width for a page frame on the board (explicit `frame.width` or breakpoint-derived). */
export function resolvePageArtboardWidth(
  page: ScenePage,
  scene: CompositionScene,
): number {
  const w = page.frame?.width
  if (isFiniteCoord(w) && w > 0) return w
  const bp = resolvePageBreakpoint(page, scene)
  const preset = resolvePrintPreset(scene.activePrintPreset)
  return artboardCssSize(bp, preset).width
}

/**
 * Artboard content height for a page frame (explicit `frame.height`, else print preset,
 * else `fallbackHeight` for digital measured height).
 */
export function resolvePageArtboardHeight(
  page: ScenePage,
  scene: CompositionScene,
  fallbackHeight: number,
): number {
  const h = page.frame?.height
  if (isFiniteCoord(h) && h > 0) return h
  const bp = resolvePageBreakpoint(page, scene)
  const preset = resolvePrintPreset(scene.activePrintPreset)
  const fromBp = artboardCssSize(bp, preset).height
  if (fromBp != null && fromBp > 0) return fromBp
  return fallbackHeight > 0 ? fallbackHeight : 640
}

export function cycleActivePageId(
  pages: ScenePage[],
  activePageId: string,
  direction: 1 | -1,
): string | null {
  if (pages.length < 2) return null
  const idx = pages.findIndex((p) => p.id === activePageId)
  const base = idx >= 0 ? idx : 0
  const next = (base + direction + pages.length) % pages.length
  return pages[next]?.id ?? null
}

function snapScalarDelta(edges: number[], targets: number[], threshold: number): number {
  let bestDelta = 0
  let bestDist = threshold + 1
  for (const edge of edges) {
    for (const target of targets) {
      const dist = Math.abs(edge - target)
      if (dist <= threshold && dist < bestDist) {
        bestDist = dist
        bestDelta = target - edge
      }
    }
  }
  return bestDelta
}

/** Snap dragged frame to neighbor edges/centers, then to the 8px grid. */
export function snapPageFramePosition(
  pageId: string,
  x: number,
  y: number,
  pages: ScenePage[],
  defaultArtboardWidth: number,
  defaultArtboardHeight: number,
): { x: number; y: number } {
  const page = pages.find((p) => p.id === pageId)
  if (!page) {
    return { x: snapBoardFrameCoord(x), y: snapBoardFrameCoord(y) }
  }
  const width = resolvePageFrameWidth(page, defaultArtboardWidth)
  const contentHeight =
    typeof page.frame?.height === 'number' && page.frame.height > 0
      ? page.frame.height
      : defaultArtboardHeight
  const height = BOARD_FRAME_CHROME_HEIGHT + contentHeight
  let nextX = x
  let nextY = y
  const xTargets: number[] = []
  const yTargets: number[] = []
  for (const other of pages) {
    if (other.id === pageId) continue
    const b = computePageFrameBounds(other, defaultArtboardWidth, defaultArtboardHeight)
    xTargets.push(b.x, b.x + b.width, b.x + b.width / 2)
    yTargets.push(b.y, b.y + b.height, b.y + b.height / 2)
  }
  if (xTargets.length) {
    nextX += snapScalarDelta(
      [nextX, nextX + width, nextX + width / 2],
      xTargets,
      BOARD_FRAME_ALIGN_THRESHOLD,
    )
  }
  if (yTargets.length) {
    nextY += snapScalarDelta(
      [nextY, nextY + height, nextY + height / 2],
      yTargets,
      BOARD_FRAME_ALIGN_THRESHOLD,
    )
  }
  return { x: snapBoardFrameCoord(nextX), y: snapBoardFrameCoord(nextY) }
}

/** Live frame drag preview overlay (session-only, not persisted). */
export function applyFramePositionPreview(
  board: SceneNode,
  preview: { pageId: string; x: number; y: number },
): SceneNode {
  const frameId = sceneBoardFrameNodeId(preview.pageId)
  function mapNode(node: SceneNode): SceneNode {
    if (node.id === frameId) {
      return {
        ...node,
        style: {
          ...(node.style ?? {}),
          left: preview.x,
          top: preview.y,
        },
      }
    }
    if (node.children?.length) {
      return { ...node, children: node.children.map(mapNode) }
    }
    return node
  }
  return mapNode(board)
}

export function shouldStartBoardFrameDrag(params: {
  isPageFrameChrome: boolean
  isPageFrameLabel: boolean
  frameDragBlocked: boolean
  altKey: boolean
  target: HTMLElement
  frameRoot: HTMLElement
}): boolean {
  if (params.frameDragBlocked) return false
  if (params.isPageFrameLabel) return true
  if (!params.isPageFrameChrome) return false
  const bodyEl = params.frameRoot.querySelector('[data-page-frame-body="true"]')
  const insideBody = bodyEl instanceof HTMLElement && bodyEl.contains(params.target)
  if (!insideBody) return true
  if (!params.altKey) return false
  const clickedNode = params.target.closest('[data-node-id]')
  if (!(clickedNode instanceof HTMLElement) || !(bodyEl instanceof HTMLElement)) return true
  const bodyRootId = bodyEl.getAttribute('data-node-id')
  const clickedId = clickedNode.getAttribute('data-node-id')
  if (clickedId && bodyRootId && clickedId !== bodyRootId) return false
  return true
}

/** Ephemeral paint root for the scene board (not persisted). */
export const SCENE_BOARD_ID = '__scene-board'

/** Prefix for per-page frame chrome wrappers on the board. */
export const SCENE_BOARD_FRAME_PREFIX = '__page-frame:'

/** Suffix for lazy-paint placeholder body ids on inactive frames. */
export const SCENE_BOARD_PLACEHOLDER_BODY_SUFFIX = ':placeholder-body'

/** Multi-page board lazy paint threshold — reserved for opt-in; editor defaults to full paint. */
export const BOARD_LAZY_INACTIVE_MIN_PAGES = 2

/**
 * Whether the editor should paint inactive frames as placeholders.
 * Product default: **always false** — all artboards stay fully visible on the board.
 * Callers may still pass `lazyInactivePages: true` to `buildSceneBoardForPaint` for perf experiments.
 */
export function shouldLazyPaintInactiveBoardPages(_pageCount: number): boolean {
  return false
}

export type BuildSceneBoardOptions = {
  /**
   * When true, inactive pages paint chrome + placeholder only.
   * Editor default: off (`shouldLazyPaintInactiveBoardPages` → false) so all artboards stay visible.
   */
  lazyInactivePages?: boolean
}

export function sceneBoardFrameNodeId(pageId: string): string {
  return `${SCENE_BOARD_FRAME_PREFIX}${pageId}`
}

export function sceneBoardPlaceholderBodyId(pageId: string): string {
  return `${sceneBoardFrameNodeId(pageId)}${SCENE_BOARD_PLACEHOLDER_BODY_SUFFIX}`
}

/** Page frame chrome selection ids (frame wrapper or label — not placeholder body). */
export function isPageFrameInspectableId(nodeId: string): boolean {
  if (!nodeId.startsWith(SCENE_BOARD_FRAME_PREFIX)) return false
  if (nodeId.includes(SCENE_BOARD_PLACEHOLDER_BODY_SUFFIX)) return false
  return true
}

export function isBoardPagePlaceholderBody(node: SceneNode): boolean {
  return node.props?.['data-page-frame-placeholder'] === 'true'
}

/** Minimal body for inactive page frames (lazy board paint — Wave B). */
export function buildInactivePageFrameBody(
  pageId: string,
  defaultArtboardHeight: number,
): SceneNode {
  return {
    id: sceneBoardPlaceholderBodyId(pageId),
    type: 'Stack',
    name: 'Page placeholder',
    locked: true,
    props: {
      'data-page-frame-body': 'true',
      'data-page-frame-placeholder': 'true',
      'data-page-id': pageId,
    },
    style: {
      minHeight: defaultArtboardHeight,
      width: '100%',
      boxSizing: 'border-box',
    },
    children: [],
  }
}

/** Session-only frame drag: update painted chrome position without rebuilding the board tree. */
export function syncBoardFrameDragPreviewDom(
  viewport: HTMLElement | null,
  pageId: string,
  x: number,
  y: number,
): void {
  if (!viewport) return
  const frame = viewport.querySelector(
    `[data-page-frame-chrome="true"][data-page-id="${CSS.escape(pageId)}"]`,
  )
  if (!(frame instanceof HTMLElement)) return
  frame.style.left = `${x}px`
  frame.style.top = `${y}px`
}

export function clearBoardFrameDragPreviewDom(
  viewport: HTMLElement | null,
  pageId: string,
): void {
  if (!viewport) return
  const frame = viewport.querySelector(
    `[data-page-frame-chrome="true"][data-page-id="${CSS.escape(pageId)}"]`,
  )
  if (!(frame instanceof HTMLElement)) return
  frame.style.left = ''
  frame.style.top = ''
}

function isFiniteCoord(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function normalizePageFrame(raw: unknown): ScenePageFrame | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const f = raw as Record<string, unknown>
  if (!isFiniteCoord(f.x) || !isFiniteCoord(f.y)) return undefined
  const frame: ScenePageFrame = { x: f.x, y: f.y }
  if (isFiniteCoord(f.width) && f.width > 0) frame.width = f.width
  if (isFiniteCoord(f.height) && f.height > 0) frame.height = f.height
  return frame
}

export function resolvePageFrameWidth(page: ScenePage, defaultArtboardWidth: number): number {
  const w = page.frame?.width
  if (isFiniteCoord(w) && w > 0) return w
  return defaultArtboardWidth
}

/** World-space bounds of one page frame on the scene board (for fit-to-frame). */
export function computePageFrameBounds(
  page: ScenePage,
  defaultArtboardWidth: number,
  defaultArtboardHeight: number,
  scene?: CompositionScene,
): { x: number; y: number; width: number; height: number } {
  const frame = page.frame ?? { x: 0, y: 0 }
  const width = scene
    ? resolvePageArtboardWidth(page, scene)
    : resolvePageFrameWidth(page, defaultArtboardWidth)
  const contentHeight = scene
    ? resolvePageArtboardHeight(page, scene, defaultArtboardHeight)
    : typeof page.frame?.height === 'number' && page.frame.height > 0
      ? page.frame.height
      : defaultArtboardHeight
  const height = BOARD_FRAME_CHROME_HEIGHT + contentHeight
  return { x: frame.x, y: frame.y, width, height }
}

/** Union bounds of every page frame on the board. */
export function computeAllPageFramesBounds(
  scene: CompositionScene,
  defaultArtboardWidth: number,
  defaultArtboardHeight: number,
): { x: number; y: number; width: number; height: number } {
  const pages = pagesForBoardPaint(scene, defaultArtboardWidth)
  if (!pages.length) {
    return { x: 0, y: 0, width: defaultArtboardWidth, height: defaultArtboardHeight }
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const page of pages) {
    const b = computePageFrameBounds(page, defaultArtboardWidth, defaultArtboardHeight, scene)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + b.width)
    maxY = Math.max(maxY, b.y + b.height)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

/** Legacy single-page id when `pages` is missing (keep in sync with scene-pages). */
const LEGACY_SINGLE_PAGE_ID = 'page-default'

function pagesForBoardPaint(scene: CompositionScene, defaultArtboardWidth: number): ScenePage[] {
  const basePages = scene.pages?.length
    ? scene.pages
    : [
        {
          id: LEGACY_SINGLE_PAGE_ID,
          name: scene.name?.trim() || 'Page',
          root: scene.root,
        },
      ]
  return normalizePageFrames(structuredClone(basePages), defaultArtboardWidth)
}

function hasValidFrame(frame: ScenePageFrame | undefined): frame is ScenePageFrame {
  return Boolean(frame && isFiniteCoord(frame.x) && isFiniteCoord(frame.y))
}

/** Assign missing/invalid `frame` positions in a horizontal row. */
export function normalizePageFrames(
  pages: ScenePage[],
  defaultArtboardWidth: number,
): ScenePage[] {
  const out: ScenePage[] = []
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!
    if (hasValidFrame(page.frame)) {
      out.push({
        ...page,
        frame: {
          x: page.frame.x,
          y: page.frame.y,
          ...(isFiniteCoord(page.frame.width) && page.frame.width > 0
            ? { width: page.frame.width }
            : {}),
          ...(isFiniteCoord(page.frame.height) && page.frame.height > 0
            ? { height: page.frame.height }
            : {}),
        },
      })
      continue
    }
    if (i === 0) {
      out.push({ ...page, frame: { x: 0, y: 0 } })
      continue
    }
    const prev = out[i - 1]!
    const prevFrame = prev.frame ?? { x: 0, y: 0 }
    const prevWidth = resolvePageFrameWidth(prev, defaultArtboardWidth)
    out.push({
      ...page,
      frame: {
        x: prevFrame.x + prevWidth + BOARD_PAGE_GAP,
        y: prevFrame.y,
      },
    })
  }
  return out
}

/** Default board position for a newly added page (right of anchor). */
export function autoPlacePageFrame(
  pages: ScenePage[],
  anchorPageId: string | undefined,
  defaultArtboardWidth: number,
): ScenePageFrame {
  if (!pages.length) return { x: 0, y: 0 }
  const anchor =
    (anchorPageId ? pages.find((p) => p.id === anchorPageId) : undefined) ??
    pages[pages.length - 1]!
  const anchorFrame = anchor.frame ?? { x: 0, y: 0 }
  const anchorWidth = resolvePageFrameWidth(anchor, defaultArtboardWidth)
  return {
    x: anchorFrame.x + anchorWidth + BOARD_PAGE_GAP,
    y: anchorFrame.y,
  }
}

export function defaultArtboardWidthForScene(scene: CompositionScene): number {
  const bp = resolveSceneBreakpoint(scene.activeBreakpoint)
  const preset = resolvePrintPreset(scene.activePrintPreset)
  return artboardCssSize(bp, preset).width
}

/** Ensure every page has a valid frame before persist. */
export function prepareSceneBoardForPersist(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  const width = defaultArtboardWidthForScene(scene)
  return {
    ...scene,
    pages: normalizePageFrames(structuredClone(scene.pages), width),
  }
}

export function isSceneBoardNodeId(id: string): boolean {
  return id === SCENE_BOARD_ID || id.startsWith(SCENE_BOARD_FRAME_PREFIX)
}

export function rejectIfBoardChrome(
  nodeId: string,
): { ok: false; reason: string } | null {
  if (!isSceneBoardNodeId(nodeId)) return null
  return { ok: false, reason: `Cannot mutate board chrome node: ${nodeId}` }
}

/** Ensure every page has a valid frame before page/board ops (W8e: share page roots). */
export function ensureScenePageFrames(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  const width = defaultArtboardWidthForScene(scene)
  return {
    ...scene,
    pages: normalizePageFrames(scene.pages, width),
  }
}

export function boardPagesForScene(scene: CompositionScene): ScenePage[] {
  return pagesForBoardPaint(scene, defaultArtboardWidthForScene(scene))
}

export function pageIdFromBoardFrameNodeId(id: string): string | null {
  if (!id.startsWith(SCENE_BOARD_FRAME_PREFIX)) return null
  const rest = id.slice(SCENE_BOARD_FRAME_PREFIX.length)
  const pageId = rest.split(':')[0]
  return pageId || null
}

function nodeInTree(root: SceneNode, id: SceneNodeId): boolean {
  if (root.id === id) return true
  return (root.children ?? []).some((child) => nodeInTree(child, id))
}

export function findPageBodyInBoard(board: SceneNode, pageId: string): SceneNode | null {
  const frame = findNodeInBoardTree(board, sceneBoardFrameNodeId(pageId))
  return frame?.children?.[1] ?? null
}

function findNodeInBoardTree(root: SceneNode, id: SceneNodeId): SceneNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const hit = findNodeInBoardTree(child, id)
    if (hit) return hit
  }
  return null
}

/** Canvas viewport size covering all page frames plus padding. */
export function computeSceneBoardCanvasSize(
  scene: CompositionScene,
  defaultArtboardWidth: number,
  defaultArtboardHeight: number,
): { width: number; height: number } {
  const pages = pagesForBoardPaint(scene, defaultArtboardWidth)
  if (!pages.length) {
    return { width: defaultArtboardWidth, height: defaultArtboardHeight }
  }
  let width = defaultArtboardWidth
  let height = defaultArtboardHeight
  for (const page of pages) {
    const frame = page.frame ?? { x: 0, y: 0 }
    const frameWidth = resolvePageArtboardWidth(page, scene)
    const frameHeight = resolvePageArtboardHeight(page, scene, defaultArtboardHeight)
    width = Math.max(width, frame.x + frameWidth + 80)
    height = Math.max(height, frame.y + frameHeight + 80)
  }
  return { width, height }
}

/**
 * Ephemeral paint tree: all page frames on one board surface.
 * Bodies use persisted page roots (stable ids across pages).
 */
export function buildSceneBoardForPaint(
  scene: CompositionScene,
  activePageId: string,
  defaultArtboardWidth: number,
  defaultArtboardHeight: number,
  options?: BuildSceneBoardOptions,
): SceneNode {
  const pages = pagesForBoardPaint(scene, defaultArtboardWidth)
  const canvas = computeSceneBoardCanvasSize(scene, defaultArtboardWidth, defaultArtboardHeight)
  const lazyInactivePages = options?.lazyInactivePages === true

  const frames: SceneNode[] = pages.map((page) => {
    const frame = page.frame ?? { x: 0, y: 0 }
    const frameWidth = resolvePageArtboardWidth(page, scene)
    const frameHeight = resolvePageArtboardHeight(page, scene, defaultArtboardHeight)
    const isActive = page.id === activePageId
    const frameId = sceneBoardFrameNodeId(page.id)
    const pageBody: SceneNode =
      lazyInactivePages && !isActive
        ? buildInactivePageFrameBody(page.id, frameHeight)
        : {
            ...structuredClone(page.root),
            props: {
              ...(page.root.props ?? {}),
              'data-page-frame-body': 'true',
            },
            style: {
              ...(page.root.style ?? {}),
              minHeight: frameHeight,
              width: '100%',
              boxSizing: 'border-box',
            },
          }
    return {
      id: frameId,
      type: 'Stack',
      name: page.name,
      props: {
        direction: 'column',
        gap: 'xs',
        align: 'stretch',
        'data-page-id': page.id,
        'data-page-frame-active': isActive ? 'true' : 'false',
        'data-page-frame-chrome': 'true',
      },
      style: {
        position: 'absolute',
        left: frame.x,
        top: frame.y,
        width: frameWidth,
        boxSizing: 'border-box',
      },
      children: [
        {
          id: `${frameId}:label`,
          type: 'Text',
          name: `${page.name} label`,
          locked: true,
          props: {
            children: page.name,
            role: 'meta',
            'data-page-id': page.id,
            'data-page-frame-label': 'true',
          },
        },
        pageBody,
      ],
    }
  })

  return {
    id: SCENE_BOARD_ID,
    type: 'Stack',
    name: 'Scene board',
    locked: true,
    props: { direction: 'column' },
    style: {
      position: 'relative',
      width: canvas.width,
      minHeight: canvas.height,
    },
    children: frames,
  }
}

/** Map a scene-board click to select-in-active or activate-page. */
export function resolveSceneBoardClick(
  paintedBoard: SceneNode,
  scene: CompositionScene,
  activePageId: string,
  clickedId: SceneNodeId,
):
  | { type: 'select'; nodeId: SceneNodeId }
  | { type: 'activate'; pageId: string; selectId?: SceneNodeId }
  | { type: 'noop' } {
  if (clickedId === SCENE_BOARD_ID) return { type: 'noop' }
  const pages = boardPagesForScene(scene)
  const activePage = pages.find((p) => p.id === activePageId)
  if (!activePage) return { type: 'noop' }

  const activeBody = findPageBodyInBoard(paintedBoard, activePageId)
  if (activeBody && nodeInTree(activeBody, clickedId)) {
    return { type: 'select', nodeId: clickedId }
  }

  for (const page of pages) {
    if (page.id === activePageId) continue
    const body = findPageBodyInBoard(paintedBoard, page.id)
    if (body && nodeInTree(body, clickedId)) {
      const selectId = isBoardPagePlaceholderBody(body) ? page.root.id : clickedId
      return { type: 'activate', pageId: page.id, selectId }
    }
  }

  const pageId = pageIdFromBoardFrameNodeId(clickedId)
  if (pageId) {
    if (pageId === activePageId) {
      return { type: 'select', nodeId: sceneBoardFrameNodeId(pageId) }
    }
    return { type: 'activate', pageId }
  }

  return { type: 'noop' }
}
