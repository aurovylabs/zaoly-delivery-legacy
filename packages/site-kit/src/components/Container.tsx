import type { HTMLAttributes, ReactNode } from 'react'

export type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  /** Row = side-by-side children; Column = stacked (default). */
  direction?: 'column' | 'row'
  /** Contract prop — paint applies flexWrap; do not forward to DOM. */
  wrap?: boolean | string
  children?: ReactNode
}

export function Container({
  direction = 'column',
  wrap: _wrap,
  children,
  className,
  style,
  ...rest
}: ContainerProps) {
  return (
    <div
      className={[
        'site-container',
        direction === 'row' && 'site-container--row',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
      style={{
        display: 'flex',
        flexDirection: direction === 'row' ? 'row' : 'column',
        ...(direction === 'row' ? { flexWrap: 'wrap' as const } : null),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
