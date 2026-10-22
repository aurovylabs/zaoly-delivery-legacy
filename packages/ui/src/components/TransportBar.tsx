import type { HTMLAttributes, ReactNode } from 'react'

export type TransportBarProps = {
  controls?: ReactNode
  timecode?: ReactNode
  trailing?: ReactNode
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Media transport chrome — specs/domain/zaoly-ui-transport-bar.md */
export function TransportBar({
  controls,
  timecode,
  trailing,
  className,
  'aria-label': ariaLabel = 'Transport',
  ...rest
}: TransportBarProps) {
  return (
    <div className={cx('ds-transport-bar', className)} role="group" aria-label={ariaLabel} {...rest}>
      {controls != null ? <div className="ds-transport-bar__controls">{controls}</div> : null}
      {timecode != null ? <div className="ds-transport-bar__timecode">{timecode}</div> : null}
      {trailing != null ? <div className="ds-transport-bar__trailing">{trailing}</div> : null}
    </div>
  )
}
