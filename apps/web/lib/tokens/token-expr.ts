/**
 * CSS-native token expressions for Zaoly local pack compose.
 * Spec: specs/domain/zaoly-token-studio.md · knowledge/upstream-pack-out-of-scope-for-zaoly.md
 */
import { paths } from '../paths'

const REF_RE = /\{([a-z][a-z0-9]*(?:\.[a-zA-Z0-9_-]+)+)\}/g

export function pathToZaolyCssVar(tokenPath: string): string {
  const dashed = tokenPath.trim().replace(/\./g, '-')
  return `${paths.zaolyTokenCssVarPrefix}${dashed}`
}

export function extractTokenRefs(expr: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  REF_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = REF_RE.exec(expr)) !== null) {
    const path = m[1]!
    if (!seen.has(path)) {
      seen.add(path)
      out.push(path)
    }
  }
  return out
}

/** True when digital looks like a compose expression (refs / calc / color-mix). */
export function looksLikeTokenExpr(raw: string): boolean {
  const v = raw.trim()
  if (!v) return false
  if (extractTokenRefs(v).length > 0) return true
  if (/^calc\(/i.test(v)) return true
  if (/^color-mix\(/i.test(v)) return true
  return false
}

export function compileTokenExprToCss(expr: string): string {
  return expr.replace(REF_RE, (_full, path: string) => `var(${pathToZaolyCssVar(path)})`)
}

export function buildSpacingScaleExpr(basePath: string, factor: number): string {
  const f = Number.isInteger(factor) ? String(factor) : String(Math.round(factor * 1000) / 1000)
  return `calc({${basePath}} * ${f})`
}

export function buildSpacingHalfExpr(basePath: string): string {
  return `calc({${basePath}} / 2)`
}

export type ColorMixToward = 'white' | 'black'

export function buildColorMixExpr(
  basePath: string,
  percent: number,
  toward: ColorMixToward,
): string {
  const pct = Math.max(1, Math.min(99, Math.round(percent)))
  return `color-mix(in oklch, {${basePath}} ${pct}%, ${toward})`
}

export type ResolveTokenCss = (tokenPath: string) => string | null

/**
 * Substitute `{path}` refs with concrete CSS values for studio preview.
 * Detects cycles; returns null when unresolved.
 */
export function resolveTokenExpr(
  expr: string,
  resolveCss: ResolveTokenCss,
  stack: string[] = [],
): string | null {
  const trimmed = expr.trim()
  if (!trimmed) return null
  const refs = extractTokenRefs(trimmed)
  if (refs.length === 0) return trimmed

  let out = trimmed
  for (const ref of refs) {
    if (stack.includes(ref)) return null
    const css = resolveCss(ref)
    if (!css?.trim()) return null
    const nested = looksLikeTokenExpr(css)
      ? resolveTokenExpr(css, resolveCss, [...stack, ref])
      : css.trim()
    if (!nested) return null
    out = out.split(`{${ref}}`).join(nested)
  }
  return out
}

export function wouldCreateCycle(
  leafPath: string,
  expr: string,
  resolveCss: ResolveTokenCss,
): boolean {
  const refs = extractTokenRefs(expr)
  if (refs.includes(leafPath)) return true

  function reaches(from: string, seen: Set<string>): boolean {
    if (from === leafPath) return true
    if (seen.has(from)) return false
    seen.add(from)
    const css = resolveCss(from)
    if (!css || !looksLikeTokenExpr(css)) return false
    for (const r of extractTokenRefs(css)) {
      if (reaches(r, seen)) return true
    }
    return false
  }

  for (const ref of refs) {
    if (reaches(ref, new Set())) return true
  }
  return false
}

/** Rewrite `{fromPath}` refs inside a stored leaf value string (JSON text or expr). */
export function rewriteTokenPathRefs(raw: string, fromPath: string, toPath: string): string {
  const from = fromPath.trim()
  const to = toPath.trim()
  if (!from || !to || from === to) return raw
  return raw.split(`{${from}}`).join(`{${to}}`)
}

export const SPACING_SCALE_PRESETS = [
  { id: 'x2', labelKey: 'tokens.composeScale2', factor: 2 },
  { id: 'x1_5', labelKey: 'tokens.composeScale15', factor: 1.5 },
  { id: 'half', labelKey: 'tokens.composeScaleHalf', factor: 0.5 },
] as const

export const COLOR_SHADE_PRESETS = [
  { id: 'soft', labelKey: 'tokens.composeShadeSoft', percent: 22, toward: 'white' as const },
  { id: 'tint', labelKey: 'tokens.composeShadeTint', percent: 45, toward: 'white' as const },
  { id: 'shade', labelKey: 'tokens.composeShadeDark', percent: 55, toward: 'black' as const },
  { id: 'ink', labelKey: 'tokens.composeShadeInk', percent: 28, toward: 'black' as const },
] as const

export type ComposeCandidateLeaf = {
  path: string
  /** Raw digital scalar for literal-vs-derived ranking. */
  digital: string
}

/** Shared path segments from the root (`color.action` → 2). */
export function sharedPathPrefixDepth(a: string, b: string): number {
  const left = a.split('.').filter(Boolean)
  const right = b.split('.').filter(Boolean)
  let i = 0
  while (i < left.length && i < right.length && left[i] === right[i]) i += 1
  return i
}

/** Parse px/rem/em lengths to px for proximity ranking. */
export function parseCssLengthPx(css: string): number | null {
  const m = css.trim().match(/^(-?[\d.]+)\s*(px|rem|em)$/i)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n)) return null
  const unit = m[2]!.toLowerCase()
  if (unit === 'rem' || unit === 'em') return n * 16
  return n
}

