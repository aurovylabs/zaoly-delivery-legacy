import type { CSSProperties } from 'react'

/** P54 wrapper class — descendant override onto `.zaoly-print-chip`. */
export const PRINT_CHIP_SURFACE_CLASS = 'creation-scene-node--print-chip'

/** CSS custom properties forwarded from the scene wrap onto the visible magazine chip. */
export const PRINT_CHIP_SURFACE_VARS = {
  borderWidth: '--creation-print-chip-border-width',
  borderColor: '--creation-print-chip-border-color',
  borderStyle: '--creation-print-chip-border-style',
  radius: '--creation-print-chip-radius',
  color: '--creation-print-chip-color',
  fill: '--creation-print-chip-fill',
} as const

export type PrintChipSurfacePaint = {
  className: string
  wrapStyle: CSSProperties
  stroke: boolean
  radius: boolean
  ink: boolean
  fill: boolean
  size: boolean
}

function cssLen(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return `${value}px`
  const text = String(value).trim()
  return text || undefined
}

/**
 * Split PrintChip wrap hit-box vs visible chip chrome.
 * Stroke/radius/ink/fill live as CSS vars so the wrap does not double-paint
 * the DS `border: 1px solid var(--print-line)` on `.zaoly-print-chip`.
 */
export function printChipSurfacePaint(style: CSSProperties): PrintChipSurfacePaint {
  const wrapStyle: CSSProperties = { ...style, display: 'inline-flex' }
  const vars: Record<string, string> = {}

  const borderWidth = cssLen(style.borderWidth)
  const borderColor = cssLen(style.borderColor)
  const borderStyle = cssLen(style.borderStyle)
  const stroke = Boolean(borderWidth || borderColor || borderStyle)
  if (stroke) {
    if (borderWidth) vars[PRINT_CHIP_SURFACE_VARS.borderWidth] = borderWidth
    if (borderColor) vars[PRINT_CHIP_SURFACE_VARS.borderColor] = borderColor
    if (borderStyle) vars[PRINT_CHIP_SURFACE_VARS.borderStyle] = borderStyle
    delete wrapStyle.borderWidth
    delete wrapStyle.borderColor
    delete wrapStyle.borderStyle
    delete wrapStyle.border
  }

  const radius = cssLen(style.borderRadius)
  if (radius) {
    vars[PRINT_CHIP_SURFACE_VARS.radius] = radius
    delete wrapStyle.borderRadius
  }

  const ink = cssLen(style.color)
  if (ink) {
    vars[PRINT_CHIP_SURFACE_VARS.color] = ink
    delete wrapStyle.color
  }

  const fill = cssLen(style.backgroundColor) ?? cssLen(style.background)
  if (fill) {
    vars[PRINT_CHIP_SURFACE_VARS.fill] = fill
    delete wrapStyle.backgroundColor
    delete wrapStyle.background
  }

  const size = Boolean(cssLen(style.width) || cssLen(style.height))

  return {
    className: PRINT_CHIP_SURFACE_CLASS,
    wrapStyle: { ...wrapStyle, ...vars },
    stroke,
    radius: Boolean(radius),
    ink: Boolean(ink),
    fill: Boolean(fill),
    size,
  }
}
