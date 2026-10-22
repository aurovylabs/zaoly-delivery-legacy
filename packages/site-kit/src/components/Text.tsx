import type { ElementType, HTMLAttributes, ReactNode } from 'react'

export type TextProps = {
  role?: 'display' | 'title' | 'body' | 'label'
  as?: ElementType
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

export function Text({ role = 'body', as, children, className, ...rest }: TextProps) {
  const Tag = (as ?? (role === 'display' || role === 'title' ? 'h2' : 'p')) as ElementType
  return (
    <Tag className={['site-text', `site-text--${role}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  )
}
