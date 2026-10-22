/**
 * Local Phase B clip presets (mirrors zaoly-ui `clip-presets.ts`).
 * Flat expand/detect is CREATION-owned; DS helper is also re-exported from `lib/zaoly-ui.ts`.
 * Keep mapping in sync with `packages/ui/src/lib/clip-presets.ts` (CL14–CL17).
 */

import {
  CLIP_INSET_PROP_KEYS,
  type ClipInsetPropKey,
  type CornerInsets,
} from './clip-insets'
import { parseClipPolygonPoints } from './clip-polygon'

export const DEFAULT_CLIP_PRESET_AMOUNT = '12%'

export const CLIP_PRESET_IDS = [
  'none',
  'slant-bottom',
  'slant-bottom-flip',
  'slant-top',
  'trapezoid',
  'parallelogram',
] as const

export type ClipPresetId = (typeof CLIP_PRESET_IDS)[number]

export const CLIP_PRESET_OPTIONS: Array<{ value: ClipPresetId; label: string }> = [
  { value: 'none', label: 'None' },
  { value: 'slant-bottom', label: 'Bottom slant' },
  { value: 'slant-bottom-flip', label: 'Bottom slant (flip)' },
  { value: 'slant-top', label: 'Top slant' },
  { value: 'trapezoid', label: 'Trapezoid' },
  { value: 'parallelogram', label: 'Parallelogram' },
]

function resolveAmount(amount?: string): string {
  const trimmed = amount?.trim() ?? ''
  return trimmed || DEFAULT_CLIP_PRESET_AMOUNT
}

export function cornerInsetsFromClipPreset(
  id: ClipPresetId,
  amount?: string,
): CornerInsets {
  if (id === 'none') return {}
  const a = resolveAmount(amount)
  switch (id) {
    case 'slant-bottom':
      return { bottomLeft: { y: a } }
    case 'slant-bottom-flip':
      return { bottomRight: { y: a } }
    case 'slant-top':
      return { topLeft: { y: a } }
    case 'trapezoid':
      return { bottomLeft: { x: a }, bottomRight: { x: a } }
    case 'parallelogram':
      return { topLeft: { x: a }, bottomRight: { x: a } }
    default:
      return {}
  }
}

/** Expand a preset to flat scene props (all eight keys — empty string clears). */
export function clipInsetPropsFromPreset(
  id: ClipPresetId,
  amount?: string,
): Record<ClipInsetPropKey, string> {
  const insets = cornerInsetsFromClipPreset(id, amount)
  const out = Object.fromEntries(
    CLIP_INSET_PROP_KEYS.map((key) => [key, '']),
  ) as Record<ClipInsetPropKey, string>

  if (insets.topLeft?.x) out.clipInsetTopLeftX = insets.topLeft.x
  if (insets.topLeft?.y) out.clipInsetTopLeftY = insets.topLeft.y
  if (insets.topRight?.x) out.clipInsetTopRightX = insets.topRight.x
  if (insets.topRight?.y) out.clipInsetTopRightY = insets.topRight.y
  if (insets.bottomRight?.x) out.clipInsetBottomRightX = insets.bottomRight.x
  if (insets.bottomRight?.y) out.clipInsetBottomRightY = insets.bottomRight.y
  if (insets.bottomLeft?.x) out.clipInsetBottomLeftX = insets.bottomLeft.x
  if (insets.bottomLeft?.y) out.clipInsetBottomLeftY = insets.bottomLeft.y
  return out
}

type ClipSource = {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

function axisDisplay(source: ClipSource, key: ClipInsetPropKey): string {
  const binding = source.tokenBindings?.[key]
  if (typeof binding === 'string' && binding.trim()) return binding.trim()
  const raw = source.props?.[key]
  if (raw == null) return ''
  return String(raw).trim()
}

function collectedAxes(source: ClipSource): Partial<Record<ClipInsetPropKey, string>> {
  const out: Partial<Record<ClipInsetPropKey, string>> = {}
  for (const key of CLIP_INSET_PROP_KEYS) {
    const v = axisDisplay(source, key)
    if (v) out[key] = v
  }
  return out
}

/**
 * Detect which preset exactly matches current insets (CL17).
 * Returns `none` when empty; `null` when custom / unmatched.
 */
export function detectClipPreset(source: ClipSource): ClipPresetId | null {
  if (parseClipPolygonPoints(source.props?.clipPolygon)) return null
  const axes = collectedAxes(source)
  const keys = Object.keys(axes) as ClipInsetPropKey[]
  if (keys.length === 0) return 'none'

  if (keys.length === 1 && axes.clipInsetBottomLeftY) return 'slant-bottom'
  if (keys.length === 1 && axes.clipInsetBottomRightY) return 'slant-bottom-flip'
  if (keys.length === 1 && axes.clipInsetTopLeftY) return 'slant-top'
  if (
    keys.length === 2 &&
    axes.clipInsetBottomLeftX &&
    axes.clipInsetBottomRightX &&
    axes.clipInsetBottomLeftX === axes.clipInsetBottomRightX
  ) {
    return 'trapezoid'
  }
  if (
    keys.length === 2 &&
    axes.clipInsetTopLeftX &&
    axes.clipInsetBottomRightX &&
    axes.clipInsetTopLeftX === axes.clipInsetBottomRightX
  ) {
    return 'parallelogram'
  }
  if (
    keys.length === 2 &&
    axes.clipInsetBottomLeftY &&
    axes.clipInsetBottomRightY &&
    axes.clipInsetBottomLeftY === axes.clipInsetBottomRightY
  ) {
    return 'slant-bottom'
  }
  return null
}

/** Best amount string for the compact Amount field given current / detected preset. */
export function amountForClipPreset(
  source: ClipSource,
  preset: ClipPresetId | null = detectClipPreset(source),
): string {
  if (!preset || preset === 'none') {
    return (
      axisDisplay(source, 'clipInsetBottomLeftY') ||
      axisDisplay(source, 'clipInsetBottomRightY') ||
      axisDisplay(source, 'clipInsetTopLeftY') ||
      axisDisplay(source, 'clipInsetBottomLeftX') ||
      axisDisplay(source, 'clipInsetTopLeftX') ||
      ''
    )
  }
  switch (preset) {
    case 'slant-bottom':
      return axisDisplay(source, 'clipInsetBottomLeftY')
    case 'slant-bottom-flip':
      return axisDisplay(source, 'clipInsetBottomRightY')
    case 'slant-top':
      return axisDisplay(source, 'clipInsetTopLeftY')
    case 'trapezoid':
      return axisDisplay(source, 'clipInsetBottomLeftX')
    case 'parallelogram':
      return axisDisplay(source, 'clipInsetTopLeftX')
    default:
      return ''
  }
}

export function isClipPresetId(value: string): value is ClipPresetId {
  return (CLIP_PRESET_IDS as readonly string[]).includes(value)
}
