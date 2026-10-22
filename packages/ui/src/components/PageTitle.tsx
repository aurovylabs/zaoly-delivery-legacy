import type { HTMLAttributes, ReactNode } from 'react'

export type PageTitleProps = {
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLHeadingElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Topbar page title — specs/domain/zaoly-ui-foundation.md */
export function PageTitle({ children, className, ...rest }: PageTitleProps) {
  return (
    <h1 className={cx('ds-page-title', 'page-title', className)} {...rest}>
      {children}
    </h1>
  )
}
