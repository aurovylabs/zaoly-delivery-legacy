import type { HTMLAttributes, ReactNode } from 'react'
export function Badge({ children = 'New', className, ...rest }: HTMLAttributes<HTMLSpanElement> & { children?: ReactNode }) {
  return <span className={['site-badge', className].filter(Boolean).join(' ')} {...rest}>{children}</span>
}
