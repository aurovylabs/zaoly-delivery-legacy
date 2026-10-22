import type { HTMLAttributes, ReactNode } from 'react'

export type FlowBoardToolbarProps = {
  leading?: ReactNode
  children?: ReactNode
  trailing?: ReactNode
  dirty?: boolean
  dirtyLabel?: string
  error?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Toolbar row chrome for flow boards (place inside FloatingPanel toolbar). */
export function FlowBoardToolbar({
  leading,
  children,
  trailing,
  dirty,
  dirtyLabel = 'dirty',
  error,
  className,
  ...rest
}: FlowBoardToolbarProps) {
  return (
    <div className={cx('zaoly-flow-toolbar', className)} {...rest}>
      <span className="zaoly-flow-toolbar-grip" aria-hidden>
        ⋮⋮
      </span>
      {leading ? <div className="zaoly-flow-toolbar-leading">{leading}</div> : null}
      <span className="zaoly-flow-toolbar-sep" aria-hidden />
      <div className="zaoly-flow-toolbar-actions">{children}</div>
      {trailing ? (
        <>
          <span className="zaoly-flow-toolbar-sep" aria-hidden />
          <div className="zaoly-flow-toolbar-trailing">{trailing}</div>
        </>
      ) : null}
      {dirty ? (
        <span className="zaoly-flow-toolbar-chip" data-dirty="true">
          {dirtyLabel}
        </span>
      ) : null}
      {error ? <div className="zaoly-flow-toolbar-error">{error}</div> : null}
    </div>
  )
}
