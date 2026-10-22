import type { HTMLAttributes } from 'react'

export type WaveformProps = {
  peaks: readonly number[]
  progressPct?: number | null
  height?: number
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Presentational peak waveform — specs/domain/zaoly-ui-waveform.md */
export function Waveform({
  peaks,
  progressPct = null,
  height = 32,
  className,
  'aria-label': ariaLabel = 'Waveform',
  ...rest
}: WaveformProps) {
  const safePeaks = peaks.length > 0 ? peaks : [0.15]
  return (
    <div
      className={cx('ds-waveform', className)}
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      {...rest}
    >
      <svg className="ds-waveform__svg" viewBox={`0 0 ${safePeaks.length} 100`} preserveAspectRatio="none">
        {safePeaks.map((peak, index) => {
          const h = Math.max(2, Math.min(100, Math.round(Math.abs(peak) * 100)))
          return (
            <rect
              key={index}
              className="ds-waveform__bar"
              x={index}
              y={100 - h}
              width={0.8}
              height={h}
            />
          )
        })}
      </svg>
      {progressPct != null ? (
        <div
          className="ds-waveform__progress"
          style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
