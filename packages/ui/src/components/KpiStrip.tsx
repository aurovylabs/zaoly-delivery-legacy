import type { HTMLAttributes, ReactNode } from 'react'
import { Text } from './Text'

export type KpiItem = {
  id: string
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
  onClick?: () => void
}

export type KpiStripProps = {
  items: KpiItem[]
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function KpiStrip({ items, className, ...rest }: KpiStripProps) {
  return (
    <div className={cx('kpi-strip', className)} {...rest}>
      {items.map((item) => {
        const content = (
          <>
            <Text role="label" className="kpi-label">{item.label}</Text>
            <Text role="numeric" className="kpi-value" as="p">{item.value}</Text>
            {item.meta != null ? <Text role="meta" as="p">{item.meta}</Text> : null}
          </>
        )

        return item.onClick ? (
          <button key={item.id} type="button" className="kpi-card" onClick={item.onClick}>
            {content}
          </button>
        ) : (
          <div key={item.id} className="kpi-card">
            {content}
          </div>
        )
      })}
    </div>
  )
}
