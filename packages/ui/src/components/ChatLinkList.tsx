import type { HTMLAttributes } from 'react'
import { Text } from './Text'

export type ChatLinkItem = {
  label: string
  href: string
  external?: boolean
}

export type ChatLinkListProps = {
  links: ChatLinkItem[]
  className?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Next-step / deep-link rows — specs/domain/zaoly-ui-chat-link-list.md
 */
export function ChatLinkList({ links, className, ...rest }: ChatLinkListProps) {
  return (
    <ul className={cx('ds-chat-links', className)} {...rest}>
      {links.map((link) => (
        <li key={`${link.href}-${link.label}`} className="ds-chat-links__item">
          <span className="ds-chat-links__marker" aria-hidden>
            {link.external ? '↗' : '→'}
          </span>
          <a
            className="ds-chat-links__anchor"
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
          >
            <Text role="body" as="span" className="ds-chat-links__label">
              {link.label}
            </Text>
          </a>
        </li>
      ))}
    </ul>
  )
}
