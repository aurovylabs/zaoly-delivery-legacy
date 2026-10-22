import type { CSSProperties } from 'react'
import type { TokenChannel } from './digital-css'
import { previewForBinding, tokenByPath, type InspectTokenOption } from './token-catalog'
import { applyClipPathToStyle } from './clip-insets'

/** Map token binding keys → CSS properties for canvas preview. */
const BINDING_TO_CSS: Record<string, keyof CSSProperties> = {
  radius: 'borderRadius',
  radiusTopLeft: 'borderTopLeftRadius',
  radiusTopRight: 'borderTopRightRadius',
  radiusBottomRight: 'borderBottomRightRadius',
  radiusBottomLeft: 'borderBottomLeftRadius',
  opacity: 'opacity',
  padding: 'padding',
  paddingTop: 'paddingTop',
  paddingRight: 'paddingRight',
  paddingBottom: 'paddingBottom',
  paddingLeft: 'paddingLeft',
  paddingBlock: 'paddingBlock',
  paddingInline: 'paddingInline',
  margin: 'margin',
  marginTop: 'marginTop',
  marginRight: 'marginRight',
  marginBottom: 'marginBottom',
  marginLeft: 'marginLeft',
  marginBlock: 'marginBlock',
  marginInline: 'marginInline',
  gap: 'gap',
  rowGap: 'rowGap',
  columnGap: 'columnGap',
  background: 'backgroundColor',
  color: 'color',
  borderColor: 'borderColor',
  borderWidth: 'borderWidth',
  shadow: 'boxShadow',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',
  width: 'width',
  height: 'height',
  minWidth: 'minWidth',
  maxWidth: 'maxWidth',
  minHeight: 'minHeight',
  maxHeight: 'maxHeight',
  gradient: 'backgroundImage',
  backgroundImage: 'backgroundImage', backgroundSize: 'backgroundSize',
  backgroundPosition: 'backgroundPosition', backgroundRepeat: 'backgroundRepeat',
  position: 'position', top: 'top', right: 'right', bottom: 'bottom', left: 'left',
  zIndex: 'zIndex', aspectRatio: 'aspectRatio', flexGrow: 'flexGrow',
  flexShrink: 'flexShrink', flexBasis: 'flexBasis', objectFit: 'objectFit',
  objectPosition: 'objectPosition', gridTemplateColumns: 'gridTemplateColumns',
  gridTemplateRows: 'gridTemplateRows', gridAutoFlow: 'gridAutoFlow',
  gridAutoRows: 'gridAutoRows', gridAutoColumns: 'gridAutoColumns',
  justifyItems: 'justifyItems', justifySelf: 'justifySelf', order: 'order',
  gridColumn: 'gridColumn', gridRow: 'gridRow',
}

const LAYOUT_GAPS = ['none', 'xs', 'sm', 'md', 'lg', 'xl'] as const
export type LayoutGapId = (typeof LAYOUT_GAPS)[number]

export function isLayoutGapId(value: unknown): value is LayoutGapId {
  return typeof value === 'string' && (LAYOUT_GAPS as readonly string[]).includes(value)
}

/**
 * Deposit ladder `spacing.static.1…6` → Stack/Grid gap ids (CT-14 / DS-DEPOSIT D4).
 * Aligns with `@zaoly/ui` `.ds-stack--gap-*` → `--space-1…4` / `--space-6` (no `--space-5` enum).
 * Fixture demo aliases `small|medium|large` stay for P39 scenes.
 */
export const SPACING_STATIC_GAP_MAP: Record<string, LayoutGapId> = {
  '1': 'xs',
  '2': 'sm',
  '3': 'md',
  '4': 'lg',
  '5': 'xl',
  '6': 'xl',
  small: 'sm',
  medium: 'md',
  large: 'lg',
}

/**
 * D7 role paths → static step (mirrors suite `SPACING_ROLE_ALIASES`).
 * CREATION must not invent CREATION-only aliases; keep in sync with path map.
 */
