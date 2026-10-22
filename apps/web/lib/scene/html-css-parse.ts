/**
 * HTML import CSS parse + style→props/style mapping helpers (W5d).
 * Spec: specs/domain/scene-core-split-w5.md · specs/domain/html-scene-import.md
 */
import { clipPropsFromCssPolygon } from './clip-path-import'

export type StyleMap = Record<string, string>

export function parseStyleAttr(raw: string | null | undefined): StyleMap {
  const out: StyleMap = {}
  if (!raw?.trim()) return out
  for (const part of raw.split(';')) {
    const idx = part.indexOf(':')
    if (idx < 0) continue
    const key = part.slice(0, idx).trim().toLowerCase()
    const value = part.slice(idx + 1).trim()
    if (key && value) out[key] = value
  }
  return out
}

/** Tags we map as style keys (simple `h1 {…}` — not compound `.brand span`). */
const STYLE_TAG_SELECTORS =
  'h1|h2|h3|h4|h5|h6|p|a|main|header|footer|nav|section|article|aside|ul|ol|li|button|body|html'

/** Inline tags for `.brand span` / `.intro h2 em` descendant rules (Wave B). */
const INLINE_DESC_TAGS = 'span|em|b|i|strong|small|abbr'

export function styleClassKey(name: string): string {
  return `class:${name.toLowerCase()}`
}

export function styleTagKey(name: string): string {
  return `tag:${name.toLowerCase()}`
}

/**
 * Remove block comments so the rule regex (which requires `}` then only
 * whitespace before the next selector) does not skip classes after comments
 * (e.g. `.cols` after a twin-columns comment).
 */
export function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ')
}

/**
 * Drop `@media` / `@keyframes` / `@supports` / `@import` so mobile overrides
 * cannot clobber the desktop base styles we import into the artboard.
 */
export function stripCssAtRules(css: string): string {
  let out = ''
  let i = 0
  while (i < css.length) {
    if (css[i] !== '@') {
      out += css[i]
      i += 1
      continue
    }
    const semi = css.indexOf(';', i)
    const brace = css.indexOf('{', i)
    if (brace < 0 || (semi >= 0 && semi < brace)) {
      i = semi < 0 ? css.length : semi + 1
      continue
    }
    let depth = 0
    let j = brace
    for (; j < css.length; j += 1) {
      if (css[j] === '{') depth += 1
      else if (css[j] === '}') {
        depth -= 1
        if (depth === 0) {
          j += 1
          break
        }
      }
    }
    i = j
  }
  return out
}

/**
 * Simple `.class` / tag / `body` / `html` / `:root` rules from document `<style>` tags.
 * Compound selectors are ignored except one-level `.class tag` (e.g. `.intro h2`).
 * `@media` blocks are stripped (desktop-first import).
 * Class and tag keys are namespaced so `.nav` ≠ `nav`.
 * Tag selectors must be sole selectors (`nav {…}`), not `footer nav {…}`.
 */
