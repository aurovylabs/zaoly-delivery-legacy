'use client'

import { useEffect, useId, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { ZaolyCornerBox } from '../brand/ZaolyCornerBox'
import { ZaolyLogoMark } from '../brand/ZaolyLogoMark'
import { TOP_RIGHT_BRAND_CORNERS, ZAOLY_SHELL_CORNER_RADIUS, type CornerKey, type CornerStyle } from '../brand/zaolyCutdown'
import {
  ProductSwitcherPanel,
  launchProductSwitcherItem,
  type ProductSwitcherItem,
} from './ProductSwitcherPanel'

export type BrandCornerProps = {
  label: ReactNode
  mark?: ReactNode
  showLogo?: boolean
  /**
   * When `showLogo` is true: `hover` (default) collapses the label until hover/focus;
   * `always` keeps mark + label visible.
   */
  labelReveal?: 'hover' | 'always'
  borderRadius?: number
  corners?: Record<CornerKey, CornerStyle>
  className?: string
  /** Federated product launcher — list expands inside the plaque (not a detached flyout). */
  menuItems?: ProductSwitcherItem[]
  currentProductId?: string
  menuLabel?: string
  menuFooter?: ReactNode
  onMenuSelectItem?: (item: ProductSwitcherItem) => void
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function labelText(label: ReactNode): string | undefined {
  if (typeof label === 'string' || typeof label === 'number') return String(label)
  return undefined
}

function BrandCornerInner({
  label,
  logoMark,
  showLogo,
  collapseLabel,
}: {
  label: ReactNode
  logoMark: ReactNode
  showLogo: boolean
  collapseLabel: boolean
}) {
  return (
    <div className="brand-corner-inner">
      {showLogo ? (
        <span className="brand-corner-mark" aria-hidden="true">
          {logoMark}
        </span>
      ) : null}
      {label != null && label !== '' ? (
        <span className="brand-corner-reveal">
          <span className="brand-corner-reveal-inner">
            {showLogo ? <span className="brand-corner-divider" aria-hidden="true" /> : null}
            <span className="brand-corner-label" aria-hidden={collapseLabel || undefined}>
              {label}
            </span>
          </span>
        </span>
      ) : null}
    </div>
  )
}

export function BrandCorner({
  label,
  mark,
  showLogo = true,
  labelReveal = 'hover',
  borderRadius = ZAOLY_SHELL_CORNER_RADIUS,
  corners = TOP_RIGHT_BRAND_CORNERS,
  className,
  menuItems,
  currentProductId,
  menuLabel = 'Products',
  menuFooter,
  onMenuSelectItem,
  ...rest
}: BrandCornerProps) {
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const logoMark = mark ?? <ZaolyLogoMark size={22} />
  const hasMenu = Boolean(menuItems && menuItems.length > 0 && currentProductId)
  const effectiveLabelReveal = menuOpen ? 'always' : labelReveal
  const collapseLabel = Boolean(showLogo && effectiveLabelReveal === 'hover')
  const accessibleName = labelText(label)

  useEffect(() => {
    if (!menuOpen) return
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [menuOpen])

  function toggleMenu() {
    if (!hasMenu) return
    setMenuOpen((value) => !value)
  }

  function onHeaderKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleMenu()
    }
  }

  function handleSelect(item: ProductSwitcherItem) {
    const launch = onMenuSelectItem ?? launchProductSwitcherItem
    launch(item)
    setMenuOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className={cx(
        'brand-corner',
        collapseLabel && 'brand-corner--collapse-label',
        !showLogo && 'brand-corner--label-only',
        hasMenu && 'brand-corner--has-menu',
        menuOpen && 'brand-corner--menu-open',
        className,
      )}
      data-testid="brand-corner"
      data-label-reveal={collapseLabel ? 'hover' : 'always'}
      {...rest}
    >
      <ZaolyCornerBox
        className={cx('brand-corner-box', menuOpen && 'brand-corner-box--menu-open')}
        borderRadius={borderRadius}
        topLeft={corners.topLeft}
        topRight={corners.topRight}
        bottomLeft={corners.bottomLeft}
        bottomRight={corners.bottomRight}
      >
        {hasMenu ? (
          <button
            type="button"
            className="brand-corner-header"
            aria-label={accessibleName}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={panelId}
            // Next + linked DS can disagree on `useId` between SSR and hydrate.
            // Client ids win after hydrate; panel is closed on first paint.
            suppressHydrationWarning
            onClick={toggleMenu}
            onKeyDown={onHeaderKeyDown}
          >
            <BrandCornerInner
              label={label}
              logoMark={logoMark}
              showLogo={showLogo}
              collapseLabel={collapseLabel}
            />
          </button>
        ) : (
          <div
            className="brand-corner-header brand-corner-header--static"
            tabIndex={collapseLabel ? 0 : undefined}
            aria-label={collapseLabel ? accessibleName : undefined}
          >
            <BrandCornerInner
              label={label}
              logoMark={logoMark}
              showLogo={showLogo}
              collapseLabel={collapseLabel}
            />
          </div>
        )}
        {hasMenu && menuOpen ? (
          <ProductSwitcherPanel
            id={panelId}
            items={menuItems!}
            currentProductId={currentProductId!}
            label={menuLabel}
            footer={menuFooter}
            onSelectItem={handleSelect}
            embedded
            className="brand-corner-menu"
          />
        ) : null}
      </ZaolyCornerBox>
    </div>
  )
}