export const SPACING_ROLE_STATIC_STEP: Record<string, string> = {
  'spacing.padding.xs': '1',
  'spacing.padding.sm': '2',
  'spacing.padding.md': '3',
  'spacing.padding.lg': '4',
  'spacing.padding.xl': '5',
  'spacing.padding.2xl': '6',
  'spacing.margin.xs': '1',
  'spacing.margin.sm': '2',
  'spacing.margin.md': '3',
  'spacing.margin.lg': '4',
  'spacing.margin.xl': '5',
  'spacing.margin.2xl': '6',
  'spacing.margin.page': '6',
  'spacing.margin.top': '5',
  'spacing.gap.xs': '1',
  'spacing.gap.sm': '2',
  'spacing.gap.md': '3',
  'spacing.gap.lg': '4',
  'spacing.gap.xl': '5',
  'spacing.gap.2xl': '6',
  'spacing.gap.tight': '2',
  'spacing.gap.modules': '4',
}

/** Resolve token pack spacing path → static step leaf for gap enum map. */
export function staticStepFromSpacingPath(path: string): string | undefined {
  if (path.startsWith('spacing.static.')) {
    return path.slice('spacing.static.'.length)
  }
  return SPACING_ROLE_STATIC_STEP[path]
}

/**
 * Map a token pack spacing.* token (or legacy enum prop) onto Stack/Grid gap ids.
 * CSS literals (`16`, `12px`) skip the DS enum so wrap/inner style.gap can paint.
 * Accepts `spacing.static.*` and D7 role paths (`spacing.gap.*` / padding / margin).
 */
export function layoutGapFromBindings(
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
): LayoutGapId {
  const g = props?.gap
  if (isLayoutGapId(g)) return g
  const path = tokenBindings?.gap
  if (typeof path === 'string' && path.startsWith('spacing.')) {
    const leaf = staticStepFromSpacingPath(path)
    if (leaf) {
      const mapped = SPACING_STATIC_GAP_MAP[leaf]
      if (mapped) return mapped
    }
  }
  if (g != null && g !== '') return 'none'
  return 'md'
}

