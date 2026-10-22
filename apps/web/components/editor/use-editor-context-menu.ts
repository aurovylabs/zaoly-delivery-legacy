'use client'

/**
 * Editor context menu state + canvas open handlers + item model (W5o).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useMemo, useRef, useState, type Dispatch, type MouseEvent as ReactMouseEvent, type SetStateAction } from 'react'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { buildEditorContextMenuItems } from '../../lib/editor/context-menu-items'
import { canUnwrapSelection, canWrapSelection } from '../../lib/scene/ops'
import { replaceSelection } from '../../lib/scene/selection'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import {
  isBreakpointSecondary,
  nodeHasBreakpointOverrides,
} from '../../lib/scene/breakpoint-visibility'
import { findNodeInTree } from '../../lib/scene/expand-instances'

export type EditorContextMenuState = {
  open: boolean
  x: number
  y: number
  ids: string[]
}

export function useEditorContextMenu(args: {
  scene: CompositionScene
  pageRoot: SceneNode
  selectedIdsRef: { current: string[] }
  clipboardLength: () => number
  workingRoot: (scene: CompositionScene) => SceneNode
  activeBreakpoint: EditorBreakpoint
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  t: (key: string, vars?: Record<string, string>) => string
  actions: {
    cut: () => void
    copy: () => void
    paste: () => void
    duplicate: () => void
    delete: () => void
    wrapStack: () => void
    wrapGrid: () => void
    unwrap: () => void
    resetBreakpoint: () => void
    setPrimaryBreakpoint: () => void
  }
}) {
  const {
    scene,
    pageRoot,
    selectedIdsRef,
    clipboardLength,
    workingRoot,
    activeBreakpoint,
    setSelectedIds,
    t,
    actions,
  } = args

  const actionsRef = useRef(actions)
  actionsRef.current = actions

  const [contextMenu, setContextMenu] = useState<EditorContextMenuState>({
    open: false,
    x: 0,
    y: 0,
    ids: [],
  })

  function closeContextMenu(): void {
    setContextMenu((prev) => (prev.open ? { ...prev, open: false } : prev))
  }

  function openEditorContextMenu(clientX: number, clientY: number, nodeId: string | null): void {
    let ids = selectedIdsRef.current
    if (nodeId && !ids.includes(nodeId)) {
      ids = replaceSelection(nodeId)
      selectedIdsRef.current = ids
      setSelectedIds(ids)
    }
    setContextMenu({ open: true, x: clientX, y: clientY, ids })
  }

  function onCanvasContextMenu(e: ReactMouseEvent): void {
    e.preventDefault()
    const target = e.target as HTMLElement | null
    const nodeEl = target?.closest?.('[data-node-id]') as HTMLElement | null
    const nodeId = nodeEl?.getAttribute('data-node-id') ?? null
    openEditorContextMenu(e.clientX, e.clientY, nodeId)
  }

  const contextMenuItems = useMemo(() => {
    if (!contextMenu.open) return []
    const rootId = pageRoot.id
    const ids = contextMenu.ids
    const editable = ids.filter((id) => id !== rootId)
    const canEdit = editable.length > 0
    const root = workingRoot(scene)
    const primary =
      scene.primaryBreakpoint === 'tablet' ||
      scene.primaryBreakpoint === 'mobile' ||
      scene.primaryBreakpoint === 'desktop'
        ? scene.primaryBreakpoint
        : 'desktop'
    const secondary = isBreakpointSecondary(activeBreakpoint, primary)
    const canResetBreakpoint =
      secondary &&
      editable.some((id) => {
        const node = findNodeInTree(root, id)
        return node ? nodeHasBreakpointOverrides(node, activeBreakpoint, primary) : false
      })
    const canSetPrimary =
      (activeBreakpoint === 'desktop' ||
        activeBreakpoint === 'tablet' ||
        activeBreakpoint === 'mobile') &&
      activeBreakpoint !== primary
    const structureOk = !secondary
    const a = actionsRef.current
    return buildEditorContextMenuItems(
      {
        cut: t('editor.cut'),
        copy: t('editor.copy'),
        paste: t('editor.paste'),
        duplicate: t('editor.duplicate'),
        delete: t('editor.delete'),
        wrapStack: t('editor.wrapStack'),
        wrapGrid: t('editor.wrapGrid'),
        unwrap: t('editor.unwrap'),
        menuLabel: t('editor.contextMenu'),
        ...(secondary
          ? { resetBreakpoint: t('editor.resetBreakpointOverrides') }
          : {}),
        ...(canSetPrimary ? { setPrimaryBreakpoint: t('editor.setPrimaryBreakpoint') } : {}),
      },
      {
        canCut: canEdit,
        canCopy: canEdit,
        canPaste: clipboardLength() > 0,
        canDuplicate: canEdit,
        canDelete: canEdit,
        canWrap:
          structureOk && canWrapSelection(scene, editable, workingRoot(scene)),
        canUnwrap:
          structureOk && canUnwrapSelection(scene, ids, workingRoot(scene)),
        canResetBreakpoint,
        canSetPrimaryBreakpoint: canSetPrimary,
      },
      {
        cut: () => a.cut(),
        copy: () => a.copy(),
        paste: () => a.paste(),
        duplicate: () => a.duplicate(),
        delete: () => a.delete(),
        wrapStack: () => a.wrapStack(),
        wrapGrid: () => a.wrapGrid(),
        unwrap: () => a.unwrap(),
        ...(secondary ? { resetBreakpoint: () => a.resetBreakpoint() } : {}),
        ...(canSetPrimary
          ? { setPrimaryBreakpoint: () => a.setPrimaryBreakpoint() }
          : {}),
      },
      {
        cut: t('editor.cutShortcut'),
        copy: t('editor.copyShortcut'),
        paste: t('editor.pasteShortcut'),
        duplicate: t('editor.duplicateShortcut'),
        delete: t('editor.deleteShortcut'),
        wrapStack: '⌘/Ctrl+G',
        unwrap: '⌘/Ctrl+⇧G',
      },
    )
  }, [
    activeBreakpoint,
    clipboardLength,
    contextMenu.ids,
    contextMenu.open,
    pageRoot.id,
    scene,
    t,
    workingRoot,
  ])

  return {
    contextMenu,
    contextMenuItems,
    closeContextMenu,
    openEditorContextMenu,
    onCanvasContextMenu,
  }
}
