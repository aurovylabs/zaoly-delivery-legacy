'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  readRailDockFromStorage,
  remToPx,
  serializeRailDock,
  type RailDockEdge,
} from '../shell/railDock'

export type FloatingPanelSurface = 'solid' | 'glass'
export type FloatingPanelVariant = 'panel' | 'toolbar' | 'strip'

export type FloatingPanelProps = {
  children: ReactNode
  storageKey: string
  defaultEdge?: RailDockEdge
  defaultOffset?: number
  title?: string
  ariaLabel?: string
  surface?: FloatingPanelSurface
  variant?: FloatingPanelVariant
  className?: string
  zIndex?: number
}

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

function readPanelDock(
  storageKey: string,
  defaultEdge: RailDockEdge,
  defaultOffset: number,
): { edge: RailDockEdge; offset: number } {
  try {
    if (!localStorage.getItem(storageKey)) {
      return { edge: defaultEdge, offset: defaultOffset }
    }
  } catch {
    /* ignore */
  }
  const stored = readRailDockFromStorage(storageKey, defaultEdge)
  return {
    edge: stored.edge,
    offset: typeof stored.offset === 'number' ? stored.offset : defaultOffset,
  }
}

/**
 * Dockable workspace overlay shell (SnapDock).
 * Magazine default: solid / hairline / square — `surface="glass"` opt-in.
 * @see specs/domain/floating-panel.md
 */
export function FloatingPanel({
  children,
  storageKey,
  defaultEdge = 'top',
  defaultOffset = 0.5,
  title,
  ariaLabel,
  surface = 'solid',
  variant = 'panel',
  className,
  zIndex = 35,
}: FloatingPanelProps) {
  const initial = useMemo(
    () => readPanelDock(storageKey, defaultEdge, defaultOffset),
    [storageKey, defaultEdge, defaultOffset],
  )
  const [edge, setEdge] = useState<RailDockEdge>(initial.edge)
  const [offset, setOffset] = useState(initial.offset)
  const [SnapDock, setSnapDock] = useState<SnapDockLike | null>(null)

  useEffect(() => {
    let active = true
    import('react-driftkit')
      .then((mod) => {
        if (active && mod.SnapDock) setSnapDock(() => mod.SnapDock as SnapDockLike)
      })
      .catch(() => {
        /* static fallback */
      })
    return () => {
      active = false
    }
  }, [])

  const persist = useCallback(
    (nextEdge: RailDockEdge, nextOffset: number) => {
      try {
        localStorage.setItem(storageKey, serializeRailDock({ edge: nextEdge, offset: nextOffset }))
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  )

  const panelClass = cx(
    'ds-floating-panel',
    `ds-floating-panel--${variant}`,
    surface === 'glass' && 'ds-floating-panel--glass',
    className,
  )

  const body = (
    <div
      className="ds-floating-panel-inner"
      data-surface={surface}
      data-variant={variant}
    >
      {title ? (
        <div className="ds-floating-panel-drag" title="Drag to dock">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  )

  const label = ariaLabel ?? title

  if (!SnapDock) {
    return (
      <div
        className={cx(panelClass, 'ds-floating-panel--static')}
        data-edge={edge}
        data-surface={surface}
        data-variant={variant}
        aria-label={label}
      >
        {body}
      </div>
    )
  }

  return (
    <SnapDock
      className={panelClass}
      defaultEdge={initial.edge}
      defaultOffset={initial.offset}
      edgePadding={remToPx(1)}
      snap
      draggable
      onEdgeChange={(next) => {
        setEdge(next)
        persist(next, offset)
      }}
      onOffsetChange={(nextOffset) => {
        setOffset(nextOffset)
        persist(edge, nextOffset)
      }}
      style={{ zIndex }}
    >
      <div aria-label={label}>{body}</div>
    </SnapDock>
  )
}