/** Enum/boolean props that preview as CSS on the node wrap (never free CSS in attrs). */
export function resolveEnumPropsToStyle(props?: Record<string, unknown> | null): CSSProperties {
  const style: CSSProperties = {}
  if (!props) return style

  const overflow = props.overflow
  if (typeof overflow === 'string' && overflow) style.overflow = overflow as CSSProperties['overflow']

  if (typeof props.position === 'string') style.position = props.position as CSSProperties['position']
  if (typeof props.aspectRatio === 'string' && props.aspectRatio !== 'auto') style.aspectRatio = props.aspectRatio

  const textDecoration = props.textDecoration
  if (typeof textDecoration === 'string' && textDecoration) {
    style.textDecoration = textDecoration
  }

  const fontStyle = props.fontStyle
  if (typeof fontStyle === 'string' && fontStyle) {
    style.fontStyle = fontStyle as CSSProperties['fontStyle']
  }

  const textTransform = props.textTransform
  if (typeof textTransform === 'string' && textTransform) {
    // Include `none` so role CSS (e.g. Site Kit label uppercase) can be cleared.
    style.textTransform = textTransform as CSSProperties['textTransform']
  }

  const textAlign = props.textAlign
  if (typeof textAlign === 'string' && textAlign) {
    style.textAlign = textAlign as CSSProperties['textAlign']
  }

  const alignSelf = props.alignSelf
  if (typeof alignSelf === 'string' && alignSelf && alignSelf !== 'auto') {
    style.alignSelf = alignSelf as CSSProperties['alignSelf']
  }

  // Stack contract uses `align` / `justify`; Print* / shared flex use CSS names.
  const alignItems =
    (typeof props.alignItems === 'string' && props.alignItems) ||
    (typeof props.align === 'string' && props.align) ||
    undefined
  if (alignItems) {
    style.alignItems = alignItems as CSSProperties['alignItems']
  }

  const justifyContent =
    (typeof props.justifyContent === 'string' && props.justifyContent) ||
    (typeof props.justify === 'string' && props.justify) ||
    undefined
  if (justifyContent) {
    style.justifyContent = justifyContent as CSSProperties['justifyContent']
  }

  const alignContent = props.alignContent
  if (typeof alignContent === 'string' && alignContent) {
    style.alignContent = alignContent as CSSProperties['alignContent']
  }

  const borderStyle = props.borderStyle
  if (typeof borderStyle === 'string' && borderStyle) {
    style.borderStyle = borderStyle as CSSProperties['borderStyle']
  }

  if (typeof props.backgroundImage === 'string' && props.backgroundImage) {
    const rawUrl = props.backgroundImage.trim()
    if (rawUrl) {
      const formattedUrl = rawUrl.startsWith('url(') || rawUrl.startsWith('linear-gradient(') || rawUrl.startsWith('radial-gradient(')
        ? rawUrl
        : `url("${rawUrl}")`
      if (typeof props.backgroundOverlay === 'string' && props.backgroundOverlay) {
        style.backgroundImage = `${props.backgroundOverlay}, ${formattedUrl}`
      } else {
        style.backgroundImage = formattedUrl
      }
    }
  }
  if (typeof props.backgroundSize === 'string' && props.backgroundSize) {
    style.backgroundSize = props.backgroundSize as CSSProperties['backgroundSize']
  }
  if (typeof props.backgroundPosition === 'string' && props.backgroundPosition) {
    style.backgroundPosition = props.backgroundPosition as CSSProperties['backgroundPosition']
  }
  if (typeof props.backgroundRepeat === 'string' && props.backgroundRepeat) {
    style.backgroundRepeat = props.backgroundRepeat as CSSProperties['backgroundRepeat']
  }

  if (typeof props.mixBlendMode === 'string' && props.mixBlendMode !== 'normal') style.mixBlendMode = props.mixBlendMode as CSSProperties['mixBlendMode']
  if (typeof props.transformOrigin === 'string') style.transformOrigin = props.transformOrigin
  if (props.scale != null && props.scale !== '' && props.scale !== '1') style.scale = String(props.scale)
  else if (props.scaleX != null || props.scaleY != null) style.scale = `${props.scaleX ?? 1} ${props.scaleY ?? 1}`
  if (props.skewX != null || props.skewY != null) {
    const x = String(props.skewX ?? 0); const y = String(props.skewY ?? 0)
    style.transform = `skew(${x.endsWith('deg') ? x : `${x}deg`}, ${y.endsWith('deg') ? y : `${y}deg`})`
  }
  const filters: string[] = []
  if (typeof props.filter === 'string' && props.filter) style.filter = props.filter
  else {
    const add = (key: string, fn: string, fallback: string, unit = '') => {
      const value = props[key]
      if (value != null && value !== '' && String(value) !== fallback) filters.push(`${fn}(${String(value).endsWith(unit) ? value : `${value}${unit}`})`)
    }
    add('blur', 'blur', '0', 'px'); add('filterBrightness', 'brightness', '100%')
    add('filterContrast', 'contrast', '100%'); add('filterSaturate', 'saturate', '100%')
    add('filterGrayscale', 'grayscale', '0%'); add('filterInvert', 'invert', '0%')
    add('filterHueRotate', 'hue-rotate', '0deg', 'deg')
    if (filters.length) style.filter = filters.join(' ')
  }
  if (typeof props.objectFit === 'string') style.objectFit = props.objectFit as CSSProperties['objectFit']
  if (typeof props.objectPosition === 'string') style.objectPosition = props.objectPosition
  for (const key of ['gridTemplateColumns', 'gridTemplateRows', 'gridAutoRows', 'gridAutoColumns'] as const) {
    if (typeof props[key] === 'string' && props[key]) style[key] = props[key]
  }
  if (typeof props.gridAutoFlow === 'string') style.gridAutoFlow = props.gridAutoFlow as CSSProperties['gridAutoFlow']
  if (typeof props.justifyItems === 'string') style.justifyItems = props.justifyItems as CSSProperties['justifyItems']
  if (typeof props.justifySelf === 'string') style.justifySelf = props.justifySelf as CSSProperties['justifySelf']
  if (props.order != null && props.order !== '') style.order = Number(props.order)
  if (typeof props.gridColumn === 'string') style.gridColumn = props.gridColumn
  else if (props.colSpan && props.colSpan !== 'auto') style.gridColumn = String(props.colSpan).startsWith('span') || props.colSpan === '1 / -1' ? String(props.colSpan) : `span ${props.colSpan}`
  else if (props.colStart || props.colEnd) style.gridColumn = `${props.colStart ?? 'auto'} / ${props.colEnd ?? 'auto'}`
  if (typeof props.gridRow === 'string') style.gridRow = props.gridRow
  else if (props.rowSpan && props.rowSpan !== 'auto') style.gridRow = String(props.rowSpan).startsWith('span') || props.rowSpan === '1 / -1' ? String(props.rowSpan) : `span ${props.rowSpan}`
  else if (props.rowStart || props.rowEnd) style.gridRow = `${props.rowStart ?? 'auto'} / ${props.rowEnd ?? 'auto'}`

  return style
}

