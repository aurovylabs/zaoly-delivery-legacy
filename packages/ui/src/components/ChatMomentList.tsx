import type { HTMLAttributes } from 'react'
import { Chip } from './Chip'
import { Text } from './Text'

export type ChatMomentKind =
  | 'action'
  | 'thought'
  | 'feeling'
  | 'pain'
  | 'opportunity'
  | 'other'

export type ChatMomentItem = {
  id?: string
  kind: ChatMomentKind
  label: string
}

export type ChatMomentListProps = {
  items: ChatMomentItem[]
  alternating?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const KIND_LABEL: Record<ChatMomentKind, string> = {
  action: 'Action',
  thought: 'Thought',
  feeling: 'Feeling',
  pain: 'Pain',
  opportunity: 'Opportunity',
  other: 'Other',
}

/**
 * Typed journey moment rows — specs/domain/zaoly-ui-chat-moment-list.md
 */
export function ChatMomentList({
  items,
  alternating = true,
  className,
  ...rest
}: ChatMomentListProps) {
  return (
    <ul className={cx('ds-chat-moments', className)} {...rest}>
      {items.map((item, index) => (
        <li
          key={item.id ?? `${item.kind}-${item.label}-${index}`}
          className={cx(
            'ds-chat-moments__item',
            `is-${item.kind}`,
            alternating && index % 2 === 1 && 'is-alt',
          )}
          data-kind={item.kind}
        >
          <Chip static size="sm" className={cx('ds-chat-moments__kind', `is-${item.kind}`)}>
            {KIND_LABEL[item.kind]}
          </Chip>
          <Text role="body" as="p" className="ds-chat-moments__label">
            {item.label}
          </Text>
        </li>
      ))}
    </ul>
  )
}
