import type { HTMLAttributes } from 'react'
import { Text } from './Text'

export type ChatQuoteTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export type ChatQuoteItem = {
  quote: string
  /** e.g. persona name or phase */
  attribution?: string
  /** Secondary line (friction / recommendation) */
  context?: string
  tone?: ChatQuoteTone
}

export type ChatQuoteListProps = {
  items: ChatQuoteItem[]
  className?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Quote rows for journey validate / persona voice — specs/domain/zaoly-ui-chat-quote-list.md
 */
export function ChatQuoteList({ items, className, ...rest }: ChatQuoteListProps) {
  return (
    <ul className={cx('ds-chat-quotes', className)} {...rest}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'neutral'
        return (
          <li
            key={`${item.quote.slice(0, 24)}-${index}`}
            className={cx('ds-chat-quotes__item', `is-${tone}`)}
            data-tone={tone}
          >
            <Text role="body" as="blockquote" className="ds-chat-quotes__quote">
              {item.quote}
            </Text>
            {item.attribution?.trim() || item.context?.trim() ? (
              <footer className="ds-chat-quotes__meta">
                {item.attribution?.trim() ? (
                  <Text role="meta" as="cite" className="ds-chat-quotes__attribution">
                    {item.attribution.trim()}
                  </Text>
                ) : null}
                {item.context?.trim() ? (
                  <Text role="meta" as="p" className="ds-chat-quotes__context">
                    {item.context.trim()}
                  </Text>
                ) : null}
              </footer>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
