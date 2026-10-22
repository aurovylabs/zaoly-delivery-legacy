'use client'

/**
 * Master-edit chrome: enter/exit, variant activate, board cell upsert (W5m).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import { useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { CompositionScene, SceneOp } from '@zaoly/contracts'
import { findMaster } from '../../lib/scene/expand-instances'
import {
  nextMasterVariantName,
  resolveMasterVariant,
} from '../../lib/scene/master-variants'
import { applySceneOp } from '../../lib/scene/ops'
import { activePageRoot } from '../../lib/scene/scene-pages'
import { replaceSelection } from '../../lib/scene/selection'
import type { LeftTab } from './editor-boot'

export function useEditorMasterEdit(args: {
  sceneRef: { current: CompositionScene }
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setLeftTab: Dispatch<SetStateAction<LeftTab>>
  pushPresent: (next: CompositionScene, ops?: SceneOp[]) => void
  enqueuePendingOp: (op: SceneOp) => void
  setError: (message: string | null) => void
}) {
  const { sceneRef, setSelectedIds, setLeftTab, pushPresent, enqueuePendingOp, setError } = args

  const [editingMasterId, setEditingMasterId] = useState<string | null>(null)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  /** Phase 3: filter picks for axes beyond the first two in Master-Edit matrix. */
  const [masterAxisFilters, setMasterAxisFilters] = useState<Record<string, string>>({})

  const editingMasterIdRef = useRef(editingMasterId)
  const editingVariantIdRef = useRef(editingVariantId)
  editingMasterIdRef.current = editingMasterId
  editingVariantIdRef.current = editingVariantId

  function enterMasterEdit(masterId: string) {
    const master = findMaster(sceneRef.current.masters, masterId)
    if (!master) return
    const variant = resolveMasterVariant(master, master.defaultVariantId)
    setEditingMasterId(masterId)
    setEditingVariantId(variant.id)
    setMasterAxisFilters({})
    setSelectedIds(replaceSelection(variant.root.id))
    setLeftTab('layers')
  }

  function exitMasterEdit() {
    setEditingMasterId(null)
    setEditingVariantId(null)
    setMasterAxisFilters({})
    setSelectedIds(replaceSelection(activePageRoot(sceneRef.current).id))
  }

  function activateMasterVariant(variantId: string) {
    const masterId = editingMasterIdRef.current
    if (!masterId) return
    const master = findMaster(sceneRef.current.masters, masterId)
    if (!master) return
    const variant = resolveMasterVariant(master, variantId)
    setEditingVariantId(variant.id)
    setSelectedIds(replaceSelection(variant.root.id))
  }

  function upsertMasterBoardCell(combination: Record<string, string>) {
    const masterId = editingMasterIdRef.current
    if (!masterId) return
    const fromVariantId = editingVariantIdRef.current ?? undefined
    const result = applySceneOp(sceneRef.current, {
      op: 'upsert_master_variant_cell',
      masterId,
      combination,
      fromVariantId,
    })
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setError(null)
    pushPresent(result.scene)
    enqueuePendingOp({
      op: 'upsert_master_variant_cell',
      masterId,
      combination,
      fromVariantId,
    })
    const master = findMaster(result.scene.masters, masterId)
    if (!master) return
    const cell = master.variants?.find((v) => {
      const axes = master.axes ?? []
      return axes.every((a) => v.combination?.[a.id] === combination[a.id])
    })
    if (cell) activateMasterVariant(cell.id)
  }

  /** Board trailing + tile — unique auto name, clone active, activate new cell. */
  function addMasterVariantFromBoard() {
    const masterId = editingMasterIdRef.current
    if (!masterId) return
    const master = findMaster(sceneRef.current.masters, masterId)
    if (!master) return
    const name = nextMasterVariantName(master)
    const fromVariantId = editingVariantIdRef.current ?? undefined
    const op = {
      op: 'add_master_variant' as const,
      masterId,
      name,
      fromVariantId,
    }
    const result = applySceneOp(sceneRef.current, op)
    if (!result.ok) {
      setError(result.reason)
      return
    }
    setError(null)
    pushPresent(result.scene, [op])
    enqueuePendingOp(op)
    const next = findMaster(result.scene.masters, masterId)
    const added = next?.variants?.[next.variants.length - 1]
    if (added) activateMasterVariant(added.id)
  }

  return {
    editingMasterId,
    setEditingMasterId,
    editingVariantId,
    setEditingVariantId,
    masterAxisFilters,
    setMasterAxisFilters,
    editingMasterIdRef,
    editingVariantIdRef,
    enterMasterEdit,
    exitMasterEdit,
    activateMasterVariant,
    upsertMasterBoardCell,
    addMasterVariantFromBoard,
  }
}
