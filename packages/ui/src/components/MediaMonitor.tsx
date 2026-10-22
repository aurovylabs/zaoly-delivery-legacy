import type { HTMLAttributes, ReactNode } from 'react'

export type MediaMonitorProps = {
  label: ReactNode
  actions?: ReactNode
  media?: ReactNode
  hud?: ReactNode
  fullscreen?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Program/source monitor shell — specs/domain/zaoly-ui-media-monitor.md */
export function MediaMonitor({
  label,
  actions,
  media,
  hud,
  fullscreen = false,
  className,
  ...rest
}: MediaMonitorProps) {
  return (
    <div
      className={cx('ds-media-monitor', fullscreen && 'is-fullscreen', className)}
      {...rest}
    >
      <div className="ds-media-monitor__label">
        <span className="ds-media-monitor__label-text">{label}</span>
        {actions != null ? <div className="ds-media-monitor__actions">{actions}</div> : null}
      </div>
      <div className="ds-media-monitor__surface">
        {media}
        {hud != null ? <div className="ds-media-monitor__hud">{hud}</div> : null}
      </div>
    </div>
  )
}
