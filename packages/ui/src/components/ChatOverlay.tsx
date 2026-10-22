'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

export type ChatOverlayPlacement = 'dock-end' | 'center'

const DEFAULT_WIDTH_PX = 32 * 16
const DEFAULT_MIN_WIDTH_PX = 20 * 16
const DEFAULT_MAX_WIDTH_PX = 64 * 16
const DEFAULT_WIDTH_STORAGE_KEY = 'zaoly-chat-overlay-width'

export type ChatOverlayProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  /** Accessible name when title is visual-only / omitted */
  ariaLabel?: string
  placement?: ChatOverlayPlacement
  headerActions?: ReactNode
  children: ReactNode
  className?: string
  onClose?: () => void
  /**
   * Dock-end only: drag the inline-start edge to change sheet width.
   * Default true for `dock-end`.
   */
  resizable?: boolean
  /** Uncontrolled initial width in px (default 512 / 32rem). */
  defaultWidth?: number
  /** Controlled width in px. */
  width?: number
  onWidthChange?: (width: number) => void
  minWidth?: number
  maxWidth?: number
  /** Persist last width under this key; pass `null` to disable. */
  widthStorageKey?: string | null
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function readStoredWidth(key: string | null | undefined): number | null {
  if (!key || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

function writeStoredWidth(key: string | null | undefined, width: number): void {
  if (!key || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, String(Math.round(width)))
  } catch {
    /* ignore quota / private mode */
  }
}

function resolveMaxWidth(maxWidth: number): number {
  if (typeof window === 'undefined') return maxWidth
  return Math.min(maxWidth, Math.floor(window.innerWidth * 0.92))
}

/**
 * Domain-free chat flyout / overlay shell.
 * Return type is `ReactNode` (not inferred `ReactPortal`) so consumers with a
 * separate `@types/react` tree can still use this as a JSX component.
 * @see specs/domain/zaoly-ui-chat-overlay.md
 * @see knowledge/react-types-dedupe.md
 */
export function ChatOverlay({
  open,
  onOpenChange,
  title,
  ariaLabel,
  placement = 'dock-end',
  headerActions,
  children,
  className,
  onClose,
  resizable,
  defaultWidth = DEFAULT_WIDTH_PX,
  width: widthProp,
  onWidthChange,
  minWidth = DEFAULT_MIN_WIDTH_PX,
  maxWidth = DEFAULT_MAX_WIDTH_PX,
  widthStorageKey = DEFAULT_WIDTH_STORAGE_KEY,
}: ChatOverlayProps): ReactNode {
  const titleId = useId()
  const sheetRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null)
  const widthRef = useRef(DEFAULT_WIDTH_PX)
  const canResize = placement === 'dock-end' && (resizable ?? true)
  const controlled = widthProp != null

  const [uncontrolledWidth, setUncontrolledWidth] = useState(() => {
    const stored = readStoredWidth(widthStorageKey)
    return stored ?? defaultWidth
  })
  const [resizing, setResizing] = useState(false)

  const widthPx = controlled ? widthProp : uncontrolledWidth
  widthRef.current = widthPx

  const setWidth = useCallback(
    (next: number, persist = false) => {
      const clamped = clamp(next, minWidth, resolveMaxWidth(maxWidth))
      widthRef.current = clamped
      if (!controlled) setUncontrolledWidth(clamped)
      onWidthChange?.(clamped)
      if (persist) writeStoredWidth(widthStorageKey, clamped)
    },
    [controlled, maxWidth, minWidth, onWidthChange, widthStorageKey],
  )

  const close = () => {
    onOpenChange(false)
    onClose?.()
  }

  useEffect(() => {
    if (!open) return
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const sheet = sheetRef.current
    const focusable = sheet?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.focus()
    return () => {
      previousFocusRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange, onClose])

  useEffect(() => {
    if (!open || !canResize || controlled) return
    const onResize = () => {
      setUncontrolledWidth((w) => clamp(w, minWidth, resolveMaxWidth(maxWidth)))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [open, canResize, controlled, minWidth, maxWidth])

  const onResizePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!canResize || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const handle = event.currentTarget
    if (typeof handle.setPointerCapture === 'function') {
      handle.setPointerCapture(event.pointerId)
    }
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startWidth: widthRef.current,
    }
    setResizing(true)
  }

  const onResizePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const rtl =
      typeof document !== 'undefined' &&
      getComputedStyle(document.documentElement).direction === 'rtl'
    const delta = rtl ? event.clientX - drag.startX : drag.startX - event.clientX
    setWidth(drag.startWidth + delta)
  }

  const endResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setResizing(false)
    try {
      if (typeof event.currentTarget.releasePointerCapture === 'function') {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }
    } catch {
      /* already released */
    }
    setWidth(widthRef.current, true)
  }

  const onResizeKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!canResize) return
    const step = event.shiftKey ? 48 : 16
    const rtl =
      typeof document !== 'undefined' &&
      getComputedStyle(document.documentElement).direction === 'rtl'
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setWidth(widthPx + (rtl ? -step : step), true)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      setWidth(widthPx + (rtl ? step : -step), true)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setWidth(minWidth, true)
    } else if (event.key === 'End') {
      event.preventDefault()
      setWidth(resolveMaxWidth(maxWidth), true)
    }
  }

  if (!open || typeof document === 'undefined') return null

  const label = ariaLabel || title || 'Chat'
  const sheetStyle: CSSProperties | undefined = canResize
    ? ({
        '--chat-overlay-sheet-width': `${Math.round(widthPx)}px`,
      } as CSSProperties)
    : undefined

  return createPortal(
    <div
      className={cx(
        'chat-overlay',
        placement === 'dock-end' && 'chat-overlay-dock-end',
        resizing && 'chat-overlay-resizing',
        className,
      )}
      data-placement={placement}
      data-resizing={resizing ? 'true' : undefined}
    >
      <button
        type="button"
        className="chat-overlay-backdrop"
        aria-label="Close chat overlay"
        onClick={close}
      />
      <div
        ref={sheetRef}
        className={cx(
          'chat-overlay-sheet',
          placement === 'dock-end' && 'chat-overlay-sheet-dock-end',
          canResize && 'chat-overlay-sheet-resizable',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title ? undefined : label}
        aria-labelledby={title ? titleId : undefined}
        style={sheetStyle}
      >
        {canResize ? (
          <button
            type="button"
            className="chat-overlay-resize"
            role="slider"
            aria-label="Resize chat panel"
            aria-orientation="vertical"
            aria-valuemin={minWidth}
            aria-valuemax={resolveMaxWidth(maxWidth)}
            aria-valuenow={Math.round(widthPx)}
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={endResize}
            onPointerCancel={endResize}
            onKeyDown={onResizeKeyDown}
          />
        ) : null}
        <div className="chat-panel-head chat-overlay-head">
          <div className="chat-overlay-head-start">
            {title ? (
              <h2 id={titleId} className="chat-overlay-title">
                {title}
              </h2>
            ) : null}
            {headerActions}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="chat-close"
            aria-label="Close"
            onClick={close}
          >
            ×
          </Button>
        </div>
        <div className="chat-overlay-body chat-panel chat-panel-compact">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
