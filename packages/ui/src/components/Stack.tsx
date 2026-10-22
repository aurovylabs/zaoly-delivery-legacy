import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import {
  clipPathFromCornerInsets,
  type CornerInsets,
} from '../lib/clip-path-from-corner-insets'

export type StackDirection = 'row' | 'column'
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export type StackProps = {
  children?: ReactNode
  className?: string
  direction?: StackDirection
  gap?: StackGap
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: boolean
  /** Corner insets → CSS clip-path (see `clipPathFromCornerInsets`). */
  clipInset?: CornerInsets
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Flex stack — CREATION composition layout (Zaoly `ds-stack`). */
export function Stack({
  children,
  className,
  direction = 'column',
  gap = 'md',
  align,
  justify,
  wrap = false,
  clipInset,
  style,
  ...rest
}: StackProps) {
  const clipPath = clipPathFromCornerInsets(clipInset)
  return (
    <div
      className={cx(
        'ds-stack',
        `ds-stack--${direction}`,
        `ds-stack--gap-${gap}`,
        wrap && 'ds-stack--wrap',
        className,
      )}
      style={{
        alignItems: align,
        justifyContent: justify,
        ...(clipPath ? { clipPath } : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

export type { CornerInsets }
