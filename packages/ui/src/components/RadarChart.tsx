'use client'

import type { HTMLAttributes, KeyboardEvent } from 'react'
import type { ChartPoint } from './Chart'
import { formatChartValue } from './Chart'

export type RadarChartProps = {
  data: ChartPoint[]
  title?: string
  /** SVG viewBox edge length; default 240 */
  size?: number
  /** Accessible name when `title` is absent */
  ariaLabel?: string
  valueFormatter?: (n: number) => string
  onPointClick?: (point: ChartPoint, index: number) => void
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

type RadarPoint = { key: string; label: string; value: number }

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

/** Polar point on unit circle; angle 0 at top, clockwise. */
export function radarVertex(
  index: number,
  total: number,
  value: number,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number } {
  const v = clamp01(value)
  const angle = -Math.PI / 2 + (index / Math.max(total, 1)) * Math.PI * 2
  return {
    x: cx + Math.cos(angle) * radius * v,
    y: cy + Math.sin(angle) * radius * v,
  }
}

export function radarPolygon(
  points: RadarPoint[],
  cx: number,
  cy: number,
  radius: number,
): string {
  if (!points.length) return ''
  return points
    .map((p, i) => {
      const { x, y } = radarVertex(i, points.length, p.value, cx, cy, radius)
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

export function radarGridRing(
  axes: number,
  level: number,
  cx: number,
  cy: number,
  radius: number,
): string {
  const dummy = Array.from({ length: axes }, (_, i) => ({
    key: String(i),
    label: '',
    value: level,
  }))
  return radarPolygon(dummy, cx, cy, radius)
}

/**
 * Domain-free spider / radar for 0–1 categorical scores.
 * Spec: specs/domain/zaoly-ui-radar-chart.md
 */
export function RadarChart({
  data,
  title,
  size = 240,
  ariaLabel,
  valueFormatter = formatChartValue,
  onPointClick,
  className,
  ...rest
}: RadarChartProps) {
  const edge = Math.max(120, size)
  const originX = edge / 2
  const originY = edge / 2
  const r = edge * 0.325
  const labelR = r + edge * 0.075

  const points: RadarPoint[] = data.map((p, i) => ({
    key: `${p.label}-${i}`,
    label: p.label,
    value: clamp01(p.value),
  }))

  const poly = radarPolygon(points, originX, originY, r)
  const rings = points.length
    ? [0.33, 0.66, 1].map((level) =>
        radarGridRing(points.length, level, originX, originY, r),
      )
    : []

  const name = title || ariaLabel || 'Radar chart'
  const interactive = typeof onPointClick === 'function'

  const activate = (index: number) => {
    if (!interactive) return
    const point = data[index]
    if (!point) return
    onPointClick(point, index)
  }

  const onKey = (index: number) => (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      activate(index)
    }
  }

  return (
    <div
      className={cx('ds-radar-chart', 'briefing-radar', className)}
      role="img"
      aria-label={name}
      {...rest}
    >
      {title ? <div className="ds-radar-chart__title">{title}</div> : null}
      <svg
        viewBox={`0 0 ${edge} ${edge}`}
        className="briefing-radar-svg"
        aria-hidden={interactive ? undefined : true}
      >
        {rings.map((d, i) => (
          <polygon
            key={`ring-${i}`}
            className="briefing-radar-ring"
            points={d}
            fill="none"
          />
        ))}
        {points.map((p, i) => {
          const tip = radarVertex(i, points.length, 1, originX, originY, r)
          return (
            <line
              key={`axis-${p.key}`}
              className="briefing-radar-axis"
              x1={originX}
              y1={originY}
              x2={tip.x}
              y2={tip.y}
            />
          )
        })}
        {poly ? <polygon className="briefing-radar-shape" points={poly} /> : null}
        {points.map((p, i) => {
          const tip = radarVertex(i, points.length, 1, originX, originY, labelR)
          const hit = radarVertex(i, points.length, 1, originX, originY, r * 0.92)
          return (
            <g key={`lbl-${p.key}`}>
              {interactive ? (
                <circle
                  className="ds-radar-chart__hit"
                  cx={hit.x}
                  cy={hit.y}
                  r={Math.max(10, edge * 0.045)}
                  role="button"
                  tabIndex={0}
                  aria-label={p.label}
                  onClick={() => activate(i)}
                  onKeyDown={onKey(i)}
                />
              ) : null}
              <text
                className={cx(
                  'briefing-radar-label',
                  interactive && 'ds-radar-chart__label--click',
                )}
                x={tip.x}
                y={tip.y}
                textAnchor="middle"
                dominantBaseline="middle"
                onClick={interactive ? () => activate(i) : undefined}
              >
                {p.label}
              </text>
            </g>
          )
        })}
      </svg>
      <ul className="score-a11y">
        {points.length === 0 ? (
          <li>No data</li>
        ) : (
          points.map((p) => (
            <li key={p.key}>
              {p.label}: {valueFormatter(p.value)}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
