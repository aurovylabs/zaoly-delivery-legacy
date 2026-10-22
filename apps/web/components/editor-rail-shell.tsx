'use client'

import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useCallback,
  useRef,
} from 'react'
import {
  PANEL_SIZE_LIMITS,
  PANEL_UNDOCK_THRESHOLD_PX,
  homeEdgeForSide,
  type PanelDockEdge,
  type PanelFloatRect,
  type PanelSide,
} from '../lib/editor-panel-chrome'
import { ChromeTip } from './chrome-tip'

type ResizeAxis = 'e' | 'w' | 'n' | 's' | 'ne' | 'nw' | 'se' | 'sw'

const FLOAT_RESIZE_HANDLES: ResizeAxis[] = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']

function axisTouchesEast(axis: ResizeAxis): boolean {
  return axis === 'e' || axis === 'ne' || axis === 'se'
}

function axisTouchesWest(axis: ResizeAxis): boolean {
  return axis === 'w' || axis === 'nw' || axis === 'sw'
}

function axisTouchesSouth(axis: ResizeAxis): boolean {
  return axis === 's' || axis === 'se' || axis === 'sw'
}

function axisTouchesNorth(axis: ResizeAxis): boolean {
  return axis === 'n' || axis === 'ne' || axis === 'nw'
}

