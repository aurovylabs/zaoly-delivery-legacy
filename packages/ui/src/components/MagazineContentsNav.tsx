'use client'

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'

export type MagazineContentsItem = {
  id: string
  index: string
  label: string
  href: string
}

export type MagazineContentsItemRenderState = {
  selected: boolean
  className: string
}

export type MagazineContentsNavProps = {
  items: MagazineContentsItem[]
  activeId: string
  /** Eyebrow label above the tablist (default Contents). */
  label?: string
  /** Optional exit / hub action in the header row. */
  exit?: ReactNode
  /** Force compact; omit for IntersectionObserver auto-compact. */
  compact?: boolean
  /** CSS grid column count (default 3). */
  columns?: number
  /** Override item rendering (e.g. Next.js Link). */
  renderItem?: (
    item: MagazineContentsItem,
    state: MagazineContentsItemRenderState
  ) => ReactNode
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Sticky magazine Contents nav with scroll-compact sentinel.
 * Spec: specs/domain/zaoly-ui-magazine-contents-nav.md
 */
export function MagazineContentsNav({
  items,
  activeId,
  label = 'Contents',
  exit,
  compact: compactProp,
  columns = 3,
  renderItem,
  className,
  'aria-label': ariaLabel = 'Contents',
  ...rest
}: MagazineContentsNavProps) {
  const [autoCompact, setAutoCompact] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const compact = compactProp ?? autoCompact

  useEffect(() => {
    if (compactProp != null) return
    const sentinel = sentinelRef.current
    if (!sentinel || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setAutoCompact(!entry.isIntersecting)
      },
      { root: null, threshold: 0, rootMargin: '0px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [compactProp])

  return (
    <>
      {compactProp == null ? (
        <div ref={sentinelRef} className="ds-magazine-contents-sentinel" aria-hidden />
      ) : null}
      <nav
        className={cx(
          'ds-magazine-contents',
          compact && 'ds-magazine-contents--compact',
          className
        )}
        aria-label={ariaLabel}
        data-compact={compact ? 'true' : undefined}
        style={{ ['--ds-magazine-contents-columns' as string]: String(Math.max(1, columns)) }}
        {...rest}
      >
        <div className="ds-magazine-contents__header">
          <p className="ds-magazine-contents__label">{label}</p>
          {exit != null ? <div className="ds-magazine-contents__exit">{exit}</div> : null}
        </div>
        <ul className="ds-magazine-contents__list" role="tablist">
          {items.map((item) => {
            const selected = item.id === activeId
            const linkClass = cx(
              'ds-magazine-contents__link',
              selected && 'ds-magazine-contents__link--active'
            )
            return (
              <li key={item.id} className="ds-magazine-contents__item">
                {renderItem ? (
                  renderItem(item, { selected, className: linkClass })
                ) : (
                  <a
                    href={item.href}
                    role="tab"
                    aria-selected={selected}
                    aria-current={selected ? 'page' : undefined}
                    className={linkClass}
                    data-section={item.id}
                  >
                    <span className="ds-magazine-contents__index" aria-hidden>
                      {item.index}
                    </span>
                    <span className="ds-magazine-contents__name">{item.label}</span>
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
