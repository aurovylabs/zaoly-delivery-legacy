/**
 * HTML → Site Kit SceneNode tree (P1).
 * Spec: specs/domain/html-scene-import.md
 *
 * No default tokenBindings — literals in props so Inspect shows Hex.
 */
import type { SceneNode } from '@zaoly/contracts'
import { sanitizeSiteSvgMarkup } from '@zaoly/site-kit'
import { createSceneNodeId } from './scene-tree'
import { clipPropsFromCssPolygon } from './clip-path-import'
import {
  type StyleMap,
  applySurfaceLiterals,
  boxStyleFromMap,
  expandFontShorthand,
  extractCssVars,
  extractGradientFromStyle,
  hasPseudoPaint,
  looksLikeMarkSurface,
  overlayStyleFromPseudo,
  pageShellStyle,
  parseClassRulesFromDocument,
  parsePx,
  parseStyleAttr,
  pickColor,
  resolveStyleMap,
  sanitizePseudoRule,
  shouldKeepEmptySurface,
  styleClassKey,
  styleTagKey,
} from './html-css-parse'

export {
  stripCssAtRules,
  parseClassRulesFromDocument,
  parsePseudoSelectorHits,
  expandFontShorthand,
  resolveCssVarValue,
  extractGradientFromStyle,
  extractBackgroundImageFromStyle,
  normalizeFlexAxis,
  borderStyleFromMap,
  boxStyleFromMap,
  overlayStyleFromPseudo,
} from './html-css-parse'
export type { StyleMap } from './html-css-parse'

export const HTML_IMPORT_MAX_CHARS = 200_000

export type HtmlImportWarning = {
  code: string
  message: string
  detail?: string
}

export type HtmlToSceneResult =
  | {
      ok: true
      root: SceneNode
      warnings: HtmlImportWarning[]
      stats: { nodeCount: number; htmlBytes: number }
    }
  | { ok: false; code: 'html-empty' | 'html-too-large' | 'html-map-failed'; message: string }

function countNodes(root: SceneNode): number {
  let n = 0
  const walk = (node: SceneNode) => {
    n += 1
    for (const c of node.children ?? []) walk(c)
  }
  walk(root)
  return n
}

const INLINE_PHRASE_TAGS = new Set(['span', 'strong', 'em', 'b', 'i', 'small', 'abbr'])

/** Join child text of inline phrases — preserve spaces between element siblings. */
function joinedInlinePhraseText(el: Element): string {
  const parts: string[] = []
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 3) {
      const t = (child.textContent ?? '').replace(/\s+/g, ' ')
      if (t) parts.push(t)
      continue
    }
    if (child.nodeType !== 1) continue
    const childEl = child as Element
    const tag = childEl.tagName.toLowerCase()
    if (tag === 'br') {
      parts.push(' ')
      continue
    }
    if (!INLINE_PHRASE_TAGS.has(tag)) continue
    const inner = (childEl.textContent ?? '').replace(/\s+/g, ' ').trim()
    if (!inner) continue
    const prev = parts[parts.length - 1] ?? ''
    if (
      prev &&
      !/\s$/.test(prev) &&
      !/^[%°+x×.,/)]/i.test(inner) &&
      !/[(\[]$/.test(prev)
    ) {
      parts.push(` ${inner}`)
    } else {
      parts.push(inner)
    }
  }
  return parts.join('').replace(/\s+/g, ' ').trim()
}

/** Only coalesce metric/logo fragments — not arbitrary German words. */
function isShortMetricFragment(text: string): boolean {
  const t = text.trim()
  if (!t || t.length > 8) return false
  if (/^\d+[.,]?\d*[%°+x×]?$/i.test(t)) return true
  if (/^[+\-–—%°x×]$/.test(t)) return true
  if (/^[A-ZÄÖÜ]{1,5}$/.test(t)) return true
  return false
}

function joinTextFragments(parts: string[]): string {
  let out = parts[0] ?? ''
  for (let i = 1; i < parts.length; i++) {
    const b = parts[i]!
    if (/^[%°+x×.,/]$/i.test(b)) out += b
    else if (/^[A-Za-z]/.test(b) && /[A-Za-z]$/.test(out)) out += ` ${b}`
    else out += b
  }
  return out
}

/** Merge adjacent short SiteText siblings ("3"+"+", "ZA"+"OLY") into one node. */
function coalesceSplitTextNodes(mapped: SceneNode[]): SceneNode[] {
  const out: SceneNode[] = []
  let i = 0
  while (i < mapped.length) {
    const n = mapped[i]!
    const text = typeof n.props?.children === 'string' ? n.props.children : ''
    if (n.type === 'SiteText' && isShortMetricFragment(text)) {
      const parts = [text.trim()]
      let j = i + 1
      while (j < mapped.length) {
        const next = mapped[j]!
        const nextText =
          typeof next.props?.children === 'string' ? next.props.children : ''
        if (next.type !== 'SiteText' || !isShortMetricFragment(nextText)) break
        parts.push(nextText.trim())
        j += 1
      }
      if (parts.length > 1) {
        out.push({
          ...n,
          props: {
            ...(n.props ?? {}),
            children: joinTextFragments(parts),
          },
        })
        i = j
        continue
      }
    }
    out.push(n)
    i += 1
  }
  return out
}

function pickPageBackground(
  bodyStyle: StyleMap,
  shell: StyleMap,
  children: SceneNode[],
): string | undefined {
  const fromBody = pickColor(bodyStyle) || pickColor(shell)
  if (fromBody) return fromBody
  for (const child of children.slice(0, 3)) {
    const bg = typeof child.props?.background === 'string' ? child.props.background : ''
    if (/^#0[0-9a-f]{5}$/i.test(bg) || /^#1[0-9a-f]{5}$/i.test(bg) || bg === '#000' || bg === '#000000') {
      return bg
    }
  }
  return undefined
}

