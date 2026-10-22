import type { HTMLAttributes, ReactNode } from 'react'

export type KpiMetricDensity = 'default' | 'hero'

export type KpiMetricProps = {
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
  unit?: ReactNode
  density?: KpiMetricDensity
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Shell-free magazine KPI readout — specs/domain/zaoly-ui-kpi-metric.md
 * Compose inside Panel / joined WidgetGrid; use LabTile for soft cards.
 */
export function KpiMetric({
  label,
  value,
  meta,
  unit,
  density = 'default',
  className,
  ...rest
}: KpiMetricProps) {
  return (
    <div
      className={cx('ds-kpi-metric', density === 'hero' && 'ds-kpi-metric--hero', className)}
      data-density={density}
      {...rest}
    >
      <div className="ds-kpi-metric__label">{label}</div>
      <div className="ds-kpi-metric__value">
        {value}
        {unit != null ? <span className="ds-kpi-metric__unit">{unit}</span> : null}
      </div>
      {meta != null ? <div className="ds-kpi-metric__meta">{meta}</div> : null}
    </div>
  )
}
