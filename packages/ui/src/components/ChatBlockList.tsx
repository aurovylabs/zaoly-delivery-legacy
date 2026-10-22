import type { HTMLAttributes } from 'react'
import { Chip } from './Chip'
import { Text } from './Text'

export type ChatBlockListTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export type ChatBlockListChip = {
  label: string
  tone?: ChatBlockListTone
}

export type ChatBlockListItem = {
  title: string
  description?: string
  badge?: string
  /** Extra chips (e.g. recommendation category). */
  chips?: ChatBlockListChip[]
  tone?: ChatBlockListTone
}

export type ChatBlockListProps = {
  items: ChatBlockListItem[]
  /** Zebra striping (default true). */
  alternating?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Compact finding / recommendation rows — specs/domain/zaoly-ui-chat-block-list.md
 */
export function ChatBlockList({
  items,
  alternating = true,
  className,
  ...rest
}: ChatBlockListProps) {
  return (
    <ul className={cx('ds-chat-block-list', className)} {...rest}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'neutral'
        return (
          <li
            key={`${item.title}-${index}`}
            className={cx(
              'ds-chat-block-list__item',
              alternating && index % 2 === 1 && 'is-alt',
              item.tone && `is-${tone}`,
            )}
            data-tone={tone}
          >
            <div className="ds-chat-block-list__head">
              <Text role="title" size="lg" as="h4" className="ds-chat-block-list__title">
                {item.title}
              </Text>
              {item.badge ? (
                <Chip static size="sm" className="ds-chat-block-list__badge">
                  {item.badge}
                </Chip>
              ) : null}
              {item.chips?.map((chip) => (
                <Chip
                  key={chip.label}
                  static
                  size="sm"
                  className={cx(
                    'ds-chat-block-list__badge',
                    chip.tone && chip.tone !== 'neutral' && `is-${chip.tone}`,
                  )}
                >
                  {chip.label}
                </Chip>
              ))}
            </div>
            {item.description?.trim() ? (
              <Text role="meta" as="p" className="ds-chat-block-list__body">
                {item.description.trim()}
              </Text>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
