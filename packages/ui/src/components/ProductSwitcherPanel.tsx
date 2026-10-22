'use client'

import type { ReactNode } from 'react'

export type ProductSwitcherItem = {
  id: string
  label: string
  href?: string | null
  disabled?: boolean
  description?: string
}

export type ProductSwitcherPanelProps = {
  items: ProductSwitcherItem[]
  currentProductId: string
  /** Accessible name for the menu. */
  label?: string
  footer?: ReactNode
  onSelectItem?: (item: ProductSwitcherItem) => void
  className?: string
  id?: string
  /** Inside BrandCorner plaque — no outer panel chrome. */
  embedded?: boolean
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function defaultSelectItem(item: ProductSwitcherItem): void {
  const href = item.href?.trim()
  if (!href || href === '#') return
  if (/^https?:\/\//i.test(href)) {
    window.open(href, '_blank', 'noopener,noreferrer')
    return
  }
  window.location.assign(href)
}

export { defaultSelectItem as launchProductSwitcherItem }

/**
 * Federated product list for BrandCorner launcher menus.
 * Spec: specs/domain/zaoly-ui-product-switcher.md
 */
export function ProductSwitcherPanel({
  items,
  currentProductId,
  label = 'Products',
  footer,
  onSelectItem,
  className,
  id,
  embedded = false,
}: ProductSwitcherPanelProps) {
  const select = onSelectItem ?? defaultSelectItem

  return (
    <div
      id={id}
      className={cx(
        'product-switcher-panel',
        !embedded && 'ds-motion-reveal',
        embedded && 'product-switcher-panel--embedded',
        className,
      )}
      role="menu"
      aria-label={label}
      data-testid="product-switcher-panel"
    >
      <ul className="product-switcher-panel__list" role="none">
        {items.map((item) => {
          const isCurrent = item.id === currentProductId
          const isDisabled = Boolean(item.disabled) || isCurrent
          return (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                className={cx(
                  'product-switcher-panel__item',
                  isCurrent && 'product-switcher-panel__item--current',
                  isDisabled && !isCurrent && 'product-switcher-panel__item--disabled',
                )}
                disabled={isDisabled}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => {
                  if (isDisabled) return
                  select(item)
                }}
              >
                <span className="product-switcher-panel__label">{item.label}</span>
                {item.description ? (
                  <span className="product-switcher-panel__description">{item.description}</span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>
      {footer ? <div className="product-switcher-panel__footer">{footer}</div> : null}
    </div>
  )
}
