/**
 * P64–P66 — detachable editor rails with resize + home-edge snap (rebuild, not Zaoly port).
 * Session key: `creation-editor-panel-chrome` (see knowledge/paths.md).
 * P66: dock/snap only left/right home edges — no top/bottom.
 */

export type PanelSide = 'left' | 'right'
export type PanelDockMode = 'docked' | 'floating'
/** Dock edge for a rail — home edge only (legacy top/bottom migrate on load). */
export type PanelDockEdge = 'left' | 'right'

export type PanelFloatRect = {
  x: number
  y: number
  w: number
  h: number
}

export type EditorPanelChromeState = {
  leftMode: PanelDockMode
  rightMode: PanelDockMode
  leftEdge: PanelDockEdge
  rightEdge: PanelDockEdge
  leftFloat: PanelFloatRect | null
  rightFloat: PanelFloatRect | null
  /** Docked width (home L/R); also seeds float w on undock. */
  leftSize: number
  rightSize: number
  /** Floating-only: collapse panel to title bar. */
  leftMinimized: boolean
  rightMinimized: boolean
}

export const EDITOR_PANEL_CHROME_KEY = 'creation-editor-panel-chrome'
export const EDITOR_INSPECT_COLLAPSE_KEY = 'creation-editor-inspect-collapsed'

export const PANEL_SNAP_ZONE_PX = 32
export const PANEL_UNDOCK_THRESHOLD_PX = 14

/**
 * Min Y for floating rails + docked rail margin — must clear hub nav bar + tool strip.
 * Keep in sync with CSS `--creation-editor-chrome-inset` (`knowledge/shell-chrome.md` P102).
 * 2.6rem hub bar (≈42px @16px root) + 40px editor toolbar.
 */
/** Hub nav + editor tool strip — keep in sync with `--creation-editor-chrome-inset`. */
export const PANEL_CHROME_TOP_INSET_PX = 82

export const PANEL_SIZE_LIMITS = {
  widthMin: 200,
  widthMax: 560,
  heightMin: 140,
  heightMax: 480,
  leftDefault: 256,
  rightDefault: 320,
} as const

export const PANEL_FLOAT_DEFAULTS = {
  left: { w: PANEL_SIZE_LIMITS.leftDefault, h: 480 },
  right: { w: PANEL_SIZE_LIMITS.rightDefault, h: 520 },
} as const

export const PANEL_CHROME_DEFAULTS: EditorPanelChromeState = {
  leftMode: 'docked',
  rightMode: 'docked',
  leftEdge: 'left',
  rightEdge: 'right',
  leftFloat: null,
  rightFloat: null,
  leftSize: PANEL_SIZE_LIMITS.leftDefault,
  rightSize: PANEL_SIZE_LIMITS.rightDefault,
  leftMinimized: false,
  rightMinimized: false,
}

export function homeEdgeForSide(side: PanelSide): PanelDockEdge {
  return side === 'left' ? 'left' : 'right'
}

export function isValidEdgeForSide(side: PanelSide, edge: string): edge is PanelDockEdge {
  return edge === homeEdgeForSide(side)
}

export function isHorizontalEdge(edge: PanelDockEdge): boolean {
  return edge === 'left' || edge === 'right'
}

function isFloatRect(value: unknown): value is PanelFloatRect {
  if (!value || typeof value !== 'object') return false
  const r = value as PanelFloatRect
  return (
    typeof r.x === 'number' &&
    typeof r.y === 'number' &&
    typeof r.w === 'number' &&
    typeof r.h === 'number' &&
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    Number.isFinite(r.w) &&
    Number.isFinite(r.h)
  )
}

function parseEdge(side: PanelSide, value: unknown): PanelDockEdge {
  if (typeof value === 'string' && isValidEdgeForSide(side, value)) return value
  return homeEdgeForSide(side)
}

function parseSize(side: PanelSide, value: unknown): number {
  const fallback = side === 'left' ? PANEL_SIZE_LIMITS.leftDefault : PANEL_SIZE_LIMITS.rightDefault
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(value, PANEL_SIZE_LIMITS.widthMin), PANEL_SIZE_LIMITS.widthMax)
}

