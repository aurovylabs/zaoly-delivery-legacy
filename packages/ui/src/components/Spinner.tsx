import type { HTMLAttributes } from 'react'

export type SpinnerProps = {
  size?: 'sm' | 'md'
  className?: string
  label?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Busy spinner — specs/domain/zaoly-ui-extended.md */
export function Spinner({
  size = 'sm',
  className,
  label = 'Loading',
  ...rest
}: SpinnerProps) {
  return (
    <span
      className={cx('ds-spinner', `ds-spinner--${size}`, className)}
      role="status"
      aria-label={label}
      {...rest}
    />
  )
}
