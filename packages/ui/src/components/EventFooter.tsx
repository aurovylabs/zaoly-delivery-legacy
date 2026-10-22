import type { HTMLAttributes, ReactNode } from 'react'

export type EventFooterProps = {
  summary?: ReactNode
  /** Extra meta lines under the summary */
  children?: ReactNode
  actions?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Compact tool/agent completion footer — specs/domain/zaoly-ui-event-footer.md */
export function EventFooter({
  summary,
  children,
  actions,
  className,
  ...rest
}: EventFooterProps) {
  return (
    <div className={cx('ds-event-footer', className)} {...rest}>
      {summary != null ? <p className="ds-event-footer-summary">{summary}</p> : null}
      {children}
      {actions != null ? <div className="ds-event-footer-actions">{actions}</div> : null}
    </div>
  )
}
