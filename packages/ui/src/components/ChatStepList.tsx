import type { HTMLAttributes } from 'react'
import { Spinner } from './Spinner'
import { Text } from './Text'

export type ChatStepStatus = 'pending' | 'running' | 'done' | 'error'

export type ChatStepItem = {
  id?: string
  label: string
  detail?: string
  status: ChatStepStatus
  /** 0–100; shown only when status is `running`. */
  progress?: number
}

export type ChatStepListProps = {
  steps: ChatStepItem[]
  className?: string
} & Omit<HTMLAttributes<HTMLOListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function statusClass(status: ChatStepStatus): string {
  if (status === 'running') return 'is-running'
  if (status === 'error') return 'is-error'
  if (status === 'done') return 'is-done'
  return 'is-pending'
}

/**
 * Workflow progress rows for assistant blocks — specs/domain/zaoly-ui-chat-step-list.md
 */
export function ChatStepList({ steps, className, ...rest }: ChatStepListProps) {
  return (
    <ol className={cx('ds-chat-steps', className)} {...rest}>
      {steps.map((step, index) => {
        const detailParts = [
          step.detail,
          typeof step.progress === 'number' && step.status === 'running'
            ? `${step.progress}%`
            : null,
        ].filter(Boolean)

        return (
          <li
            key={step.id ?? `${step.label}-${index}`}
            className={cx('ds-chat-steps__item', statusClass(step.status))}
            data-status={step.status}
          >
            <div className="ds-chat-steps__marker" aria-hidden>
              {step.status === 'running' ? (
                <Spinner size="sm" label={`Running: ${step.label}`} />
              ) : (
                <span className="ds-chat-steps__dot" />
              )}
            </div>
            <div className="ds-chat-steps__copy">
              <Text role="body" as="p" className="ds-chat-steps__label">
                {step.label}
              </Text>
              {detailParts.length > 0 ? (
                <Text role="meta" as="p" className="ds-chat-steps__detail">
                  {detailParts.join(' · ')}
                </Text>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
