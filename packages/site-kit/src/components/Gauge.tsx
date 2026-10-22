import type { CSSProperties, HTMLAttributes } from 'react'

export type SiteGaugeTone = 'neutral' | 'ok' | 'warn' | 'bad'

export type GaugeProps = {
  value?: number | string
  min?: number | string
  max?: number | string
  label?: string
  unit?: string
  tone?: SiteGaugeTone | string
  className?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'style'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function num(raw: unknown, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : fallback
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** Site Kit gauge atom — fixture meter for composition authoring. */
export function Gauge({
  value = 0,
  min = 0,
  max = 100,
  label,
  unit,
  tone = 'neutral',
  className,
  style,
  ...rest
}: GaugeProps) {
  const lo = Math.min(num(min, 0), num(max, 100))
  const hi = Math.max(num(min, 0), num(max, 100))
  const span = hi - lo || 1
  const current = clamp(num(value, 0), lo, hi)
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
  const toneClass =
    tone === 'ok' || tone === 'warn' || tone === 'bad' ? tone : 'neutral'

  return (
    <div
      className={cx('site-gauge', `site-gauge--${toneClass}`, className)}
      style={style}
      role="meter"
      aria-valuemin={lo}
      aria-valuemax={hi}
      aria-valuenow={current}
      aria-label={label || 'Gauge'}
      {...rest}
    >
      <svg className="site-gauge__svg" viewBox="0 0 100 62" aria-hidden="true">
        <path
          className="site-gauge__track"
          d={`M ${x1} ${y1} A ${r} ${r} 0 1 1 ${trackEndX} ${trackEndY}`}
          fill="none"
        />
        {ratio > 0 ? (
          <path
            className="site-gauge__value"
            d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
            fill="none"
          />
        ) : null}
      </svg>
      <div className="site-gauge__readout">
        <span className="site-gauge__number">
          {Number.isFinite(current) ? current : '—'}
          {unit ? <span className="site-gauge__unit">{unit}</span> : null}
        </span>
        {label ? <span className="site-gauge__label">{label}</span> : null}
      </div>
    </div>
  )
}
