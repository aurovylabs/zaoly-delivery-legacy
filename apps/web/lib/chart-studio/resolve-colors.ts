/**
 * Resolve token pack colorToken → CSS on SiteChart series before Site Kit paint.
 * Spec: `specs/domain/chart-studio-panel.md` Phase 4
 */
import type { SiteChartPoint, SiteChartStyle } from '@zaoly/site-kit'
import {
  previewForBinding,
  tokenByPath,
  type InspectTokenOption,
} from '../inspect/token-catalog'
import type { TokenChannel } from '../inspect/digital-css'
import { readChartSeriesPoints } from './series'
import { normalizeChartStyle } from '@zaoly/site-kit'

export function resolveChartSeriesColors(
  rawData: unknown,
  catalog: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): SiteChartPoint[] {
  const points = readChartSeriesPoints(rawData)
  return points.map((p) => {
    if (!p.colorToken) return p
    const tok = tokenByPath(p.colorToken, catalog)
    if (!tok) return p
    const css = previewForBinding(tok, 'color', channel)
    if (!css) return p
    return { ...p, color: css }
  })
}

export function resolveChartStyleColors(
  rawStyle: unknown,
  catalog: InspectTokenOption[],
  channel: TokenChannel = 'digital',
  strokeColorToken?: string,
): SiteChartStyle {
  const style = normalizeChartStyle(rawStyle)
  const token = strokeColorToken?.trim()
  if (!token) return style
  const tok = tokenByPath(token, catalog)
  if (!tok) return style
  const css = previewForBinding(tok, 'color', channel)
  if (!css) return style
  return { ...style, strokeColor: css }
}
