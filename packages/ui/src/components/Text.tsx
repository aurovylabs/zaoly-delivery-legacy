import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import type { TextRole, TypeStep } from '../tokens/typography'

const ROLE_CLASS: Record<TextRole, string> = {
  display: 'ds-text-display',
  headline: 'ds-text-headline',
  title: 'ds-text-title',
  body: 'ds-text-body',
  label: 'ds-text-label',
  meta: 'ds-text-meta',
  hint: 'ds-text-hint',
  mono: 'ds-text-mono',
  numeric: 'ds-text-numeric',
}

export type TextProps = {
  role?: TextRole
  /** Optional size override (maps to .ds-text--*) */
  size?: TypeStep
  as?: ElementType
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'role' | 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Semantic text — specs/domain/zaoly-ui-typography.md
 * Prefer roles over ad-hoc font-size in new UI.
 */
export function Text({
  role = 'body',
  size,
  as,
  children,
  className,
  ...rest
}: TextProps) {
  const Tag = (as ?? defaultTag(role)) as ElementType
  const sizeMod = size ? `ds-text--${size}` : undefined

  return (
    <Tag className={cx(ROLE_CLASS[role], sizeMod, className)} {...rest}>
      {children}
    </Tag>
  )
}

function defaultTag(role: TextRole): ElementType {
  switch (role) {
    case 'display':
      return 'h1'
    case 'headline':
      return 'h2'
    case 'title':
      return 'h2'
    case 'label':
    case 'numeric':
      return 'span'
    case 'hint':
    case 'meta':
    case 'mono':
      return 'p'
    default:
      return 'p'
  }
}
