import type { HTMLAttributes, ReactNode } from 'react'

export type EntityCardProps = {
  meta?: ReactNode
  title: ReactNode
  badge?: ReactNode
  headActions?: ReactNode
  toolbar?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: 'default' | 'tall'
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'title' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Catalog card shell (meta · title · toolbar · preview · footer).
 * Brandion TokenCard chrome without token contracts.
 */
export function EntityCard({
  meta,
  title,
  badge,
  headActions,
  toolbar,
  children,
  footer,
  size = 'default',
  className,
  ...rest
}: EntityCardProps) {
  return (
    <article
      className={cx('ds-entity-card', size === 'tall' && 'ds-entity-card--tall', className)}
      {...rest}
    >
      <div className="ds-entity-card__face">
        <header className="ds-entity-card__head">
          <div className="ds-entity-card__meta">{meta}</div>
          <div className="ds-entity-card__head-actions">
            {badge}
            {headActions}
          </div>
        </header>
        <div className="ds-entity-card__title">{title}</div>
        {toolbar != null ? <div className="ds-entity-card__toolbar">{toolbar}</div> : null}
        {children != null ? <div className="ds-entity-card__body">{children}</div> : null}
        {footer != null ? <footer className="ds-entity-card__footer">{footer}</footer> : null}
      </div>
    </article>
  )
}
