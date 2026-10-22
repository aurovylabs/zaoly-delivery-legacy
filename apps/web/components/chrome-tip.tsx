'use client'

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Tooltip } from '../lib/zaoly-ui-client'

export type ChromeTipProps = {
  /** Localized tip — also applied as aria-label when the child lacks one. */
  tip: string
  children: ReactNode
  className?: string
}

/**
 * Icon-chrome discoverability: DS Tooltip + aria-label, no native title (P104).
 */
export function ChromeTip({ tip, children, className }: ChromeTipProps) {
  const child = Children.only(children)
  const labeled = isValidElement(child)
    ? cloneElement(child as ReactElement<{ 'aria-label'?: string; title?: string }>, {
        'aria-label':
          (child as ReactElement<{ 'aria-label'?: string }>).props['aria-label'] ?? tip,
        title: undefined,
      })
    : child

  return (
    <Tooltip content={tip} className={className}>
      {labeled}
    </Tooltip>
  )
}
