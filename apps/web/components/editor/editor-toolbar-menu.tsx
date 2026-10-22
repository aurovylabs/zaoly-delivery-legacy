'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Button, ContextMenu, type ContextMenuItem } from '@zaoly/ui'
import { ChromeTip } from '../chrome-tip'

export type EditorToolbarMenuProps = {
  label: string
  icon: ReactNode
  items: ContextMenuItem[]
  testId: string
  /** Highlight when a panel from this menu is open. */
  active?: boolean
  disabled?: boolean
}

/**
 * Icon trigger + portaled `@zaoly/ui` ContextMenu for thematic topbar clusters (P101).
 * Knowledge: `knowledge/editor-topbar-menus.md`
 */
export function EditorToolbarMenu({
  label,
  icon,
  items,
  testId,
  active = false,
  disabled = false,
}: EditorToolbarMenuProps) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLSpanElement | null>(null)

  return (
    <span ref={triggerRef} className="creation-editor-toolbar-menu">
      <ChromeTip tip={label}>
        <Button
          type="button"
          size="sm"
          variant={active || open ? 'subtle' : 'ghost'}
          icon={icon}
          aria-haspopup="menu"
          aria-expanded={open}
          disabled={disabled}
          data-testid={testId}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setAnchor({ x: rect.left, y: rect.bottom + 4 })
            setOpen((v) => !v)
          }}
        />
      </ChromeTip>
      <ContextMenu
        open={open}
        x={anchor.x}
        y={anchor.y}
        items={items}
        label={label}
        anchorRef={triggerRef}
        onClose={() => setOpen(false)}
      />
    </span>
  )
}