function resolveElementStyle(el: Element, ctx: MapCtx): StyleMap {
  let merged: StyleMap = {}
  const tag = el.tagName.toLowerCase()
  const tagRule = ctx.classRules.get(styleTagKey(el.tagName))
  if (tagRule) merged = { ...merged, ...tagRule }
  // One-level descendant: `.intro h2` / `.brand span`
  let ancestor: Element | null = el.parentElement
  for (let depth = 0; ancestor && depth < 3; depth += 1, ancestor = ancestor.parentElement) {
    for (const token of (ancestor.getAttribute('class') ?? '').split(/\s+/)) {
      const key = token.trim()
      if (!key) continue
      const desc = ctx.classRules.get(`desc:${key.toLowerCase()}>${tag}`)
      if (desc) merged = { ...merged, ...desc }
    }
  }
  // Two-level: `.intro h2 em`
  const parent = el.parentElement
  if (parent) {
    const pt = parent.tagName.toLowerCase()
    let g: Element | null = parent.parentElement
    for (let depth = 0; g && depth < 3; depth += 1, g = g.parentElement) {
      for (const token of (g.getAttribute('class') ?? '').split(/\s+/)) {
        const key = token.trim()
        if (!key) continue
        const desc2 = ctx.classRules.get(`desc:${key.toLowerCase()}>${pt}>${tag}`)
        if (desc2) merged = { ...merged, ...desc2 }
      }
    }
  }
  // Adjacent sibling: `.day + .day` / `.planning article + article`
  const prev = el.previousElementSibling
  if (prev) {
    const prevClasses = new Set(
      (prev.getAttribute('class') ?? '')
        .split(/\s+/)
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    )
    for (const token of (el.getAttribute('class') ?? '').split(/\s+/)) {
      const cls = token.trim().toLowerCase()
      if (!cls) continue
      for (const prevCls of prevClasses) {
        const sib = ctx.classRules.get(`sib:${prevCls}+${cls}`)
        if (sib) merged = { ...merged, ...sib }
      }
    }
    if (prev.tagName.toLowerCase() === tag) {
      let g: Element | null = el.parentElement
      for (let depth = 0; g && depth < 2; depth += 1, g = g.parentElement) {
        for (const token of (g.getAttribute('class') ?? '').split(/\s+/)) {
          const pCls = token.trim().toLowerCase()
          if (!pCls) continue
          const sibTag = ctx.classRules.get(`sib:${pCls}>${tag}+${tag}`)
          if (sibTag) merged = { ...merged, ...sibTag }
        }
      }
    }
  }
  for (const token of (el.getAttribute('class') ?? '').split(/\s+/)) {
    const key = token.trim()
    if (!key) continue
    const rule = ctx.classRules.get(styleClassKey(key))
    if (rule) merged = { ...merged, ...rule }
  }
  const withInline = expandFontShorthand({
    ...merged,
    ...parseStyleAttr(el.getAttribute('style')),
  })
  return resolveStyleMap(withInline, ctx.cssVars)
}
/** Walk ancestors for inherited `color` (e.g. `.hero { color: … }` → `.seal { border: … currentColor }`). */
function resolveInheritedTextColor(el: Element, ctx: MapCtx): string | undefined {
  let node: Element | null = el.parentElement
  while (node) {
    const color = resolveElementStyle(node, ctx).color
    if (color) return color
    node = node.parentElement
  }
  return undefined
}

/** Typo + color CSS keys that inherit in the browser but not via our class merge. */
const INHERITED_PAINT_KEYS = [
  'color',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'text-transform',
  'line-height',
  'font-style',
] as const

/**
 * Fill missing typo/color from ancestors so SiteLink/SiteText leaves beat
 * Site Kit accent defaults (cream-on-wine headers, brand tracking).
 */
function withInheritedTypo(el: Element, style: StyleMap, ctx: MapCtx): StyleMap {
  const out: StyleMap = { ...style }
  let node: Element | null = el.parentElement
  while (node) {
    const ps = resolveElementStyle(node, ctx)
    for (const k of INHERITED_PAINT_KEYS) {
      if (!out[k] && ps[k]) out[k] = ps[k]
    }
    node = node.parentElement
  }
  return out
}

function mergedPseudoRule(
  el: Element,
  pseudo: 'before' | 'after',
  ctx: MapCtx,
): StyleMap | null {
  let merged: StyleMap = {}
  let any = false
  for (const token of (el.getAttribute('class') ?? '').split(/\s+/)) {
    const cls = token.trim().toLowerCase()
    if (!cls) continue
    const rule = ctx.classRules.get(`pseudo:${cls}:${pseudo}`)
    if (!rule) continue
    merged = { ...merged, ...rule }
    any = true
  }
  return any ? merged : null
}

function buildPseudoDecorLayer(
  el: Element,
  ctx: MapCtx,
  pseudo: 'before' | 'after',
): SceneNode | null {
  const raw = mergedPseudoRule(el, pseudo, ctx)
  if (!raw) return null
  const resolved = resolveStyleMap(sanitizePseudoRule(raw), ctx.cssVars)
  if (resolved['clip-path']) {
    const mapped = clipPropsFromCssPolygon(resolved['clip-path'])
    if (!mapped || Object.keys(mapped).length === 0) {
      ctx.warnings.push({
        code: 'lossy-pseudo-clip-path',
        message: `clip-path on ::${pseudo} not mapped to scene`,
      })
    }
  }
  if (!hasPseudoPaint(resolved)) return null
  const textColor = resolved.color || resolveInheritedTextColor(el, ctx)
  const props = applySurfaceLiterals({ direction: 'column', gap: '0' }, resolved)
  delete resolved['clip-path']
  return {
    id: nextId(ctx, 'decor'),
    type: 'SiteStack',
    name: `::${pseudo}`,
    props,
    children: [],
    style: overlayStyleFromPseudo(resolved, textColor),
  }
}

function attachPseudoDecor(el: Element, node: SceneNode, ctx: MapCtx): SceneNode {
  if (node.type !== 'SiteStack' && node.type !== 'SiteGrid') return node
  const before = buildPseudoDecorLayer(el, ctx, 'before')
  const after = buildPseudoDecorLayer(el, ctx, 'after')
  if (before) ctx.pseudoMapped += 1
  if (after) ctx.pseudoMapped += 1
  if (!before && !after) return node
  return {
    ...node,
    children: [...(before ? [before] : []), ...(node.children ?? []), ...(after ? [after] : [])],
    style: {
      ...(node.style ?? {}),
      position: 'relative',
    },
  }
}

