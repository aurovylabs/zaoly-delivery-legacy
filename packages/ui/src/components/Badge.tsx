import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

export type BadgeProps = {
  children?: ReactNode
  className?: string
  tone?: BadgeTone
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Compact status / category label — not a filter Chip. specs/domain/zaoly-ui-badge.md */
export function Badge({
  children,
  className,
  tone = 'neutral',
  ...rest
}: BadgeProps) {
  return (
    <span className={cx('ds-badge', `ds-badge--${tone}`, className)} {...rest}>
      {children}
    </span>
  )
}
