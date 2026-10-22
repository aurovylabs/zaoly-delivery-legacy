'use client'

import type { ReactNode } from 'react'
import { BrandCorner, type BrandCornerProps } from './BrandCorner'
import type { ProductSwitcherItem } from './ProductSwitcherPanel'

export type BrandCornerProductMenuProps = BrandCornerProps & {
  /** @deprecated Prefer `menuItems` on `BrandCorner`. */
  items: ProductSwitcherItem[]
  /** @deprecated Prefer `menuFooter` on `BrandCorner`. */
  footer?: ReactNode
  /** @deprecated Prefer `onMenuSelectItem` on `BrandCorner`. */
  onSelectItem?: (item: ProductSwitcherItem) => void
}

/**
 * Back-compat alias — product menu is rendered inside `BrandCorner`.
 * Spec: specs/domain/zaoly-ui-product-switcher.md
 */
export function BrandCornerProductMenu({
  items,
  currentProductId,
  menuLabel,
  footer,
  onSelectItem,
  ...brandCornerProps
}: BrandCornerProductMenuProps) {
  return (
    <BrandCorner
      {...brandCornerProps}
      menuItems={items}
      currentProductId={currentProductId}
      menuLabel={menuLabel}
      menuFooter={footer}
      onMenuSelectItem={onSelectItem}
    />
  )
}
