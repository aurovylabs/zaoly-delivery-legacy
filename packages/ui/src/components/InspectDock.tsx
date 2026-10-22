import type { ElementType, HTMLAttributes, ReactNode } from 'react'

export type InspectDockProps = {
  children?: ReactNode
  className?: string
  as?: ElementType
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Band inside a chat stream for agent inspect chrome — specs/domain/zaoly-ui-inspect-dock.md */
export function InspectDock({
  children,
  className,
  as: Comp = 'div',
  'aria-label': ariaLabel = 'Inspect',
  ...rest
}: InspectDockProps) {
  return (
    <Comp className={cx('ds-inspect-dock', className)} aria-label={ariaLabel} {...rest}>
      {children}
    </Comp>
  )
}
