import type { ContextMenuItem } from '@zaoly/ui'

export type EditorContextMenuLabels = {
  cut: string
  copy: string
  paste: string
  duplicate: string
  delete: string
  wrapStack: string
  wrapGrid: string
  unwrap: string
  menuLabel: string
  /** Wave E — clear secondary BP overrides (Figma “Reset all changes”). */
  resetBreakpoint?: string
  /** Wave H — promote active digital BP to OP-9 base. */
  setPrimaryBreakpoint?: string
}

export type EditorContextMenuShortcuts = {
  cut?: string
  copy?: string
  paste?: string
  duplicate?: string
  delete?: string
  wrapStack?: string
  unwrap?: string
}

export type EditorContextMenuActions = {
  cut: () => void
  copy: () => void
  paste: () => void
  duplicate: () => void
  delete: () => void
  wrapStack: () => void
  wrapGrid: () => void
  unwrap: () => void
  resetBreakpoint?: () => void
  setPrimaryBreakpoint?: () => void
}

export type EditorContextMenuFlags = {
  canCut: boolean
  canCopy: boolean
  canPaste: boolean
  canDuplicate: boolean
  canDelete: boolean
  canWrap: boolean
  canUnwrap: boolean
  /** Show/enable Wave E reset when secondary + selection has overrides. */
  canResetBreakpoint?: boolean
  /** Wave H — active digital BP is not already primary. */
  canSetPrimaryBreakpoint?: boolean
}

/** Builds P28 editor context-menu items (canvas + layers). */
export function buildEditorContextMenuItems(
  labels: EditorContextMenuLabels,
  flags: EditorContextMenuFlags,
  actions: EditorContextMenuActions,
  shortcuts: EditorContextMenuShortcuts = {},
): ContextMenuItem[] {
  const items: ContextMenuItem[] = [
    {
      id: 'cut',
      label: labels.cut,
      shortcut: shortcuts.cut,
      disabled: !flags.canCut,
      onSelect: actions.cut,
    },
    {
      id: 'copy',
      label: labels.copy,
      shortcut: shortcuts.copy,
      disabled: !flags.canCopy,
      onSelect: actions.copy,
    },
    {
      id: 'paste',
      label: labels.paste,
      shortcut: shortcuts.paste,
      disabled: !flags.canPaste,
      onSelect: actions.paste,
    },
    {
      id: 'duplicate',
      label: labels.duplicate,
      shortcut: shortcuts.duplicate,
      disabled: !flags.canDuplicate,
      onSelect: actions.duplicate,
    },
    {
      id: 'delete',
      label: labels.delete,
      shortcut: shortcuts.delete,
      disabled: !flags.canDelete,
      danger: true,
      onSelect: actions.delete,
    },
  ]
  if (labels.resetBreakpoint && actions.resetBreakpoint) {
    items.push({
      id: 'reset-breakpoint',
      label: labels.resetBreakpoint,
      disabled: !flags.canResetBreakpoint,
      onSelect: actions.resetBreakpoint,
    })
  }
  if (labels.setPrimaryBreakpoint && actions.setPrimaryBreakpoint) {
    items.push({
      id: 'set-primary-breakpoint',
      label: labels.setPrimaryBreakpoint,
      disabled: flags.canSetPrimaryBreakpoint === false,
      onSelect: actions.setPrimaryBreakpoint,
    })
  }
  items.push(
    {
      id: 'wrap-stack',
      label: labels.wrapStack,
      shortcut: shortcuts.wrapStack,
      disabled: !flags.canWrap,
      onSelect: actions.wrapStack,
    },
    {
      id: 'wrap-grid',
      label: labels.wrapGrid,
      disabled: !flags.canWrap,
      onSelect: actions.wrapGrid,
    },
    {
      id: 'unwrap',
      label: labels.unwrap,
      shortcut: shortcuts.unwrap,
      disabled: !flags.canUnwrap,
      onSelect: actions.unwrap,
    },
  )
  return items
}
