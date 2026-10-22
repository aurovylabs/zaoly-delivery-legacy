/**
 * Chart studio mark helpers — `props.chartStyle` map.
 * Spec: `specs/domain/chart-studio-panel.md`
 */
import {
  normalizeChartStyle,
  SITE_CHART_STYLE_DEFAULTS,
  type SiteChartStyle,
} from '@zaoly/site-kit'

export type ChartMarkControlId = 'barGap' | 'donutHole' | 'strokeWidth' | 'pointRadius'

export function chartMarkControlsForKind(chartType: string): ChartMarkControlId[] {
  switch (chartType) {
    case 'bar':
    case 'bar_horizontal':
      return ['barGap']
    case 'funnel':
      return ['barGap']
    case 'line':
    case 'area':
      return ['strokeWidth', 'pointRadius']
    case 'scatter':
      return ['pointRadius']
    case 'donut':
      return ['donutHole']
    default:
      return []
  }
}

export function readChartStyle(raw: unknown): SiteChartStyle {
  return normalizeChartStyle(raw)
}

export function patchChartStyle(
  current: unknown,
  patch: Partial<SiteChartStyle>,
): SiteChartStyle {
  const base = normalizeChartStyle(current)
  const next: SiteChartStyle = { ...base }
  if ('barGap' in patch) {
    if (patch.barGap == null || !Number.isFinite(patch.barGap)) delete next.barGap
    else next.barGap = patch.barGap
  }
  if ('donutHole' in patch) {
    if (patch.donutHole == null || !Number.isFinite(patch.donutHole)) delete next.donutHole
    else next.donutHole = patch.donutHole
  }
  if ('strokeWidth' in patch) {
    if (patch.strokeWidth == null || !Number.isFinite(patch.strokeWidth)) delete next.strokeWidth
    else next.strokeWidth = patch.strokeWidth
  }
  if ('pointRadius' in patch) {
    if (patch.pointRadius == null || !Number.isFinite(patch.pointRadius)) delete next.pointRadius
    else next.pointRadius = patch.pointRadius
  }
  if ('strokeColor' in patch) {
    const c = typeof patch.strokeColor === 'string' ? patch.strokeColor.trim() : ''
    if (!c) delete next.strokeColor
    else next.strokeColor = c
  }
  return normalizeChartStyle(next)
}

export function chartStyleDisplayValue(
  style: SiteChartStyle,
  key: ChartMarkControlId,
): string {
  const v = style[key]
  if (v != null && Number.isFinite(v)) {
    if (key === 'donutHole') return String(Math.round(v * 100))
    return String(v)
  }
  if (key === 'barGap') return String(SITE_CHART_STYLE_DEFAULTS.barGap)
  if (key === 'donutHole') return String(Math.round(SITE_CHART_STYLE_DEFAULTS.donutHole * 100))
  if (key === 'strokeWidth') return String(SITE_CHART_STYLE_DEFAULTS.strokeWidth)
  if (key === 'pointRadius') return String(SITE_CHART_STYLE_DEFAULTS.pointRadiusLine)
  return ''
}

/** Parse studio input → chartStyle number (donutHole UI is percent 0–85). */
export function parseChartMarkInput(
  key: ChartMarkControlId,
  raw: string,
): number | null {
  const n = Number(raw.trim())
  if (!Number.isFinite(n)) return null
  if (key === 'donutHole') return n / 100
  return n
}
