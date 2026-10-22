import type { HTMLAttributes, ReactNode } from 'react'
import { Panel } from './Panel'
import { Text } from './Text'

export type ChatBlockPanelProps = {
  title?: string
  eyebrow?: string
  infoTooltip?: string
  infoTooltipAriaLabel?: string
  /** Drop body padding (flush lists / tables). */
  flush?: boolean
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Assistant message block shell — specs/domain/zaoly-ui-chat-block-panel.md
 * Compact title density for chat overlays (not magazine section titles).
 */
export function ChatBlockPanel({
  title,
  eyebrow,
  infoTooltip,
  infoTooltipAriaLabel,
  flush = false,
  children,
  className,
  ...rest
}: ChatBlockPanelProps) {
  const showHeader = Boolean(title || eyebrow)
  return (
    <div className={cx('ds-chat-block-panel', className)} data-zaoly-chat-block {...rest}>
      <Panel
        variant="default"
        className={cx('ds-chat-block-panel__surface', flush && 'is-flush')}
      >
        {showHeader ? (
          <header className="ds-chat-block-panel__header">
            {eyebrow ? (
              <Text role="meta" as="span" className="ds-chat-block-panel__eyebrow">
                {eyebrow}
              </Text>
            ) : null}
            {title ? (
              <div className="ds-chat-block-panel__title-row">
                <Text role="title" size="xl" as="h3" className="ds-chat-block-panel__title">
                  {title}
                </Text>
                {infoTooltip ? (
                  <span
                    className="ds-chat-block-panel__info"
                    title={infoTooltip}
                    aria-label={infoTooltipAriaLabel ?? `Info: ${title}`}
                  >
                    i
                  </span>
                ) : null}
              </div>
            ) : null}
          </header>
        ) : null}
        <div className="ds-chat-block-panel__body">{children}</div>
      </Panel>
    </div>
  )
}
