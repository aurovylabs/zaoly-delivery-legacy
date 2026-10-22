import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Panel } from './Panel'
import { Text } from './Text'

type HubIndexCardShared = {
  title: ReactNode
  meta?: ReactNode
  media?: ReactNode
  variant?: 'default' | 'create'
  className?: string
}

export type HubIndexCardProps =
  | (HubIndexCardShared & {
      href: string
    } & Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      'className' | 'children' | 'title' | 'href' | 'media'
    >)
  | (HubIndexCardShared & {
      href?: undefined
    } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'title' | 'media'>)

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Hub index tile — Panel card + title/meta + optional media.
 * Spec: specs/domain/zaoly-ui-hub-index-card.md · Origin: Audion project cards.
 */
export function HubIndexCard(props: HubIndexCardProps) {
  const { title, meta, media, variant = 'default', className, href, ...rest } = props
  const create = variant === 'create'
  const panel = (
    <Panel
      as="div"
      variant="card"
      className={cx('ds-hub-index-card__panel', create && 'ds-hub-index-card__panel--create')}
    >
      {media != null ? <div className="ds-hub-index-card__media">{media}</div> : null}
      <Text role="headline" as={create ? 'span' : 'h2'} className="ds-hub-index-card__title">
        {title}
      </Text>
      {meta != null ? <div className="ds-hub-index-card__meta">{meta}</div> : null}
    </Panel>
  )

  const rootClass = cx('ds-hub-index-card', create && 'ds-hub-index-card--create', className)

  if (typeof href === 'string') {
    const { type: _t, ...anchorRest } = rest as ButtonHTMLAttributes<HTMLButtonElement> &
      AnchorHTMLAttributes<HTMLAnchorElement>
    return (
      <a {...anchorRest} href={href} className={rootClass}>
        {panel}
      </a>
    )
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={buttonRest.type ?? 'button'} {...buttonRest} className={rootClass}>
      {panel}
    </button>
  )
}
