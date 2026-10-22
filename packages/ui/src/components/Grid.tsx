import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'

export type GridProps = {
  children?: ReactNode
  className?: string
  columns?: number | string
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** CSS grid layout wrapper (Zaoly `ds-grid`). */
export function Grid({
  children,
  className,
  columns = 2,
  gap = 'md',
  style,
  ...rest
}: GridProps) {
  const template =
    typeof columns === 'number' ? `repeat(${columns}, minmax(0, 1fr))` : columns
  return (
    <div
      className={cx('ds-grid', `ds-grid--gap-${gap}`, className)}
      style={{ gridTemplateColumns: template, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  )
}
