/**
 * Free 4–8 point clip polygon → CSS `clip-path` (zaoly-ui-surface-clip / CREATION CL18–CL23).
 * Points are box-relative CSS lengths (`%`, `px`, `calc(...)`).
 */

export type ClipPolygonPoint = {
  x: string
  y: string
}

export const CLIP_POLYGON_MIN_POINTS = 4
export const CLIP_POLYGON_MAX_POINTS = 8

const ZERO = /^(0|0px|0rem|0em|0%)$/i

function axisValue(raw: string | undefined): string | null {
  if (raw == null) return null
  const v = raw.trim()
  if (!v || ZERO.test(v)) return null
  return v
}

/** Split one polygon vertex into x/y, keeping `calc(...)` intact. */
export function splitClipPolygonVertex(part: string): ClipPolygonPoint | null {
  const t = part.trim()
  if (!t) return null
  if (/^calc\(/i.test(t)) {
    let depth = 0
    let end = -1
    for (let i = 0; i < t.length; i++) {
      const ch = t[i]
      if (ch === '(') depth += 1
      else if (ch === ')') {
        depth -= 1
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end < 0) return null
    const x = t.slice(0, end + 1).trim()
    const y = t.slice(end + 1).trim()
    if (!y) return null
    return { x, y }
  }
  const m = t.match(/^(\S+)\s+(.+)$/)
  if (!m) return null
  return { x: m[1], y: m[2].trim() }
}

/**
 * Parse scene `clipPolygon` (interior string or `polygon(...)`) or an array of points.
 * Returns null when count is outside 4–8 or any vertex is invalid.
 */
export function parseClipPolygonPoints(raw: unknown): ClipPolygonPoint[] | null {
  if (raw == null) return null

  if (Array.isArray(raw)) {
    const points: ClipPolygonPoint[] = []
    for (const item of raw) {
      if (!item || typeof item !== 'object') return null
      const rec = item as Record<string, unknown>
      const x = typeof rec.x === 'string' ? rec.x.trim() : ''
      const y = typeof rec.y === 'string' ? rec.y.trim() : ''
      if (!x || !y) return null
      points.push({ x, y })
    }
    if (
      points.length < CLIP_POLYGON_MIN_POINTS ||
      points.length > CLIP_POLYGON_MAX_POINTS
    ) {
      return null
    }
    return points
  }

  if (typeof raw !== 'string') return null
  let body = raw.trim()
  if (!body) return null
  const wrapped = body.match(/^polygon\(\s*(.+)\s*\)$/i)
  if (wrapped) body = wrapped[1].trim()

  const parts = body
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  if (
    parts.length < CLIP_POLYGON_MIN_POINTS ||
    parts.length > CLIP_POLYGON_MAX_POINTS
  ) {
    return null
  }

  const points = parts.map(splitClipPolygonVertex)
  if (points.some((p) => !p)) return null
  return points as ClipPolygonPoint[]
}

/** Serialize points to CSS polygon interior (no `polygon()` wrapper). */
export function formatClipPolygonPoints(points: ClipPolygonPoint[]): string {
  return points.map((p) => `${p.x.trim()} ${p.y.trim()}`).join(', ')
}

/**
 * Build `clip-path: polygon(...)` from 4–8 points, or `undefined` when invalid/empty.
 */
export function clipPathFromPolygonPoints(
  points: ClipPolygonPoint[] | null | undefined,
): string | undefined {
  if (!points || points.length < CLIP_POLYGON_MIN_POINTS) return undefined
  if (points.length > CLIP_POLYGON_MAX_POINTS) return undefined
  const normalized: ClipPolygonPoint[] = []
  for (const p of points) {
    const x = p.x?.trim()
    const y = p.y?.trim()
    if (!x || !y) return undefined
    normalized.push({ x, y })
  }
  return `polygon(${formatClipPolygonPoints(normalized)})`
}

/** Default rectangle silhouette (4 corners) for seeding polygon mode. */
export function defaultClipPolygonPoints(): ClipPolygonPoint[] {
  return [
    { x: '0', y: '0' },
    { x: '100%', y: '0' },
    { x: '100%', y: '100%' },
    { x: '0', y: '100%' },
  ]
}

export function isClipPolygonAxisActive(raw: string | undefined): boolean {
  return axisValue(raw) != null
}
