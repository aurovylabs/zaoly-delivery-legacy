'use client'

/**
 * Scene mutation primitives: soft-lock, master-edit apply, runOp/runOps (W5i).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import type { Dispatch, SetStateAction } from 'react'
import type { CompositionScene, SceneNode, SceneOp } from '@zaoly/contracts'
import { softLockConflict } from '../../lib/editor/presence-soft-lock'
import { editorToastMessage } from '../../lib/editor-toast-message'
import { applyMasterEditOp, applySceneOp } from '../../lib/scene/ops'
import { findMaster } from '../../lib/scene/expand-instances'
import { resolveMasterVariant } from '../../lib/scene/master-variants'
import { activePageRoot } from '../../lib/scene/scene-pages'
import { replaceSelection } from '../../lib/scene/selection'

export type EditorMutateResult =
  | { ok: true; scene: CompositionScene }
  | { ok: false; reason: string }

export type EditorMutationsToast = {
  message: string
  tone: 'ok' | 'error'
  durationMs?: number
}

export function useEditorMutations(args: {
  sceneRef: { current: CompositionScene }
  editingMasterIdRef: { current: string | null }
  editingVariantIdRef: { current: string | null }
  inspectRootRef: { current: SceneNode }
  pushPresent: (next: CompositionScene, ops?: SceneOp[]) => void
  enqueuePendingOp: (op: SceneOp) => void
  enqueuePendingOps: (ops: SceneOp[]) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setError: (message: string | null) => void
  pushToast: (toast: EditorMutationsToast) => void
}) {
  const {
    sceneRef,
    editingMasterIdRef,
    editingVariantIdRef,
    inspectRootRef,
    pushPresent,
    enqueuePendingOp,
    enqueuePendingOps,
    setSelectedIds,
    setError,
    pushToast,
  } = args

  function rejectMutation(reason: string): void {
    const message = editorToastMessage(reason)
    setError(message)
    pushToast({ message, tone: 'error', durationMs: 4000 })
  }

  function applyMutatingOp(current: CompositionScene, op: SceneOp): EditorMutateResult {
    const masterId = editingMasterIdRef.current
    if (
      masterId &&
      op.op !== 'add_master_variant' &&
      op.op !== 'rename_master_variant' &&
      op.op !== 'delete_master_variant' &&
      op.op !== 'set_master_default_variant' &&
      op.op !== 'set_instance_variant' &&
      op.op !== 'set_instance_variant_axes' &&
      op.op !== 'update_master_variant_root' &&
      op.op !== 'update_master_root' &&
      op.op !== 'rename_master' &&
      op.op !== 'bind_master_composition' &&
      op.op !== 'delete_master' &&
      op.op !== 'create_master' &&
      op.op !== 'ensure_palette_master' &&
      op.op !== 'detach_instance'
    ) {
      // insert_instance / insert_child route here so nested palette hydrate
      // lands on the Master working root (section Masters), not the page tree.
      return applyMasterEditOp(current, masterId, op, editingVariantIdRef.current ?? undefined)
    }
    return applySceneOp(current, op)
  }

  function workingRoot(scene: CompositionScene): SceneNode {
    const masterId = editingMasterIdRef.current
    if (!masterId) return activePageRoot(scene)
    const master = findMaster(scene.masters, masterId)
    if (!master) return activePageRoot(scene)
    return resolveMasterVariant(master, editingVariantIdRef.current).root
  }

  function runOp(op: SceneOp): void {
    if (op.op === 'select') {
      setSelectedIds(op.nodeId ? replaceSelection(op.nodeId) : [inspectRootRef.current.id])
      return
    }
    const lockReason = softLockConflict([op])
    if (lockReason) {
      rejectMutation(lockReason)
      return
    }
    const result = applyMutatingOp(sceneRef.current, op)
    if (!result.ok) {
      rejectMutation(result.reason)
      return
    }
    setError(null)
    pushPresent(result.scene, [op])
    enqueuePendingOp(op)
    if (
      op.op === 'set_active_page' ||
      op.op === 'add_page' ||
      op.op === 'duplicate_page' ||
      op.op === 'delete_page'
    ) {
      setSelectedIds(replaceSelection(result.scene.root.id))
    }
  }

  function runOps(ops: SceneOp[]): void {
    if (!ops.length) return
    const lockReason = softLockConflict(ops)
    if (lockReason) {
      rejectMutation(lockReason)
      return
    }
    let current = sceneRef.current
    for (const op of ops) {
      const result = applyMutatingOp(current, op)
      if (!result.ok) {
        rejectMutation(result.reason)
        return
      }
      current = result.scene
    }
    setError(null)
    pushPresent(current, ops)
    enqueuePendingOps(ops)
  }

  return {
    rejectMutation,
    applyMutatingOp,
    workingRoot,
    runOp,
    runOps,
  }
}
