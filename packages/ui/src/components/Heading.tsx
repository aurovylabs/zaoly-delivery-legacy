import type { HTMLAttributes, ReactNode } from 'react'

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingProps = {
  children?: ReactNode
  className?: string
  level?: HeadingLevel
} & Omit<HTMLAttributes<HTMLHeadingElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Semantic heading for compositions (Zaoly `ds-heading`). */
export function Heading({
  children,
  className,
  level = 2,
  ...rest
}: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  return (
    <Tag className={cx('ds-heading', `ds-heading--${level}`, className)} {...rest}>
      {children}
    </Tag>
  )
}
