import type { HTMLAttributes, ReactNode } from 'react'

export type TimelineTrackProps = {
  label: ReactNode
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Timeline lane shell — specs/domain/zaoly-ui-timeline-ruler.md */
export function TimelineTrack({ label, children, className, ...rest }: TimelineTrackProps) {
  return (
    <div className={cx('ds-timeline-track', className)} {...rest}>
      <div className="ds-timeline-track__label">{label}</div>
      <div className="ds-timeline-track__lane">{children}</div>
    </div>
  )
}
