'use client'

import { useLayoutEffect } from 'react'
import { syncEditorSelectionFromIds } from '../../lib/editor/editor-selection-store'

/** Keeps canvas selection store aligned with React `selectedIds` SSOT (P99). */
export function EditorSelectionSync({ selectedIds }: { selectedIds: string[] }) {
  useLayoutEffect(() => {
    syncEditorSelectionFromIds(selectedIds)
  }, [selectedIds])
  return null
}
