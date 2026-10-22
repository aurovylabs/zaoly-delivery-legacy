/** Rail dock edge + persistence for SnapDock nav rails. */

export type RailDockEdge = 'left' | 'right' | 'top' | 'bottom'

export type RailDockState = {
  edge: RailDockEdge
  offset: number
}

const EDGES: readonly RailDockEdge[] = ['left', 'right', 'top', 'bottom']

export function isRailDockEdge(value: string | null | undefined): value is RailDockEdge {
  return !!value && (EDGES as readonly string[]).includes(value)
}

/** Vertical on left/right; horizontal on top/bottom. */
export function railOrientationFromEdge(edge: RailDockEdge): 'vertical' | 'horizontal' {
  return edge === 'top' || edge === 'bottom' ? 'horizontal' : 'vertical'
}

/** Compact viewport: force bottom dock (match `frame.css` / ultra-wide 900px band). */
export const NAV_RAIL_COMPACT_MEDIA = '(max-width: 900px)' as const

export function clampOffset(value: number): number {
  if (!Number.isFinite(value)) return 0.5
  return Math.min(1, Math.max(0, value))
}

export function resolveRailDock(opts: {
  stored: string | null
  defaultEdge: string
  defaultOffset?: number
}): RailDockState {
  const fallback: RailDockState = {
    edge: isRailDockEdge(opts.defaultEdge) ? opts.defaultEdge : 'left',
    offset: clampOffset(opts.defaultOffset ?? 0.5),
  }
  if (!opts.stored) return fallback
  try {
    const raw = JSON.parse(opts.stored) as { edge?: string; offset?: number }
    const edge = isRailDockEdge(raw.edge) ? raw.edge : fallback.edge
    const offset = clampOffset(typeof raw.offset === 'number' ? raw.offset : fallback.offset)
    return { edge, offset }
  } catch {
    if (isRailDockEdge(opts.stored)) {
      return { edge: opts.stored, offset: fallback.offset }
    }
    return fallback
  }
}

export function serializeRailDock(state: RailDockState): string {
  return JSON.stringify({
    edge: state.edge,
    offset: clampOffset(state.offset),
  })
}

export function remToPx(rem: number): number {
  if (typeof window !== 'undefined' && window.document?.documentElement) {
    const root = Number.parseFloat(getComputedStyle(window.document.documentElement).fontSize || '16')
    if (Number.isFinite(root) && root > 0) return Math.round(rem * root)
  }
  return Math.round(rem * 16)
}

export function readRailDockFromStorage(storageKey: string, defaultEdge: string): RailDockState {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(storageKey)
  } catch {
    stored = null
  }
  return resolveRailDock({
    stored,
    defaultEdge,
    defaultOffset: 0.5,
  })
}

export type ShellFrameStyleInput = {
  railInsetRem?: number
  railGapRem?: number
  railWidthRem?: number
  mainGutterRem?: number
}

export function shellFrameStyle(input: ShellFrameStyleInput = {}): Record<string, string> {
  const inset = `${input.railInsetRem ?? 1}rem`
  const gap = `${input.railGapRem ?? 4}rem`
  const width = `${input.railWidthRem ?? 4.25}rem`
  const radius = `calc(${width} / 2)`
  const gutter = `${input.mainGutterRem ?? 2.5}rem`
  return {
    '--rail-inset': inset,
    '--rail-w': width,
    '--rail-radius': radius,
    '--rail-gap': gap,
    '--main-gutter': gutter,
  }
}
