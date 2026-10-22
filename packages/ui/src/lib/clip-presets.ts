/**
 * Clip / slant presets → corner insets (zaoly-ui-surface-clip Phase B / CREATION CL14–CL16).
 * Paint SSOT remains corner insets + `clipPathFromCornerInsets`.
 */

import type { CornerInsets } from './clip-path-from-corner-insets'

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

function resolveAmount(amount?: string): string {
  const trimmed = amount?.trim() ?? ''
  return trimmed || DEFAULT_CLIP_PRESET_AMOUNT
}

/** Map a preset id to corner insets (empty for `none`). */
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
