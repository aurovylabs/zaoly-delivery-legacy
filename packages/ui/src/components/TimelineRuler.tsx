import type { HTMLAttributes, ReactNode } from 'react'

export type TimelineRulerMark = {
  id: string
  label: ReactNode
  offsetPct: number
}

export type TimelineRulerProps = {
  marks?: readonly TimelineRulerMark[]
  playheadPct?: number | null
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Timeline tick strip — specs/domain/zaoly-ui-timeline-ruler.md */
export function TimelineRuler({
  marks = [],
  playheadPct = null,
  className,
  ...rest
}: TimelineRulerProps) {
  return (
    <div className={cx('ds-timeline-ruler', className)} {...rest}>
      {marks.map((mark) => (
        <span
          key={mark.id}
          className="ds-timeline-ruler__mark"
          style={{ left: `${Math.max(0, Math.min(100, mark.offsetPct))}%` }}
        >
          {mark.label}
        </span>
      ))}
      {playheadPct != null ? (
        <span
          className="ds-timeline-ruler__playhead"
          style={{ left: `${Math.max(0, Math.min(100, playheadPct))}%` }}
          aria-hidden
        />
      ) : null}
    </div>
  )
}
