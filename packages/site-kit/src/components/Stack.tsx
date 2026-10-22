import type { HTMLAttributes, ReactNode } from 'react'

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: 'column' | 'row'
  /** Contract prop — paint applies flexWrap; do not forward to DOM. */
  wrap?: boolean | string
  children?: ReactNode
}

export function Stack({
  direction = 'column',
  wrap: _wrap,
  children,
  className,
  ...rest
}: StackProps) {
  return (
    <div
      className={['site-stack', direction === 'row' && 'site-stack--row', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
