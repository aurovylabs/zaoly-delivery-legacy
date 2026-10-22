import type { AnchorHTMLAttributes, ReactNode } from 'react'

export type LinkProps = {
  children?: ReactNode
  className?: string
  href: string
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Text link primitive (Zaoly `ds-link`). */
export function Link({ children, className, href, ...rest }: LinkProps) {
  return (
    <a className={cx('ds-link', className)} href={href} {...rest}>
      {children}
    </a>
  )
}
