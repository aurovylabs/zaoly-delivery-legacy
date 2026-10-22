import type { ComponentType, HTMLAttributes, KeyboardEvent, ReactNode } from 'react'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatRankIndex(index: number): string {
  const n = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
  return String(n).padStart(2, '0')
}

export type RankedListProps = {
  children: ReactNode
  hint?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

/** Ranked list shell — specs/domain/zaoly-ui-ranked-list.md */
export function RankedList({ children, hint, className, ...rest }: RankedListProps) {
  return (
    <div className={cx('ds-rank-block', 'category-rank-block', className)} {...rest}>
      {hint ? <div className="ds-rank-hint">{hint}</div> : null}
      <ul className="ds-rank category-rank">{children}</ul>
    </div>
  )
}

export type RankedRowProps = {
  /** 1-based rank */
  index: number
  label: ReactNode
  value?: ReactNode
  secondary?: ReactNode
  /** 0–100 fill; omit to hide track */
  barPct?: number
  href?: string
  linkComponent?: ComponentType<any>
  active?: boolean
  onActivate?: () => void
  className?: string
} & Omit<HTMLAttributes<HTMLLIElement>, 'className' | 'children'>

export function RankedRow({
  index,
  label,
  value,
  secondary,
  barPct,
  href,
  linkComponent: LinkComponent,
  active = false,
  onActivate,
  className,
  ...rest
}: RankedRowProps) {
  const interactive = typeof onActivate === 'function' || Boolean(href)
  const showTrack = barPct != null && Number.isFinite(barPct)
  const pct = showTrack ? Math.max(0, Math.min(100, Math.round(barPct))) : 0
  const rowClass = cx(
    'ds-rank-row',
    'category-rank-row',
    interactive && 'ds-rank-row--interactive',
    active && 'ds-rank-row--active',
  )

  const content = (
    <>
      <span className="ds-rank-idx category-rank-idx" aria-hidden>
        {formatRankIndex(index)}
      </span>
      <span className="ds-rank-main category-rank-main">
        <span className="ds-rank-head category-rank-head">
          <span className="ds-rank-label category-rank-label">{label}</span>
          {(value != null || secondary != null) && (
            <span className="ds-rank-meta category-rank-meta">
              {value != null ? (
                <strong className="ds-rank-value ds-text-numeric">{value}</strong>
              ) : null}
              {secondary != null ? (
                <span className="ds-rank-meta-sec meta">{secondary}</span>
              ) : null}
            </span>
          )}
        </span>
        {showTrack ? (
          <span className="ds-rank-track category-rank-track" aria-hidden>
            <span className="ds-rank-fill category-rank-fill" style={{ width: `${pct}%` }} />
          </span>
        ) : null}
      </span>
    </>
  )

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!onActivate) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onActivate()
    }
  }

  return (
    <li
      {...rest}
      className={cx('ds-rank-item', className)}
      data-active={active ? 'true' : undefined}
    >
      {href ? (
        LinkComponent ? (
          <LinkComponent href={href} className={rowClass} aria-current={active ? 'page' : undefined}>
            {content}
          </LinkComponent>
        ) : (
          <a href={href} className={rowClass} aria-current={active ? 'page' : undefined}>
            {content}
          </a>
        )
      ) : (
        <div
          className={rowClass}
          role={onActivate ? 'button' : undefined}
          tabIndex={onActivate ? 0 : undefined}
          onClick={onActivate}
          onKeyDown={onActivate ? onKeyDown : undefined}
        >
          {content}
        </div>
      )}
    </li>
  )
}