export function parseClassRulesFromDocument(document: Document): Map<string, StyleMap> {
  const rules = new Map<string, StyleMap>()
  // Lookbehind: rule starts at beginning or right after a closing `}`.
  const re = new RegExp(
    `(?:^|(?<=\\}))\\s*(?:\\.([a-zA-Z0-9_-]+)|(:root)\\b|(${STYLE_TAG_SELECTORS})\\b)\\s*\\{([^}]*)\\}`,
    'gi',
  )
  const descRe = new RegExp(
    `(?:^|(?<=\\}))\\s*\\.([a-zA-Z0-9_-]+)\\s+(${STYLE_TAG_SELECTORS}|${INLINE_DESC_TAGS})\\b\\s*\\{([^}]*)\\}`,
    'gi',
  )
  const desc2Re = new RegExp(
    `(?:^|(?<=\\}))\\s*\\.([a-zA-Z0-9_-]+)\\s+(h[1-6]|p)\\s+(${INLINE_DESC_TAGS})\\b\\s*\\{([^}]*)\\}`,
    'gi',
  )
  const sibRe = new RegExp(
    `(?:^|(?<=\\}))\\s*\\.([a-zA-Z0-9_-]+)\\s*\\+\\s*\\.([a-zA-Z0-9_-]+)\\b\\s*\\{([^}]*)\\}`,
    'gi',
  )
  const sibTagRe = new RegExp(
    `(?:^|(?<=\\}))\\s*\\.([a-zA-Z0-9_-]+)\\s+(${STYLE_TAG_SELECTORS})\\s*\\+\\s*\\2\\b\\s*\\{([^}]*)\\}`,
    'gi',
  )
  for (const styleEl of Array.from(document.querySelectorAll('style'))) {
    const css = stripCssAtRules(stripCssComments(styleEl.textContent ?? ''))
    let match: RegExpExecArray | null
    while ((match = re.exec(css))) {
      let key = ''
      if (match[1]) key = styleClassKey(match[1])
      else if (match[2]) key = ':root'
      else if (match[3]) key = styleTagKey(match[3])
      if (!key) continue
      const decls = expandFontShorthand(parseStyleAttr(match[4]!.replace(/\n/g, ';')))
      rules.set(key, { ...(rules.get(key) ?? {}), ...decls })
    }
    while ((match = descRe.exec(css))) {
      const key = `desc:${match[1]!.toLowerCase()}>${match[2]!.toLowerCase()}`
      const decls = expandFontShorthand(parseStyleAttr(match[3]!.replace(/\n/g, ';')))
      rules.set(key, { ...(rules.get(key) ?? {}), ...decls })
    }
    while ((match = desc2Re.exec(css))) {
      const key = `desc:${match[1]!.toLowerCase()}>${match[2]!.toLowerCase()}>${match[3]!.toLowerCase()}`
      const decls = expandFontShorthand(parseStyleAttr(match[4]!.replace(/\n/g, ';')))
      rules.set(key, { ...(rules.get(key) ?? {}), ...decls })
    }
    while ((match = sibRe.exec(css))) {
      const key = `sib:${match[1]!.toLowerCase()}+${match[2]!.toLowerCase()}`
      const decls = expandFontShorthand(parseStyleAttr(match[3]!.replace(/\n/g, ';')))
      rules.set(key, { ...(rules.get(key) ?? {}), ...decls })
    }
    while ((match = sibTagRe.exec(css))) {
      const key = `sib:${match[1]!.toLowerCase()}>${match[2]!.toLowerCase()}+${match[2]!.toLowerCase()}`
      const decls = expandFontShorthand(parseStyleAttr(match[3]!.replace(/\n/g, ';')))
      rules.set(key, { ...(rules.get(key) ?? {}), ...decls })
    }
    // Plain block scan — avoids lookbehind missing the 2nd+ `::before|after` rule in jsdom/vitest.
    const pseudoBlockRe = /([^{]+)\{([^}]*)\}/g
    while ((match = pseudoBlockRe.exec(css))) {
      const selector = match[1]!.trim()
      if (!/::(?:before|after)\b/i.test(selector)) continue
      const decls = expandFontShorthand(parseStyleAttr(match[2]!.replace(/\n/g, ';')))
      for (const hit of parsePseudoSelectorHits(selector)) {
        const key = `pseudo:${hit.class}:${hit.pseudo}`
        rules.set(key, { ...(rules.get(key) ?? {}), ...decls })
      }
    }
  }
  return rules
}

/** Extract `.class::before|after` hits from a selector list (Wave C). */
export function parsePseudoSelectorHits(
  selector: string,
): Array<{ class: string; pseudo: 'before' | 'after' }> {
  const out: Array<{ class: string; pseudo: 'before' | 'after' }> = []
  const re = /\.([a-zA-Z0-9_-]+)::(before|after)\b/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(selector))) {
    out.push({ class: m[1]!.toLowerCase(), pseudo: m[2]!.toLowerCase() as 'before' | 'after' })
  }
  return out
}

/**
 * Expand CSS `font:` shorthand into longhands when missing.
 * Handles `400 clamp(…)/.72 Georgia, serif` and `italic 1.6rem/1 Georgia`.
 */
