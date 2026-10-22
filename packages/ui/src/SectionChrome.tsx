import type { ReactNode } from 'react'
import { Text } from './components/Text'

export type PanelRole =
  | 'foresight'
  | 'research'
  | 'waves'
  | 'signals'
  | 'sources'
  | 'ops'
  | 'corpus'
  | 'pipeline'

export type SectionChromeProps = {
  /** Optional — omit on nested sections to reduce icon noise */
  icon?: ReactNode
  title: string
  meta?: ReactNode
  /** Count / brand meta — `accent` uses `--accent` (default `muted`) */
  metaTone?: 'muted' | 'accent'
  action?: ReactNode
  role?: PanelRole
  as?: 'h2' | 'h3'
  quiet?: boolean
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Section header — specs/domain/zaoly-ui-section-chrome.md */
export function SectionChrome({
  icon,
  title,
  meta,
  metaTone = 'muted',
  action,
  role,
  as = 'h2',
  quiet = false,
}: SectionChromeProps) {
  return (
    <div
      className={cx(
        'section-chrome',
        quiet && 'section-chrome-quiet',
        role && `panel-role-${role}`,
      )}
    >
      <div className="section-chrome-main">
        {icon && !quiet ? (
          <span className="section-chrome-icon">{icon}</span>
        ) : null}
        <Text role="title" as={as} className="section-chrome-title">
          {title}
        </Text>
        {meta != null ? (
          <Text
            role="meta"
            as="span"
            className={cx(
              'section-chrome-meta',
              metaTone === 'accent' && 'section-chrome-meta--accent',
            )}
          >
            {meta}
          </Text>
        ) : null}
      </div>
      {action ? <div className="section-chrome-action">{action}</div> : null}
    </div>
  )
}

export type SectionTitleKey = string
