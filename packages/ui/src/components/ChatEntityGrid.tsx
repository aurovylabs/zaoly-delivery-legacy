import type { HTMLAttributes, KeyboardEvent } from 'react'
import { Chip } from './Chip'
import { EntityCard } from './EntityCard'
import { Text } from './Text'

export type ChatEntityAccent = 'green' | 'pink' | 'orange' | 'purple' | 'yellow' | 'neutral'

export type ChatEntityItem = {
  id: string
  title: string
  subtitle?: string
  description?: string
  badge?: string
  tags?: string[]
  accent?: ChatEntityAccent
  href?: string
}

export type ChatEntityGridProps = {
  items: ChatEntityItem[]
  /** Single column (full width cards). */
  fullWidth?: boolean
  onItemActivate?: (item: ChatEntityItem) => void
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function activate(item: ChatEntityItem, onItemActivate?: (item: ChatEntityItem) => void) {
  if (onItemActivate) {
    onItemActivate(item)
    return
  }
  if (item.href && typeof window !== 'undefined') {
    window.open(item.href, '_blank', 'noopener,noreferrer')
  }
}

/**
 * Entity card grid for chat — specs/domain/zaoly-ui-chat-entity-grid.md
 * Audion persona / Brandion entity teasers map here without product schemas.
 */
export function ChatEntityGrid({
  items,
  fullWidth = false,
  onItemActivate,
  className,
  ...rest
}: ChatEntityGridProps) {
  return (
    <div
      className={cx('ds-chat-entity-grid', fullWidth && 'is-full', className)}
      {...rest}
    >
      {items.map((item) => {
        const accent = item.accent ?? 'neutral'
        const interactive = Boolean(onItemActivate || item.href)
        return (
          <EntityCard
            key={item.id}
            className={cx('ds-chat-entity-grid__card', `is-${accent}`, interactive && 'is-interactive')}
            meta={
              item.subtitle ? (
                <Text role="meta" as="span">
                  {item.subtitle}
                </Text>
              ) : (
                <span />
              )
            }
            badge={
              item.badge ? (
                <Chip static size="sm" className={cx('ds-chat-entity-grid__badge', `is-${accent}`)}>
                  {item.badge}
                </Chip>
              ) : undefined
            }
            title={
              <Text role="title" size="lg" as="h4" className="ds-chat-entity-grid__title">
                {item.title}
              </Text>
            }
            footer={
              item.tags && item.tags.length > 0 ? (
                <div className="ds-chat-entity-grid__tags">
                  {item.tags.map((tag) => (
                    <Chip key={tag} static size="sm" className={`is-${accent}`}>
                      {tag}
                    </Chip>
                  ))}
                </div>
              ) : undefined
            }
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => activate(item, onItemActivate) : undefined}
            onKeyDown={
              interactive
                ? (e: KeyboardEvent<HTMLElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      activate(item, onItemActivate)
                    }
                  }
                : undefined
            }
          >
            {item.description ? (
              <Text role="body" as="p" className="ds-chat-entity-grid__description">
                {item.description}
              </Text>
            ) : null}
          </EntityCard>
        )
      })}
    </div>
  )
}