function probeExprForCandidate(candidatePath: string): string {
  return `{${candidatePath}}`
}

/**
 * Cycle-safe, ranked base-token paths for Derived compose.
 * Order: path family → literal over derived → spacing proximity → localeCompare.
 */
export function listSmartComposeCandidates(opts: {
  leafPath: string
  candidates: ComposeCandidateLeaf[]
  resolveCss: ResolveTokenCss
  currentDigital?: string
}): string[] {
  const leafPath = opts.leafPath.trim()
  const currentResolved =
    opts.currentDigital && looksLikeTokenExpr(opts.currentDigital)
      ? resolveTokenExpr(opts.currentDigital, opts.resolveCss)
      : opts.currentDigital?.trim() || null
  const currentPx = currentResolved ? parseCssLengthPx(currentResolved) : null

  const scored = opts.candidates
    .filter((row) => {
      if (!row.path || row.path === leafPath) return false
      if (!leafPath) return true
      return !wouldCreateCycle(leafPath, probeExprForCandidate(row.path), opts.resolveCss)
    })
    .map((row) => {
      const digital = row.digital.trim()
      const family = leafPath ? sharedPathPrefixDepth(leafPath, row.path) : 0
      const literalScore = looksLikeTokenExpr(digital) ? 0 : 1
      let proximity = 0
      if (currentPx != null) {
        const candCss = looksLikeTokenExpr(digital)
          ? resolveTokenExpr(digital, opts.resolveCss)
          : digital
        const candPx = candCss ? parseCssLengthPx(candCss) : null
        if (candPx != null) proximity = -Math.abs(currentPx - candPx)
      }
      return { path: row.path, family, literalScore, proximity }
    })

  scored.sort((a, b) => {
    if (b.family !== a.family) return b.family - a.family
    if (b.literalScore !== a.literalScore) return b.literalScore - a.literalScore
    if (b.proximity !== a.proximity) return b.proximity - a.proximity
    return a.path.localeCompare(b.path)
  })

  return scored.map((row) => row.path)
}

/** Top-ranked safe base, or empty when none. */
export function pickDefaultComposeBase(opts: {
  leafPath: string
  candidates: ComposeCandidateLeaf[]
  resolveCss: ResolveTokenCss
  currentDigital?: string
}): string {
  return listSmartComposeCandidates(opts)[0] ?? ''
}
