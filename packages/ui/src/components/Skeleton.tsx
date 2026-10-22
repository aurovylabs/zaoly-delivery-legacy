import type { HTMLAttributes } from 'react'

export type SkeletonProps = {
  width?: string | number
  height?: string | number
  className?: string
  /** rounded pill look */
  round?: boolean
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Loading placeholder — specs/domain/zaoly-ui-extended.md */
export function Skeleton({
  width,
  height = '0.85rem',
  className,
  round = false,
  style,
  ...rest
}: SkeletonProps) {
  return (
    <div
      className={cx('ds-skeleton', round && 'ds-skeleton--round', className)}
      style={{
        width: width ?? '100%',
        height,
        ...style,
      }}
      aria-hidden
      {...rest}
    />
  )
}