function finishHost(el: Element, node: SceneNode | null, ctx: MapCtx): SceneNode | null {
  if (!node) return null
  return attachPseudoDecor(el, node, ctx)
}

function applyBoxStyle(
  node: SceneNode,
  style: StyleMap,
  textColor?: string,
): SceneNode {
  const box = boxStyleFromMap(style, textColor)
  if (Object.keys(box).length === 0) return node
  return {
    ...node,
    style: {
      ...(node.style ?? {}),
      ...box,
    },
  }
}

function textContent(el: Element): string {
  let out = ''
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      out += node.textContent ?? ''
      return
    }
    if (node.nodeType !== 1) return
    const tag = (node as Element).tagName.toLowerCase()
    if (tag === 'br') {
      out += ' '
      return
    }
    for (const child of Array.from(node.childNodes)) walk(child)
  }
  walk(el)
  return out.replace(/\s+/g, ' ').trim()
}

function directText(el: Element): string {
  let out = ''
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 3) out += child.textContent ?? ''
  }
  return out.replace(/\s+/g, ' ').trim()
}

function hasAbsolute(style: StyleMap): boolean {
  return style.position === 'absolute' || style.position === 'fixed'
}

/** Skip-links / sr-only / off-screen fixed chrome — omit from scene flow. */
function isImportChromeHidden(el: Element, style: StyleMap, className: string): boolean {
  if (style.display === 'none' || el.hasAttribute('hidden')) return true
  if (/\b(skip|sr-only|visually-hidden|screen-reader-only)\b/i.test(className)) return true
  const transform = style.transform ?? ''
  if (
    (style.position === 'fixed' || style.position === 'absolute') &&
    (/translateY\(\s*-/i.test(transform) || /translate3d\([^)]*?,\s*-[^)]*\)/i.test(transform))
  ) {
    return true
  }
  const left = parsePx(style.left)
  if ((style.position === 'absolute' || style.position === 'fixed') && left != null && left < -40) {
    return true
  }
  return false
}

function flexDirection(style: StyleMap, tag: string, childCount: number, className: string): 'row' | 'column' {
  const explicit = (style['flex-direction'] ?? '').toLowerCase()
  if (explicit.startsWith('row')) return 'row'
  if (explicit.startsWith('column')) return 'column'

  if (isFlex(style)) return 'row'

  if (tag === 'nav' || tag === 'ul' || tag === 'ol') return 'row'

  if (tag === 'header' && childCount >= 2 && childCount <= 6) return 'row'

  const cn = className.toLowerCase()
  const rowHint =
    /\b(row|nav|navbar|menu|stats|metrics|hero-actions|actions|cta-row|buttons|logo-row|benefits|features|cards|grid-cols|cols-2|cols-3|cols|two-col|three-col|trust|pair|split)\b/.test(
      cn,
    )
  if (rowHint && childCount >= 2 && childCount <= 6) return 'row'

  if (childCount >= 3 && childCount <= 4 && (tag === 'div' || tag === 'section')) {
    if (/\b(stat|metric|benefit|feature|card|col|grid|trust)\b/i.test(cn)) return 'row'
  }

  return 'column'
}

function isGrid(style: StyleMap): boolean {
  return (style.display ?? '').toLowerCase() === 'grid'
}

/** Count grid columns; parentheses-aware (minmax). Empty columns → 1 (rows-only grid). */
function gridColumnCount(style: StyleMap, childCount: number): number {
  const tmpl = (style['grid-template-columns'] ?? '').trim()
  if (!tmpl || tmpl === 'none') return 1
  const repeat = tmpl.match(/repeat\(\s*(\d+)/i)
  if (repeat) return Math.min(Number(repeat[1]), 12)
  const tracks: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of tmpl) {
    if (ch === '(') depth += 1
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (/\s/.test(ch) && depth === 0) {
      if (cur.trim()) tracks.push(cur.trim())
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.trim()) tracks.push(cur.trim())
  if (tracks.length >= 1) return Math.min(tracks.length, 12)
  if (childCount >= 2 && childCount <= 6) return childCount
  return 3
}

function isFlex(style: StyleMap, displayHint?: string): boolean {
  const display = (style.display || displayHint || '').toLowerCase()
  return display === 'flex' || display === 'inline-flex'
}

function elementChildren(el: Element): Element[] {
  return Array.from(el.children) as Element[]
}

type MapCtx = {
  warnings: HtmlImportWarning[]
  seq: number
  classRules: Map<string, StyleMap>
  cssVars: Record<string, string>
  pseudoMapped: number
}

function nextId(ctx: MapCtx, prefix: string): string {
  ctx.seq += 1
  return createSceneNodeId(`imp-${prefix}`)
}

/** Unitless line-height (or % → ratio). Lengths return null. */
function parseUnitlessLineHeight(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t)
  const pct = t.match(/^(\d+(?:\.\d+)?)%$/)
  if (pct) return Number(pct[1]) / 100
  return null
}

function parseFontSizePxLocal(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return null
  const px = raw.trim().match(/^(\d+(?:\.\d+)?)px$/i)
  if (px) return Number(px[1])
  const rem = raw.trim().match(/^(\d+(?:\.\d+)?)rem$/i)
  if (rem) return Number(rem[1]) * 16
  const clamp = raw.match(/clamp\([^)]*?(\d+(?:\.\d+)?)px/i)
  if (clamp) return Number(clamp[1])
  return null
}

/**
 * Display inherits body line-height (often 1.6) via withInheritedTypo — that
 * makes wrapped hero lines look floaty. Clamp large type to tight leading.
 * Spec cue: knowledge/gallery-hero-slider-prompt.md · Fallgefühl.
 */
