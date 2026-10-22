/**
 * Map CSS `clip-path: polygon(...)` onto Phase A `clipInset*` or Phase C `clipPolygon`
 * or Phase D `clipPathD` (surface-clip-slant.md CL12 / CL22 / CL29).
 */

import {
  CLIP_POLYGON_MAX_POINTS,
  CLIP_POLYGON_MIN_POINTS,
  formatClipPolygonPoints,
  parseClipPolygonPoints,
  type ClipPolygonPoint,
} from '../inspect/clip-polygon'
import { parseClipPathD } from '../inspect/clip-path-d'

const ZERO = /^(0|0px|0%)$/i

function parseLength(raw: string): { kind: 'pct' | 'px' | 'other'; value: number; text: string } | null {
  const t = raw.trim()
  if (!t) return null
  const pct = t.match(/^(-?\d+(?:\.\d+)?)%$/)
  if (pct) return { kind: 'pct', value: Number(pct[1]), text: t }
  const px = t.match(/^(-?\d+(?:\.\d+)?)px$/i)
  if (px) return { kind: 'px', value: Number(px[1]), text: t }
  if (/^-?\d+(\.\d+)?$/.test(t)) return { kind: 'other', value: Number(t), text: t }
  return { kind: 'other', value: NaN, text: t }
}

function isZero(raw: string): boolean {
  return !raw.trim() || ZERO.test(raw.trim())
}

/** Convert a far-edge coord (100% - inset or calc) into an inset length string. */
function insetFromFarEdge(coord: string): string | undefined {
  const t = coord.trim()
  const calc = t.match(/^calc\(\s*100%\s*-\s*(.+?)\s*\)$/i)
  if (calc) {
    const inner = calc[1].trim()
    return isZero(inner) ? undefined : inner
  }
  const parsed = parseLength(t)
  if (!parsed) return undefined
  if (parsed.kind === 'pct') {
    const inset = 100 - parsed.value
    if (inset <= 0.01) return undefined
    return `${Number(inset.toFixed(4))}%`
  }
  if (t === '100%' || t === '100') return undefined
  return undefined
}

function insetFromNearEdge(coord: string): string | undefined {
  const t = coord.trim()
  if (isZero(t)) return undefined
  return t
}

/**
 * Parse `polygon(...)` into clipInset* props when it is a 4-point corner-inset silhouette.
 * Returns null when the polygon is not a 4-point corner-inset shape.
 */
export function clipInsetsFromCssPolygon(
  clipPath: string,
): Record<string, string> | null {
  const points = parseClipPolygonPoints(clipPath)
  if (!points || points.length !== 4) return null
  const [tl, tr, br, bl] = points

  const out: Record<string, string> = {}
  const tlX = insetFromNearEdge(tl.x)
  const tlY = insetFromNearEdge(tl.y)
  const trX = insetFromFarEdge(tr.x)
  const trY = insetFromNearEdge(tr.y)
  const brX = insetFromFarEdge(br.x)
  const brY = insetFromFarEdge(br.y)
  const blX = insetFromNearEdge(bl.x)
  const blY = insetFromFarEdge(bl.y)

  const nearOk = (v: string) =>
    isZero(v) || parseLength(v) != null || /^calc\(/i.test(v)
  const farOk = (v: string) =>
    v === '100%' ||
    v === '100' ||
    /^calc\(\s*100%/i.test(v) ||
    (parseLength(v)?.kind === 'pct' && (parseLength(v)?.value ?? 0) >= 50)
  if (!nearOk(tl.x) || !nearOk(tl.y)) return null
  if (!farOk(tr.x) || !nearOk(tr.y)) return null
  if (!farOk(br.x) || !farOk(br.y)) return null
  if (!nearOk(bl.x) || !farOk(bl.y)) return null

  if (tlX) out.clipInsetTopLeftX = tlX
  if (tlY) out.clipInsetTopLeftY = tlY
  if (trX) out.clipInsetTopRightX = trX
  if (trY) out.clipInsetTopRightY = trY
  if (brX) out.clipInsetBottomRightX = brX
  if (brY) out.clipInsetBottomRightY = brY
  if (blX) out.clipInsetBottomLeftX = blX
  if (blY) out.clipInsetBottomLeftY = blY

  return Object.keys(out).length ? out : {}
}

/**
 * Map any CSS clip-path onto scene props (CL12 / CL22 / CL29).
 * Prefer path() → clipPathD; else insets; else clipPolygon.
 */
export function clipPropsFromCssPolygon(
  clipPath: string,
): Record<string, string> | null {
  const pathD = parseClipPathD(clipPath)
  if (pathD && /^path\s*\(/i.test(clipPath.trim())) {
    return { clipPathD: pathD }
  }

  const insets = clipInsetsFromCssPolygon(clipPath)
  if (insets) return insets

  const points = parseClipPolygonPoints(clipPath)
  if (!points) return null
  if (
    points.length < CLIP_POLYGON_MIN_POINTS ||
    points.length > CLIP_POLYGON_MAX_POINTS
  ) {
    return null
  }
  return { clipPolygon: formatClipPolygonPoints(points) }
}

/** Alias used by callers that map any clip-path form. */
export const clipPropsFromCssClipPath = clipPropsFromCssPolygon

export function clipPolygonPointsFromCss(clipPath: string): ClipPolygonPoint[] | null {
  return parseClipPolygonPoints(clipPath)
}
