'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  dockPanel,
  loadPanelChrome,
  moveFloatingPanel,
  normalizePanelChrome,
  PANEL_CHROME_DEFAULTS,
  resizeDockedPanel,
  resolveFloatSnap,
  savePanelChrome,
  toggleMinimizeFloatingPanel,
  undockPanel,
  type EditorPanelChromeState,
  type PanelDockEdge,
  type PanelFloatRect,
  type PanelSide,
} from '../../lib/editor-panel-chrome'
import { EditorRailShell } from '../editor-rail-shell'
import { isEditableTarget } from './editor-boot'

export function useEditorPanelChrome() {
  // SSR-safe default; restore session after mount to avoid hydration mismatch.
  const [panelChrome, setPanelChrome] = useState<EditorPanelChromeState>(() => ({
    ...PANEL_CHROME_DEFAULTS,
  }))
  const [panelChromeHydrated, setPanelChromeHydrated] = useState(false)
  const bodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setPanelChrome(loadPanelChrome())
    setPanelChromeHydrated(true)
  }, [])

  useEffect(() => {
    if (!panelChromeHydrated) return
    savePanelChrome(panelChrome)
  }, [panelChrome, panelChromeHydrated])

  // After layout, clamp / redock floats that would leave the inspect rail invisible.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const sync = () => {
      const r = el.getBoundingClientRect()
      const viewport = { width: r.width, height: r.height }
      setPanelChrome((prev) => {
        const next = normalizePanelChrome(prev, viewport)
        return next === prev ? prev : next
      })
    }
    sync()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [])

  const bodyViewport = useCallback(() => {
    const el = bodyRef.current
    if (!el) return { width: 1200, height: 800 }
    const r = el.getBoundingClientRect()
    return { width: r.width, height: r.height }
  }, [])

  const onRailUndock = useCallback(
    (side: PanelSide, seed: Partial<PanelFloatRect>) => {
      const vp = bodyViewport()
      setPanelChrome((prev) => undockPanel(prev, side, vp, seed))
    },
    [bodyViewport],
  )

  const onRailDock = useCallback((side: PanelSide, edge?: PanelDockEdge) => {
    setPanelChrome((prev) => dockPanel(prev, side, edge))
  }, [])

  const onRailToggleMinimize = useCallback((side: PanelSide) => {
    setPanelChrome((prev) => toggleMinimizeFloatingPanel(prev, side))
  }, [])

  const onRailMove = useCallback(
    (side: PanelSide, next: PanelFloatRect) => {
      const vp = bodyViewport()
      setPanelChrome((prev) => moveFloatingPanel(prev, side, next, vp))
    },
    [bodyViewport],
  )

  const onRailResizeDocked = useCallback(
    (side: PanelSide, size: number) => {
      const vp = bodyViewport()
      setPanelChrome((prev) => resizeDockedPanel(prev, side, size, vp))
    },
    [bodyViewport],
  )

  const onRailResizeFloat = useCallback(
    (side: PanelSide, next: PanelFloatRect) => {
      const vp = bodyViewport()
      setPanelChrome((prev) => moveFloatingPanel(prev, side, next, vp))
    },
    [bodyViewport],
  )

  const onRailSnapDock = useCallback(
    (side: PanelSide) => {
      const vp = bodyViewport()
      setPanelChrome((prev) => {
        const float = side === 'left' ? prev.leftFloat : prev.rightFloat
        if (!float) return prev
        const snap = resolveFloatSnap(side, float, vp)
        if (snap) return dockPanel(prev, side, snap)
        return prev
      })
    },
    [bodyViewport],
  )

  const toggleLeftRail = useCallback(() => {
    setPanelChrome((prev) => {
      if (prev.leftMode === 'floating') return dockPanel(prev, 'left')
      const vp = bodyViewport()
      return undockPanel(prev, 'left', vp, {})
    })
  }, [bodyViewport])

  const toggleRightRail = useCallback(() => {
    setPanelChrome((prev) => {
      if (prev.rightMode === 'floating') return dockPanel(prev, 'right')
      const vp = bodyViewport()
      return undockPanel(prev, 'right', vp, {})
    })
  }, [bodyViewport])

  const redockBothRails = useCallback(() => {
    setPanelChrome((prev) => {
      let next = prev
      if (next.leftMode === 'floating') next = dockPanel(next, 'left')
      if (next.rightMode === 'floating') next = dockPanel(next, 'right')
      return next
    })
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return
      if (e.key === '[') {
        e.preventDefault()
        toggleLeftRail()
        return
      }
      if (e.key === ']') {
        e.preventDefault()
        toggleRightRail()
        return
      }
      if (e.key === '\\') {
        e.preventDefault()
        redockBothRails()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggleLeftRail, toggleRightRail, redockBothRails])

  return {
    panelChrome,
    bodyRef,
    onRailUndock,
    onRailDock,
    onRailToggleMinimize,
    onRailMove,
    onRailResizeDocked,
    onRailResizeFloat,
    onRailSnapDock,
  }
}

