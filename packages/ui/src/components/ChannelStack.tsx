import type { DetailsHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export type ChannelStackProps = {
  children?: ReactNode
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

export type ChannelLaneProps = {
  label: ReactNode
  children?: ReactNode
  /** Controlled open state for `<details>` */
  open?: boolean
  defaultOpen?: boolean
  compact?: boolean
  className?: string
} & Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Stack of labeled disclosure lanes — specs/domain/zaoly-ui-channel-stack.md */
export function ChannelStack({
  children,
  className,
  'aria-label': ariaLabel,
  ...rest
}: ChannelStackProps) {
  return (
    <div className={cx('ds-channel-stack', className)} aria-label={ariaLabel} {...rest}>
      {children}
    </div>
  )
}

export function ChannelLane({
  label,
  children,
  open,
  defaultOpen,
  compact = false,
  className,
  onClick,
  ...rest
}: ChannelLaneProps) {
  const openProps =
    open !== undefined
      ? ({ open } as const)
      : defaultOpen !== undefined
        ? ({ defaultOpen } as const)
        : {}

  return (
    <details
      className={cx('ds-channel-lane', compact && 'ds-channel-lane--compact', className)}
      {...openProps}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(e)
      }}
      {...rest}
    >
      <summary className="ds-channel-lane-summary">{label}</summary>
      <div className="ds-channel-lane-body">{children}</div>
    </details>
  )
}
