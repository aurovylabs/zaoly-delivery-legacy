import type { HTMLAttributes } from 'react'

export type DividerProps = {
  orientation?: 'horizontal' | 'vertical'
  className?: string
} & Omit<HTMLAttributes<HTMLHRElement>, 'className'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Hairline divider — specs/domain/zaoly-ui-extended.md */
export function Divider({
  orientation = 'horizontal',
  className,
  ...rest
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cx('ds-divider', 'ds-divider--vertical', className)}
      />
    )
  }
  return (
    <hr
      className={cx('ds-divider', 'ds-divider--horizontal', className)}
      {...rest}
    />
  )
}
