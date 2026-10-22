import type { HTMLAttributes, ReactNode } from 'react'

export type CardActionsProps = {
  children?: ReactNode
  /** Magazine hairline + top padding (default true). */
  hairline?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Equal-width card action row — specs/domain/zaoly-ui-card-actions.md
 * Children (Button, or Link/span wrapping Button) stretch evenly across the row.
 * Pin to card bottom: parent must be a column flex container filling equal grid height
 * (`.ds-card-actions` uses `margin-top: auto`).
 */
export function CardActions({
  children,
  hairline = true,
  className,
  ...rest
}: CardActionsProps) {
  return (
    <div
      className={cx('ds-card-actions', hairline && 'ds-card-actions--hairline', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