export function tightenDisplayTypo(
  props: Record<string, unknown>,
  role: 'display' | 'title' | 'body' | 'meta',
): void {
  const fs = parseFontSizePxLocal(props.fontSize)
  const asDisplay = role === 'display' || (fs != null && fs >= 48)
  const asTitle = !asDisplay && (role === 'title' || (fs != null && fs >= 32))
  if (!asDisplay && !asTitle) return

  const lh = parseUnitlessLineHeight(props.lineHeight)
  const maxOk = asDisplay ? 1.25 : 1.35
  const target = asDisplay ? '1.08' : '1.2'
  if (lh == null || lh > maxOk) {
    props.lineHeight = target
  }
  if (asDisplay) {
    const ls = props.letterSpacing
    const missing = ls == null || (typeof ls === 'string' && !ls.trim())
    // Wide tracking from ancestor nav/eyebrow should not stick on display.
    const wide =
      typeof ls === 'string' &&
      /^\d/.test(ls.trim()) &&
      /em$/i.test(ls.trim()) &&
      Number.parseFloat(ls) >= 0.04
    if (missing || wide) {
      props.letterSpacing = '-0.02em'
    }
  }
}

function mapLeafText(
  ctx: MapCtx,
  text: string,
  role: 'display' | 'title' | 'body' | 'meta',
  name: string,
  style: StyleMap,
  textColor?: string,
): SceneNode | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const props = applySurfaceLiterals({ role, children: trimmed }, style)
  tightenDisplayTypo(props, role)
  let node: SceneNode = {
    id: nextId(ctx, 'text'),
    type: 'SiteText',
    name,
    props,
  }
  node = applyBoxStyle(node, style, textColor ?? style.color)
  return node
}

/** Circular seal / mark: centered SiteStack wrapping a SiteText glyph. */
function mapMarkSurface(
  ctx: MapCtx,
  el: Element,
  text: string,
  style: StyleMap,
  textColor?: string,
): SceneNode {
  const label = text.trim() || '•'
  const paint = withInheritedTypo(el, style, ctx)
  const child = mapLeafText(ctx, label, 'meta', 'mark', paint, textColor ?? paint.color)
  const props = applySurfaceLiterals(
    {
      direction: 'column',
      gap: '0',
      align: 'center',
      justify: 'center',
    },
    paint,
  )
  if (!props.align) props.align = 'center'
  if (!props.justify) props.justify = 'center'
  let node: SceneNode = {
    id: nextId(ctx, 'seal'),
    type: 'SiteStack',
    name: el.getAttribute('aria-label')?.trim() || el.className?.toString?.().split(/\s+/)[0] || 'seal',
    props,
    children: child ? [child] : [],
  }
  node = applyBoxStyle(node, paint, textColor ?? paint.color)
  return {
    ...node,
    style: {
      ...(node.style ?? {}),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }
}

function headlineNeedsInlineSplit(
  el: Element,
  ctx: MapCtx,
  style: StyleMap,
  textColor?: string,
): boolean {
  const parentColor = style.color || textColor
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 1 && (child as Element).tagName.toLowerCase() === 'br') return true
    if (child.nodeType !== 1) continue
    const tag = (child as Element).tagName.toLowerCase()
    if (!INLINE_PHRASE_TAGS.has(tag)) continue
    const cs = resolveElementStyle(child as Element, ctx)
    if ((cs.display ?? '').toLowerCase() === 'block') return true
    if (cs.color && parentColor && cs.color !== parentColor) return true
  }
  return false
}

/** Split headline inline craft into a column SiteStack of SiteText nodes (Wave B). */
function mapSplitHeadline(
  ctx: MapCtx,
  el: Element,
  role: 'display' | 'title',
  style: StyleMap,
  textColor?: string,
): SceneNode {
  const segments: SceneNode[] = []
  let rowParts: string[] = []

  const flushRow = () => {
    const parts = rowParts.map((t) => t.trim()).filter(Boolean)
    if (!parts.length) return
    const joined = joinTextFragments(parts)
    const t = mapLeafText(ctx, joined, role, el.tagName.toUpperCase(), style, textColor)
    if (t) segments.push(t)
    rowParts = []
  }

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 3) {
      const t = (child.textContent ?? '').replace(/\s+/g, ' ')
      if (t.trim()) rowParts.push(t.trim())
      continue
    }
    if (child.nodeType !== 1) continue
    const childEl = child as Element
    const tag = childEl.tagName.toLowerCase()
    if (tag === 'br') {
      flushRow()
      continue
    }
    if (!INLINE_PHRASE_TAGS.has(tag)) continue
    flushRow()
    const childStyle = resolveElementStyle(childEl, ctx)
    const inner = textContent(childEl)
    if (inner) {
      const t = mapLeafText(
        ctx,
        inner,
        role,
        tag,
        { ...style, ...childStyle },
        childStyle.color || textColor,
      )
      if (t) segments.push(t)
    }
  }
  flushRow()

  if (segments.length === 1) return applyBoxStyle(segments[0]!, style, textColor)

  let node: SceneNode = {
    id: nextId(ctx, 'stack'),
    type: 'SiteStack',
    name: el.tagName.toUpperCase(),
    props: applySurfaceLiterals({ direction: 'column', gap: '0' }, style),
    children: segments,
  }
  return applyBoxStyle(node, style, textColor)
}

const BADGE_CLASS_RE = /\b(badge|pill|chip|tag)\b/i
const BADGE_TAGS = new Set(['span', 'p', 'div', 'em', 'strong'])
const INPUT_BUTTON_TYPES = new Set(['submit', 'button', 'reset'])

function isDisabledAttr(el: Element): boolean {
  return el.hasAttribute('disabled')
}

function looksLikeBadge(el: Element, tag: string, className: string, style: StyleMap, text: string): boolean {
  if (!BADGE_TAGS.has(tag)) return false
  const trimmed = text.trim()
  if (trimmed.length < 1 || trimmed.length > 28) return false
  const kids = elementChildren(el)
  if (
    kids.length > 0 &&
    !kids.every((k) => {
      const t = k.tagName.toLowerCase()
      return t === 'br' || INLINE_PHRASE_TAGS.has(t)
    })
  ) {
    return false
  }
  if (BADGE_CLASS_RE.test(className)) return true
  const hasRadius = Boolean(style['border-radius']?.trim())
  const hasBg = Boolean(pickColor(style) || extractGradientFromStyle(style))
  return hasRadius && hasBg
}

