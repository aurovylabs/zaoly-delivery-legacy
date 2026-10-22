import type { ElementType, HTMLAttributes, ReactNode } from 'react'

export type ScrollAreaOrientation = 'vertical' | 'horizontal' | 'both'

export type ScrollAreaProps = {
  children?: ReactNode
  className?: string
  as?: ElementType
  orientation?: ScrollAreaOrientation
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Opt-in hairline scrollport — specs/domain/zaoly-ui-scroll-area.md
 * Adds `.ds-scroll` (see base.css). Avoids universal WebKit scrollbar chrome.
 */
export function ScrollArea({
  children,
  className,
  as: Comp = 'div',
  orientation = 'vertical',
  ...rest
}: ScrollAreaProps) {
  return (
    <Comp
      className={cx(
        'ds-scroll',
        'ds-scroll-area',
        orientation === 'vertical' && 'ds-scroll-area--y',
        orientation === 'horizontal' && 'ds-scroll-area--x',
        orientation === 'both' && 'ds-scroll-area--both',
        className,
      )}
      {...rest}
    >
      {children}
    </Comp>
  )
}
