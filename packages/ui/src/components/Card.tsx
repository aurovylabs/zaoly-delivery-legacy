import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import {
  clipPathFromCornerInsets,
  type CornerInsets,
} from '../lib/clip-path-from-corner-insets'

export type CardProps = {
  children?: ReactNode
  /** Optional 16:9 preview plane (browse / media tiles). */
  media?: ReactNode
  /** Compact title — not magazine HubIndexCard headline scale. */
  title?: ReactNode
  /** Status chips / secondary facts. */
  meta?: ReactNode
  /** Footer actions — prefer `<CardActions>`. */
  actions?: ReactNode
  /** When set, wraps media+title in one primary link (actions stay outside). */
  href?: string
  className?: string
  as?: 'div' | 'article' | 'section'
  /** Corner insets → CSS clip-path (see `clipPathFromCornerInsets`). */
  clipInset?: CornerInsets
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Composition surface card — specs/domain/zaoly-ui-card.md
 * Distinct from EntityCard (catalog) and HubIndexCard (magazine hubs).
 */
export function Card({
  children,
  media,
  title,
  meta,
  actions,
  href,
  className,
  as: Tag = 'div',
  clipInset,
  style,
  ...rest
}: CardProps) {
  const clipPath = clipPathFromCornerInsets(clipInset)
  const structured = media != null || title != null || meta != null || actions != null
  const primary =
    media != null || title != null ? (
      <>
        {media != null ? <div className="ds-card__media">{media}</div> : null}
        {title != null ? <div className="ds-card__title">{title}</div> : null}
      </>
    ) : null

  return (
    <Tag
      className={cx('ds-card', structured && 'ds-card--structured', media != null && 'ds-card--media', className)}
      style={{
        ...(clipPath ? { clipPath } : null),
        ...(style as CSSProperties | undefined),
      }}
      {...rest}
    >
      {primary != null && href ? (
        <a className="ds-card__primary" href={href}>
          {primary}
        </a>
      ) : (
        primary
      )}
      {meta != null ? <div className="ds-card__meta">{meta}</div> : null}
      {children}
      {actions != null ? <div className="ds-card__actions">{actions}</div> : null}
    </Tag>
  )
}

export type { CornerInsets }