function applySpecialBinding(key: string, preview: string, style: CSSProperties) {
  if (key === 'blur') {
    style.filter = preview === 'none' ? 'none' : preview
    return true
  }
  if (key === 'rotate') {
    style.transform = preview === 'none' ? undefined : preview
    return true
  }
  return false
}

export function resolveTokenBindingsToStyle(
  tokenBindings?: Record<string, string> | null,
  base?: CSSProperties,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): CSSProperties {
  const style: CSSProperties = { ...(base ?? {}) }
  if (!tokenBindings) return style

  for (const [key, path] of Object.entries(tokenBindings)) {
    const token = tokenByPath(path, catalog)
    if (!token) continue
    const preview = previewForBinding(token, key, channel)
    if (preview == null) continue
    if (applySpecialBinding(key, preview, style)) continue
    const cssKey = BINDING_TO_CSS[key]
    if (!cssKey) continue
    const value = cssKey === 'fontFamily' ? withCanvasFontFallback(preview) : preview
    ;(style as Record<string, string | number>)[cssKey] = value
  }

  if (tokenBindings.borderColor || tokenBindings.borderWidth) {
    style.borderStyle = style.borderStyle ?? 'solid'
  }

  return style
}

export function parseInspectLiteral(raw: string): string | number {
  const text = raw.trim()
  if (!text) return ''
  if (/^-?\d+(\.\d+)?$/.test(text)) return Number(text)
  return text
}

function cssFromProp(value: unknown): string | number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return undefined
  const text = String(value).trim()
  return text || undefined
}

/** Bare family names without a generic fallback paint as Times when the face is missing. */
export function withCanvasFontFallback(family: string): string {
  const v = family.trim()
  if (!v) return v
  if (/sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|emoji|math|fangsong/i.test(v)) {
    return v
  }
  return `${v}, system-ui, sans-serif`
}

/** Typed gap that is not a Stack/Grid enum — paint as CSS on the flex/grid parent. */
export function cssGapLiteral(props?: Record<string, unknown> | null): string | number | undefined {
  const g = props?.gap
  if (g == null || g === '' || isLayoutGapId(g)) return undefined
  return cssFromProp(g)
}

/**
 * P56 shared apply map: catalog surface keys on `props` → wrap CSS.
 * Used by every registered type — not PrintChip-only.
 */
