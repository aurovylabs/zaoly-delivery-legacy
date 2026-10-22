import type { HTMLAttributes, ReactNode } from 'react'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type LoadingTextProps = {
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLParagraphElement>, 'className' | 'children'>

/** Loading line — specs/domain/zaoly-ui-foundation.md */
export function LoadingText({ children, className, ...rest }: LoadingTextProps) {
  return (
    <p className={cx('ds-loading', 'ds-text-meta', 'meta', className)} role="status" {...rest}>
      {children}
    </p>
  )
}

export type EmptyStateProps = {
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLParagraphElement>, 'className' | 'children'>

/** Empty / no-data line — specs/domain/zaoly-ui-foundation.md */
export function EmptyState({ children, className, ...rest }: EmptyStateProps) {
  return (
    <p className={cx('ds-empty', 'ds-text-meta', 'meta', className)} {...rest}>
      {children}
    </p>
  )
}
