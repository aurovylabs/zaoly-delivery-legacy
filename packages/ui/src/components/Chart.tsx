'use client'

import { useState, type HTMLAttributes, type ReactNode } from 'react'

export type ChartPoint = {
  label: string
  value: number
}

export const CHART_VARIANTS = [
  'bar',
  'bar_horizontal',
  'line',
  'area',
  'scatter',
  'pie',
  'donut',
  'funnel',
] as const

export type ChartVariant = (typeof CHART_VARIANTS)[number]

export type ChartProps = {
  variant?: ChartVariant
  data: ChartPoint[]
  title?: string
  height?: number
  valueFormatter?: (n: number) => string
  onPointClick?: (point: ChartPoint, index: number) => void
  showTicks?: boolean
  showValueLabels?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatChartValue(n: number): string {
  if (!Number.isFinite(n)) return '—'
  const abs = Math.abs(n)
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-9) {
    return String(Math.round(n))
  }
  if (abs >= 100) return n.toFixed(1)
  if (abs >= 10) return n.toFixed(1)
  if (abs >= 1) return n.toFixed(2)
  return n.toFixed(2)
}

export function isChartVariant(v: string | null | undefined): v is ChartVariant {
  return Boolean(v && (CHART_VARIANTS as readonly string[]).includes(v))
}

function truncateLabel(label: string, max = 12): string {
  const t = label.trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(1, max - 1))}…`
}

function sliceFill(i: number): string {
  const tones = [
    'var(--chart-accent, var(--accent, #c4a35a))',
    'var(--chart-ok, var(--ok, #6a9b7a))',
    'color-mix(in oklab, var(--chart-accent, var(--accent, #c4a35a)) 70%, white)',
    'color-mix(in oklab, var(--chart-ok, var(--ok, #6a9b7a)) 65%, white)',
    'color-mix(in oklab, var(--fg, #eee) 35%, var(--chart-accent, #c4a35a))',
    'color-mix(in oklab, var(--chart-accent, #c4a35a) 45%, var(--bg0, #111))',
  ]
  return tones[i % tones.length]!
}

function polar(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

function donutSlicePath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number,
): string {
  const large = end - start > Math.PI ? 1 : 0
  const o0 = polar(cx, cy, rOuter, start)
  const o1 = polar(cx, cy, rOuter, end)
  const i1 = polar(cx, cy, rInner, end)
  const i0 = polar(cx, cy, rInner, start)
  if (rInner <= 0) {
    return [
      `M ${cx} ${cy}`,
      `L ${o0.x} ${o0.y}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${o1.x} ${o1.y}`,
      'Z',
    ].join(' ')
  }
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i0.x} ${i0.y}`,
    'Z',
  ].join(' ')
}

type MarkProps = {
  point: ChartPoint
  index: number
  interactive: boolean
  hoverState: 'active' | 'dim' | null
  onHoverChange: (index: number | null) => void
  onPointClick?: (point: ChartPoint, index: number) => void
  children: ReactNode
}

function Mark({
  point,
  index,
  interactive,
  hoverState,
  onHoverChange,
  onPointClick,
  children,
}: MarkProps) {
  return (
    <g
      className={cx(
        'ds-chart__point',
        hoverState === 'active' && 'ds-chart__point--active',
        hoverState === 'dim' && 'ds-chart__point--dim',
      )}
      data-index={index}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={interactive ? { cursor: 'pointer' } : undefined}
      onMouseEnter={() => onHoverChange(index)}
      onMouseLeave={() => onHoverChange(null)}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation()
              onPointClick?.(point, index)
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPointClick?.(point, index)
              }
            }
          : undefined
      }
    >
      {children}
    </g>
  )
}

function pointHoverState(hoveredIndex: number | null, index: number): 'active' | 'dim' | null {
  if (hoveredIndex == null) return null
  return hoveredIndex === index ? 'active' : 'dim'
}

