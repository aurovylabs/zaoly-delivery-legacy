/**
 * Pack-backed artboard size presets — specs/domain/artboard-presets.md
 */
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import { EDITOR_BREAKPOINT_WIDTHS, type DigitalEditorBreakpoint } from '../scene/breakpoints'

export const ARTBOARD_PRESET_PATH_PREFIX = 'artboard.preset.'

export type ArtboardLane = DigitalEditorBreakpoint

export type ArtboardDigitalDraft = {
  label: string
  width: string
  height: string
  lane: '' | ArtboardLane
}

export type ArtboardPreset = {
  path: string
  id: string
  label: string
  width: number
  height: number
  lane?: ArtboardLane
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

export function isArtboardLane(value: string): value is ArtboardLane {
  return LANES.has(value)
}

export function emptyArtboardDraft(): ArtboardDigitalDraft {
  return {
    label: '',
    width: String(EDITOR_BREAKPOINT_WIDTHS.desktop),
    height: '900',
    lane: 'desktop',
  }
}

export function readArtboardDigitalDraft(value: string | null | undefined): ArtboardDigitalDraft {
  const empty = emptyArtboardDraft()
  if (!value) return empty
  const rec = parseLeafObject(value)
  const dig = asRecord(rec?.digital)
  if (!dig) return empty
  const width = dig.width
  const height = dig.height
  const laneRaw = typeof dig.lane === 'string' ? dig.lane.trim() : ''
  return {
    label: typeof dig.label === 'string' ? dig.label : '',
    width: typeof width === 'number' && Number.isFinite(width) ? String(Math.round(width)) : empty.width,
    height: typeof height === 'number' && Number.isFinite(height) ? String(Math.round(height)) : empty.height,
    lane: isArtboardLane(laneRaw) ? laneRaw : '',
  }
}

export function readArtboardSummary(value: string): string {
  const d = readArtboardDigitalDraft(value)
  const dims = `${d.width} × ${d.height}`
  return d.label.trim() ? `${d.label.trim()} · ${dims}` : dims
}

export function buildArtboardValue(draft: ArtboardDigitalDraft): string | null {
  const width = Number(draft.width)
  const height = Number(draft.height)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  const digital: Record<string, unknown> = {
    width: Math.round(width),
    height: Math.round(height),
  }
  const label = draft.label.trim()
  if (label) digital.label = label
  if (draft.lane && isArtboardLane(draft.lane)) digital.lane = draft.lane
  return JSON.stringify({ digital })
}

export function applyArtboardDigital(
  _prevValue: string | null | undefined,
  draft: ArtboardDigitalDraft,
): string | null {
  return buildArtboardValue(draft)
}

export function artboardPresetFromLeaf(leaf: ZaolyPackLeaf): ArtboardPreset | null {
  if (leaf.type !== 'artboard') return null
  if (!leaf.path.startsWith(ARTBOARD_PRESET_PATH_PREFIX)) return null
  const draft = readArtboardDigitalDraft(leaf.value)
  const width = Number(draft.width)
  const height = Number(draft.height)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  const id = pathId(leaf.path)
  const label = draft.label.trim() || id
  return {
    path: leaf.path,
    id,
    label,
    width: Math.round(width),
    height: Math.round(height),
    ...(draft.lane ? { lane: draft.lane } : {}),
  }
}

/** Seed Desktop / Tablet / Mobile — fixture side of the local pack merge. */
export function defaultArtboardPresetLeaves(): ZaolyPackLeaf[] {
  const defs: Array<{ id: string; lane: ArtboardLane; width: number; height: number; label: string }> = [
    {
      id: 'desktop',
      lane: 'desktop',
      width: EDITOR_BREAKPOINT_WIDTHS.desktop,
      height: 900,
      label: 'Desktop',
    },
    {
      id: 'tablet',
      lane: 'tablet',
      width: EDITOR_BREAKPOINT_WIDTHS.tablet,
      height: 1024,
      label: 'Tablet',
    },
    {
      id: 'mobile',
      lane: 'mobile',
      width: EDITOR_BREAKPOINT_WIDTHS.mobile,
      height: 844,
      label: 'Mobile',
    },
  ]
  return defs.map((d) => ({
    path: `${ARTBOARD_PRESET_PATH_PREFIX}${d.id}`,
    type: 'artboard',
    value: JSON.stringify({
      digital: { width: d.width, height: d.height, lane: d.lane, label: d.label },
    }),
    status: 'active',
  }))
}

/** Valid artboard presets from a merged pack (seed + local). */
export function artboardPresetsFromLeaves(leaves: readonly ZaolyPackLeaf[]): ArtboardPreset[] {
  const out: ArtboardPreset[] = []
  for (const leaf of leaves) {
    const preset = artboardPresetFromLeaf(leaf)
    if (preset) out.push(preset)
  }
  out.sort((a, b) => a.label.localeCompare(b.label) || a.path.localeCompare(b.path))
  return out
}