export function EditorRailShell({
  side,
  mode,
  edge,
  dockSize,
  float,
  minimized = false,
  title,
  undockLabel,
  minimizeLabel,
  restoreLabel,
  dragLabel,
  resizeLabel,
  children,
  onUndock,
  onToggleMinimize,
  onMove,
  onSnapDock,
  onResizeDocked,
  onResizeFloat,
  className,
  testId,
}: {
  side: PanelSide
  mode: 'docked' | 'floating'
  edge: PanelDockEdge
  dockSize: number
  float: PanelFloatRect | null
  /** Floating-only: collapse body to title bar. */
  minimized?: boolean
  title: string
  undockLabel: string
  minimizeLabel: string
  restoreLabel: string
  dragLabel: string
  resizeLabel: string
  children: ReactNode
  onUndock: (seed: Partial<PanelFloatRect>) => void
  onToggleMinimize: () => void
  onMove: (next: PanelFloatRect) => void
  onSnapDock: () => void
  onResizeDocked: (size: number) => void
  onResizeFloat: (next: PanelFloatRect) => void
  className?: string
  testId?: string
}) {
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    w: number
    h: number
    undocked: boolean
  } | null>(null)

  const resizeRef = useRef<{
    pointerId: number
    axis: ResizeAxis
    startX: number
    startY: number
    originX: number
    originY: number
    originW: number
    originH: number
    originDock: number
  } | null>(null)

  const onHeaderPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      const target = event.target as HTMLElement | null
      if (target?.closest('button, a, input, select, textarea, [data-no-rail-drag]')) return

      const host = event.currentTarget.closest('[data-editor-rail]') as HTMLElement | null
      const rect = host?.getBoundingClientRect()
      const viewport = host?.closest('.creation-editor-body')?.getBoundingClientRect()
      if (!rect) return

      event.preventDefault()
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* jsdom */
      }

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: mode === 'floating' && float ? float.x : rect.left - (viewport?.left ?? 0),
        originY: mode === 'floating' && float ? float.y : rect.top - (viewport?.top ?? 0),
        w: float?.w ?? dockSize,
        h: float?.h ?? rect.height,
        undocked: mode === 'floating',
      }
    },
    [dockSize, edge, float, mode],
  )

  const onHeaderPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      const dx = event.clientX - drag.startX
      const dy = event.clientY - drag.startY
      const dist = Math.hypot(dx, dy)

      if (!drag.undocked) {
        if (dist < PANEL_UNDOCK_THRESHOLD_PX) return
        drag.undocked = true
        onUndock({
          x: drag.originX + dx,
          y: drag.originY + dy,
          w: drag.w,
          h: drag.h,
        })
        return
      }

      onMove({
        x: drag.originX + dx,
        y: drag.originY + dy,
        w: drag.w,
        h: drag.h,
      })
    },
    [onMove, onUndock],
  )

  const endDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== event.pointerId) return
      dragRef.current = null
      try {
        event.currentTarget.releasePointerCapture(event.pointerId)
      } catch {
        /* already released */
      }
      if (drag.undocked && mode === 'floating') onSnapDock()
    },
    [mode, onSnapDock],
  )

  const onResizePointerDown = useCallback(
    (axis: ResizeAxis) => (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* jsdom */
      }
      resizeRef.current = {
        pointerId: event.pointerId,
        axis,
        startX: event.clientX,
        startY: event.clientY,
        originX: float?.x ?? 0,
        originY: float?.y ?? 0,
        originW: float?.w ?? dockSize,
        originH: float?.h ?? dockSize,
        originDock: dockSize,
      }
    },
    [dockSize, float],
  )

  const onResizePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = resizeRef.current
      if (!session || session.pointerId !== event.pointerId) return
      const dx = event.clientX - session.startX
      const dy = event.clientY - session.startY

      if (mode === 'docked') {
        let next = session.originDock
        if (edge === 'left' && axisTouchesEast(session.axis)) next = session.originDock + dx
        if (edge === 'right' && axisTouchesWest(session.axis)) next = session.originDock - dx
        onResizeDocked(next)
        return
      }

      const right = session.originX + session.originW
      const bottom = session.originY + session.originH
      let x = session.originX
      let y = session.originY
      let w = session.originW
      let h = session.originH

      if (axisTouchesWest(session.axis)) {
        x = session.originX + dx
        w = right - x
        if (w < PANEL_SIZE_LIMITS.widthMin) {
          w = PANEL_SIZE_LIMITS.widthMin
          x = right - w
        }
      } else if (axisTouchesEast(session.axis)) {
        w = Math.max(PANEL_SIZE_LIMITS.widthMin, session.originW + dx)
      }

      if (axisTouchesNorth(session.axis)) {
        y = session.originY + dy
        h = bottom - y
        if (h < PANEL_SIZE_LIMITS.heightMin) {
          h = PANEL_SIZE_LIMITS.heightMin
          y = bottom - h
        }
      } else if (axisTouchesSouth(session.axis)) {
        h = Math.max(PANEL_SIZE_LIMITS.heightMin, session.originH + dy)
      }

      onResizeFloat({ x, y, w, h })
    },
    [edge, mode, onResizeDocked, onResizeFloat],
  )

  const endResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const session = resizeRef.current
    if (!session || session.pointerId !== event.pointerId) return
    resizeRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }, [])

  const floating = mode === 'floating' && float
  // Floating without a rect would leave the rail in flow with no dock width — treat as docked.
  const effectiveMode: 'docked' | 'floating' = floating ? 'floating' : 'docked'
  const isMinimized = Boolean(floating && minimized)
  const dockedEdge = effectiveMode === 'docked' ? edge : homeEdgeForSide(side)
  const style: CSSProperties = floating
    ? {
        position: 'absolute',
        left: float.x,
        top: float.y,
        width: float.w,
        height: isMinimized ? 'auto' : float.h,
        zIndex: side === 'left' ? 40 : 41,
      }
    : {
        ['--rail-dock-size' as string]: `${dockSize}px`,
      }

  const resizeHandles: ResizeAxis[] = isMinimized
    ? []
    : effectiveMode === 'floating'
      ? FLOAT_RESIZE_HANDLES
      : dockedEdge === 'left'
        ? ['e']
        : ['w']

  const minimizeToggleLabel = isMinimized ? restoreLabel : minimizeLabel

  return (
    <div
      className={[
        'creation-editor-rail',
        floating ? 'creation-editor-rail--floating' : 'creation-editor-rail--docked',
        effectiveMode === 'docked' ? `creation-editor-rail--dock-${dockedEdge}` : '',
        isMinimized ? 'creation-editor-rail--minimized' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-editor-rail={side}
      data-rail-mode={effectiveMode}
      data-rail-edge={effectiveMode === 'docked' ? dockedEdge : 'float'}
      data-minimized={isMinimized ? 'true' : 'false'}
      data-testid={testId}
      style={style}
    >
      <header
        className="creation-editor-rail__header"
        data-testid={`editor-rail-header-${side}`}
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        title={dragLabel}
      >
        <span className="creation-editor-rail__title">{title}</span>
        <div className="creation-editor-rail__actions" data-no-rail-drag>
          {effectiveMode === 'docked' ? (
            <ChromeTip tip={undockLabel}>
              <button
                type="button"
                className="creation-editor-rail__action"
                data-no-rail-drag
                data-testid={`editor-rail-undock-${side}`}
                onClick={() => {
                  const host = document.querySelector(
                    `[data-editor-rail="${side}"]`,
                  ) as HTMLElement | null
                  const body = host?.closest('.creation-editor-body') as HTMLElement | null
                  const rect = host?.getBoundingClientRect()
                  const bodyRect = body?.getBoundingClientRect()
                  onUndock({
                    x: (rect?.left ?? 16) - (bodyRect?.left ?? 0),
                    y: (rect?.top ?? 56) - (bodyRect?.top ?? 0),
                    w: rect?.width,
                    h: rect?.height,
                  })
                }}
              >
                ⧉
              </button>
            </ChromeTip>
          ) : (
            <ChromeTip tip={minimizeToggleLabel}>
              <button
                type="button"
                className="creation-editor-rail__action"
                data-no-rail-drag
                data-testid={`editor-rail-minimize-${side}`}
                aria-pressed={isMinimized}
                onClick={onToggleMinimize}
              >
                {isMinimized ? '▢' : '−'}
              </button>
            </ChromeTip>
          )}
        </div>
      </header>
      {!isMinimized ? <div className="creation-editor-rail__body">{children}</div> : null}
      {resizeHandles.map((axis) => (
        <div
          key={axis}
          role="separator"
          aria-orientation={
            axis === 'n' || axis === 's'
              ? 'horizontal'
              : axis === 'e' || axis === 'w'
                ? 'vertical'
                : undefined
          }
          aria-label={resizeLabel}
          title={resizeLabel}
          className={`creation-editor-rail__resize creation-editor-rail__resize--${axis}`}
          data-testid={`editor-rail-resize-${side}-${axis}`}
          data-no-rail-drag
          onPointerDown={onResizePointerDown(axis)}
          onPointerMove={onResizePointerMove}
          onPointerUp={endResize}
          onPointerCancel={endResize}
        />
      ))}
    </div>
  )
}