/** Domain-free chart family — specs/domain/zaoly-ui-chart.md */
export function Chart({
  variant = 'bar',
  data,
  title,
  height = 220,
  valueFormatter = formatChartValue,
  onPointClick,
  showTicks = true,
  showValueLabels = true,
  className,
  ...rest
}: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const safe = Array.isArray(data) ? data.filter((d) => d && typeof d.value === 'number') : []
  const max = Math.max(1, ...safe.map((d) => d.value))
  const total = safe.reduce((s, p) => s + Math.max(0, p.value), 0) || 1
  const padX = 12
  const isRadial = variant === 'pie' || variant === 'donut'
  const isFunnel = variant === 'funnel'
  const isHBar = variant === 'bar_horizontal'
  const padTop = showValueLabels && !isRadial ? 20 : 10
  const tickBand = showTicks && !isRadial && !isFunnel ? 42 : isFunnel ? 8 : 12
  const plotW = 400
  const plotH = Math.max(120, height)
  const innerW = plotW - padX * 2
  const labelCol = isHBar ? 72 : 0
  const plotLeft = padX + labelCol
  const plotInnerW = innerW - labelCol
  const innerH = Math.max(56, plotH - padTop - tickBand)
  const n = Math.max(1, safe.length)
  const slot = (isHBar ? innerH : plotInnerW) / n
  const interactive = typeof onPointClick === 'function'
  const tickMax = Math.max(5, Math.min(16, Math.floor((isHBar ? 70 : plotInnerW / n) / 6)))
  const valueFont = 9
  const tickFont = 6.5
  const summary =
    title ||
    (safe.length
      ? `Chart with ${safe.length} values from ${valueFormatter(safe[0].value)} to ${valueFormatter(safe[safe.length - 1].value)}`
      : 'Empty chart')

  const linePoints = safe.map((point, i) => {
    const x = plotLeft + i * (plotInnerW / n) + plotInnerW / n / 2
    const y = padTop + innerH - (point.value / max) * innerH
    return { point, i, x, y }
  })

  return (
    <div
      className={cx(
        'ds-chart',
        `ds-chart--${variant}`,
        interactive && 'ds-chart--interactive',
        hoveredIndex != null && 'ds-chart--hovering',
        className,
      )}
      data-hover-index={hoveredIndex == null ? undefined : String(hoveredIndex)}
      {...rest}
    >
      {title ? <div className="ds-chart__title">{title}</div> : null}
      <svg
        className="ds-chart__svg"
        viewBox={`0 0 ${plotW} ${plotH}`}
        role="img"
        aria-label={summary}
        height={height}
      >
        {!isRadial ? (
          <line
            className="ds-chart__grid"
            x1={plotLeft}
            x2={plotW - padX}
            y1={padTop + innerH}
            y2={padTop + innerH}
          />
        ) : null}

        {variant === 'bar'
          ? safe.map((point, i) => {
              const h = (point.value / max) * innerH
              const w = Math.max(8, (plotInnerW / n) * 0.58)
              const x = plotLeft + i * (plotInnerW / n) + ((plotInnerW / n) - w) / 2
              const y = padTop + innerH - h
              const cx = x + w / 2
              return (
                <Mark
                  key={`${point.label}-${i}`}
                  point={point}
                  index={i}
                  interactive={interactive}
                  hoverState={pointHoverState(hoveredIndex, i)}
                  onHoverChange={setHoveredIndex}
                  onPointClick={onPointClick}
                >
                  <rect className="ds-chart__bar" x={x} y={y} width={w} height={Math.max(2, h)} rx={2}>
                    <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                  </rect>
                  {showValueLabels && point.value > 0 ? (
                    <text
                      className="ds-chart__value-label"
                      x={cx}
                      y={Math.max(valueFont + 2, y - 3)}
                      textAnchor="middle"
                      fontSize={valueFont}
                    >
                      {valueFormatter(point.value)}
                    </text>
                  ) : null}
                  {showTicks ? (
                    <text
                      className="ds-chart__tick"
                      x={cx}
                      y={padTop + innerH + 12}
                      textAnchor="middle"
                      fontSize={tickFont}
                    >
                      {truncateLabel(point.label, tickMax)}
                    </text>
                  ) : null}
                </Mark>
              )
            })
          : null}

        {variant === 'bar_horizontal'
          ? safe.map((point, i) => {
              const barH = Math.max(6, slot * 0.55)
              const y = padTop + i * slot + (slot - barH) / 2
              const w = Math.max(2, (point.value / max) * plotInnerW)
              return (
                <Mark
                  key={`${point.label}-${i}`}
                  point={point}
                  index={i}
                  interactive={interactive}
                  hoverState={pointHoverState(hoveredIndex, i)}
                  onHoverChange={setHoveredIndex}
                  onPointClick={onPointClick}
                >
                  <text
                    className="ds-chart__tick"
                    x={padX}
                    y={y + barH / 2 + 2}
                    textAnchor="start"
                    fontSize={tickFont}
                  >
                    {truncateLabel(point.label, 10)}
                  </text>
                  <rect
                    className="ds-chart__bar"
                    x={plotLeft}
                    y={y}
                    width={w}
                    height={barH}
                    rx={2}
                  >
                    <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                  </rect>
                  {showValueLabels ? (
                    <text
                      className="ds-chart__value-label"
                      x={plotLeft + w + 4}
                      y={y + barH / 2 + 2}
                      textAnchor="start"
                      fontSize={valueFont}
                    >
                      {valueFormatter(point.value)}
                    </text>
                  ) : null}
                </Mark>
              )
            })
          : null}

        {variant === 'area' && linePoints.length > 0 ? (
          <polygon
            className="ds-chart__area"
            points={[
              `${linePoints[0]!.x},${padTop + innerH}`,
              ...linePoints.map((p) => `${p.x},${p.y}`),
              `${linePoints[linePoints.length - 1]!.x},${padTop + innerH}`,
            ].join(' ')}
          />
        ) : null}

        {(variant === 'line' || variant === 'area') && linePoints.length > 0 ? (
          <polyline
            className="ds-chart__line"
            fill="none"
            points={linePoints.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        ) : null}

        {variant === 'line' || variant === 'area' || variant === 'scatter'
          ? linePoints.map(({ point, i, x, y }) => (
              <Mark
                key={`${point.label}-${i}`}
                point={point}
                index={i}
                interactive={interactive}
                hoverState={pointHoverState(hoveredIndex, i)}
                onHoverChange={setHoveredIndex}
                onPointClick={onPointClick}
              >
                <circle
                  className="ds-chart__dot"
                  cx={x}
                  cy={y}
                  r={interactive || variant === 'scatter' ? 4 : 2.5}
                >
                  <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                </circle>
                {showValueLabels && point.value > 0 ? (
                  <text
                    className="ds-chart__value-label"
                    x={x}
                    y={Math.max(valueFont + 2, y - 6)}
                    textAnchor="middle"
                    fontSize={valueFont}
                  >
                    {valueFormatter(point.value)}
                  </text>
                ) : null}
                {showTicks && variant !== 'scatter' ? (
                  <text
                    className="ds-chart__tick"
                    x={x}
                    y={padTop + innerH + 12}
                    textAnchor="middle"
                    fontSize={tickFont}
                  >
                    {truncateLabel(point.label, tickMax)}
                  </text>
                ) : null}
              </Mark>
            ))
          : null}

        {isRadial
          ? (() => {
              const cx = plotW / 2
              const cy = plotH / 2
              const rOuter = Math.min(plotW, plotH) * 0.36
              const rInner = variant === 'donut' ? rOuter * 0.55 : 0
              let angle = -Math.PI / 2
              return safe.map((point, i) => {
                const sweep = (Math.max(0, point.value) / total) * Math.PI * 2
                const start = angle
                const end = angle + Math.max(sweep, 0.001)
                angle = end
                const mid = (start + end) / 2
                const labelR = rOuter * (variant === 'donut' ? 0.78 : 0.62)
                const lp = polar(cx, cy, labelR, mid)
                return (
                  <Mark
                    key={`${point.label}-${i}`}
                    point={point}
                    index={i}
                    interactive={interactive}
                    hoverState={pointHoverState(hoveredIndex, i)}
                    onHoverChange={setHoveredIndex}
                    onPointClick={onPointClick}
                  >
                    <path
                      className="ds-chart__slice"
                      d={donutSlicePath(cx, cy, rOuter, rInner, start, end)}
                      fill={sliceFill(i)}
                    >
                      <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                    </path>
                    {showValueLabels && sweep > 0.2 ? (
                      <text
                        className="ds-chart__value-label"
                        x={lp.x}
                        y={lp.y}
                        textAnchor="middle"
                        fontSize={valueFont}
                      >
                        {valueFormatter(point.value)}
                      </text>
                    ) : null}
                  </Mark>
                )
              })
            })()
          : null}

        {isFunnel
          ? safe.map((point, i) => {
              const rowH = Math.max(14, (innerH - 8) / n)
              const y = padTop + i * rowH
              const widthRatio = Math.max(0.12, point.value / max)
              const w = plotInnerW * widthRatio
              const x = plotLeft + (plotInnerW - w) / 2
              return (
                <Mark
                  key={`${point.label}-${i}`}
                  point={point}
                  index={i}
                  interactive={interactive}
                  hoverState={pointHoverState(hoveredIndex, i)}
                  onHoverChange={setHoveredIndex}
                  onPointClick={onPointClick}
                >
                  <rect
                    className="ds-chart__funnel"
                    x={x}
                    y={y}
                    width={w}
                    height={rowH * 0.78}
                    rx={3}
                    fill={sliceFill(i)}
                  >
                    <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
                  </rect>
                  <text
                    className="ds-chart__tick"
                    x={plotW / 2}
                    y={y + rowH * 0.45}
                    textAnchor="middle"
                    fontSize={tickFont}
                  >
                    {truncateLabel(point.label, 18)} · {valueFormatter(point.value)}
                  </text>
                </Mark>
              )
            })
          : null}
      </svg>
      <table className="ds-chart__table">
        <caption className="ds-chart__caption">{summary}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {safe.map((point, i) => {
            const hover = pointHoverState(hoveredIndex, i)
            return (
              <tr
                key={`${point.label}-${i}`}
                data-index={i}
                className={cx(
                  'ds-chart__row',
                  interactive && 'ds-chart__row--interactive',
                  hover === 'active' && 'ds-chart__row--active',
                  hover === 'dim' && 'ds-chart__row--dim',
                )}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={
                  interactive
                    ? (e) => {
                        e.stopPropagation()
                        onPointClick?.(point, i)
                      }
                    : undefined
                }
              >
                <th scope="row">{point.label}</th>
                <td>{valueFormatter(point.value)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