export function loadPanelChrome(): EditorPanelChromeState {
  if (typeof sessionStorage === 'undefined') return { ...PANEL_CHROME_DEFAULTS }
  try {
    const raw = sessionStorage.getItem(EDITOR_PANEL_CHROME_KEY)
    if (!raw) return { ...PANEL_CHROME_DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<EditorPanelChromeState>
    const loaded: EditorPanelChromeState = {
      leftMode: parsed.leftMode === 'floating' ? 'floating' : 'docked',
      rightMode: parsed.rightMode === 'floating' ? 'floating' : 'docked',
      leftEdge: parseEdge('left', parsed.leftEdge),
      rightEdge: parseEdge('right', parsed.rightEdge),
      leftFloat: isFloatRect(parsed.leftFloat) ? parsed.leftFloat : null,
      rightFloat: isFloatRect(parsed.rightFloat) ? parsed.rightFloat : null,
      leftSize: parseSize('left', parsed.leftSize),
      rightSize: parseSize('right', parsed.rightSize),
      leftMinimized: parsed.leftMinimized === true,
      rightMinimized: parsed.rightMinimized === true,
    }
    // Heal without viewport first (floating + missing rect → dock).
    return normalizePanelChrome(loaded)
  } catch {
    return { ...PANEL_CHROME_DEFAULTS }
  }
}

export function savePanelChrome(state: EditorPanelChromeState): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(EDITOR_PANEL_CHROME_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

export function loadInspectCollapsed(): Record<string, boolean> {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(EDITOR_INSPECT_COLLAPSE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Record<string, boolean> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'boolean') out[key] = value
    }
    return out
  } catch {
    return {}
  }
}

