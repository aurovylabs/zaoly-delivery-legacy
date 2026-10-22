/**
 * Mag PDF instance paint (P84 color/box · P86 layout/type).
 * Maps Creation inspect paint → Mag wrap + text styles.
 */

import type { CSSProperties } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import type { MagazineColorOverrides, MagRankedListTones } from '@zaoly/ui/mag'
import {
  isLayoutGapId,
  layoutGapFromBindings,
  resolveNodePaintStyle,
  type LayoutGapId,
} from '../inspect/resolve-bindings'
import {
  INSPECT_TOKEN_CATALOG,
  mergeLivePackIntoCatalog,
  type BrandTokenPackResponse,
  type InspectTokenOption,
} from '../inspect/token-catalog'
import { sanitizeMagPaper } from './mag-paper'

/** react-pdf text overrides (Mag label / headline). */
export type MagTextStyle = {
  fontSize?: number
  fontWeight?: number | string
  lineHeight?: number
  letterSpacing?: number
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  /** Ink (token color) — Mag Text consumers; not only MagTheme tones. */
  color?: string
  /** Registered Mag face or token pack-resolved family. */
  fontFamily?: string
  textDecoration?: string
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
}

/** CSS px → PDF pt (96dpi / 72pt-inch). Explicit `pt` stays as-is. */
export const CSS_PX_TO_PDF_PT = 0.75

export type MagInstancePaint = {
  /** react-pdf View wrap (box + flex layout). */
  wrapStyle?: Record<string, string | number>
  /** MagRankedList / text tone overrides. */
  tones?: MagRankedListTones
  /** Typography overrides for Mag Text (label / title). */
  textStyle?: MagTextStyle
  /** Document-level Mag theme hints (PrintPage / Cover). */
  theme?: MagazineColorOverrides
}

const BOX_LENGTH_KEYS = [
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'gap',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'borderRadius',
  'borderWidth',
] as const

/** Inspect pairs → react-pdf physical sides (no paddingBlock in yoga). */
const LOGICAL_BOX_EXPAND: Record<string, readonly [string, string]> = {
  paddingBlock: ['paddingTop', 'paddingBottom'],
  paddingInline: ['paddingLeft', 'paddingRight'],
  marginBlock: ['marginTop', 'marginBottom'],
  marginInline: ['marginLeft', 'marginRight'],
}

const LAYOUT_ENUM_KEYS = ['alignItems', 'justifyContent', 'alignSelf', 'flexDirection'] as const

const SIZE_PERCENT_KEYS = new Set(['width', 'height', 'minWidth', 'maxWidth', 'minHeight', 'maxHeight'])

const TEXT_ALIGN = new Set(['left', 'center', 'right', 'justify'])

/** Match DS stack gap rhythm (≈ rem → pt at 12pt root). */
export const LAYOUT_GAP_PT: Record<LayoutGapId, number> = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
}

function asCssColor(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  if (!v) return undefined
  if (/^#([0-9a-fA-F]{3,8})$/.test(v) || /^(rgb|rgba)\(/i.test(v)) return v
  return undefined
}

/** Convert CSS lengths (px/rem/mm/pt) to react-pdf pt numbers. */
export function cssLengthToPdf(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * CSS_PX_TO_PDF_PT * 100) / 100
  }
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  if (!v) return undefined
  if (isLayoutGapId(v)) return LAYOUT_GAP_PT[v]
  if (/^\d+(\.\d+)?$/.test(v)) {
    const n = Number(v)
    // Unitless ratios (line-height ≈ 1.2) stay as multipliers; larger = CSS px.
    if (n > 0 && n <= 4) return n
    return Math.round(n * CSS_PX_TO_PDF_PT * 100) / 100
  }
  const px = /^(\d+(\.\d+)?)px$/i.exec(v)
  if (px) return Math.round(Number(px[1]) * CSS_PX_TO_PDF_PT * 100) / 100
  const rem = /^(\d+(\.\d+)?)rem$/i.exec(v)
  if (rem) return Math.round(Number(rem[1]) * 12 * 100) / 100
  const mm = /^(\d+(\.\d+)?)mm$/i.exec(v)
  if (mm) return Math.round(Number(mm[1]) * 2.834645669 * 100) / 100
  const cm = /^(\d+(\.\d+)?)cm$/i.exec(v)
  if (cm) return Math.round(Number(cm[1]) * 28.34645669 * 100) / 100
  const pt = /^(\d+(\.\d+)?)pt$/i.exec(v)
  if (pt) return Number(pt[1])
  return undefined
}

/** Keep % sizes as strings for react-pdf (cssLengthToPdf cannot map %). */
function cssSizeToPdf(value: unknown): string | number | undefined {
  if (typeof value === 'string') {
    const v = value.trim()
    if (/^\d+(\.\d+)?%$/.test(v)) return v
  }
  return cssLengthToPdf(value)
}

