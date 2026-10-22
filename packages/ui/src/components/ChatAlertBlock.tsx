import type { HTMLAttributes } from 'react'
import { Alert, type AlertTone } from './Alert'
import { ChatBlockPanel } from './ChatBlockPanel'
import { Text } from './Text'

export type ChatAlertTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export type ChatAlertBlockProps = {
  title?: string
  message: string
  tone?: ChatAlertTone
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function toAlertTone(tone: ChatAlertTone): AlertTone {
  if (tone === 'error' || tone === 'warning') return 'error'
  if (tone === 'success') return 'ok'
  return 'info'
}

/**
 * In-turn alert chrome — specs/domain/zaoly-ui-chat-alert-block.md
 */
export function ChatAlertBlock({
  title,
  message,
  tone = 'info',
  className,
  ...rest
}: ChatAlertBlockProps) {
  return (
    <ChatBlockPanel
      title={title ?? 'Hinweis'}
      eyebrow={tone}
      className={cx('ds-chat-alert', `is-${tone}`, className)}
      {...rest}
    >
      <Alert tone={toAlertTone(tone)} className="ds-chat-alert__body">
        <Text role="body" as="span">
          {message}
        </Text>
      </Alert>
    </ChatBlockPanel>
  )
}
