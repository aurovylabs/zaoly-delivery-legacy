'use client'

import type { HTMLAttributes } from 'react'

export type GaugeTone = 'neutral' | 'ok' | 'warn' | 'bad'

export type GaugeProps = {
  value: number
  min?: number
  max?: number
  label?: string
  unit?: string
  tone?: GaugeTone
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Domain-free arc gauge — specs/domain/zaoly-ui-gauge.md */
export function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  unit,
  tone = 'neutral',
  className,
  ...rest
}: GaugeProps) {
  const lo = Math.min(min, max)
  const hi = Math.max(min, max)
  const span = hi - lo || 1
  const current = clamp(value, lo, hi)
  const ratio = (current - lo) / span
  const r = 42
  const cx0 = 50
  const cy0 = 50
  const start = Math.PI
  const end = Math.PI + Math.PI * ratio
  const x1 = cx0 + r * Math.cos(start)
  const y1 = cy0 + r * Math.sin(start)
  const x2 = cx0 + r * Math.cos(end)
  const y2 = cy0 + r * Math.sin(end)
  const large = ratio > 0.5 ? 1 : 0
  const trackEndX = cx0 + r * Math.cos(0)
  const trackEndY = cy0 + r * Math.sin(0)

  return (
    <div
      className={cx('ds-gauge', `ds-gauge--${tone}`, className)}
      role="meter"
      aria-valuemin={lo}
      aria-valuemax={hi}
      aria-valuenow={current}
      aria-label={label || 'Gauge'}
      {...rest}
    >
      <svg className="ds-gauge__svg" viewBox="0 0 100 62" aria-hidden="true">
        <path
          className="ds-gauge__track"
          d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${trackEndX} ${trackEndY}`}
          fill="none"
        />
        {ratio > 0 ? (
          <path
            className="ds-gauge__value"
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none"
          />
        ) : null}
      </svg>
      <div className="ds-gauge__readout">
        <span className="ds-gauge__number">
          {Number.isFinite(current) ? current : '—'}
          {unit ? <span className="ds-gauge__unit">{unit}</span> : null}
        </span>
        {label ? <span className="ds-gauge__label">{label}</span> : null}
      </div>
    </div>
  )
}
