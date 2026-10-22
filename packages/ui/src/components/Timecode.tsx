import type { HTMLAttributes, ReactNode } from 'react'

export type TimecodeProps = {
  value: ReactNode
  secondary?: ReactNode
  separator?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Media timecode readout — specs/domain/zaoly-ui-timecode.md */
export function Timecode({
  value,
  secondary,
  separator = '/',
  className,
  ...rest
}: TimecodeProps) {
  return (
    <span className={cx('ds-timecode', className)} {...rest}>
      <span className="ds-timecode__value ds-text-mono">{value}</span>
      {secondary != null ? (
        <>
          <span className="ds-timecode__sep" aria-hidden>
            {separator}
          </span>
          <span className="ds-timecode__secondary ds-text-mono">{secondary}</span>
        </>
      ) : null}
    </span>
  )
}
