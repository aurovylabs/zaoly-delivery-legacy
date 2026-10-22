import type { ReactNode } from 'react'

export type TabItem = {
  id: string
  label: ReactNode
  panel: ReactNode
  disabled?: boolean
}

export type TabsProps = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
  'aria-label'?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Controlled tabs — specs/domain/zaoly-ui-extended.md */
export function Tabs({
  items,
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: TabsProps) {
  const active = items.find((i) => i.id === value) ?? items[0]
  return (
    <div className={cx('ds-tabs', className)}>
      <div className="ds-tablist" role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const selected = item.id === active?.id
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className={cx('ds-tab', selected && 'ds-tab--selected')}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      {active ? (
        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="ds-tabpanel"
        >
          {active.panel}
        </div>
      ) : null}
    </div>
  )
}
