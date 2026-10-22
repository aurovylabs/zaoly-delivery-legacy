import type { HTMLAttributes, ReactNode } from 'react'
import { Text } from './Text'

export type HintProps = {
  children: ReactNode
  className?: string
  /** Also apply legacy `.panel-hint` */
  panel?: boolean
} & Omit<HTMLAttributes<HTMLParagraphElement>, 'className' | 'children' | 'role'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Mono click-path hint — specs/domain/zaoly-ui-foundation.md */
export function Hint({ children, className, panel = false, ...rest }: HintProps) {
  return (
    <Text
      role="hint"
      as="p"
      className={cx('ds-hint', 'hint', panel && 'panel-hint', className)}
      {...rest}
    >
      {children}
    </Text>
  )
}
