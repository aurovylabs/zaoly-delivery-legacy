'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export type InspectTabItem = {
  id: string
  label: ReactNode
  disabled?: boolean
}

export type InspectTabsProps = {
  value: string
  onChange: (id: string) => void
  /** Custom tabs — when set, `designLabel` / `cssLabel` are ignored. */
  items?: InspectTabItem[]
  /** Default left tab label (default `Design`). */
  designLabel?: ReactNode
  /** Default right tab label (default `CSS`). */
  cssLabel?: ReactNode
  /** Default left tab id (default `design`). */
  designId?: string
  /** Default right tab id (default `css`). */
  cssId?: string
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Dense inspect-rail tablist (Design | CSS by default).
 * Panels stay in the app — compose around PropertyInspector.
 */
export function InspectTabs({
  value,
  onChange,
  items,
  designLabel = 'Design',
  cssLabel = 'CSS',
  designId = 'design',
  cssId = 'css',
  className,
  'aria-label': ariaLabel = 'Inspector tabs',
  ...rest
}: InspectTabsProps) {
  const tabs: InspectTabItem[] =
    items ??
    [
      { id: designId, label: designLabel },
      { id: cssId, label: cssLabel },
    ]

  return (
    <div
      className={cx('ds-inspect-tabs', className)}
      role="tablist"
      aria-label={ariaLabel}
      data-testid="inspect-tabs"
      {...rest}
    >
      {tabs.map((tab) => {
        const selected = value === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`inspect-tab-${tab.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            disabled={tab.disabled}
            data-testid={`inspect-tab-${tab.id}`}
            className={cx(
              'ds-inspect-tabs__tab',
              selected && 'ds-inspect-tabs__tab--selected',
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
