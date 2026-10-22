import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { fluidGridTemplateFromColumns } from '../layout-fluid'

export type GridProps = HTMLAttributes<HTMLDivElement> & {
  /** Column count (1–4 typical); maps to fluid `gridTemplateColumns` (auto-fit). */
  columns?: string | number
  /** Explicit CSS grid-template-columns (wins over `columns` when set). */
  gridTemplateColumns?: string
  children?: ReactNode
}

export function Grid({
  children,
  className,
  columns,
  gridTemplateColumns,
  style,
  ...rest
}: GridProps) {
  const template =
    (typeof gridTemplateColumns === 'string' && gridTemplateColumns.trim()) ||
    fluidGridTemplateFromColumns(columns)
  const merged: CSSProperties = {
    display: 'grid',
    ...(template ? { gridTemplateColumns: template } : null),
    ...style,
  }
  return (
    <div className={['site-grid', className].filter(Boolean).join(' ')} style={merged} {...rest}>
      {children}
    </div>
  )
}

