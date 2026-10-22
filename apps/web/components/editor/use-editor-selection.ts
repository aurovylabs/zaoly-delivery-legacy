'use client'

/**
 * Selection id slice for the editor scene orchestrator (W5e).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useRef, useState } from 'react'
import type { SceneNodeId } from '@zaoly/contracts'
import {
  primarySelectedId,
  replaceSelection,
  toggleSelectedId,
} from '../../lib/scene/selection'

export function useEditorSelection(initialIds: SceneNodeId[]) {
  const [selectedIds, setSelectedIds] = useState(initialIds)
  const selectedId = primarySelectedId(selectedIds)
  const selectedIdsRef = useRef(selectedIds)
  const selectedIdRef = useRef(selectedId)
  selectedIdsRef.current = selectedIds
  selectedIdRef.current = selectedId

  function selectOnly(id: SceneNodeId) {
    setSelectedIds(replaceSelection(id))
  }

  function selectToggle(id: SceneNodeId) {
    setSelectedIds((prev) => toggleSelectedId(prev, id))
  }

  return {
    selectedIds,
    setSelectedIds,
    selectedId,
    selectedIdsRef,
    selectedIdRef,
    selectOnly,
    selectToggle,
  }
}