export function expandFontShorthand(style: StyleMap): StyleMap {
  const font = style.font?.trim()
  if (!font) return style
  const out: StyleMap = { ...style }
  if (/\bitalic\b|\boblique\b/i.test(font) && !out['font-style']) {
    out['font-style'] = 'italic'
  }
  if (!out['font-weight']) {
    const weight = font.match(/\b(100|200|300|400|500|600|700|800|900|bold|normal)\b/i)
    if (weight) out['font-weight'] = weight[1]!
  }
  if (!out['font-size']) {
    const clamp = font.match(/clamp\([^)]+\)/i)
    const size = font.match(/(\d+(?:\.\d+)?(?:rem|px|em|vw|vh|svh|dvh|%))/i)
    if (clamp) out['font-size'] = clamp[0]!
    else if (size) out['font-size'] = size[1]!
  }
  if (!out['line-height']) {
    const lh = font.match(/\/\s*(normal|\.?\d+(?:\.\d+)?)/i)
    if (lh) out['line-height'] = lh[1]!
  }
  if (!out['font-family']) {
    let rest = font
    const clamp = font.match(/clamp\([^)]+\)/i)
    const size = font.match(/(\d+(?:\.\d+)?(?:rem|px|em|vw|vh|svh|dvh|%))/i)
    if (clamp) rest = font.slice(font.indexOf(clamp[0]!) + clamp[0]!.length)
    else if (size) rest = font.slice(font.indexOf(size[1]!) + size[1]!.length)
    rest = rest
      .replace(/^\/\s*(normal|\.?\d+(?:\.\d+)?)\s*/i, '')
      .replace(/^(italic|oblique|bold|normal|\d{3})\s+/i, '')
      .replace(/^,\s*/, '')
      .trim()
    if (rest && !/^\/|^\d/.test(rest)) out['font-family'] = rest
  }
  return out
}

/** Page shell styles from `body` / `html` / `:root` (not class-bound). */
export function pageShellStyle(classRules: Map<string, StyleMap>): StyleMap {
  return {
    ...(classRules.get(':root') ?? {}),
    ...(classRules.get(styleTagKey('html')) ?? {}),
    ...(classRules.get(styleTagKey('body')) ?? {}),
  }
}

/** Custom properties declared on :root / html / body (`--ink: #fff`). */
export function extractCssVars(classRules: Map<string, StyleMap>): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const scope of [':root', styleTagKey('html'), styleTagKey('body')] as const) {
    const map = classRules.get(scope)
    if (!map) continue
    for (const [k, v] of Object.entries(map)) {
      if (k.startsWith('--') && v.trim()) vars[k] = v.trim()
    }
  }
  // Bridge short names ↔ Site-Kit chrome (`--ink` ↔ `--site-ink`) when only one side exists.
  for (const short of ['ink', 'muted', 'line', 'accent', 'font', 'paper', 'radius'] as const) {
    const a = `--${short}`
    const b = `--site-${short}`
    if (!vars[a] && vars[b]) vars[a] = vars[b]!
    if (!vars[b] && vars[a]) vars[b] = vars[a]!
  }
  if (!vars['--bg'] && vars['--site-paper']) vars['--bg'] = vars['--site-paper']!
  if (!vars['--bg'] && vars['--paper']) vars['--bg'] = vars['--paper']!
  return vars
}

function cleanupCssList(value: string): string {
  return value
    .replace(/^\s*,\s*/g, '')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Expand `var(--x)` / `var(--x, fallback)` against document custom properties. */
export function resolveCssVarValue(
  raw: string,
  vars: Record<string, string>,
  depth = 0,
): string {
  if (!raw || depth > 8) return raw
  const resolved = raw.replace(
    /var\(\s*(--[a-zA-Z0-9-_]+)\s*(?:,\s*((?:[^)(]+|\([^)]*\))*))?\)/g,
    (_m, name: string, fallback?: string) => {
      let v = vars[name]
      if ((v == null || v === '') && name.startsWith('--') && !name.startsWith('--site-')) {
        v = vars[`--site-${name.slice(2)}`]
      }
      if ((v == null || v === '') && name.startsWith('--site-')) {
        v = vars[`--${name.slice('--site-'.length)}`]
      }
      if (v != null && v !== '') return resolveCssVarValue(v, vars, depth + 1)
      if (fallback != null && fallback.trim()) {
        return resolveCssVarValue(fallback.trim(), vars, depth + 1)
      }
      return ''
    },
  )
  return cleanupCssList(resolved)
}

