import type {
  SceneBreakpointId,
  SceneNode,
  SceneOp,
  SceneStyleDimensionKey,
} from '@zaoly/contracts'
import { asPackLeafInput, sizeLadderCss } from '../inspect/digital-css'
import { tokensForGroup, tokenByPath } from '../inspect/token-catalog'
import {
  cascadeNodeForBreakpoint,
  writesToBreakpointOverride,
  type DigitalPrimaryBreakpoint,
} from './cascade'

function tokenSnapCss(tok: ReturnType<typeof tokenByPath>): string | undefined {
  if (!tok) return undefined
  const leaf = asPackLeafInput(tok)
  if (leaf?.type === 'size') {
    return sizeLadderCss(leaf) ?? tok.preview
  }
  return tok.preview
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se'

const MIN_SIZE = 24
/** Prefer token snap when within this many CSS px of a size token. */
const TOKEN_SNAP_PX = 28

/** Size tokens usable for width/height snap (excludes hug/auto and full/%). */
export function sizeTokensWithPx(): Array<{ path: string; px: number }> {
  return tokensForGroup('size')
    .map((tok) => {
      const px = cssLengthToPx(tokenSnapCss(tok))
      return px == null ? null : { path: tok.path, px }
    })
    .filter((row): row is { path: string; px: number } => row != null)
    .sort((a, b) => a.px - b.px)
}

export function cssLengthToPx(value: string | number | undefined | null): number | null {
  if (value == null) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const raw = String(value).trim()
  if (!raw || raw === 'auto' || raw.endsWith('%')) return null
  if (raw.endsWith('rem')) {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n * 16 : null
  }
  if (raw.endsWith('px')) {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : null
  }
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : null
}

export function nearestSizeTokenPath(px: number): string | null {
  const ladder = sizeTokensWithPx()
  if (!ladder.length) return null
  let best = ladder[0]
  let bestDist = Math.abs(px - best.px)
  for (const row of ladder.slice(1)) {
    const dist = Math.abs(px - row.px)
    if (dist < bestDist) {
      best = row
      bestDist = dist
    }
  }
  return best.path
}

export function applyResizeDelta(
  start: { width: number; height: number },
  handle: ResizeHandle,
  dx: number,
  dy: number,
  minSize = MIN_SIZE,
): { width: number; height: number } {
  let width = start.width
  let height = start.height
  if (handle.includes('e')) width = start.width + dx
  if (handle.includes('w')) width = start.width - dx
  if (handle.includes('s')) height = start.height + dy
  if (handle.includes('n')) height = start.height - dy
  return {
    width: Math.max(minSize, Math.round(width)),
    height: Math.max(minSize, Math.round(height)),
  }
}

function axisPx(
  node: SceneNode,
  key: SceneStyleDimensionKey,
  measured: number,
  breakpoint: SceneBreakpointId = 'desktop',
  primary: DigitalPrimaryBreakpoint = 'desktop',
): number {
  const cascaded = cascadeNodeForBreakpoint(node, breakpoint, primary)
  const binding = cascaded.tokenBindings[key]
  if (binding) {
    const fromToken = cssLengthToPx(tokenSnapCss(tokenByPath(binding)))
    if (fromToken != null) return fromToken
  }
  const fromProp = cssLengthToPx(cascaded.props[key] as string | number | undefined)
  if (fromProp != null) return fromProp
  const fromStyle = cssLengthToPx(node.style?.[key])
  if (fromStyle != null) return fromStyle
  return measured
}

function emitSizeOp(
  node: SceneNode,
  key: SceneStyleDimensionKey,
  breakpoint: SceneBreakpointId,
  mode: 'token' | 'literal',
  value: string | number,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  const useOverride = writesToBreakpointOverride(breakpoint, primary)
  if (mode === 'token') {
    const tokenPath = String(value)
    if (useOverride) {
      const ops: SceneOp[] = [
        {
          op: 'set_breakpoint_override',
          nodeId: node.id,
          breakpoint,
          tokenBindings: { [key]: tokenPath },
        },
      ]
      const existing = node.breakpoints?.[breakpoint]?.props?.[key]
      if (existing != null) {
        ops.push({
          op: 'clear_breakpoint_override',
          nodeId: node.id,
          breakpoint,
          keys: [key],
          clearProps: true,
          clearTokens: false,
        })
      }
      return ops
    }
    return [{ op: 'set_token_binding', nodeId: node.id, key, tokenPath }]
  }

  const px = typeof value === 'number' ? value : Number(value)
  if (useOverride) {
    const ops: SceneOp[] = [
      {
        op: 'set_breakpoint_override',
        nodeId: node.id,
        breakpoint,
        props: { [key]: `${px}px` },
      },
    ]
    const existingTok = node.breakpoints?.[breakpoint]?.tokenBindings?.[key]
    if (existingTok) {
      ops.push({
        op: 'clear_breakpoint_override',
        nodeId: node.id,
        breakpoint,
        keys: [key],
        clearProps: false,
        clearTokens: true,
      })
    }
    return ops
  }
  return [{ op: 'set_style', nodeId: node.id, key, value: px }]
}

/**
 * Plan scene ops for a resize commit — token-first when snapping or already bound;
 * otherwise numeric size. On non-desktop breakpoints (incl. print), write
 * `set_breakpoint_override` so Mag/print cascade sees the size (never base-only).
 */
export function planResizeOps(
  node: SceneNode,
  next: { width: number; height: number },
  measured: { width: number; height: number },
  breakpoint: SceneBreakpointId = 'desktop',
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  const ops: SceneOp[] = []
  const cascaded = cascadeNodeForBreakpoint(node, breakpoint, primary)
  for (const key of ['width', 'height'] as const) {
    const target = next[key]
    const current = axisPx(node, key, measured[key], breakpoint, primary)
    const hasBinding = Boolean(cascaded.tokenBindings[key])
    const hasLiteral =
      cascaded.props[key] != null ||
      (!writesToBreakpointOverride(breakpoint, primary) && node.style?.[key] != null)
    if (target === current && !hasLiteral && !hasBinding) {
      continue
    }
    if (Math.abs(target - current) < 1 && hasBinding) {
      continue
    }

    const nearest = nearestSizeTokenPath(target)
    const nearestPx = nearest ? cssLengthToPx(tokenSnapCss(tokenByPath(nearest))) : null
    const snap =
      nearest != null &&
      nearestPx != null &&
      (hasBinding || Math.abs(nearestPx - target) <= TOKEN_SNAP_PX)

    if (snap && nearest) {
      if (cascaded.tokenBindings[key] !== nearest) {
        ops.push(...emitSizeOp(node, key, breakpoint, 'token', nearest, primary))
      }
    } else {
      ops.push(...emitSizeOp(node, key, breakpoint, 'literal', target, primary))
    }
  }
  return ops
}

export function cycleSizeToken(currentPath: string | null | undefined, direction: 1 | -1): string {
  const ladder = sizeTokensWithPx()
  if (!ladder.length) return 'size.logo.min'
  const idx = ladder.findIndex((row) => row.path === currentPath)
  const start = idx >= 0 ? idx : direction > 0 ? -1 : ladder.length
  const next = Math.max(0, Math.min(ladder.length - 1, start + direction))
  return ladder[next].path
}

const NUDGE_STEP_PX = 8

/**
 * Plan ops for arrow-key size nudge (flow layout — no free X/Y).
 * Token-bound axes cycle the size ladder; otherwise numeric ±8px (min 24).
 * Print/tablet/mobile lanes write breakpoint overrides.
 */
export function planNudgeOps(
  node: SceneNode,
  axis: SceneStyleDimensionKey,
  direction: 1 | -1,
  measured: number,
  breakpoint: SceneBreakpointId = 'desktop',
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  const cascaded = cascadeNodeForBreakpoint(node, breakpoint, primary)
  const binding = cascaded.tokenBindings[axis]
  if (binding) {
    const nextPath = cycleSizeToken(binding, direction)
    if (nextPath === binding) return []
    return emitSizeOp(node, axis, breakpoint, 'token', nextPath, primary)
  }

  const current = axisPx(node, axis, measured, breakpoint, primary)
  const next = Math.max(MIN_SIZE, Math.round(current + direction * NUDGE_STEP_PX))
  const hasLiteral =
    cascaded.props[axis] != null ||
    (!writesToBreakpointOverride(breakpoint, primary) && node.style?.[axis] != null)
  if (next === current && hasLiteral) return []
  return emitSizeOp(node, axis, breakpoint, 'literal', next, primary)
}