export function saveInspectCollapsed(map: Record<string, boolean>): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(EDITOR_INSPECT_COLLAPSE_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

export function clampDockSize(
  edge: PanelDockEdge,
  size: number,
  viewport: { width: number; height: number },
): number {
  void edge
  const max = Math.min(PANEL_SIZE_LIMITS.widthMax, Math.max(PANEL_SIZE_LIMITS.widthMin, viewport.width * 0.45))
  return Math.min(Math.max(size, PANEL_SIZE_LIMITS.widthMin), max)
}

export function clampFloatRect(
  rect: PanelFloatRect,
  viewport: { width: number; height: number },
): PanelFloatRect {
  const minY = PANEL_CHROME_TOP_INSET_PX
  const w = Math.min(
    Math.max(rect.w, PANEL_SIZE_LIMITS.widthMin),
    Math.max(PANEL_SIZE_LIMITS.widthMin, viewport.width - 16),
  )
  const h = Math.min(
    Math.max(rect.h, PANEL_SIZE_LIMITS.heightMin),
    Math.max(PANEL_SIZE_LIMITS.heightMin, viewport.height - minY - 16),
  )
  const x = Math.min(Math.max(rect.x, 0), Math.max(0, viewport.width - w))
  const y = Math.min(Math.max(rect.y, minY), Math.max(minY, viewport.height - h))
  return { x, y, w, h }
}

export function defaultFloatRect(
  side: PanelSide,
  viewport: { width: number; height: number },
  from?: Partial<PanelFloatRect> | null,
  dockSize?: number,
): PanelFloatRect {
  const base = PANEL_FLOAT_DEFAULTS[side]
  const w = from?.w ?? dockSize ?? base.w
  const h = from?.h ?? Math.min(base.h, viewport.height - PANEL_CHROME_TOP_INSET_PX - 16)
  const x =
    from?.x ??
    (side === 'left' ? 16 : Math.max(16, viewport.width - w - 16))
  const y = from?.y ?? PANEL_CHROME_TOP_INSET_PX
  return clampFloatRect({ x, y, w, h }, viewport)
}

export function undockPanel(
  state: EditorPanelChromeState,
  side: PanelSide,
  viewport: { width: number; height: number },
  seed?: Partial<PanelFloatRect> | null,
): EditorPanelChromeState {
  const size = side === 'left' ? state.leftSize : state.rightSize
  const seedWithSize: Partial<PanelFloatRect> = {
    ...seed,
    w: seed?.w ?? size,
  }
  const float = defaultFloatRect(side, viewport, seedWithSize, size)
  if (side === 'left') {
    return { ...state, leftMode: 'floating', leftFloat: float, leftSize: float.w, leftMinimized: false }
  }
  return { ...state, rightMode: 'floating', rightFloat: float, rightSize: float.w, rightMinimized: false }
}

export function dockPanel(
  state: EditorPanelChromeState,
  side: PanelSide,
  edge?: string,
): EditorPanelChromeState {
  const nextEdge = edge && isValidEdgeForSide(side, edge) ? edge : homeEdgeForSide(side)
  const sizeKey = side === 'left' ? 'leftSize' : 'rightSize'
  const float = side === 'left' ? state.leftFloat : state.rightFloat
  const size = float ? float.w : state[sizeKey]
  if (side === 'left') {
    return { ...state, leftMode: 'docked', leftEdge: nextEdge, leftSize: size, leftMinimized: false }
  }
  return { ...state, rightMode: 'docked', rightEdge: nextEdge, rightSize: size, rightMinimized: false }
}

export function resizeDockedPanel(
  state: EditorPanelChromeState,
  side: PanelSide,
  size: number,
  viewport: { width: number; height: number },
): EditorPanelChromeState {
  const edge = side === 'left' ? state.leftEdge : state.rightEdge
  const next = clampDockSize(edge, size, viewport)
  if (side === 'left') return { ...state, leftSize: next }
  return { ...state, rightSize: next }
}

export function moveFloatingPanel(
  state: EditorPanelChromeState,
  side: PanelSide,
  next: PanelFloatRect,
  viewport: { width: number; height: number },
): EditorPanelChromeState {
  const float = clampFloatRect(next, viewport)
  if (side === 'left') {
    return { ...state, leftFloat: float, leftSize: float.w }
  }
  return { ...state, rightFloat: float, rightSize: float.w }
}

/** Toggle title-bar-only collapse for a floating rail. No-op when docked. */
export function toggleMinimizeFloatingPanel(
  state: EditorPanelChromeState,
  side: PanelSide,
): EditorPanelChromeState {
  if (side === 'left') {
    if (state.leftMode !== 'floating') return state
    return { ...state, leftMinimized: !state.leftMinimized }
  }
  if (state.rightMode !== 'floating') return state
  return { ...state, rightMinimized: !state.rightMinimized }
}

/**
 * Snap zones while floating: home edge only (left / right).
 * Not a full Zaoly dock clone — simple edge strips only.
 */
export function resolveFloatSnap(
  side: PanelSide,
  rect: PanelFloatRect,
  viewport: { width: number; height: number },
): PanelDockEdge | null {
  const home = homeEdgeForSide(side)
  if (home === 'left' && rect.x <= PANEL_SNAP_ZONE_PX) return 'left'
  if (home === 'right' && rect.x + rect.w >= viewport.width - PANEL_SNAP_ZONE_PX) return 'right'
  return null
}

/** @deprecated Prefer resolveFloatSnap — kept for P64 call sites / tests. */
export function resolveHomeSnap(
  side: PanelSide,
  rect: PanelFloatRect,
  viewport: { width: number; height: number },
): 'dock' | null {
  const snap = resolveFloatSnap(side, rect, viewport)
  return snap === homeEdgeForSide(side) ? 'dock' : null
}

export function resetPanelChrome(): EditorPanelChromeState {
  return { ...PANEL_CHROME_DEFAULTS }
}

/**
 * Heal persisted chrome that would hide a rail (floating without rect, or
 * float coordinates outside the editor body). Also remaps legacy top/bottom edges.
 */
export function normalizePanelChrome(
  state: EditorPanelChromeState,
  viewport?: { width: number; height: number },
): EditorPanelChromeState {
  let next = state

  if (!isValidEdgeForSide('left', next.leftEdge)) {
    next = { ...next, leftEdge: homeEdgeForSide('left') }
  }
  if (!isValidEdgeForSide('right', next.rightEdge)) {
    next = { ...next, rightEdge: homeEdgeForSide('right') }
  }

  if (next.leftMode === 'floating' && !next.leftFloat) {
    next = dockPanel(next, 'left')
  }
  if (next.rightMode === 'floating' && !next.rightFloat) {
    next = dockPanel(next, 'right')
  }

  if (!viewport || viewport.width < 48 || viewport.height < 48) return next

  if (next.leftMode === 'floating' && next.leftFloat) {
    const clamped = clampFloatRect(next.leftFloat, viewport)
    if (
      clamped.x !== next.leftFloat.x ||
      clamped.y !== next.leftFloat.y ||
      clamped.w !== next.leftFloat.w ||
      clamped.h !== next.leftFloat.h
    ) {
      next = { ...next, leftFloat: clamped, leftSize: clamped.w, leftMinimized: false }
    }
  }

  if (next.rightMode === 'floating' && next.rightFloat) {
    const clamped = clampFloatRect(next.rightFloat, viewport)
    if (
      clamped.x !== next.rightFloat.x ||
      clamped.y !== next.rightFloat.y ||
      clamped.w !== next.rightFloat.w ||
      clamped.h !== next.rightFloat.h
    ) {
      next = { ...next, rightFloat: clamped, rightSize: clamped.w, rightMinimized: false }
    }
  }

  return next
}