export function resolveStyleMap(style: StyleMap, vars: Record<string, string>): StyleMap {
  const out: StyleMap = {}
  for (const [k, v] of Object.entries(style)) {
    if (k.startsWith('--')) continue
    const next = resolveCssVarValue(v, vars)
    if (next) out[k] = next
  }
  return out
}
export function pickColor(style: StyleMap): string | undefined {
  const bg = style['background-color']?.trim()
  if (bg && bg !== 'transparent' && bg !== 'none' && !/gradient\(/i.test(bg)) return bg
  const shorthand = style.background?.trim()
  if (!shorthand || /gradient\(/i.test(shorthand)) return undefined
  if (/^#|^rgb|^hsl/i.test(shorthand) || /^var\(--/.test(shorthand)) return shorthand
  return undefined
}

/** Extract linear/repeating gradient for `props.gradient` (Wave B). */
export function extractGradientFromStyle(style: StyleMap): string | undefined {
  const bgImg = style['background-image']?.trim()
  if (bgImg && /gradient\(/i.test(bgImg)) return bgImg
  const bg = style.background?.trim()
  if (!bg || !/gradient\(/i.test(bg)) return undefined
  const match = bg.match(/((?:repeating-)?linear-gradient\([^)]*(?:\([^)]*\)[^)]*)*\))/i)
  return match?.[1]?.trim() ?? undefined
}

/** Extract background-image url(...) for `props.backgroundImage` (P2 Fidelity). */
export function extractBackgroundImageFromStyle(style: StyleMap): string | undefined {
  const bgImg = style['background-image']?.trim()
  if (bgImg && /url\(/i.test(bgImg)) {
    const m = bgImg.match(/url\(['"]?([^'"()]+)['"]?\)/i)
    if (m?.[1]) return m[1].trim()
  }
  const bg = style.background?.trim()
  if (bg && /url\(/i.test(bg)) {
    const m = bg.match(/url\(['"]?([^'"()]+)['"]?\)/i)
    if (m?.[1]) return m[1].trim()
  }
  return undefined
}

const TEXT_TRANSFORM_VALUES = new Set(['none', 'uppercase', 'lowercase', 'capitalize'])
const TEXT_DECORATION_VALUES = new Set(['none', 'underline', 'line-through'])
const OVERFLOW_VALUES = new Set(['visible', 'hidden', 'scroll', 'auto'])
const FLEX_AXIS_VALUES = new Set([
  'flex-start',
  'flex-end',
  'center',
  'stretch',
  'baseline',
  'space-between',
  'space-around',
  'space-evenly',
  'auto',
])

/** Map CSS flex keywords → Inspect enum (`start` → `flex-start`). */
export function normalizeFlexAxis(raw: string): string {
  const v = raw.trim().toLowerCase()
  if (v === 'start' || v === 'left') return 'flex-start'
  if (v === 'end' || v === 'right') return 'flex-end'
  if (FLEX_AXIS_VALUES.has(v)) return v
  return raw.trim()
}

function normalizeTextTransform(raw: string): string | undefined {
  const v = raw.trim().toLowerCase()
  return TEXT_TRANSFORM_VALUES.has(v) ? v : undefined
}

function normalizeTextDecoration(raw: string): string | undefined {
  const v = raw.trim().toLowerCase()
  if (TEXT_DECORATION_VALUES.has(v)) return v
  if (v.includes('underline')) return 'underline'
  if (v.includes('line-through')) return 'line-through'
  return undefined
}

function parseOpacity(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined
  const v = raw.trim()
  const n = Number(v)
  if (Number.isFinite(n)) return n >= 0 && n <= 1 ? n : n > 1 && n <= 100 ? n / 100 : undefined
  return undefined
}

function cssDimensionLiteral(raw: string | undefined): string | undefined {
  const v = raw?.trim()
  return v && v !== 'auto' && v !== 'none' ? v : undefined
}

export function applySurfaceLiterals(
  props: Record<string, unknown>,
  style: StyleMap,
): Record<string, unknown> {
  const next = { ...props }
  const gradient = extractGradientFromStyle(style)
  if (gradient) next.gradient = gradient
  const bgImg = extractBackgroundImageFromStyle(style)
  if (bgImg) {
    next.backgroundImage = bgImg
    if (style['background-size']) next.backgroundSize = style['background-size'].trim()
    if (style['background-position']) next.backgroundPosition = style['background-position'].trim()
    if (style['background-repeat']) next.backgroundRepeat = style['background-repeat'].trim()
  }
  const bg = pickColor(style)
  if (bg && !bg.includes('url(') && bg !== 'transparent' && bg !== 'none') {
    next.background = bg
  }
  if (style.color) next.color = style.color
  if (style['border-color']) next.borderColor = style['border-color']
  if (style['border-radius']) next.radius = style['border-radius']
  const clipPath = style['clip-path']?.trim()
  if (clipPath) {
    const mapped = clipPropsFromCssPolygon(clipPath)
    if (mapped) {
      Object.assign(next, mapped)
    }
  }
  if (style.gap) {
    const remMatch = style.gap.trim().match(/^(\d+(?:\.\d+)?)rem$/i)
    if (remMatch) {
      next.gap = `${Math.round(Number(remMatch[1]) * 16)}px`
    } else {
      next.gap = style.gap
    }
  }
  if (style.padding) next.padding = style.padding
  if (style['padding-top']) next.paddingTop = style['padding-top']
  if (style['padding-right']) next.paddingRight = style['padding-right']
  if (style['padding-bottom']) next.paddingBottom = style['padding-bottom']
  if (style['padding-left']) next.paddingLeft = style['padding-left']
  if (style.margin) next.margin = style.margin
  if (style['margin-top']) next.marginTop = style['margin-top']
  if (style['margin-right']) next.marginRight = style['margin-right']
  if (style['margin-bottom']) next.marginBottom = style['margin-bottom']
  if (style['margin-left']) next.marginLeft = style['margin-left']
  if (style['margin-block']) next.marginBlock = style['margin-block']
  if (style['margin-inline']) next.marginInline = style['margin-inline']
  if (style['font-size']) next.fontSize = style['font-size']
  if (style['font-weight']) next.fontWeight = style['font-weight']
  if (style['font-family']) next.fontFamily = style['font-family']
  if (style['line-height']) next.lineHeight = style['line-height']
  if (style['letter-spacing']) next.letterSpacing = style['letter-spacing']
  const tt = style['text-transform'] ? normalizeTextTransform(style['text-transform']) : undefined
  if (tt) next.textTransform = tt
  const td = style['text-decoration']
    ? normalizeTextDecoration(style['text-decoration'])
    : undefined
  if (td) next.textDecoration = td
  if (style['text-align']) next.textAlign = style['text-align']
  if (style['justify-content']) next.justify = normalizeFlexAxis(style['justify-content'])
  if (style['align-items']) next.align = normalizeFlexAxis(style['align-items'])
  // place-items: center → flex/grid centering (seal marks)
  const placeItems = (style['place-items'] ?? style['place-content'] ?? '').trim().toLowerCase()
  if (placeItems === 'center') {
    if (!next.align) next.align = 'center'
    if (!next.justify) next.justify = 'center'
  }
  if (style['align-self']) next.alignSelf = normalizeFlexAxis(style['align-self'])
  if (style['align-content']) next.alignContent = normalizeFlexAxis(style['align-content'])
  const ov = style.overflow?.trim().toLowerCase()
  if (ov && OVERFLOW_VALUES.has(ov)) next.overflow = ov
  const opacity = parseOpacity(style.opacity)
  if (opacity != null) next.opacity = opacity
  if (style['min-width']) next.minWidth = style['min-width']
  if (style['max-width']) next.maxWidth = style['max-width']
  if (style['min-height']) next.minHeight = style['min-height']
  if (style['max-height']) next.maxHeight = style['max-height']
  return next
}

export function parsePx(value: string | undefined): number | undefined {
  if (!value) return undefined
  const m = value.trim().match(/^(-?\d+(?:\.\d+)?)px$/i)
  if (!m) return undefined
  const n = Number(m[1])
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Rough CSS length → px for artboard mass (hero min-height). */
function parseCssLengthToPx(value: string | undefined): number | undefined {
  if (!value) return undefined
  const px = parsePx(value)
  if (px != null) return px
  const rem = value.trim().match(/^(\d+(?:\.\d+)?)rem$/i)
  if (rem) return Math.round(Number(rem[1]) * 16)
  const vh = value.trim().match(/^(\d+(?:\.\d+)?)(vh|svh|dvh)$/i)
  if (vh) return Math.round((Number(vh[1]) / 100) * 800)
  const clamp = value.trim().match(/^clamp\(/i)
  if (clamp) {
    // Prefer middle or last px/rem/vh arg as rough mass
    const parts = value.match(/(\d+(?:\.\d+)?(?:px|rem|vh|svh|dvh|vw))/gi) ?? []
    for (let i = parts.length - 1; i >= 0; i--) {
      const n = parseCssLengthToPx(parts[i])
      if (n != null && n >= 80) return n
    }
  }
  const minFn = value.trim().match(/^min\(\s*([^,]+),\s*([^)]+)\)/i)
  if (minFn) {
    const a = parseCssLengthToPx(minFn[1]!.trim())
    const b = parseCssLengthToPx(minFn[2]!.trim())
    if (a != null && b != null) return Math.min(a, b)
    return a ?? b
  }
  return undefined
}

const BORDER_CSS_KEYS = [
  ['border', 'border'],
  ['border-top', 'borderTop'],
  ['border-right', 'borderRight'],
  ['border-bottom', 'borderBottom'],
  ['border-left', 'borderLeft'],
] as const

function isZeroBorder(value: string): boolean {
  const v = value.trim().toLowerCase()
  if (!v || v === 'none' || v === 'hidden' || v === 'transparent') return true
  if (/^0(?:px|rem|em|%)?(?:\s|$)/.test(v)) return true
  return false
}

function resolveBorderPaintValue(raw: string, textColor?: string): string | undefined {
  const v = raw.trim()
  if (isZeroBorder(v)) return undefined
  if (/currentcolor/i.test(v) && textColor) {
    return v.replace(/currentcolor/gi, textColor)
  }
  return v
}
export function looksLikeMarkSurface(style: StyleMap, className: string): boolean {
  if (/\b(seal|mark|avatar|logo-mark)\b/i.test(className)) return true
  const radius = (style['border-radius'] ?? '').trim().toLowerCase()
  const isCircle =
    radius === '50%' ||
    radius === '100%' ||
    radius.startsWith('50%') ||
    radius === '9999px' ||
    radius === '999px'
  if (!isCircle) return false
  const hasBox = Boolean(style.width || style['aspect-ratio'] || style.height)
  const hasBorder =
    Boolean(style.border) ||
    Boolean(style['border-width']) ||
    Boolean(style['border-color']) ||
    Object.keys(borderStyleFromMap(style)).length > 0
  return hasBox && hasBorder
}

/** Map border shorthands / longhands → `node.style` (canvas paint via `resolveNodePaintStyle`). */
export function borderStyleFromMap(
  style: StyleMap,
  textColor?: string,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [cssKey, styleKey] of BORDER_CSS_KEYS) {
    const raw = style[cssKey]
    if (!raw) continue
    const resolved = resolveBorderPaintValue(raw, textColor)
    if (resolved) out[styleKey] = resolved
  }

  const sides = ['top', 'right', 'bottom', 'left'] as const
  for (const side of sides) {
    const shorthand = `border-${side}`
    if (style[shorthand]) continue
    const width = style[`border-${side}-width`]
    const bStyle = style[`border-${side}-style`]
    const color = style[`border-${side}-color`]
    if (!width && !bStyle && !color) continue
    const w = width && !isZeroBorder(width) ? width : undefined
    const s = bStyle && bStyle !== 'none' ? bStyle : undefined
    const c = color ? resolveBorderPaintValue(color, textColor) : undefined
    if (!w && !s && !c) continue
    const parts = [w ?? (s || c ? '1px' : undefined), s ?? (w || c ? 'solid' : undefined), c].filter(
      Boolean,
    ) as string[]
    if (parts.length && !isZeroBorder(parts.join(' '))) {
      const styleKey = `border${side[0]!.toUpperCase()}${side.slice(1)}`
      out[styleKey] = parts.join(' ')
    }
  }

  return out
}

/** Keep empty divs that still carry visible box/surface CSS (hero media, overflow clips). */
export function shouldKeepEmptySurface(style: StyleMap): boolean {
  if (pickColor(style)) return true
  if (extractGradientFromStyle(style)) return true
  if (extractBackgroundImageFromStyle(style)) return true
  if (parseCssLengthToPx(style['min-height']) != null) return true
  if (parsePx(style.height) != null || cssDimensionLiteral(style.height)) return true
  if (parsePx(style.width) != null || cssDimensionLiteral(style.width)) return true
  if (style.overflow && style.overflow !== 'visible') return true
  if (style['max-width'] || style['min-width'] || style['max-height']) return true
  if (style.opacity) return true
  if (Object.keys(borderStyleFromMap(style)).length > 0) return true
  return false
}

/** Width/height/aspect/font-style paint on `node.style` (P2-A). */
export function boxStyleFromMap(
  style: StyleMap,
  textColor?: string,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    ...borderStyleFromMap(style, textColor),
  }

  const widthPx = parsePx(style.width)
  if (widthPx != null) out.width = widthPx
  else {
    const wLit = cssDimensionLiteral(style.width)
    if (wLit) out.width = wLit
  }

  const heightPx = parsePx(style.height)
  if (heightPx != null) out.height = heightPx
  else {
    const hLit = cssDimensionLiteral(style.height)
    if (hLit) out.height = hLit
    else {
      const minMass = parseCssLengthToPx(style['min-height'])
      if (minMass != null && !style.height) out.height = minMass
    }
  }

  const aspect = cssDimensionLiteral(style['aspect-ratio'])
  if (aspect) out.aspectRatio = aspect

  const fs = style['font-style']?.trim().toLowerCase()
  if (fs && fs !== 'normal') out.fontStyle = style['font-style']!.trim()

  const gridCol = cssDimensionLiteral(style['grid-column'])
  if (gridCol) out.gridColumn = gridCol
  const gridRow = cssDimensionLiteral(style['grid-row'])
  if (gridRow) out.gridRow = gridRow

  const fw = style['flex-wrap']?.trim().toLowerCase()
  if (fw === 'wrap' || fw === 'wrap-reverse' || fw === 'nowrap') {
    out.flexWrap = fw
  }

  const fg = style['flex-grow']?.trim()
  if (fg) {
    const num = Number(fg)
    if (Number.isFinite(num)) out.flexGrow = num
  }

  const fsr = style['flex-shrink']?.trim()
  if (fsr) {
    const num = Number(fsr)
    if (Number.isFinite(num)) out.flexShrink = num
  }

  const fb = cssDimensionLiteral(style['flex-basis'])
  if (fb) out.flexBasis = fb

  return out
}

export function hasPseudoPaint(style: StyleMap): boolean {
  if (extractGradientFromStyle(style)) return true
  if (pickColor(style)) return true
  if (style['box-shadow']?.trim()) return true
  if (Object.keys(borderStyleFromMap(style)).length > 0) return true
  const clip = style['clip-path']?.trim()
  if (clip && clipPropsFromCssPolygon(clip)) return true
  return false
}

export function sanitizePseudoRule(style: StyleMap): StyleMap {
  const out = { ...style }
  for (const k of ['content', 'transition', 'animation', 'cursor', 'pointer-events'] as const) {
    delete out[k]
  }
  return out
}

/** Map pseudo-element layout + paint → decor `node.style` (Wave C). */
export function overlayStyleFromPseudo(
  style: StyleMap,
  textColor?: string,
): Record<string, string | number> {
  const out: Record<string, string | number> = {
    position: 'absolute',
    pointerEvents: 'none',
    ...boxStyleFromMap(style, textColor),
  }
  if (style.inset) out.inset = style.inset
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const v = style[side]
    if (v) out[side] = v
  }
  if (style.transform) out.transform = style.transform
  if (style['z-index']) out.zIndex = style['z-index']
  if (style['box-shadow']) out.boxShadow = style['box-shadow']
  if (style['border-radius']) out.borderRadius = style['border-radius']
  return out
}
