import type { InspectFieldDef } from './field-catalog'
import { CLIP_INSET_PROP_KEYS } from './clip-insets'
import { parseClipPolygonPoints } from './clip-polygon'
import { detectClipPreset } from './clip-presets'

export const CLIP_SLANT_EXPANDED_KEY = 'creation-editor-inspect-clip-slant-expanded'
export const CLIP_POLYGON_PROP = 'clipPolygon'
export const CLIP_PATH_D_PROP = 'clipPathD'

export const CLIP_SLANT_GROUP_KEYS = [
  ...CLIP_INSET_PROP_KEYS,
  CLIP_POLYGON_PROP,
  CLIP_PATH_D_PROP,
] as const

export const CLIP_SLANT_FIELD_NAMES = new Set<string>(CLIP_SLANT_GROUP_KEYS)

const CORNER_PAIRS: Array<[string, string]> = [
  ['clipInsetTopLeftX', 'clipInsetTopLeftY'],
  ['clipInsetTopRightX', 'clipInsetTopRightY'],
  ['clipInsetBottomRightX', 'clipInsetBottomRightY'],
  ['clipInsetBottomLeftX', 'clipInsetBottomLeftY'],
]

export function isClipSlantGroupedField(name: string): boolean {
  return CLIP_SLANT_FIELD_NAMES.has(name)
}

export function partitionInspectClipSlantFields(fields: InspectFieldDef[]): {
  clip: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const clip: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isClipSlantGroupedField(field.name)) clip.push(field)
    else rest.push(field)
  }
  return { clip, rest }
}

export function clipSlantCornerPairs(
  fields: InspectFieldDef[],
): Array<[InspectFieldDef, InspectFieldDef]> {
  const byName = new Map(fields.map((f) => [f.name, f]))
  const pairs: Array<[InspectFieldDef, InspectFieldDef]> = []
  for (const [left, right] of CORNER_PAIRS) {
    const a = byName.get(left)
    const b = byName.get(right)
    if (a && b) pairs.push([a, b])
  }
  return pairs
}

type ClipSource = {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

function hasBinding(source: ClipSource, key: string): boolean {
  const binding = source.tokenBindings?.[key]
  return typeof binding === 'string' && binding.length > 0
}

function hasLiteral(source: ClipSource, key: string): boolean {
  const raw = source.props?.[key]
  return raw != null && String(raw).trim() !== ''
}

function displayValue(source: ClipSource, key: string): string {
  if (hasBinding(source, key)) return source.tokenBindings![key]!
  if (hasLiteral(source, key)) return String(source.props![key]).trim()
  return ''
}

/** Compact Bottom slant Amount → `clipInsetBottomLeftY` (CL10). */
export function compactBottomSlantAmount(source: ClipSource): string {
  return displayValue(source, 'clipInsetBottomLeftY')
}

/** Mirror on when BR Y matches BL Y and both are set (CL10). */
export function isBottomSlantMirrored(source: ClipSource): boolean {
  const bl = displayValue(source, 'clipInsetBottomLeftY')
  const br = displayValue(source, 'clipInsetBottomRightY')
  return Boolean(bl) && bl === br
}

export function hasActiveClipPolygon(source: ClipSource): boolean {
  return parseClipPolygonPoints(source.props?.clipPolygon) != null
}

export function hasActiveClipPathD(source: ClipSource): boolean {
  const raw = source.props?.clipPathD
  return raw != null && String(raw).trim() !== ''
}

/**
 * Auto-expand when insets are custom (no exact preset match) or polygon/path is set.
 * Known Phase B presets stay in compact mode (CL16–CL17).
 */
export function shouldAutoExpandClipSlant(source: ClipSource): boolean {
  if (hasActiveClipPolygon(source) || hasActiveClipPathD(source)) return true
  const preset = detectClipPreset(source)
  if (preset !== null) return false
  for (const key of CLIP_INSET_PROP_KEYS) {
    if (hasBinding(source, key) || hasLiteral(source, key)) return true
  }
  return false
}

export function readClipSlantExpanded(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(CLIP_SLANT_EXPANDED_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeClipSlantExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CLIP_SLANT_EXPANDED_KEY, expanded ? 'true' : 'false')
  } catch {
    /* ignore */
  }
}