function expandLogicalBox(
  paint: Record<string, unknown>,
  wrapStyle: Record<string, string | number>,
) {
  for (const [logical, sides] of Object.entries(LOGICAL_BOX_EXPAND)) {
    const len = cssLengthToPdf(paint[logical])
    if (len == null) continue
    for (const side of sides) {
      if (wrapStyle[side] == null) wrapStyle[side] = len
    }
  }
}

function textAlignFromFlexAlign(align: unknown): MagTextStyle['textAlign'] | undefined {
  if (typeof align !== 'string') return undefined
  const v = align.trim()
  if (v === 'center') return 'center'
  if (v === 'flex-end' || v === 'end') return 'right'
  if (v === 'flex-start' || v === 'start') return 'left'
  return undefined
}

/** Normalize inspector/CSS text-align → Mag vocabulary (legacy start/end → left/right). */
export function normalizeTextAlign(value: unknown): MagTextStyle['textAlign'] | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  if (TEXT_ALIGN.has(v)) return v as MagTextStyle['textAlign']
  if (v === 'start' || v === 'flex-start') return 'left'
  if (v === 'end' || v === 'flex-end') return 'right'
  return undefined
}

function asTextAlign(value: unknown): MagTextStyle['textAlign'] | undefined {
  return normalizeTextAlign(value)
}

const TEXT_TRANSFORM = new Set(['none', 'uppercase', 'lowercase', 'capitalize'])

function asTextTransform(value: unknown): MagTextStyle['textTransform'] | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim().toLowerCase()
  return TEXT_TRANSFORM.has(v) ? (v as MagTextStyle['textTransform']) : undefined
}

function asFontFamily(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return v || undefined
}

function asTextDecoration(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return v || undefined
}

function asFontWeight(value: unknown): number | string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
    return value.trim()
  }
  return undefined
}

/** Build inspect catalog for Mag paint (fixture + live token pack overlay). */
export function catalogForMagPaint(
  pack: BrandTokenPackResponse | null | undefined,
): InspectTokenOption[] {
  if (pack?.tokens?.length) return mergeLivePackIntoCatalog(pack.tokens)
  return INSPECT_TOKEN_CATALOG
}

/**
 * Mag paint resolve (P89): prefer print-channel CSS (CT-6), then fill gaps from
 * digital — same color fallback contract, extended to spacing/size/type so Mag
 * PDF matches the Print viewport when token pack leaves lack a print facet.
 */
function resolveMagPaintCss(
  node: SceneNode,
  catalog: InspectTokenOption[],
): Record<string, unknown> {
  const nodeStyle = (node.style ?? {}) as CSSProperties
  const printPaint = resolveNodePaintStyle(
    node.props,
    node.tokenBindings,
    nodeStyle,
    catalog,
    'print',
  ) as Record<string, unknown>
  const digitalPaint = resolveNodePaintStyle(
    node.props,
    node.tokenBindings,
    nodeStyle,
    catalog,
    'digital',
  ) as Record<string, unknown>
  const out: Record<string, unknown> = { ...digitalPaint }
  for (const [key, value] of Object.entries(printPaint)) {
    if (value != null && value !== '') out[key] = value
  }
  return out
}

