import { describe, expect, it, vi } from 'vitest'
import { buildEditorContextMenuItems } from '../lib/editor/context-menu-items'

const labels = {
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  duplicate: 'Duplicate',
  delete: 'Delete',
  wrapStack: 'Wrap in Stack',
  wrapGrid: 'Wrap in Grid',
  unwrap: 'Unwrap',
  menuLabel: 'Menu',
}

describe('buildEditorContextMenuItems', () => {
  it('disables wrap/unwrap and selection ops when flags are false', () => {
    const actions = {
      cut: vi.fn(),
      copy: vi.fn(),
      paste: vi.fn(),
      duplicate: vi.fn(),
      delete: vi.fn(),
      wrapStack: vi.fn(),
      wrapGrid: vi.fn(),
      unwrap: vi.fn(),
    }
    const items = buildEditorContextMenuItems(
      labels,
      {
        canCut: false,
        canCopy: false,
        canPaste: true,
        canDuplicate: false,
        canDelete: false,
        canWrap: false,
        canUnwrap: false,
      },
      actions,
    )
    expect(items.find((i) => i.id === 'paste')?.disabled).toBe(false)
    expect(items.find((i) => i.id === 'style')).toBeUndefined()
    expect(items.find((i) => i.id === 'wrap-grid')?.disabled).toBe(true)
    expect(items.find((i) => i.id === 'wrap-stack')?.disabled).toBe(true)
    expect(items.find((i) => i.id === 'delete')?.danger).toBe(true)
  })

  it('includes Wave H set-primary when label and action are provided', () => {
    const setPrimaryBreakpoint = vi.fn()
    const items = buildEditorContextMenuItems(
      { ...labels, setPrimaryBreakpoint: 'Set as primary' },
      {
        canCut: true,
        canCopy: true,
        canPaste: false,
        canDuplicate: true,
        canDelete: true,
        canWrap: false,
        canUnwrap: false,
        canSetPrimaryBreakpoint: true,
      },
      {
        cut: vi.fn(),
        copy: vi.fn(),
        paste: vi.fn(),
        duplicate: vi.fn(),
        delete: vi.fn(),
        wrapStack: vi.fn(),
        wrapGrid: vi.fn(),
        unwrap: vi.fn(),
        setPrimaryBreakpoint,
      },
    )
    const item = items.find((i) => i.id === 'set-primary-breakpoint')
    expect(item?.disabled).toBe(false)
    item?.onSelect?.()
    expect(setPrimaryBreakpoint).toHaveBeenCalled()
  })

  it('includes Wave E reset-breakpoint when label and action are provided', () => {
    const resetBreakpoint = vi.fn()
    const items = buildEditorContextMenuItems(
      { ...labels, resetBreakpoint: 'Reset breakpoint changes' },
      {
        canCut: true,
        canCopy: true,
        canPaste: false,
        canDuplicate: true,
        canDelete: true,
        canWrap: false,
        canUnwrap: false,
        canResetBreakpoint: true,
      },
      {
        cut: vi.fn(),
        copy: vi.fn(),
        paste: vi.fn(),
        duplicate: vi.fn(),
        delete: vi.fn(),
        wrapStack: vi.fn(),
        wrapGrid: vi.fn(),
        unwrap: vi.fn(),
        resetBreakpoint,
      },
    )
    const item = items.find((i) => i.id === 'reset-breakpoint')
    expect(item?.disabled).toBe(false)
    item?.onSelect?.()
    expect(resetBreakpoint).toHaveBeenCalled()
  })
})
