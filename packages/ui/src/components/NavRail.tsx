'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentType, CSSProperties, HTMLAttributes, MouseEventHandler, ReactNode } from 'react'
import {
  NAV_RAIL_COMPACT_MEDIA,
  railOrientationFromEdge,
  readRailDockFromStorage,
  remToPx,
  serializeRailDock,
  type RailDockEdge,
} from '../shell/railDock'

export type NavRailItem = {
  id: string
  label: string
  href?: string
  icon?: ReactNode
  active?: boolean
  disabled?: boolean
  title?: string
  ariaLabel?: string
  onClick?: MouseEventHandler<HTMLElement>
}

export type NavRailProps = {
  items: NavRailItem[]
  footerItems?: NavRailItem[]
  logo?: ReactNode
  logoLabel?: string
  onLogoClick?: MouseEventHandler<HTMLButtonElement>
  linkComponent?: ComponentType<any>
  dockable?: boolean
  dockStorageKey?: string
  defaultDockEdge?: RailDockEdge
  dockEdgePaddingRem?: number
  onDockEdgeChange?: (edge: RailDockEdge) => void
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

type SnapDockLike = ComponentType<{
  children?: ReactNode
  className?: string
  defaultEdge?: RailDockEdge
  defaultOffset?: number
  edgePadding?: number
  snap?: boolean
  draggable?: boolean
  onEdgeChange?: (edge: RailDockEdge) => void
  onOffsetChange?: (offset: number) => void
  style?: CSSProperties
}>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function RailItem({
  item,
  linkComponent: LinkComponent,
}: {
  item: NavRailItem
  linkComponent?: ComponentType<any>
}) {
  const className = cx(
    'rail-link',
    item.active && 'active',
    item.disabled && 'rail-link-muted',
    item.id === 'settings' && 'rail-link-avatar',
  )
  const content = (
    <>
      {item.icon ? <span className="rail-icon" aria-hidden="true">{item.icon}</span> : null}
      <span className="rail-label">{item.label}</span>
    </>
  )

  if (item.href && !item.disabled) {
    if (LinkComponent) {
      return (
        <LinkComponent
          href={item.href}
          className={className}
          title={item.title ?? item.label}
          aria-label={item.ariaLabel ?? item.label}
        >
          {content}
        </LinkComponent>
      )
    }

    return (
      <a
        href={item.href}
        className={className}
        title={item.title ?? item.label}
        aria-label={item.ariaLabel ?? item.label}
      >
        {content}
      </a>
    )
  }

  if (item.onClick && !item.disabled) {
    return (
      <button
        type="button"
        className={className}
        title={item.title ?? item.label}
        aria-label={item.ariaLabel ?? item.label}
        onClick={item.onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <span
      className={className}
      title={item.title ?? item.label}
      aria-label={item.ariaLabel ?? item.label}
      aria-disabled={item.disabled ? 'true' : undefined}
    >
      {content}
    </span>
  )
}

function RailBody({
  items,
  footerItems,
  logo,
  logoLabel,
  onLogoClick,
  linkComponent,
}: Pick<
  NavRailProps,
  'items' | 'footerItems' | 'logo' | 'logoLabel' | 'onLogoClick' | 'linkComponent'
>) {
  return (
    <>
      {logo ? (
        <button type="button" className="rail-logo" aria-label={logoLabel} onClick={onLogoClick}>
          {logo}
        </button>
      ) : null}
      {items.map((item) => (
        <RailItem key={item.id} item={item} linkComponent={linkComponent} />
      ))}
      {footerItems?.length ? <div className="rail-spacer" /> : null}
      {footerItems?.map((item) => (
        <RailItem key={item.id} item={item} linkComponent={linkComponent} />
      ))}
    </>
  )
}

function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(NAV_RAIL_COMPACT_MEDIA)
    const apply = () => setCompact(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return compact
}

export function NavRail({
  items,
  footerItems = [],
  logo,
  logoLabel = 'Open home',
  onLogoClick,
  linkComponent,
  dockable = false,
  dockStorageKey = 'zaoly.navRail.dock',
  defaultDockEdge = 'left',
  dockEdgePaddingRem = 1,
  onDockEdgeChange,
  className,
  ...rest
}: NavRailProps) {
  const initial = useMemo(
    () => readRailDockFromStorage(dockStorageKey, defaultDockEdge),
    [dockStorageKey, defaultDockEdge],
  )
  const [edge, setEdge] = useState<RailDockEdge>(initial.edge)
  const [offset, setOffset] = useState(initial.offset)
  const [SnapDock, setSnapDock] = useState<SnapDockLike | null>(null)
  const compact = useCompactViewport()
  const effectiveEdge: RailDockEdge = compact ? 'bottom' : edge
  const orientation = railOrientationFromEdge(effectiveEdge)

  useEffect(() => {
    if (!dockable) return
    let active = true
    import('react-driftkit')
      .then((mod) => {
        if (active && mod.SnapDock) setSnapDock(() => mod.SnapDock as SnapDockLike)
      })
      .catch(() => {
        /* keep CSS-fixed rail */
      })
    return () => {
      active = false
    }
  }, [dockable])

  useEffect(() => {
    if (!compact) return
    onDockEdgeChange?.('bottom')
  }, [compact, onDockEdgeChange])

  const persist = useCallback(
    (nextEdge: RailDockEdge, nextOffset: number) => {
      try {
        localStorage.setItem(
          dockStorageKey,
          serializeRailDock({ edge: nextEdge, offset: nextOffset }),
        )
      } catch {
        /* ignore */
      }
    },
    [dockStorageKey],
  )

  const body = (
    <RailBody
      items={items}
      footerItems={footerItems}
      logo={logo}
      logoLabel={logoLabel}
      onLogoClick={onLogoClick}
      linkComponent={linkComponent}
    />
  )

  const railClass = cx(
    'nav-rail',
    compact && 'nav-rail--compact-bottom',
    (!dockable || !SnapDock || compact) && 'nav-rail--static-dock',
    className,
  )

  /* Compact: lock bottom bar (no SnapDock fight with inline position). */
  if (compact || !dockable || !SnapDock) {
    return (
      <nav
        className={railClass}
        data-orientation={orientation}
        data-edge={effectiveEdge}
        aria-label="Primary"
        {...rest}
      >
        {body}
      </nav>
    )
  }

  return (
    <SnapDock
      key={`dock-${effectiveEdge}`}
      className={cx('nav-rail', className)}
      defaultEdge={initial.edge}
      defaultOffset={initial.offset}
      edgePadding={remToPx(dockEdgePaddingRem)}
      snap
      draggable
      onEdgeChange={(next) => {
        setEdge(next)
        onDockEdgeChange?.(next)
        persist(next, offset)
      }}
      onOffsetChange={(nextOffset) => {
        setOffset(nextOffset)
        persist(edge, nextOffset)
      }}
      style={{ zIndex: 'var(--z-nav-rail)' }}
    >
      {body}
    </SnapDock>
  )
}
