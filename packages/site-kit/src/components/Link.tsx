import type { AnchorHTMLAttributes, ReactNode } from 'react'
export type LinkProps = { children?: ReactNode; className?: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>
export function Link({ children = 'Learn more', className, href = '#', ...rest }: LinkProps) {
  return <a href={href} className={['site-link', className].filter(Boolean).join(' ')} {...rest}>{children}</a>
}