function mapBadge(
  ctx: MapCtx,
  el: Element,
  text: string,
  style: StyleMap,
  textColor?: string,
): SceneNode {
  const label = text.trim()
  let node: SceneNode = {
    id: nextId(ctx, 'badge'),
    type: 'SiteBadge',
    name: label.slice(0, 40) || 'Badge',
    props: applySurfaceLiterals({ children: label }, style),
  }
  return applyBoxStyle(node, style, textColor)
}

function mapFormInput(
  ctx: MapCtx,
  el: Element,
  style: StyleMap,
  textColor?: string,
): SceneNode | null {
  const typeRaw = (el.getAttribute('type') ?? 'text').trim().toLowerCase() || 'text'
  if (typeRaw === 'hidden') return null
  if (INPUT_BUTTON_TYPES.has(typeRaw)) {
    const label = el.getAttribute('value')?.trim() || 'Submit'
    let node: SceneNode = {
      id: nextId(ctx, 'btn'),
      type: 'SiteButton',
      name: label.slice(0, 40),
      props: applySurfaceLiterals({ children: label }, style),
    }
    return applyBoxStyle(node, style, textColor)
  }
  const props: Record<string, unknown> = { type: typeRaw }
  const placeholder = el.getAttribute('placeholder')?.trim()
  if (placeholder) props.placeholder = placeholder
  const name = el.getAttribute('name')?.trim()
  if (name) props.name = name
  const value = el.getAttribute('value')
  if (value != null && value !== '') props.defaultValue = value
  if (isDisabledAttr(el)) props.disabled = true
  let node: SceneNode = {
    id: nextId(ctx, 'input'),
    type: 'SiteInput',
    name: (placeholder || name || typeRaw).slice(0, 40) || 'Input',
    props: applySurfaceLiterals(props, style),
  }
  return applyBoxStyle(node, style, textColor)
}

function mapFormTextarea(
  ctx: MapCtx,
  el: Element,
  style: StyleMap,
  textColor?: string,
): SceneNode {
  const props: Record<string, unknown> = {}
  const placeholder = el.getAttribute('placeholder')?.trim()
  if (placeholder) props.placeholder = placeholder
  const name = el.getAttribute('name')?.trim()
  if (name) props.name = name
  const rowsRaw = el.getAttribute('rows')?.trim()
  if (rowsRaw) {
    const rows = Number(rowsRaw)
    if (Number.isFinite(rows) && rows > 0) props.rows = rows
  }
  const body = (el.textContent ?? '').trim()
  if (body) props.defaultValue = body
  if (isDisabledAttr(el)) props.disabled = true
  let node: SceneNode = {
    id: nextId(ctx, 'textarea'),
    type: 'SiteTextarea',
    name: (placeholder || name || 'Textarea').slice(0, 40),
    props: applySurfaceLiterals(props, style),
  }
  return applyBoxStyle(node, style, textColor)
}

function formatSelectOptionLine(opt: Element): string | null {
  const label = (opt.textContent ?? '').replace(/\s+/g, ' ').trim()
  const valueAttr = opt.getAttribute('value')
  const value = valueAttr != null ? valueAttr : label
  if (!value && !label) return null
  if (value && label && value !== label) return `${value}|${label}`
  return value || label
}

function mapFormSelect(
  ctx: MapCtx,
  el: Element,
  style: StyleMap,
  textColor?: string,
): SceneNode {
  const optionEls = elementChildren(el).filter((c) => c.tagName.toLowerCase() === 'option')
  const lines: string[] = []
  let selectedValue: string | undefined
  for (const opt of optionEls) {
    const line = formatSelectOptionLine(opt)
    if (!line) continue
    lines.push(line)
    if (opt.hasAttribute('selected')) {
      const valueAttr = opt.getAttribute('value')
      selectedValue = valueAttr != null ? valueAttr : (opt.textContent ?? '').replace(/\s+/g, ' ').trim()
    }
  }
  const props: Record<string, unknown> = {}
  const name = el.getAttribute('name')?.trim()
  if (name) props.name = name
  if (lines.length) props.options = lines.join('\n')
  if (selectedValue) props.defaultValue = selectedValue
  if (isDisabledAttr(el)) props.disabled = true
  const placeholder = el.getAttribute('placeholder')?.trim()
  if (placeholder) props.placeholder = placeholder
  let node: SceneNode = {
    id: nextId(ctx, 'select'),
    type: 'SiteSelect',
    name: (name || placeholder || 'Select').slice(0, 40),
    props: applySurfaceLiterals(props, style),
  }
  return applyBoxStyle(node, style, textColor)
}

function mapSvgElement(
  el: Element,
  ctx: MapCtx,
  style: StyleMap,
  textColor: string | undefined,
): SceneNode | null {
  const raw = (el as unknown as { outerHTML?: string }).outerHTML ?? el.toString()
  const sanitized = sanitizeSiteSvgMarkup(String(raw))
  if (!sanitized.ok) {
    ctx.warnings.push({
      code: 'svg-rejected',
      message: `Rejected <svg> (${sanitized.reason})`,
    })
    return null
  }
  if (sanitized.stripped) {
    ctx.warnings.push({
      code: 'svg-sanitized',
      message: 'Stripped unsafe attributes or nodes from <svg>',
    })
  }

  const titleEl = el.querySelector('title')
  const titleText = titleEl?.textContent?.trim() || ''
  const aria = el.getAttribute('aria-label')?.trim() || ''
  const alt = aria || titleText || 'Graphic'
  const viewBox =
    sanitized.viewBox || el.getAttribute('viewBox')?.trim() || undefined

  let node: SceneNode = {
    id: nextId(ctx, 'svg'),
    type: 'SiteSvg',
    name: alt.slice(0, 40) || 'Svg',
    props: applySurfaceLiterals(
      {
        mark: 'custom',
        markup: sanitized.markup,
        alt,
        ...(titleText ? { title: titleText } : {}),
        ...(viewBox ? { viewBox } : {}),
      },
      style,
    ),
  }
  node = applyBoxStyle(node, style, textColor)
  const attrW = Number(el.getAttribute('width'))
  const attrH = Number(el.getAttribute('height'))
  if (Number.isFinite(attrW) && attrW > 0) {
    node = { ...node, style: { ...(node.style ?? {}), width: attrW } }
  }
  if (Number.isFinite(attrH) && attrH > 0) {
    node = { ...node, style: { ...(node.style ?? {}), height: attrH } }
  }
  // Wide graphics (editorial diagrams) without fixed attrs → full host width.
  // Icons keep numeric width/height attrs and stay hug-sized.
  if (node.style?.width == null && viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)
    const vbW = parts[2]
    if (Number.isFinite(vbW) && vbW >= 200) {
      node = {
        ...node,
        style: { ...(node.style ?? {}), width: '100%', height: 'auto' },
      }
    }
  }
  return node
}