export function resolveMagInstancePaint(
  node: SceneNode,
  catalog: InspectTokenOption[] = INSPECT_TOKEN_CATALOG,
): MagInstancePaint {
  const paint = resolveMagPaintCss(node, catalog)

  const wrapStyle: Record<string, string | number> = {}
  for (const key of BOX_LENGTH_KEYS) {
    const len = SIZE_PERCENT_KEYS.has(key) ? cssSizeToPdf(paint[key]) : cssLengthToPdf(paint[key])
    if (len != null) wrapStyle[key] = len
  }
  expandLogicalBox(paint, wrapStyle)
  for (const key of LAYOUT_ENUM_KEYS) {
    const raw = paint[key]
    if (typeof raw === 'string' && raw.trim()) wrapStyle[key] = raw.trim()
  }
  const bg = asCssColor(paint.backgroundColor)
  if (bg) wrapStyle.backgroundColor = bg
  if (typeof paint.opacity === 'number' && Number.isFinite(paint.opacity)) {
    wrapStyle.opacity = paint.opacity
  } else if (typeof paint.opacity === 'string') {
    const n = Number(paint.opacity)
    if (Number.isFinite(n)) wrapStyle.opacity = n
  }

  // Gap from enum / token pack spacing when author set gap (not Mag chrome default).
  if (wrapStyle.gap == null && (node.tokenBindings?.gap || node.props?.gap != null)) {
    wrapStyle.gap = LAYOUT_GAP_PT[layoutGapFromBindings(node.props, node.tokenBindings)]
  }

  const color = asCssColor(paint.color)
  const borderColor = asCssColor(paint.borderColor)
  const tones: MagRankedListTones = {}
  if (color) {
    tones.ink = color
    tones.accentInk = color
  }
  if (borderColor) tones.line = borderColor

  const textStyle: MagTextStyle = {}
  const fontSize = cssLengthToPdf(paint.fontSize)
  if (fontSize != null) textStyle.fontSize = fontSize
  const fontWeight = asFontWeight(paint.fontWeight)
  if (fontWeight != null) textStyle.fontWeight = fontWeight
  const lineHeight = cssLengthToPdf(paint.lineHeight)
  if (lineHeight != null) textStyle.lineHeight = lineHeight
  const letterSpacing = cssLengthToPdf(paint.letterSpacing)
  if (letterSpacing != null) textStyle.letterSpacing = letterSpacing
  if (color) textStyle.color = color
  const fontFamily = asFontFamily(paint.fontFamily)
  if (fontFamily) textStyle.fontFamily = fontFamily
  const textDecoration = asTextDecoration(paint.textDecoration)
  if (textDecoration) textStyle.textDecoration = textDecoration
  const textTransform = asTextTransform(paint.textTransform)
  if (textTransform) textStyle.textTransform = textTransform
  let textAlign = asTextAlign(paint.textAlign)
  // Cell/typography alignment only — never promote alignSelf (block park) into textAlign (P91).
  if (!textAlign) textAlign = textAlignFromFlexAlign(wrapStyle.alignItems)
  if (textAlign) {
    textStyle.textAlign = textAlign
  }
  // MagPage column parks blocks via alignSelf. Do not invent alignSelf from alignItems —
  // that made PrintTable hug+width:100% circular and force page breaks (P91).
  // Authors set alignSelf explicitly (Constraints → Align self).

  const theme: MagazineColorOverrides = {}
  const paper = sanitizeMagPaper(bg)
  if (paper) theme.paper = paper
  if (color) {
    theme.ink = color
    theme.inkSoft = color
  }
  if (borderColor) theme.line = borderColor

  return {
    wrapStyle: Object.keys(wrapStyle).length ? wrapStyle : undefined,
    tones: Object.keys(tones).length ? tones : undefined,
    textStyle: Object.keys(textStyle).length ? textStyle : undefined,
    theme: Object.keys(theme).length ? theme : undefined,
  }
}

/** Merge Mag text styles (later keys win). */
export function mergeMagTextStyles(
  ...parts: Array<MagTextStyle | undefined>
): MagTextStyle | undefined {
  const out: MagTextStyle = {}
  for (const part of parts) {
    if (!part) continue
    Object.assign(out, part)
  }
  return Object.keys(out).length ? out : undefined
}

/** Color + type from a RankedRow label Text (or the row itself). */
export function resolveRankedRowLabelPaint(
  row: SceneNode,
  catalog: InspectTokenOption[],
): { color?: string; textStyle?: MagTextStyle } {
  const labelChild =
    row.children?.find((c) => c.props?.slot === 'label') ??
    row.children?.find((c) => c.type === 'Text' || c.type === 'Heading')
  const target = labelChild ?? row
  const paint = resolveMagInstancePaint(target, catalog)
  return {
    color: paint.tones?.ink,
    textStyle: paint.textStyle,
  }
}

/**
 * Paint from a slotted Text/Heading (title/value/label…) — Size/Align live on
 * the slot child in the editor, not on the Print* shell.
 */
export function resolveSlotTextPaint(
  parent: SceneNode,
  slot: string,
  catalog: InspectTokenOption[],
): MagTextStyle | undefined {
  const hit = parent.children?.find((c) => c.props?.slot === slot)
  if (!hit) return undefined
  return resolveMagInstancePaint(hit, catalog).textStyle
}

export function resolveRankedRowLabelColor(
  row: SceneNode,
  catalog: InspectTokenOption[],
): string | undefined {
  return resolveRankedRowLabelPaint(row, catalog).color
}

/**
 * First PrintPage / PrintCover instance theme hints for MagThemeProvider merge.
 */
export function magThemeOverridesFromSceneRoot(
  root: SceneNode,
  catalog: InspectTokenOption[],
): MagazineColorOverrides {
  const overrides: MagazineColorOverrides = {}
  const visit = (node: SceneNode, depth: number) => {
    if (depth > 6) return
    if (node.type === 'PrintPage' || node.type === 'PrintCover') {
      const paint = resolveMagInstancePaint(node, catalog)
      if (paint.theme) {
        for (const [k, v] of Object.entries(paint.theme)) {
          if (v != null && overrides[k as keyof MagazineColorOverrides] == null) {
            ;(overrides as Record<string, unknown>)[k] = v
          }
        }
      }
    }
    for (const child of node.children ?? []) visit(child, depth + 1)
  }
  visit(root, 0)
  return overrides
}
