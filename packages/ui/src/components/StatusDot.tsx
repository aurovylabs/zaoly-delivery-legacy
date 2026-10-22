import type { HTMLAttributes } from 'react'

export type StatusLevel = 'ok' | 'warn' | 'critical'

export type StatusDotProps = {
  level?: StatusLevel
  className?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Health dot — specs/domain/zaoly-ui-foundation.md */
export function StatusDot({ level = 'ok', className, ...rest }: StatusDotProps) {
  return (
    <span
      className={cx('ds-status-dot', 'status-dot', `level-${level}`, className)}
      aria-hidden
      {...rest}
    />
  )
}
