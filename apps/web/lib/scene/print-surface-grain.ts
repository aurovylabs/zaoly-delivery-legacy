import type { CSSProperties } from 'react'

/** P55 wrapper class — descendant override onto magazine `.zaoly-print-*`. */
export const PRINT_SURFACE_CLASS = 'creation-scene-node--print-surface'

/** CSS custom properties forwarded from the scene wrap onto inner magazine boxes. */
export const PRINT_GRAIN_VARS = {
  textAlign: '--creation-print-text-align',
  justifyContent: '--creation-print-justify-content',
  alignItems: '--creation-print-align-items',
  fontSize: '--creation-print-font-size',
  fontWeight: '--creation-print-font-weight',
  fontFamily: '--creation-print-font-family',
  textDecoration: '--creation-print-text-decoration',
  textTransform: '--creation-print-text-transform',
  lineHeight: '--creation-print-line-height',
  letterSpacing: '--creation-print-letter-spacing',
  color: '--creation-print-color',
} as const

export type PrintSurfaceGrainPaint = {
  className: string
  wrapStyle: CSSProperties
  textAlign: boolean
  justifyContent: boolean
  alignItems: boolean
  typography: boolean
  /** alignSelf parks the block — table/chip must hug, not width:100% (P91). */
  blockAlign: boolean
}

function cssEnum(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  const text = String(value).trim()
  return text || undefined
}

/** Normalize text-align to Mag/CSS twin vocab (legacy start/end → left/right). */
export function normalizePrintTextAlign(value: string | undefined): string | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  if (v === 'left' || v === 'center' || v === 'right' || v === 'justify') return v
  if (v === 'start' || v === 'flex-start') return 'left'
  if (v === 'end' || v === 'flex-end') return 'right'
  return undefined
}

/** Inspect alignItems (flex) → CSS text-align for magazine inners (P90). */
export function textAlignFromFlexAlign(align: string | undefined): string | undefined {
  return normalizePrintTextAlign(align)
}

/**
 * Keep alignment on the wrap (alignSelf / text-align / flex) and mirror
 * textAlign / justifyContent / alignItems / typography as CSS vars so magazine
 * inner classes can honor them without one-off wrappers. Unset stays unset.
 * When only alignItems is set (no textAlign), mirror a text-align var so
 * PrintTable cells pick up center/end. alignSelf stays block-only (P91).
 */
export function printSurfaceGrainPaint(style: CSSProperties): PrintSurfaceGrainPaint {
  const wrapStyle: CSSProperties = { ...style }
  const vars: Record<string, string> = {}

  let textAlign = normalizePrintTextAlign(cssEnum(style.textAlign))
  const justifyContent = cssEnum(style.justifyContent)
  const alignItems = cssEnum(style.alignItems)
  const alignSelf = cssEnum(style.alignSelf)

  if (!textAlign && alignItems) {
    textAlign = textAlignFromFlexAlign(alignItems)
  }

  if (textAlign) vars[PRINT_GRAIN_VARS.textAlign] = textAlign
  if (justifyContent) vars[PRINT_GRAIN_VARS.justifyContent] = justifyContent
  if (alignItems) vars[PRINT_GRAIN_VARS.alignItems] = alignItems

  const fontSize = cssEnum(style.fontSize)
  const fontWeight = cssEnum(style.fontWeight)
  const fontFamily = cssEnum(style.fontFamily)
  const textDecoration = cssEnum(style.textDecoration)
  const textTransform = cssEnum(style.textTransform)
  const lineHeight = cssEnum(style.lineHeight)
  const letterSpacing = cssEnum(style.letterSpacing)
  const color = cssEnum(style.color)

  if (fontSize) vars[PRINT_GRAIN_VARS.fontSize] = fontSize
  if (fontWeight) vars[PRINT_GRAIN_VARS.fontWeight] = fontWeight
  if (fontFamily) vars[PRINT_GRAIN_VARS.fontFamily] = fontFamily
  if (textDecoration) vars[PRINT_GRAIN_VARS.textDecoration] = textDecoration
  if (textTransform) vars[PRINT_GRAIN_VARS.textTransform] = textTransform
  if (lineHeight) vars[PRINT_GRAIN_VARS.lineHeight] = lineHeight
  if (letterSpacing) vars[PRINT_GRAIN_VARS.letterSpacing] = letterSpacing
  if (color) vars[PRINT_GRAIN_VARS.color] = color

  const typography = Boolean(
    fontSize ||
      fontWeight ||
      fontFamily ||
      textDecoration ||
      textTransform ||
      lineHeight ||
      letterSpacing ||
      color,
  )

  const blockAlign =
    alignSelf === 'center' ||
    alignSelf === 'flex-end' ||
    alignSelf === 'end' ||
    alignSelf === 'flex-start' ||
    alignSelf === 'start'

  // Block park without needing a flex parent (PrintPage is block layout): margin auto + hug width.
  if (blockAlign && wrapStyle.width == null) {
    wrapStyle.width = 'max-content'
    wrapStyle.maxWidth = '100%'
    if (alignSelf === 'center') {
      wrapStyle.marginLeft = 'auto'
      wrapStyle.marginRight = 'auto'
    } else if (alignSelf === 'flex-end' || alignSelf === 'end') {
      wrapStyle.marginLeft = 'auto'
    } else if (alignSelf === 'flex-start' || alignSelf === 'start') {
      wrapStyle.marginRight = 'auto'
    }
  }

  return {
    className: PRINT_SURFACE_CLASS,
    wrapStyle: { ...wrapStyle, ...vars },
    textAlign: Boolean(textAlign),
    justifyContent: Boolean(justifyContent),
    alignItems: Boolean(alignItems),
    typography,
    blockAlign,
  }
}
