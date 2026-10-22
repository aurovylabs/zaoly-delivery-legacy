'use client'

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'

export type ContextMenuItem = {
  id: string
  label: string
  shortcut?: string
  disabled?: boolean
  danger?: boolean
  /** Optional leading icon (app supplies `@zaoly/ui` Icon*). */
  icon?: ReactNode
  /** Optional `data-testid` on the menuitem button. */
  testId?: string
  /** Hairline rule before this row. */
  separator?: boolean
  /** Non-interactive group label (uses `label`; skips keyboard activation). */
  section?: boolean
  onSelect: () => void
}

export type ContextMenuProps = {
  open: boolean
  x: number
  y: number
  onClose: () => void
  items: ContextMenuItem[]
  /** Accessible name for the menu. */
  label?: string
  className?: string
  /**
   * Optional trigger / anchor element. Outside-close ignores presses inside it
   * so icon toggles (topbar menus) do not race open → close.
   */
  anchorRef?: RefObject<HTMLElement | null>
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function isActionItem(item: ContextMenuItem): boolean {
  return item.section !== true
}

function clampToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  pad = 8,
): { left: number; top: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : x + width
  const vh = typeof window !== 'undefined' ? window.innerHeight : y + height
  const maxLeft = Math.max(pad, vw - width - pad)
  const maxTop = Math.max(pad, vh - height - pad)
  return {
    left: Math.min(Math.max(pad, x), maxLeft),
    top: Math.min(Math.max(pad, y), maxTop),
  }
}

/**
 * Controlled pointer-positioned action menu.
 * Spec: specs/domain/zaoly-ui-context-menu.md
 *
 * Portals to `document.body` with `position: fixed` so ancestor `transform` /
 * `backdrop-filter` (e.g. Creation editor topbar trail) cannot retarget fixed
 * coordinates — same pattern as Select / Tooltip.
 */
export function ContextMenu({
  open,
  x,
  y,
  onClose,
  items,
  label = 'Context menu',
  className,
  anchorRef,
}: ContextMenuProps) {
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [pos, setPos] = useState({ left: x, top: y })

  useLayoutEffect(() => {
    if (!open) return
    setPos({ left: x, top: y })
    const el = rootRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos(clampToViewport(x, y, rect.width, rect.height))
  }, [open, x, y, items])

  useEffect(() => {
    if (!open) return

    const enabledIndexes = items
      .map((item, index) => (isActionItem(item) && !item.disabled ? index : -1))
      .filter((index) => index >= 0)
    const first = enabledIndexes[0]
    if (first != null) {
      queueMicrotask(() => itemRefs.current[first]?.focus())
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [open, items, onClose, anchorRef])

  if (!open || items.length === 0) return null
  if (typeof document === 'undefined') return null

  function focusEnabled(delta: number) {
    const enabled = items
      .map((item, index) => (isActionItem(item) && !item.disabled ? index : -1))
      .filter((index) => index >= 0)
    if (enabled.length === 0) return
    const active = document.activeElement
    const current = itemRefs.current.findIndex((el) => el === active)
    const posIdx = enabled.indexOf(current)
    const nextPos = posIdx < 0 ? 0 : (posIdx + delta + enabled.length) % enabled.length
    itemRefs.current[enabled[nextPos]]?.focus()
  }

  function onMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusEnabled(1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusEnabled(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      const first = items.findIndex((item) => isActionItem(item) && !item.disabled)
      if (first >= 0) itemRefs.current[first]?.focus()
    } else if (event.key === 'End') {
      event.preventDefault()
      for (let i = items.length - 1; i >= 0; i -= 1) {
        const item = items[i]
        if (item && isActionItem(item) && !item.disabled) {
          itemRefs.current[i]?.focus()
          break
        }
      }
    }
  }

  return createPortal(
    <div
      ref={rootRef}
      id={menuId}
      role="menu"
      aria-label={label}
      className={cx('ds-context-menu', 'ds-context-menu--portal', className)}
      data-testid="ds-context-menu-portal"
      style={{ left: pos.left, top: pos.top }}
      onKeyDown={onMenuKeyDown}
    >
      {items.map((item, index) => (
        <div key={item.id} className="ds-context-menu-row">
          {item.separator ? <div className="ds-context-menu-separator" role="separator" /> : null}
          {item.section ? (
            <div className="ds-context-menu-section">{item.label}</div>
          ) : (
            <button
              ref={(el) => {
                itemRefs.current[index] = el
              }}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              data-testid={item.testId}
              className={cx(
                'ds-context-menu-item',
                item.danger && 'ds-context-menu-item--danger',
                item.disabled && 'ds-context-menu-item--disabled',
              )}
              onClick={() => {
                if (item.disabled) return
                item.onSelect()
                onClose()
              }}
            >
              <span className="ds-context-menu-item__main">
                {item.icon ? (
                  <span className="ds-context-menu-item__icon" aria-hidden>
                    {item.icon}
                  </span>
                ) : null}
                <span>{item.label}</span>
              </span>
              {item.shortcut ? (
                <span className="ds-context-menu-shortcut">{item.shortcut}</span>
              ) : null}
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body,
  )
}
