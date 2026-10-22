import type { CSSProperties, HTMLAttributes } from 'react'

export type SiteChartPoint = {
  label: string
  value: number
  /** Resolved CSS color for paint (`#hex`, `var(--…)`, …). */
  color?: string
  /** Token pack path — resolve at canvas paint when catalog is available. */
  colorToken?: string
}

export const SITE_CHART_VARIANTS = [
  'bar',
  'bar_horizontal',
  'line',
  'area',
  'scatter',
  'pie',
  'donut',
  'funnel',
] as const

export type SiteChartVariant = (typeof SITE_CHART_VARIANTS)[number]

/** Mark/style map on SiteChart — Chart studio Marks section. Spec: chart-studio-panel.md */
export type SiteChartStyle = {
  /** Gap between vertical/horizontal bars or funnel rows (px). Default 8. */
  barGap?: number
  /** Donut inner radius as fraction of outer (0–0.85). Default ~0.58. */
  donutHole?: number
  /** Line/area stroke width (px). Default 2. */
  strokeWidth?: number
  /** Scatter / line vertex radius (px). Default 3 (line) / 5 (scatter). */
  pointRadius?: number
  /** Line/area stroke color (CSS). Falls back to first point color, then accent. */
  strokeColor?: string
}

export const SITE_CHART_STYLE_DEFAULTS = {
  barGap: 8,
  donutHole: 28 / 48,
  strokeWidth: 2,
  pointRadiusLine: 3,
  pointRadiusScatter: 5,
} as const

export function normalizeChartStyle(raw: unknown): SiteChartStyle {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const r = raw as Record<string, unknown>
  const out: SiteChartStyle = {}
  const barGap = numOrUndef(r.barGap)
  const donutHole = numOrUndef(r.donutHole)
  const strokeWidth = numOrUndef(r.strokeWidth)
  const pointRadius = numOrUndef(r.pointRadius)
  if (barGap != null) out.barGap = clamp(barGap, 0, 48)
  if (donutHole != null) out.donutHole = clamp(donutHole, 0, 0.85)
  if (strokeWidth != null) out.strokeWidth = clamp(strokeWidth, 0.5, 16)
  if (pointRadius != null) out.pointRadius = clamp(pointRadius, 1, 24)
  const strokeColor = typeof r.strokeColor === 'string' ? r.strokeColor.trim() : ''
  if (strokeColor) out.strokeColor = strokeColor
  return out
}

