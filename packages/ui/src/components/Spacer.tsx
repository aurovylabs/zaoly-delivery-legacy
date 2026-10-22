import type { HTMLAttributes } from 'react'

export type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type SpacerProps = {
  className?: string
  size?: SpacerSize
  axis?: 'x' | 'y' | 'both'
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Token-sized empty space (Zaoly `ds-spacer`). */
export function Spacer({
  className,
  size = 'md',
  axis = 'y',
  ...rest
}: SpacerProps) {
  return (
    <span
      className={cx('ds-spacer', `ds-spacer--${size}`, `ds-spacer--${axis}`, className)}
      aria-hidden
      {...rest}
    />
  )
}
