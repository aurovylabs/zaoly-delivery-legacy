import type { HTMLAttributes, ReactNode } from 'react'
import { StatusDot } from './StatusDot'

export type TopStatusLevel = 'ok' | 'warn' | 'critical'

export type TopStatusProps = {
  level?: TopStatusLevel
  primary: ReactNode
  secondary?: ReactNode
  live?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function TopStatus({
  level = 'ok',
  primary,
  secondary,
  live = false,
  className,
  ...rest
}: TopStatusProps) {
  return (
    <div className={cx('top-status', live && 'live', className)} data-level={level} role="status" {...rest}>
      <StatusDot level={level === 'critical' ? 'critical' : level === 'warn' ? 'warn' : 'ok'} />
      <span>{primary}</span>
      {secondary != null ? (
        <>
          <span className="top-status-sep" aria-hidden>·</span>
          <span>{secondary}</span>
        </>
      ) : null}
    </div>
  )
}
