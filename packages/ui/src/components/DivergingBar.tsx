import type { HTMLAttributes, ReactNode } from 'react'

export type DivergingBarTone = 'pos' | 'neg' | 'neu'

export type DivergingBarItem = {
  id: string
  label: ReactNode
  value: number
  display?: ReactNode
}

export type DivergingBarListProps = {
  items: DivergingBarItem[]
  /** Absolute max used for bar width; defaults to max |value|. */
  domain?: number
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function resolveDomain(items: DivergingBarItem[], domain?: number): number {
  if (domain != null && domain > 0) return domain
  const peak = items.reduce((m, it) => Math.max(m, Math.abs(it.value)), 0)
  return Math.max(1, peak)
}

function barPct(value: number, domain: number): number {
  return Math.min(100, (Math.abs(value) / domain) * 100)
}

function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return value > 0 ? `+${text}` : text
}

/** Zero-centered signed bars for scorecards. */
export function DivergingBarList({
  items,
  domain: domainProp,
  className,
  'aria-label': ariaLabel = 'Category scores',
  ...rest
}: DivergingBarListProps) {
  const domain = resolveDomain(items, domainProp)
  return (
    <ul className={cx('ds-diverging-bars', className)} aria-label={ariaLabel} {...rest}>
      {items.map((item) => {
        const tone: DivergingBarTone =
          item.value < 0 ? 'neg' : item.value > 0 ? 'pos' : 'neu'
        const pct = barPct(item.value, domain)
        return (
          <li key={item.id} data-tone={tone} className="ds-diverging-bar">
            <span className="ds-diverging-bar-label">{item.label}</span>
            <div className="ds-diverging-bar-track" aria-hidden>
              <span className="ds-diverging-bar-zero" />
              <span
                className="ds-diverging-bar-fill"
                data-tone={tone}
                style={{ ['--bar-pct' as string]: `${pct}%` }}
              />
            </div>
            <strong className="ds-diverging-bar-value ds-text-numeric">
              {item.display ?? formatSigned(item.value)}
            </strong>
          </li>
        )
      })}
    </ul>
  )
}
