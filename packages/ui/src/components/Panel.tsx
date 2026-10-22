import type { HTMLAttributes, ReactNode } from 'react'

export type PanelVariant = 'default' | 'flush' | 'editorial' | 'card'

export type PanelProps = {
  children?: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article'
  /**
   * `editorial` = magazine chapter band (top hairline, fill-free, square) — default.
   * `flush` = no chrome.
   * `card` = square hairline collection tile (no wash).
   * `default` = ops / workstation wash (`--surface-2` + `--radius-panel`).
   */
  variant?: PanelVariant
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Panel shell — magazine-first. Spec: specs/domain/zaoly-ui-foundation.md */
export function Panel({
  children,
  className,
  as: Tag = 'section',
  variant = 'editorial',
  ...rest
}: PanelProps) {
  return (
    <Tag
      className={cx(
        'ds-panel',
        'module-panel',
        variant === 'default' && 'ds-panel--default',
        variant === 'flush' && 'ds-panel--flush',
        variant === 'editorial' && 'ds-panel--editorial',
        variant === 'card' && 'ds-panel--card',
        className,
      )}
      data-variant={variant}
      {...rest}
    >
      {children}
    </Tag>
  )
}
