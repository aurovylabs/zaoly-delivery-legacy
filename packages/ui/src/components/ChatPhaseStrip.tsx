import type { HTMLAttributes, KeyboardEvent } from 'react'
import { Text } from './Text'

export type ChatPhaseStatus = 'upcoming' | 'current' | 'done'

export type ChatPhaseItem = {
  id: string
  label: string
  summary?: string
  /** Emphasize the focused phase (journey map, not workflow spinner). */
  active?: boolean
  status?: ChatPhaseStatus
}

export type ChatPhaseStripProps = {
  phases: ChatPhaseItem[]
  onPhaseActivate?: (phase: ChatPhaseItem) => void
  className?: string
} & Omit<HTMLAttributes<HTMLOListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function resolveStatus(phase: ChatPhaseItem): ChatPhaseStatus {
  if (phase.status) return phase.status
  if (phase.active) return 'current'
  return 'upcoming'
}

/**
 * Ordered journey phase outline — specs/domain/zaoly-ui-chat-phase-strip.md
 * Distinct from ChatStepList (workflow progress).
 */
export function ChatPhaseStrip({
  phases,
  onPhaseActivate,
  className,
  ...rest
}: ChatPhaseStripProps) {
  return (
    <ol className={cx('ds-chat-phases', className)} {...rest}>
      {phases.map((phase, index) => {
        const status = resolveStatus(phase)
        const interactive = Boolean(onPhaseActivate)
        return (
          <li
            key={phase.id}
            className={cx(
              'ds-chat-phases__item',
              `is-${status}`,
              phase.active && 'is-active',
              interactive && 'is-interactive',
            )}
            data-status={status}
            data-active={phase.active ? 'true' : undefined}
            role={interactive ? 'button' : undefined}
            tabIndex={interactive ? 0 : undefined}
            onClick={interactive ? () => onPhaseActivate?.(phase) : undefined}
            onKeyDown={
              interactive
                ? (e: KeyboardEvent<HTMLLIElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onPhaseActivate?.(phase)
                    }
                  }
                : undefined
            }
          >
            <span className="ds-chat-phases__index" aria-hidden>
              {index + 1}
            </span>
            <div className="ds-chat-phases__copy">
              <Text role="title" size="lg" as="h4" className="ds-chat-phases__label">
                {phase.label}
              </Text>
              {phase.summary?.trim() ? (
                <Text role="meta" as="p" className="ds-chat-phases__summary">
                  {phase.summary.trim()}
                </Text>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