export type EditorPanelRailProps = {
  side: 'left' | 'right'
  mode: 'docked' | 'floating'
  panelChrome: EditorPanelChromeState
  title: string
  undockLabel: string
  minimizeLabel: string
  restoreLabel: string
  dragLabel: string
  resizeLabel: string
  className: string
  testId: string
  children: ReactNode
  onRailUndock: (side: PanelSide, seed: Partial<PanelFloatRect>) => void
  onRailToggleMinimize: (side: PanelSide) => void
  onRailMove: (side: PanelSide, next: PanelFloatRect) => void
  onRailSnapDock: (side: PanelSide) => void
  onRailResizeDocked: (side: PanelSide, size: number) => void
  onRailResizeFloat: (side: PanelSide, next: PanelFloatRect) => void
}

export function EditorPanelRail({
  side,
  mode,
  panelChrome,
  title,
  undockLabel,
  minimizeLabel,
  restoreLabel,
  dragLabel,
  resizeLabel,
  className,
  testId,
  children,
  onRailUndock,
  onRailToggleMinimize,
  onRailMove,
  onRailSnapDock,
  onRailResizeDocked,
  onRailResizeFloat,
}: EditorPanelRailProps) {
  const edge = side === 'left' ? panelChrome.leftEdge : panelChrome.rightEdge
  const dockSize = side === 'left' ? panelChrome.leftSize : panelChrome.rightSize
  const float = side === 'left' ? panelChrome.leftFloat : panelChrome.rightFloat
  const minimized = side === 'left' ? panelChrome.leftMinimized : panelChrome.rightMinimized

  return (
    <EditorRailShell
      side={side}
      mode={mode}
      edge={edge}
      dockSize={dockSize}
      float={float}
      minimized={minimized}
      title={title}
      undockLabel={undockLabel}
      minimizeLabel={minimizeLabel}
      restoreLabel={restoreLabel}
      dragLabel={dragLabel}
      resizeLabel={resizeLabel}
      className={className}
      testId={testId}
      onUndock={(seed) => onRailUndock(side, seed)}
      onToggleMinimize={() => onRailToggleMinimize(side)}
      onMove={(next) => onRailMove(side, next)}
      onSnapDock={() => onRailSnapDock(side)}
      onResizeDocked={(size) => onRailResizeDocked(side, size)}
      onResizeFloat={(next) => onRailResizeFloat(side, next)}
    >
      {children}
    </EditorRailShell>
  )
}

export type EditorPanelDockLayoutProps = {
  panelChrome: EditorPanelChromeState
  leftRail: (mode: 'docked' | 'floating') => ReactNode
  rightRail: (mode: 'docked' | 'floating') => ReactNode
  canvas: ReactNode
}

export function EditorPanelDockLayout({
  panelChrome,
  leftRail,
  rightRail,
  canvas,
}: EditorPanelDockLayoutProps) {
  return (
    <>
      <div className="creation-editor-dock-mid">
        {panelChrome.leftMode === 'docked' ? leftRail('docked') : null}
        {canvas}
        {panelChrome.rightMode === 'docked' ? rightRail('docked') : null}
      </div>
      {panelChrome.leftMode === 'floating' ? leftRail('floating') : null}
      {panelChrome.rightMode === 'floating' ? rightRail('floating') : null}
    </>
  )
}