function mapElement(el: Element, ctx: MapCtx): SceneNode | null {
  const tag = el.tagName.toLowerCase()
  if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'iframe') {
    if (tag === 'script' || tag === 'iframe') {
      ctx.warnings.push({
        code: 'html-stripped',
        message: `Stripped <${tag}>`,
      })
    }
    return null
  }

  const className = el.getAttribute('class') ?? ''
  const style = resolveElementStyle(el, ctx)
  const paint = withInheritedTypo(el, style, ctx)
  const textColor = paint.color || resolveInheritedTextColor(el, ctx)
  if (isImportChromeHidden(el, style, className)) {
    ctx.warnings.push({
      code: 'omitted-hidden-chrome',
      message: `Omitted skip/off-screen chrome on <${tag}>`,
    })
    return null
  }
  if (hasAbsolute(style)) {
    ctx.warnings.push({
      code: 'ignored-absolute-position',
      message: `Absolute/fixed position ignored on <${tag}>`,
    })
  }
  if (style.display === 'none' || el.hasAttribute('hidden')) {
    return null
  }

  // Media queries are not represented — warn once per document is enough; keep light.
  if (/\b@media\b/i.test(el.ownerDocument?.documentElement?.innerHTML?.slice(0, 500) ?? '')) {
    // handled at top-level once
  }

  if (tag === 'svg') {
    return mapSvgElement(el, ctx, style, textColor)
  }

  if (tag === 'img') {
    const src = el.getAttribute('src')?.trim() || ''
    const alt = el.getAttribute('alt')?.trim() || 'Image'
    let node: SceneNode = {
      id: nextId(ctx, 'img'),
      type: 'SiteImage',
      name: alt.slice(0, 40) || 'Image',
      props: applySurfaceLiterals({ src: src || undefined, alt }, style),
    }
    node = applyBoxStyle(node, style, textColor)
    const attrW = Number(el.getAttribute('width'))
    const attrH = Number(el.getAttribute('height'))
    if (Number.isFinite(attrW) && attrW > 0) {
      node = { ...node, style: { ...(node.style ?? {}), width: attrW } }
    }
    if (Number.isFinite(attrH) && attrH > 0) {
      node = { ...node, style: { ...(node.style ?? {}), height: attrH } }
    }
    return node
  }

  if (tag === 'input') {
    return mapFormInput(ctx, el, style, textColor)
  }
  if (tag === 'textarea') {
    return mapFormTextarea(ctx, el, style, textColor)
  }
  if (tag === 'select') {
    return mapFormSelect(ctx, el, style, textColor)
  }

  if (tag === 'button' || el.getAttribute('role') === 'button') {
    const kids = elementChildren(el)
    const hasSvg = kids.some((k) => k.tagName.toLowerCase() === 'svg')
    if (hasSvg || kids.length > 1) {
      const mappedKids = kids.map((c) => mapElement(c, ctx)).filter(Boolean) as SceneNode[]
      if (mappedKids.length > 0) {
        const textParts = textContent(el)
        let node: SceneNode = {
          id: nextId(ctx, 'btn'),
          type: 'SiteButton',
          name: (el.getAttribute('aria-label') || textParts || 'Button').slice(0, 40),
          props: applySurfaceLiterals({ direction: 'row', gap: '8px' }, paint),
          children: mappedKids,
        }
        return applyBoxStyle(node, paint, textColor)
      }
    }
    const label = textContent(el) || 'Button'
    let node: SceneNode = {
      id: nextId(ctx, 'btn'),
      type: 'SiteButton',
      name: label.slice(0, 40),
      props: applySurfaceLiterals({ children: label }, paint),
    }
    return applyBoxStyle(node, paint, textColor)
  }

  if (tag === 'a') {
    const kids = elementChildren(el)
    const hasBlockChild = kids.some((k) => {
      const t = k.tagName.toLowerCase()
      return t !== 'br' && !INLINE_PHRASE_TAGS.has(t)
    })
    // Card-like anchors keep structure — flatten only phrase/text links.
    if (!hasBlockChild) {
      const onlyInline =
        kids.length === 0 ||
        kids.every((k) => {
          const t = k.tagName.toLowerCase()
          return t === 'br' || INLINE_PHRASE_TAGS.has(t)
        })
      const hasBlockInline = kids.some((k) => {
        if (!INLINE_PHRASE_TAGS.has(k.tagName.toLowerCase())) return false
        return (resolveElementStyle(k, ctx).display ?? '').toLowerCase() === 'block'
      })
      if (onlyInline && !hasBlockInline) {
        const label = (
          kids.length > 0 ? joinedInlinePhraseText(el) : textContent(el)
        ) || (el.getAttribute('href')?.trim() || '#')
        const href = el.getAttribute('href')?.trim() || '#'
        const classNameLower = className.toLowerCase()
        const looksButton =
          classNameLower.includes('btn') ||
          classNameLower.includes('button') ||
          Boolean(pickColor(paint))
        if (looksButton) {
          let node: SceneNode = {
            id: nextId(ctx, 'btn'),
            type: 'SiteButton',
            name: label.slice(0, 40),
            props: applySurfaceLiterals({ children: label }, paint),
          }
          return applyBoxStyle(node, paint, textColor)
        }
        let node: SceneNode = {
          id: nextId(ctx, 'link'),
          type: 'SiteLink',
          name: label.slice(0, 40),
          props: applySurfaceLiterals({ children: label, href }, paint),
        }
        return applyBoxStyle(node, paint, textColor)
      }
    }
    // Fall through to container mapping for structural <a> (story cards, etc.)
  }

  if (tag === 'hr') {
    return {
      id: nextId(ctx, 'hr'),
      type: 'SiteDivider',
      name: 'Divider',
      props: applySurfaceLiterals({}, paint),
    }
  }

  if (/^h[1-3]$/.test(tag)) {
    const role = tag === 'h1' ? 'display' : 'title'
    if (headlineNeedsInlineSplit(el, ctx, paint, textColor)) {
      return mapSplitHeadline(ctx, el, role, paint, textColor)
    }
    const kids = elementChildren(el)
    const phraseOrBr = kids.every((k) => {
      const t = k.tagName.toLowerCase()
      return t === 'br' || INLINE_PHRASE_TAGS.has(t)
    })
    const text =
      kids.length > 0 && phraseOrBr ? joinedInlinePhraseText(el) : textContent(el)
    return mapLeafText(ctx, text, role, tag.toUpperCase(), paint, textColor)
  }

  if (tag === 'p' || tag === 'label' || tag === 'span' || tag === 'strong' || tag === 'em') {
    const kids = elementChildren(el)
    if (kids.length === 0) {
      const text = textContent(el)
      if (looksLikeMarkSurface(style, className)) {
        return mapMarkSurface(ctx, el, text, paint, textColor)
      }
      if (looksLikeBadge(el, tag, className, paint, text)) {
        return mapBadge(ctx, el, text, paint, textColor)
      }
      const role = tag === 'label' ? 'meta' : 'body'
      return mapLeafText(ctx, text, role, tag, paint, textColor)
    }
    // Nested inline phrases → single text (avoids "3" / "+" as stacked SiteTexts)
    if (kids.every((k) => INLINE_PHRASE_TAGS.has(k.tagName.toLowerCase()))) {
      const joined = joinedInlinePhraseText(el)
      if (looksLikeMarkSurface(style, className)) {
        return mapMarkSurface(ctx, el, joined, paint, textColor)
      }
      if (looksLikeBadge(el, tag, className, paint, joined)) {
        return mapBadge(ctx, el, joined, paint, textColor)
      }
      return mapLeafText(ctx, joined, 'body', tag, paint, textColor)
    }
    // Mixed content: wrap as stack of mapped children + leftover text
  }
  // Containers / sections (includes structural <a> with block children)
  const containerTags = new Set([
    'div',
    'section',
    'header',
    'footer',
    'main',
    'nav',
    'article',
    'aside',
    'ul',
    'ol',
    'li',
    'form',
    'body',
    'a',
  ])

  if (containerTags.has(tag) || tag === 'p' || tag === 'span') {
    const kids = elementChildren(el)
    // Div/section that is only inline phrase tags → one SiteText
    if (
      kids.length > 0 &&
      kids.every((k) => INLINE_PHRASE_TAGS.has(k.tagName.toLowerCase())) &&
      !pickColor(paint) &&
      !isGrid(style) &&
      (tag === 'div' || tag === 'span' || tag === 'p')
    ) {
      const joined = joinedInlinePhraseText(el)
      if (joined) {
        if (looksLikeMarkSurface(style, className)) {
          return mapMarkSurface(ctx, el, joined, paint, textColor)
        }
        if (looksLikeBadge(el, tag, className, paint, joined)) {
          return mapBadge(ctx, el, joined, paint, textColor)
        }
        return mapLeafText(ctx, joined, 'body', tag, paint, textColor)
      }
    }

    // Text-only / empty containers: mark / badge before SiteText
    if (kids.length === 0) {
      const onlyText = textContent(el)
      if (onlyText && looksLikeMarkSurface(style, className)) {
        return mapMarkSurface(ctx, el, onlyText, paint, textColor)
      }
      if (onlyText && looksLikeBadge(el, tag, className, paint, onlyText)) {
        return mapBadge(ctx, el, onlyText, paint, textColor)
      }
    }

    let mapped: SceneNode[] = []
    for (const child of kids) {
      const n = mapElement(child, ctx)
      if (n) mapped.push(n)
    }
    mapped = coalesceSplitTextNodes(mapped)

    // Preserve loose text in containers with element children (brand wordmark etc.)
    const loose = directText(el)
    if (loose && kids.length > 0) {
      const t = mapLeafText(ctx, loose, 'body', 'text', paint, textColor)
      if (t) mapped.unshift(t)
    }

    if (mapped.length === 0) {
      // Empty or text-only container
      const onlyText = textContent(el)
      if (onlyText) {
        if (looksLikeMarkSurface(style, className)) {
          return mapMarkSurface(ctx, el, onlyText, paint, textColor)
        }
        if (looksLikeBadge(el, tag, className, paint, onlyText)) {
          return mapBadge(ctx, el, onlyText, paint, textColor)
        }
        return mapLeafText(ctx, onlyText, 'body', tag, paint, textColor)
      }
      // Keep decorative empty surfaces (hero media / placeholders with bg + mass)
      if (shouldKeepEmptySurface(style)) {
        let empty: SceneNode = {
          id: nextId(ctx, 'stack'),
          type: 'SiteStack',
          name: el.getAttribute('aria-label')?.trim() || el.getAttribute('data-name')?.trim() || tag,
          props: applySurfaceLiterals({ direction: 'column', gap: '0' }, style),
          children: [],
        }
        return finishHost(el, applyBoxStyle(empty, style, textColor), ctx)
      }
      return null
    }

    if (
      mapped.length === 1 &&
      !pickColor(style) &&
      !style.gap &&
      !style.padding &&
      tag === 'div' &&
      !isGrid(style)
    ) {
      // Collapse trivial wrapper
      return applyBoxStyle(
        {
          ...mapped[0]!,
          props: applySurfaceLiterals({ ...(mapped[0]!.props ?? {}) }, style),
        },
        style,
        textColor,
      )
    }

    if (isGrid(style)) {
      const columns = gridColumnCount(style, mapped.length)
      const tmpl = (style['grid-template-columns'] ?? '').trim()
      if (columns >= 2) {
        ctx.warnings.push({
          code: 'mapped-grid-to-sitegrid',
          message: `CSS grid on <${tag}> mapped to SiteGrid (${columns} cols)`,
        })
        let node: SceneNode = {
          id: nextId(ctx, 'grid'),
          type: 'SiteGrid',
          name: el.getAttribute('aria-label')?.trim() || el.getAttribute('data-name')?.trim() || tag,
          props: applySurfaceLiterals(
            {
              columns,
              ...(tmpl && tmpl !== 'none' ? { gridTemplateColumns: tmpl } : {}),
              gap: style.gap || '24px',
            },
            style,
          ),
          children: mapped,
        }
        return finishHost(el, applyBoxStyle(node, style, textColor), ctx)
      }
      // Rows-only / single-column grid → column stack (preserve band height)
      ctx.warnings.push({
        code: 'mapped-grid-rows-to-stack',
        message: `CSS grid without multi-column template on <${tag}> mapped to column SiteStack`,
      })
    }

    const direction = isGrid(style)
      ? 'column'
      : flexDirection(style, tag, mapped.length, className)
    const allShortText =
      mapped.length >= 2 &&
      mapped.every(
        (m) =>
          m.type === 'SiteText' &&
          isShortMetricFragment(String(m.props?.children ?? '')),
      )

    let node: SceneNode = {
      id: nextId(ctx, 'stack'),
      type: 'SiteStack',
      name: el.getAttribute('aria-label')?.trim() || el.getAttribute('data-name')?.trim() || tag,
      props: applySurfaceLiterals(
        {
          direction: allShortText ? 'row' : direction,
          ...(style.gap
            ? {}
            : {
                gap:
                  allShortText ? '0' : direction === 'row' ? '16px' : '24px',
              }),
        },
        style,
      ),
      children: mapped,
    }
    return finishHost(el, applyBoxStyle(node, style, textColor), ctx)
  }

  // Fallback: treat as stack of children or text
  const kids = elementChildren(el)
  if (kids.length) {
    const mapped = kids.map((c) => mapElement(c, ctx)).filter(Boolean) as SceneNode[]
    if (!mapped.length) return null
    return finishHost(
      el,
      {
        id: nextId(ctx, 'stack'),
        type: 'SiteStack',
        name: tag,
        props: applySurfaceLiterals({ direction: 'column', gap: '16px' }, style),
        children: mapped,
      },
      ctx,
    )
  }
  const t = textContent(el)
  if (t) return mapLeafText(ctx, t, 'body', tag, style, textColor)
  return null
}