export function resolveSurfacePropsToStyle(
  props?: Record<string, unknown> | null,
): CSSProperties {
  const style: CSSProperties = {}
  if (!props) return style
  for (const [key, cssKey] of Object.entries(BINDING_TO_CSS)) {
    if (key === 'gap' && isLayoutGapId(props[key])) continue
    const css = cssFromProp(props[key])
    if (css == null) continue
    const value =
      cssKey === 'fontFamily' && typeof css === 'string' ? withCanvasFontFallback(css) : css
    ;(style as Record<string, string | number>)[cssKey] = value
  }
  return style
}

/**
 * Paint precedence (high wins):
 * 1. Baked `node.style` snapshot (Master deposit / HTML import)
 * 2. Token bindings
 * 3. Explicit props (HUD / Inspect literals — must beat Master style + bindings)
 * 4. Enum props
 *
 * Site Kit Masters often ship both `style.fontWeight: "400"` and a typography
 * binding. Instance HUD writes go to `instanceOverrides.props`; if style stayed
 * last, weight/size/family never painted. See `composition-masters.md`.
 */
export function resolveNodePaintStyle(
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
  nodeStyle?: CSSProperties | null,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): CSSProperties {
  const style: CSSProperties = {
    ...((nodeStyle ?? {}) as CSSProperties),
    ...resolveTokenBindingsToStyle(tokenBindings, undefined, catalog, channel),
    ...resolveSurfacePropsToStyle(props),
    ...resolveEnumPropsToStyle(props),
  }
  return applyLayoutContainment(
    applyClipPathToStyle(style, props, tokenBindings, catalog, channel),
  )
}

/**
 * Keep hug/fill descendants inside a fixed-size ancestor (Figma-like).
 * Flex default `min-width: auto` lets intrinsic content blow past a 400px parent;
 * hug (`auto`) / fill (`100%`) therefore get `min-*: 0` + `max-*: 100%` unless the
 * designer set an explicit min/max. Fixed literals keep their size (no forced max).
 */
export function applyLayoutContainment(style: CSSProperties): CSSProperties {
  const next: CSSProperties = { ...style }
  if (next.boxSizing == null) next.boxSizing = 'border-box'

  const width = normalizeSizeToken(next.width)
  const height = normalizeSizeToken(next.height)

  if (isUnsetOrAutoMin(next.minWidth)) next.minWidth = 0
  if (isUnsetOrAutoMin(next.minHeight)) next.minHeight = 0

  if (isHugOrFillSize(width) && isUnsetMax(next.maxWidth)) {
    next.maxWidth = '100%'
  }
  if (isHugOrFillSize(height) && isUnsetMax(next.maxHeight)) {
    next.maxHeight = '100%'
  }

  return next
}

function normalizeSizeToken(value: unknown): string | number | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'boolean') return undefined
  return String(value).trim()
}

function isHugOrFillSize(value: string | number | undefined): boolean {
  if (value == null) return true
  if (typeof value === 'number') return false
  const v = value.toLowerCase()
  return (
    v === 'auto' ||
    v === 'fit-content' ||
    v === 'max-content' ||
    v === 'min-content' ||
    v === '100%' ||
    v === '1fr'
  )
}

function isUnsetOrAutoMin(value: unknown): boolean {
  if (value == null || value === '') return true
  if (typeof value === 'number') return false
  const v = String(value).trim().toLowerCase()
  return v === 'auto'
}

function isUnsetMax(value: unknown): boolean {
  if (value == null || value === '') return true
  if (typeof value === 'number') return false
  return String(value).trim() === ''
}

/** CSS fill for the editor artboard pad — mirrors the painted page/view root `background`. */
export function resolveArtboardFillCss(
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
  nodeStyle?: CSSProperties | null,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): string | undefined {
  const painted = resolveNodePaintStyle(props, tokenBindings, nodeStyle, catalog, channel)
  const bg = painted.backgroundColor
  return typeof bg === 'string' && bg.trim() ? bg.trim() : undefined
}
