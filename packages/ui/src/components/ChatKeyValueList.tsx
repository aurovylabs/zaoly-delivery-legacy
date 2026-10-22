import type { HTMLAttributes, ReactNode } from 'react'
import { Text } from './Text'

export type ChatKeyValueItem = {
  label: string
  value: string | number
  /** Optional leading icon (app supplies `@zaoly/ui` Icon*). */
  icon?: ReactNode
}

export type ChatKeyValueListProps = {
  items: ChatKeyValueItem[]
  /** Zebra striping (default true). */
  alternating?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Label → value rows for assistant blocks — specs/domain/zaoly-ui-chat-key-value-list.md
 */
export function ChatKeyValueList({
  items,
  alternating = true,
  className,
  ...rest
}: ChatKeyValueListProps) {
  return (
    <ul className={cx('ds-chat-kv', className)} {...rest}>
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className={cx('ds-chat-kv__item', alternating && index % 2 === 1 && 'is-alt')}
        >
          <div className="ds-chat-kv__row">
            <span className="ds-chat-kv__key">
              {item.icon ? (
                <span className="ds-chat-kv__icon" aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              <Text role="meta" as="span" className="ds-chat-kv__label">
                {item.label}
              </Text>
            </span>
            <Text role="body" as="span" className="ds-chat-kv__value">
              {item.value}
            </Text>
          </div>
        </li>
      ))}
    </ul>
  )
}
