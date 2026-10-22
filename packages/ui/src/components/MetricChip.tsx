import type { HTMLAttributes, ReactNode } from 'react'

export type MetricChipProps = {
  icon?: ReactNode
  label: ReactNode
  children?: ReactNode
  className?: string
  title?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Ops / KPI chip — specs/domain/zaoly-ui-foundation.md */
export function MetricChip({
  icon,
  label,
  children,
  className,
  title,
  ...rest
}: MetricChipProps) {
  return (
    <span
      className={cx('ds-metric-chip', 'metric-chip', className)}
      title={title}
      {...rest}
    >
      {icon}
      <span className="ds-metric-chip-label chip-label">{label}</span>
      {children != null ? <strong className="ds-metric-chip-value">{children}</strong> : null}
    </span>
  )
}
