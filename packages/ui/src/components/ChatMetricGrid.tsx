import type { HTMLAttributes } from 'react'
import { Panel } from './Panel'
import { Text } from './Text'

export type ChatMetricTone = 'success' | 'warning' | 'error' | 'info' | 'neutral'

export type ChatMetricItem = {
  label: string
  value: string | number
  unit?: string
  hint?: string
  tone?: ChatMetricTone
}

export type ChatMetricGridProps = {
  items: ChatMetricItem[]
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * KPI tile grid for assistant blocks — specs/domain/zaoly-ui-chat-metric-grid.md
 * Compose inside ChatBlockPanel.
 */
export function ChatMetricGrid({ items, className, ...rest }: ChatMetricGridProps) {
  return (
    <div className={cx('ds-chat-metric-grid', className)} {...rest}>
      {items.map((item, index) => {
        const tone = item.tone ?? 'neutral'
        return (
          <Panel
            key={`${item.label}-${index}`}
            variant="card"
            className={cx('ds-chat-metric-grid__tile', `is-${tone}`)}
            data-tone={tone}
          >
            <div className="ds-chat-metric-grid__body">
              <Text role="meta" as="span" className="ds-chat-metric-grid__label">
                {item.label}
              </Text>
              <div className="ds-chat-metric-grid__value-row">
                <Text role="title" size="xl" as="span" className="ds-chat-metric-grid__value">
                  {item.value}
                </Text>
                {item.unit ? (
                  <Text role="meta" as="span" className="ds-chat-metric-grid__unit">
                    {item.unit}
                  </Text>
                ) : null}
              </div>
              {item.hint?.trim() ? (
                <Text role="meta" as="span" className="ds-chat-metric-grid__hint">
                  {item.hint.trim()}
                </Text>
              ) : null}
            </div>
          </Panel>
        )
      })}
    </div>
  )
}
