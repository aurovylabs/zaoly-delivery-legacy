'use client'

import { useState, type HTMLAttributes } from 'react'
import { formatChartValue } from './Chart'

export type SeriesChartPoint = {
  label: string
  /** Omit or null = gap (no vertex / break the path) */
  value: number | null
}

export type SeriesChartSeries = {
  id: string
  label: string
  points: SeriesChartPoint[]
}

export type SeriesChartProps = {
  series: SeriesChartSeries[]
  title?: string
  height?: number
  /** When true, higher values plot lower (rank / position charts). Default false. */
  invertY?: boolean
  valueFormatter?: (n: number) => string
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function seriesStroke(i: number): string {
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

/** Collect shared X labels in first-seen order across series. */
export function collectSeriesLabels(series: SeriesChartSeries[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of series) {
    for (const p of s.points) {
      const label = p.label?.trim()
      if (!label || seen.has(label)) continue
      seen.add(label)
      out.push(label)
    }
  }
  return out
}

function valueAt(series: SeriesChartSeries, label: string): number | null {
  const hit = series.points.find((p) => p.label === label)
  if (!hit || hit.value == null || !Number.isFinite(hit.value)) return null
  return hit.value
}

/** Domain-free multi-series line chart — specs/domain/zaoly-ui-series-chart.md */
export function SeriesChart({
  series,
  title,
  height = 220,
  invertY = false,
  valueFormatter = formatChartValue,
  className,
  ...rest
}: SeriesChartProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const safeSeries = Array.isArray(series) ? series.filter((s) => s && s.id) : []
  const labels = collectSeriesLabels(safeSeries)
  const numericValues = safeSeries.flatMap((s) =>
    s.points.map((p) => p.value).filter((v): v is number => v != null && Number.isFinite(v)),
  )
  const minV = numericValues.length ? Math.min(...numericValues) : 0
  const maxV = numericValues.length ? Math.max(...numericValues) : 1
  const span = Math.max(1e-6, maxV - minV)

  const padX = 12
  const padTop = 16
  const tickBand = 36
  const plotW = 400
  const plotH = Math.max(120, height)
  const innerW = plotW - padX * 2
  const innerH = Math.max(56, plotH - padTop - tickBand)
  const n = Math.max(1, labels.length)

  function yFor(value: number): number {
    const t = (value - minV) / span
    const normalized = invertY ? t : 1 - t
    return padTop + normalized * innerH
  }

  function xFor(i: number): number {
    return padX + i * (innerW / n) + innerW / n / 2
  }

  const summary =
    title ||
    (safeSeries.length
      ? `Series chart with ${safeSeries.length} series and ${labels.length} labels`
      : 'Empty series chart')

  return (
    <div
      className={cx('ds-series-chart', hovered && 'ds-series-chart--hovering', className)}
      data-invert-y={invertY ? 'true' : undefined}
      {...rest}
    >
      {title ? <div className="ds-series-chart__title">{title}</div> : null}
      <svg
        className="ds-series-chart__svg"
        viewBox={`0 0 ${plotW} ${plotH}`}
        role="img"
        aria-label={summary}
        height={height}
      >
        <line
          className="ds-series-chart__grid"
          x1={padX}
          x2={plotW - padX}
          y1={padTop + innerH}
          y2={padTop + innerH}
        />

        {safeSeries.map((s, si) => {
          const stroke = seriesStroke(si)
          const dim = hovered != null && hovered !== s.id
          const active = hovered === s.id
          const coords = labels.map((label, i) => {
            const v = valueAt(s, label)
            if (v == null) return null
            return { i, x: xFor(i), y: yFor(v), v, label }
          })

          const pathParts: string[] = []
          let drawing = false
          for (const c of coords) {
            if (!c) {
              drawing = false
              continue
            }
            pathParts.push(`${drawing ? 'L' : 'M'} ${c.x} ${c.y}`)
            drawing = true
          }

          return (
            <g
              key={s.id}
              className={cx(
                'ds-series-chart__series',
                dim && 'ds-series-chart__series--dim',
                active && 'ds-series-chart__series--active',
              )}
              data-series={s.id}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {pathParts.length ? (
                <path
                  className="ds-series-chart__line"
                  d={pathParts.join(' ')}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={active ? 2.5 : 2}
                />
              ) : null}
              {coords.map((c) =>
                c ? (
                  <circle
                    key={`${s.id}-${c.label}`}
                    className="ds-series-chart__dot"
                    cx={c.x}
                    cy={c.y}
                    r={active ? 4 : 3}
                    fill={stroke}
                  >
                    <title>{`${s.label} · ${c.label}: ${valueFormatter(c.v)}`}</title>
                  </circle>
                ) : null,
              )}
            </g>
          )
        })}

        {labels.map((label, i) => (
          <text
            key={label}
            className="ds-series-chart__tick"
            x={xFor(i)}
            y={plotH - 10}
            textAnchor="middle"
          >
            {label.length > 10 ? `${label.slice(0, 9)}…` : label}
          </text>
        ))}
      </svg>

      {safeSeries.length ? (
        <ul className="ds-series-chart__legend" aria-label="Series">
          {safeSeries.map((s, si) => (
            <li
              key={s.id}
              className={cx(
                'ds-series-chart__legend-item',
                hovered === s.id && 'ds-series-chart__legend-item--active',
                hovered != null && hovered !== s.id && 'ds-series-chart__legend-item--dim',
              )}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="ds-series-chart__swatch"
                style={{ background: seriesStroke(si) }}
                aria-hidden
              />
              <span className="ds-series-chart__legend-label">{s.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
