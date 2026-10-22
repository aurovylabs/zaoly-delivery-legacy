/**
 * Chart studio series helpers — structured `SiteChartPoint[]` on props.data.
 * Spec: `specs/domain/chart-studio-panel.md`
 */
import {
  formatChartSeriesText,
  parseChartSeriesText,
  type SiteChartPoint,
} from '@zaoly/site-kit'

export function readChartSeriesPoints(raw: unknown): SiteChartPoint[] {
  if (typeof raw === 'string') return parseChartSeriesText(raw)
  if (!Array.isArray(raw)) return []
  const out: SiteChartPoint[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const label = String(r.label ?? '').trim()
    const value = typeof r.value === 'number' ? r.value : Number(r.value)
    if (!label || !Number.isFinite(value)) continue
    out.push(normalizePointFields({ label, value, ...pickColors(r) }))
  }
  return out
}

function pickColors(r: Record<string, unknown>): Pick<SiteChartPoint, 'color' | 'colorToken'> {
  const out: Pick<SiteChartPoint, 'color' | 'colorToken'> = {}
  const color = typeof r.color === 'string' ? r.color.trim() : ''
  if (color) out.color = color
  const colorToken = typeof r.colorToken === 'string' ? r.colorToken.trim() : ''
  if (colorToken) out.colorToken = colorToken
  return out
}

function normalizePointFields(p: SiteChartPoint): SiteChartPoint {
  const next: SiteChartPoint = { label: p.label, value: p.value }
  if (p.color?.trim()) next.color = p.color.trim()
  if (p.colorToken?.trim()) next.colorToken = p.colorToken.trim()
  return next
}

export function chartSeriesPointsEqual(a: SiteChartPoint[], b: SiteChartPoint[]): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (p, i) =>
      p.label === b[i]!.label &&
      p.value === b[i]!.value &&
      (p.color ?? '') === (b[i]!.color ?? '') &&
      (p.colorToken ?? '') === (b[i]!.colorToken ?? ''),
  )
}

export function updateChartSeriesLabel(
  points: SiteChartPoint[],
  index: number,
  label: string,
): SiteChartPoint[] {
  const next = points.map((p) => ({ ...p }))
  const row = next[index]
  if (!row) return points
  const trimmed = label.trim()
  if (!trimmed) return points
  next[index] = { ...row, label: trimmed }
  return next
}

export function updateChartSeriesValue(
  points: SiteChartPoint[],
  index: number,
  raw: string,
): SiteChartPoint[] {
  const next = points.map((p) => ({ ...p }))
  const row = next[index]
  if (!row) return points
  const value = Number(raw.trim())
  if (!Number.isFinite(value)) return points
  next[index] = { ...row, value }
  return next
}

export function updateChartSeriesColor(
  points: SiteChartPoint[],
  index: number,
  nextColor: { color?: string; colorToken?: string } | null,
): SiteChartPoint[] {
  const next = points.map((p) => ({ ...p }))
  const row = next[index]
  if (!row) return points
  const updated: SiteChartPoint = { label: row.label, value: row.value }
  if (nextColor?.colorToken?.trim()) {
    updated.colorToken = nextColor.colorToken.trim()
    if (nextColor.color?.trim()) updated.color = nextColor.color.trim()
  } else if (nextColor?.color?.trim()) {
    updated.color = nextColor.color.trim()
  }
  // Preserve other color field only when clearing partially — null clears both.
  if (nextColor === null) {
    next[index] = { label: row.label, value: row.value }
  } else {
    next[index] = updated
  }
  return next
}

export function addChartSeriesPoint(
  points: SiteChartPoint[],
  point: SiteChartPoint = { label: 'Point', value: 0 },
): SiteChartPoint[] {
  const label = uniqueSeriesLabel(points, point.label.trim() || 'Point')
  return [
    ...points,
    normalizePointFields({
      ...point,
      label,
      value: Number.isFinite(point.value) ? point.value : 0,
    }),
  ]
}

export function removeChartSeriesPoint(points: SiteChartPoint[], index: number): SiteChartPoint[] {
  if (index < 0 || index >= points.length) return points
  return points.filter((_, i) => i !== index)
}

export function moveChartSeriesPoint(
  points: SiteChartPoint[],
  index: number,
  delta: -1 | 1,
): SiteChartPoint[] {
  const target = index + delta
  if (index < 0 || index >= points.length || target < 0 || target >= points.length) {
    return points
  }
  const next = points.map((p) => ({ ...p }))
  const tmp = next[index]!
  next[index] = next[target]!
  next[target] = tmp
  return next
}

function uniqueSeriesLabel(points: SiteChartPoint[], base: string): string {
  const used = new Set(points.map((p) => p.label))
  if (!used.has(base)) return base
  let n = 2
  while (used.has(`${base} ${n}`)) n += 1
  return `${base} ${n}`
}

/** Prefer structured array for scene storage; text form kept for Inspect stopgap / paste. */
export function serializeChartSeriesForScene(points: SiteChartPoint[]): SiteChartPoint[] {
  return points.map((p) => normalizePointFields(p))
}

export function chartSeriesAsInspectText(points: SiteChartPoint[]): string {
  return formatChartSeriesText(points)
}