/**
 * Convert an HTML document or body fragment into a SiteStack page root.
 */
export async function htmlToSceneRoot(html: string): Promise<HtmlToSceneResult> {
  const raw = typeof html === 'string' ? html : ''
  const htmlBytes = Buffer.byteLength(raw, 'utf8')
  if (raw.trim().length === 0) {
    return { ok: false, code: 'html-empty', message: 'HTML is empty' }
  }
  if (raw.length > HTML_IMPORT_MAX_CHARS) {
    return {
      ok: false,
      code: 'html-too-large',
      message: `HTML exceeds ${HTML_IMPORT_MAX_CHARS} characters`,
    }
  }

  try {
    const { JSDOM } = await import('jsdom')
    const dom = new JSDOM(raw.includes('<html') || raw.includes('<body') ? raw : `<body>${raw}</body>`)
    const document = dom.window.document

    // Strip scripts/iframes
    for (const bad of Array.from(document.querySelectorAll('script, iframe'))) {
      bad.remove()
    }

    const warnings: HtmlImportWarning[] = []
    if (/\b@media\b/i.test(raw)) {
      warnings.push({
        code: 'ignored-media-query',
        message: 'Media queries are not mapped to breakpoints in v1',
      })
    }
    const classRules = parseClassRulesFromDocument(document)
    if (document.querySelector('style') && classRules.size === 0) {
      warnings.push({
        code: 'stylesheet-unmapped',
        message: 'Complex <style> selectors not mapped; use inline style or simple .class rules',
      })
    }

    const cssVars = extractCssVars(classRules)
    const ctx: MapCtx = { warnings, seq: 0, classRules, cssVars, pseudoMapped: 0 }
    const body = document.body
    if (!body) {
      return { ok: false, code: 'html-map-failed', message: 'No body element' }
    }

    const children: SceneNode[] = []
    for (const child of elementChildren(body)) {
      const n = mapElement(child, ctx)
      if (n) children.push(n)
    }

    // Body-level loose text
    const loose = directText(body)
    if (loose) {
      const t = mapLeafText(ctx, loose, 'body', 'body-text', {})
      if (t) children.unshift(t)
    }

    if (!children.length) {
      return { ok: false, code: 'html-empty', message: 'No mappable content in HTML' }
    }

    const shell = resolveStyleMap(pageShellStyle(classRules), cssVars)
    const bodyStyle = {
      ...shell,
      ...resolveElementStyle(body, ctx),
    }
    const pageBg = pickPageBackground(bodyStyle, shell, children)
    const rootProps = applySurfaceLiterals(
      {
        direction: 'column',
        // Sections usually own their own padding/rhythm — do not invent a 32px page gap.
        gap: bodyStyle.gap || '0',
      },
      bodyStyle,
    )
    if (pageBg && !rootProps.background) {
      rootProps.background = pageBg
    }
    if (shell.color && !rootProps.color) {
      rootProps.color = shell.color
    }
    if (shell['font-family'] && !rootProps.fontFamily) {
      rootProps.fontFamily = shell['font-family']
    }

    const root: SceneNode = applyBoxStyle(
      {
        id: nextId(ctx, 'page'),
        type: 'SiteStack',
        name: 'Imported page',
        props: rootProps,
        children,
      },
      bodyStyle,
    )

    if (/::(?:before|after)\b/i.test(raw)) {
      if (ctx.pseudoMapped > 0) {
        warnings.push({
          code: 'mapped-pseudo-to-decor',
          message: `Mapped ${ctx.pseudoMapped} ::before/::after layer(s) to decorative SiteStack children`,
        })
      } else {
        warnings.push({
          code: 'dropped-pseudo',
          message: '::before/::after rules had no mappable paint (clip-path/hover/transition only)',
        })
      }
    }

    return {
      ok: true,
      root,
      warnings,
      stats: { nodeCount: countNodes(root), htmlBytes },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, code: 'html-map-failed', message: message.slice(0, 240) }
  }
}
