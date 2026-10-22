import type { HTMLAttributes, ReactNode } from 'react'

export type TimelineClipTone = 'default' | 'audio' | 'transcript' | 'accent'

export type TimelineClipProps = {
  label?: ReactNode
  leftPct: number
  widthPct: number
  active?: boolean
  tone?: TimelineClipTone
  className?: string
  children?: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Absolute-positioned timeline clip block — specs/domain/zaoly-ui-timeline-ruler.md */
export function TimelineClip({
  label,
  leftPct,
  widthPct,
  active = false,
  tone = 'default',
  className,
  children,
  style,
  ...rest
}: TimelineClipProps) {
  return (
    <div
      className={cx(
        'ds-timeline-clip',
        `ds-timeline-clip--${tone}`,
        active && 'is-active',
        className,
      )}
      data-active={active ? 'true' : undefined}
      {...rest}
      style={{
        ...style,
        left: `${Math.max(0, Math.min(100, leftPct))}%`,
        width: `${Math.max(0, Math.min(100, widthPct))}%`,
      }}
    >
      {label != null ? <span className="ds-timeline-clip__label">{label}</span> : null}
      {children}
    </div>
  )
}
