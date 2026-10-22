/**
 * Pack-backed CSS media thresholds — specs/domain/media-breakpoints.md
 */
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import { EDITOR_BREAKPOINT_WIDTHS, type DigitalEditorBreakpoint } from '../scene/breakpoints'

export const MEDIA_BREAKPOINT_PATH_PREFIX = 'media.breakpoint.'

export type MediaLane = DigitalEditorBreakpoint

export type MediaDigitalDraft = {
  label: string
  minWidth: string
  lane: '' | MediaLane
}

export type MediaBreakpoint = {
  path: string
  id: string
  label: string
  minWidth: number
  lane?: MediaLane
}

const LANES = new Set<string>(['mobile', 'tablet', 'desktop'])

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function parseLeafObject(value: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(value))
  } catch {
    return null
  }
}

function pathId(path: string): string {
  const parts = path.split('.').filter(Boolean)
  return parts[parts.length - 1] || path
}

export function isMediaLane(value: string): value is MediaLane {
  return LANES.has(value)
}

export function emptyMediaDraft(): MediaDigitalDraft {
  return { label: '', minWidth: '768', lane: 'tablet' }
}

export function readMediaDigitalDraft(value: string | null | undefined): MediaDigitalDraft {
  const empty = emptyMediaDraft()
  if (!value) return empty
  const rec = parseLeafObject(value)
  const dig = asRecord(rec?.digital)
  if (!dig) return empty
  const minWidth = dig.minWidth
  const laneRaw = typeof dig.lane === 'string' ? dig.lane.trim() : ''
  return {
    label: typeof dig.label === 'string' ? dig.label : '',
    minWidth:
      typeof minWidth === 'number' && Number.isFinite(minWidth) && minWidth >= 0
        ? String(Math.round(minWidth))
        : empty.minWidth,
    lane: isMediaLane(laneRaw) ? laneRaw : '',
  }
}

export function readMediaSummary(value: string): string {
  const d = readMediaDigitalDraft(value)
  const q = `min-width: ${d.minWidth}px`
  return d.label.trim() ? `${d.label.trim()} · ${q}` : q
}

export function buildMediaValue(draft: MediaDigitalDraft): string | null {
  const minWidth = Number(draft.minWidth)
  if (!Number.isFinite(minWidth) || minWidth < 0) return null
  const digital: Record<string, unknown> = { minWidth: Math.round(minWidth) }
  const label = draft.label.trim()
  if (label) digital.label = label
  if (draft.lane && isMediaLane(draft.lane)) digital.lane = draft.lane
  return JSON.stringify({ digital })
}

export function applyMediaDigital(
  _prev: string | null | undefined,
  draft: MediaDigitalDraft,
): string | null {
  return buildMediaValue(draft)
}

export function mediaBreakpointFromLeaf(leaf: ZaolyPackLeaf): MediaBreakpoint | null {
  if (leaf.type !== 'media') return null
  if (!leaf.path.startsWith(MEDIA_BREAKPOINT_PATH_PREFIX)) return null
  const draft = readMediaDigitalDraft(leaf.value)
  const minWidth = Number(draft.minWidth)
  if (!Number.isFinite(minWidth) || minWidth < 0) return null
  const id = pathId(leaf.path)
  return {
    path: leaf.path,
    id,
    label: draft.label.trim() || id,
    minWidth: Math.round(minWidth),
    ...(draft.lane ? { lane: draft.lane } : {}),
  }
}

/** Seed CSS media thresholds (mobile-first base = 0). */
export function defaultMediaBreakpointLeaves(): ZaolyPackLeaf[] {
  const defs: Array<{ id: string; lane: MediaLane; minWidth: number; label: string }> = [
    { id: 'mobile', lane: 'mobile', minWidth: 0, label: 'Mobile' },
    {
      id: 'tablet',
      lane: 'tablet',
      minWidth: EDITOR_BREAKPOINT_WIDTHS.tablet,
      label: 'Tablet',
    },
    {
      id: 'desktop',
      lane: 'desktop',
      minWidth: EDITOR_BREAKPOINT_WIDTHS.desktop,
      label: 'Desktop',
    },
  ]
  return defs.map((d) => ({
    path: `${MEDIA_BREAKPOINT_PATH_PREFIX}${d.id}`,
    type: 'media',
    value: JSON.stringify({
      digital: { minWidth: d.minWidth, lane: d.lane, label: d.label },
    }),
    status: 'active',
  }))
}

export function mediaBreakpointsFromLeaves(leaves: readonly ZaolyPackLeaf[]): MediaBreakpoint[] {
  const out: MediaBreakpoint[] = []
  for (const leaf of leaves) {
    const row = mediaBreakpointFromLeaf(leaf)
    if (row) out.push(row)
  }
  out.sort((a, b) => a.minWidth - b.minWidth || a.id.localeCompare(b.id))
  return out
}

/** CSS custom properties for pack dump. */
export function formatMediaBreakpointCssVars(leaves: readonly ZaolyPackLeaf[]): string[] {
  return mediaBreakpointsFromLeaves(leaves).map(
    (bp) => `  --zaoly-media-${bp.id}: ${bp.minWidth}px;`,
  )
}

/** `@media` stubs for handoff (skips minWidth 0). */
export function formatMediaBreakpointQueries(leaves: readonly ZaolyPackLeaf[]): string {
  const lines: string[] = []
  for (const bp of mediaBreakpointsFromLeaves(leaves)) {
    if (bp.minWidth <= 0) continue
    lines.push(`/* ${bp.label} */`)
    lines.push(`@media (min-width: ${bp.minWidth}px) {`)
    lines.push(`  /* … */`)
    lines.push(`}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}
