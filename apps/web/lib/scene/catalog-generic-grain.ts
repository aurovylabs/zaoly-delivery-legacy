import type { CSSProperties } from 'react'

/** Catalog types without a contract — wrap chrome forwarded onto inner DS surfaces. */
export const CATALOG_GENERIC_CLASS = 'creation-scene-node--catalog-generic'

/**
 * Custom properties inherit through intermediate hosts (`.ds-chat-block-panel`).
 * `background-color` / `border-radius` do not — PrintChip uses the same var pattern.
 */
export const CATALOG_GENERIC_VARS = {
  fill: '--creation-catalog-fill',
  fillImage: '--creation-catalog-fill-image',
  radius: '--creation-catalog-radius',
  borderColor: '--creation-catalog-border-color',
  borderWidth: '--creation-catalog-border-width',
  borderStyle: '--creation-catalog-border-style',
  boxShadow: '--creation-catalog-box-shadow',
  color: '--creation-catalog-color',
  fontSize: '--creation-catalog-font-size',
  fontWeight: '--creation-catalog-font-weight',
  fontFamily: '--creation-catalog-font-family',
  lineHeight: '--creation-catalog-line-height',
  letterSpacing: '--creation-catalog-letter-spacing',
  textAlign: '--creation-catalog-text-align',
  textDecoration: '--creation-catalog-text-decoration',
  textTransform: '--creation-catalog-text-transform',
} as const

export type CatalogGenericGrainPaint = {
  className: string
  wrapStyle: CSSProperties
  fill: boolean
  radius: boolean
  stroke: boolean
  typography: boolean
}

function cssVal(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  const text = String(value).trim()
  return text || undefined
}

function assignVar(
  vars: Record<string, string>,
  wrapStyle: CSSProperties,
  key: keyof CSSProperties,
  cssVar: string,
  value: string | undefined,
) {
  if (!value) return
  vars[cssVar] = value
  delete wrapStyle[key]
}

/** Unset stays unset. Data attrs gate descendant var apply so default DS chrome is unchanged. */
export function catalogGenericGrainPaint(style: CSSProperties): CatalogGenericGrainPaint {
  const wrapStyle: CSSProperties = { ...style }
  const vars: Record<string, string> = {}

  const fill = cssVal(style.backgroundColor)
  const fillImage = cssVal(style.backgroundImage)
  assignVar(vars, wrapStyle, 'backgroundColor', CATALOG_GENERIC_VARS.fill, fill)
  assignVar(vars, wrapStyle, 'backgroundImage', CATALOG_GENERIC_VARS.fillImage, fillImage)
  if (fill || fillImage) delete wrapStyle.background

  const radius = cssVal(style.borderRadius)
  assignVar(vars, wrapStyle, 'borderRadius', CATALOG_GENERIC_VARS.radius, radius)

  const borderColor = cssVal(style.borderColor)
  const borderWidth = cssVal(style.borderWidth)
  const borderStyle = cssVal(style.borderStyle)
  const boxShadow = cssVal(style.boxShadow)
  assignVar(vars, wrapStyle, 'borderColor', CATALOG_GENERIC_VARS.borderColor, borderColor)
  assignVar(vars, wrapStyle, 'borderWidth', CATALOG_GENERIC_VARS.borderWidth, borderWidth)
  assignVar(vars, wrapStyle, 'borderStyle', CATALOG_GENERIC_VARS.borderStyle, borderStyle)
  assignVar(vars, wrapStyle, 'boxShadow', CATALOG_GENERIC_VARS.boxShadow, boxShadow)

  const color = cssVal(style.color)
  const fontSize = cssVal(style.fontSize)
  const fontWeight = cssVal(style.fontWeight)
  const fontFamily = cssVal(style.fontFamily)
  const lineHeight = cssVal(style.lineHeight)
  const letterSpacing = cssVal(style.letterSpacing)
  const textAlign = cssVal(style.textAlign)
  const textDecoration = cssVal(style.textDecoration)
  const textTransform = cssVal(style.textTransform)
  assignVar(vars, wrapStyle, 'color', CATALOG_GENERIC_VARS.color, color)
  assignVar(vars, wrapStyle, 'fontSize', CATALOG_GENERIC_VARS.fontSize, fontSize)
  assignVar(vars, wrapStyle, 'fontWeight', CATALOG_GENERIC_VARS.fontWeight, fontWeight)
  assignVar(vars, wrapStyle, 'fontFamily', CATALOG_GENERIC_VARS.fontFamily, fontFamily)
  assignVar(vars, wrapStyle, 'lineHeight', CATALOG_GENERIC_VARS.lineHeight, lineHeight)
  assignVar(vars, wrapStyle, 'letterSpacing', CATALOG_GENERIC_VARS.letterSpacing, letterSpacing)
  assignVar(vars, wrapStyle, 'textAlign', CATALOG_GENERIC_VARS.textAlign, textAlign)
  assignVar(vars, wrapStyle, 'textDecoration', CATALOG_GENERIC_VARS.textDecoration, textDecoration)
  assignVar(vars, wrapStyle, 'textTransform', CATALOG_GENERIC_VARS.textTransform, textTransform)

  return {
    className: CATALOG_GENERIC_CLASS,
    wrapStyle: { ...wrapStyle, ...vars },
    fill: Boolean(fill || fillImage),
    radius: Boolean(radius),
    stroke: Boolean(borderColor || borderWidth || borderStyle || boxShadow),
    typography: Boolean(
      color ||
        fontSize ||
        fontWeight ||
        fontFamily ||
        lineHeight ||
        letterSpacing ||
        textAlign ||
        textDecoration ||
        textTransform,
    ),
  }
}