function numOrUndef(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export type ChartProps = {
  /** Preferred chart kind prop (Inspect “Chart type”). */
  chartType?: SiteChartVariant | string
  /** @deprecated Prefer `chartType` — kept for older scenes / Masters. */
  variant?: SiteChartVariant | string
  /** Fixture series — `SiteChartPoint[]` or multiline `Label: value` text. */
  data?: SiteChartPoint[] | string
  /** Mark styling — bar gap, donut hole, stroke, point radius. */
  chartStyle?: SiteChartStyle
  title?: string
  height?: number | string
  className?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title' | 'style'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function normalizeData(raw: unknown): SiteChartPoint[] {
  if (typeof raw === 'string') {
    return parseChartSeriesText(raw)
  }
  if (!Array.isArray(raw)) return []
  const out: SiteChartPoint[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const label = String(r.label ?? '').trim()
    const value = typeof r.value === 'number' ? r.value : Number(r.value)
    if (!label || !Number.isFinite(value)) continue
    const point: SiteChartPoint = { label, value }
    const color = typeof r.color === 'string' ? r.color.trim() : ''
    if (color) point.color = color
    const colorToken = typeof r.colorToken === 'string' ? r.colorToken.trim() : ''
    if (colorToken) point.colorToken = colorToken
    out.push(point)
  }
  return out
}

/** One point per line: `Label: 42` or `Label|42` or `Label,42`. */
export function parseChartSeriesText(text: string): SiteChartPoint[] {
  const out: SiteChartPoint[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = /^(.+?)\s*[:|,=]\s*(-?\d+(?:\.\d+)?)\s*$/.exec(trimmed)
    if (!m) continue
    const label = m[1]!.trim()
    const value = Number(m[2])
    if (!label || !Number.isFinite(value)) continue
    out.push({ label, value })
  }
  return out
}

export function formatChartSeriesText(points: SiteChartPoint[]): string {
  return points.map((p) => `${p.label}: ${p.value}`).join('\n')
}

function sliceFill(i: number): string {
  const tones = [
    'var(--accent, #1f44ff)',
    'var(--ok, #c6f24a)',
    'color-mix(in oklab, var(--accent, #1f44ff) 70%, white)',
    'color-mix(in oklab, var(--ok, #c6f24a) 65%, white)',
  ]
  return tones[i % tones.length]!
}

function markFill(point: SiteChartPoint, index: number): string {
  const c = point.color?.trim()
  return c || sliceFill(index)
}

function lineStrokeColor(points: SiteChartPoint[], strokeColor?: string): string {
  const explicit = strokeColor?.trim()
  if (explicit) return explicit
  for (const p of points) {
    const c = p.color?.trim()
    if (c) return c
  }
  return 'var(--accent, #1f44ff)'
}

/** Site Kit chart atom — fixture series for composition authoring. */
export function Chart({
  chartType,
  variant,
  data,
  chartStyle,
  title,
  height = 220,
  className,
  style,
  ...rest
}: ChartProps) {
  const points = normalizeData(data)
  const marks = normalizeChartStyle(chartStyle)
  const h = Math.max(80, Math.round(typeof height === 'number' ? height : Number(height) || 220))
  const max = Math.max(1, ...points.map((p) => p.value))
  const v = String(chartType || variant || 'bar')

  return (
    <div
      className={cx('site-chart', `site-chart--${v}`, className)}
      style={{ ...style, minHeight: h }}
      role="img"
      aria-label={title || 'Chart'}
      data-variant={v}
      data-bar-gap={marks.barGap != null ? String(marks.barGap) : undefined}
      data-donut-hole={marks.donutHole != null ? String(marks.donutHole) : undefined}
      data-stroke-width={marks.strokeWidth != null ? String(marks.strokeWidth) : undefined}
      data-point-radius={marks.pointRadius != null ? String(marks.pointRadius) : undefined}
      {...rest}
    >
      {title ? <div className="site-chart__title">{title}</div> : null}
      {points.length === 0 ? (
        <div className="site-chart__empty">No data</div>
      ) : v === 'pie' || v === 'donut' ? (
        <PieSvg points={points} donut={v === 'donut'} donutHole={marks.donutHole} />
      ) : v === 'bar_horizontal' ? (
        <HorizontalBars points={points} max={max} barGap={marks.barGap} />
      ) : v === 'line' || v === 'area' ? (
        <LineArea
          points={points}
          max={max}
          area={v === 'area'}
          strokeWidth={marks.strokeWidth}
          pointRadius={marks.pointRadius}
          strokeColor={marks.strokeColor}
        />
      ) : v === 'scatter' ? (
        <Scatter points={points} max={max} pointRadius={marks.pointRadius} />
      ) : v === 'funnel' ? (
        <Funnel points={points} max={max} barGap={marks.barGap} />
      ) : (
        <VerticalBars points={points} max={max} barGap={marks.barGap} />
      )}
    </div>
  )
}

function VerticalBars({
  points,
  max,
  barGap,
}: {
  points: SiteChartPoint[]
  max: number
  barGap?: number
}) {
  const w = 240
  const h = 120
  const gap = barGap ?? SITE_CHART_STYLE_DEFAULTS.barGap
  const barW = Math.max(8, (w - gap * (points.length + 1)) / points.length)
  return (
    <svg className="site-chart__svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {points.map((p, i) => {
        const bh = (p.value / max) * (h - 24)
        const x = gap + i * (barW + gap)
        const y = h - 16 - bh
        return (
          <g key={`${p.label}-${i}`}>
            <rect x={x} y={y} width={barW} height={bh} fill={markFill(p, i)} rx={2} />
            <text x={x + barW / 2} y={h - 4} textAnchor="middle" className="site-chart__tick">
              {p.label.slice(0, 6)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function HorizontalBars({
  points,
  max,
  barGap,
}: {
  points: SiteChartPoint[]
  max: number
  barGap?: number
}) {
  const w = 240
  const gap = barGap ?? SITE_CHART_STYLE_DEFAULTS.barGap
  const row = Math.max(14, 14 + gap)
  const h = Math.max(80, points.length * row + 8)
  return (
    <svg className="site-chart__svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {points.map((p, i) => {
        const bw = (p.value / max) * (w - 64)
        const y = 8 + i * row
        return (
          <g key={`${p.label}-${i}`}>
            <text x={0} y={y + 12} className="site-chart__tick">
              {p.label.slice(0, 8)}
            </text>
            <rect x={56} y={y} width={bw} height={14} fill={markFill(p, i)} rx={2} />
          </g>
        )
      })}
    </svg>
  )
}

function lineCoords(points: SiteChartPoint[], max: number) {
  const w = 240
  const h = 120
  const padX = 12
  const padTop = 12
  const padBot = 20
  const innerW = w - padX * 2
  const innerH = h - padTop - padBot
  const n = Math.max(1, points.length)
  return points.map((p, i) => ({
    p,
    i,
    x: padX + i * (innerW / n) + innerW / n / 2,
    y: padTop + innerH - (p.value / max) * innerH,
    w,
    h,
    padTop,
    padBot,
    innerH,
  }))
}

function LineArea({
  points,
  max,
  area,
  strokeWidth,
  pointRadius,
  strokeColor,
}: {
  points: SiteChartPoint[]
  max: number
  area: boolean
  strokeWidth?: number
  pointRadius?: number
  strokeColor?: string
}) {
  const coords = lineCoords(points, max)
  if (!coords.length) return null
  const { w, h, padTop, innerH } = coords[0]!
  const baseline = padTop + innerH
  const poly = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const sw = strokeWidth ?? SITE_CHART_STYLE_DEFAULTS.strokeWidth
  const pr = pointRadius ?? SITE_CHART_STYLE_DEFAULTS.pointRadiusLine
  const stroke = lineStrokeColor(points, strokeColor)
  return (
    <svg className="site-chart__svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {area ? (
        <polygon
          className="site-chart__area"
          fill={`color-mix(in oklab, ${stroke} 28%, transparent)`}
          points={[
            `${coords[0]!.x},${baseline}`,
            ...coords.map((c) => `${c.x},${c.y}`),
            `${coords[coords.length - 1]!.x},${baseline}`,
          ].join(' ')}
        />
      ) : null}
      <polyline
        className="site-chart__line"
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        points={poly}
      />
      {coords.map(({ p, i, x, y }) => (
        <g key={`${p.label}-${i}`}>
          <circle cx={x} cy={y} r={pr} fill={markFill(p, i)} />
          <text x={x} y={h - 4} textAnchor="middle" className="site-chart__tick">
            {p.label.slice(0, 6)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Scatter({
  points,
  max,
  pointRadius,
}: {
  points: SiteChartPoint[]
  max: number
  pointRadius?: number
}) {
  const coords = lineCoords(points, max)
  if (!coords.length) return null
  const { w, h } = coords[0]!
  const pr = pointRadius ?? SITE_CHART_STYLE_DEFAULTS.pointRadiusScatter
  return (
    <svg className="site-chart__svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {coords.map(({ p, i, x, y }) => (
        <g key={`${p.label}-${i}`}>
          <circle cx={x} cy={y} r={pr} fill={markFill(p, i)} />
          <text x={x} y={h - 4} textAnchor="middle" className="site-chart__tick">
            {p.label.slice(0, 6)}
          </text>
        </g>
      ))}
    </svg>
  )
}

function Funnel({
  points,
  max,
  barGap,
}: {
  points: SiteChartPoint[]
  max: number
  barGap?: number
}) {
  const w = 240
  const gap = barGap ?? SITE_CHART_STYLE_DEFAULTS.barGap
  const row = Math.max(18, 16 + gap)
  const h = Math.max(80, points.length * row + 8)
  return (
    <svg className="site-chart__svg" viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {points.map((p, i) => {
        const bw = Math.max(24, (p.value / max) * (w - 16))
        const x = (w - bw) / 2
        const y = 8 + i * row
        return (
          <g key={`${p.label}-${i}`}>
            <rect x={x} y={y} width={bw} height={16} fill={markFill(p, i)} rx={2} />
            <text x={w / 2} y={y + 12} textAnchor="middle" className="site-chart__tick">
              {p.label.slice(0, 10)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PieSvg({
  points,
  donut,
  donutHole,
}: {
  points: SiteChartPoint[]
  donut: boolean
  donutHole?: number
}) {
  const total = points.reduce((s, p) => s + Math.max(0, p.value), 0) || 1
  const cx = 60
  const cy = 60
  const r = 48
  const hole =
    donutHole != null ? donutHole : SITE_CHART_STYLE_DEFAULTS.donutHole
  const ri = donut ? r * hole : 0
  let angle = -Math.PI / 2
  const slices = points.map((p, i) => {
    const sweep = (Math.max(0, p.value) / total) * Math.PI * 2
    const a0 = angle
    const a1 = angle + sweep
    angle = a1
    const large = sweep > Math.PI ? 1 : 0
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const xi0 = cx + ri * Math.cos(a1)
    const yi0 = cy + ri * Math.sin(a1)
    const xi1 = cx + ri * Math.cos(a0)
    const yi1 = cy + ri * Math.sin(a0)
    const d =
      ri > 0
        ? `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${ri} ${ri} 0 ${large} 0 ${xi1} ${yi1} Z`
        : `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
    return <path key={`${p.label}-${i}`} d={d} fill={markFill(p, i)} />
  })
  return (
    <svg className="site-chart__svg" viewBox="0 0 120 120" aria-hidden="true">
      {slices}
    </svg>
  )
}
