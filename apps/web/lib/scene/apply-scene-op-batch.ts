import type { CompositionScene, SceneOp } from '@zaoly/contracts'
import { withPrunedComments } from '../scene-comments'
import { applySceneOp } from './ops'
import { normalizeSceneOp } from './normalize-scene-op'
import { collectSceneNodeIds } from './scene-pages'

export const SCENE_OPS_MAX_BATCH = 64
export const SCENE_OPS_MAX_NODES = 2000
export const SCENE_OPS_MAX_MASTERS = 256
export const SCENE_OPS_MAX_PAGES = 64

export type SceneOpBatchErrorCode =
  | 'op-not-persisted'
  | 'op-rejected'
  | 'tree-too-large'
  | 'masters-too-large'
  | 'pages-too-large'

export type ApplySceneOpBatchResult =
  | { ok: true; scene: CompositionScene; appliedCount: number }
  | {
      ok: false
      error: SceneOpBatchErrorCode
      failedIndex: number
      reason: string
      op?: SceneOp
    }

export function applySceneOpBatch(
  scene: CompositionScene,
  ops: SceneOp[],
): ApplySceneOpBatchResult {
  let working = scene

  for (let i = 0; i < ops.length; i++) {
    const op = normalizeSceneOp(ops[i]!)
    if (op.op === 'select') {
      return {
        ok: false,
        error: 'op-not-persisted',
        failedIndex: i,
        reason: 'select is editor chrome only',
        op,
      }
    }
    let result: ReturnType<typeof applySceneOp>
    try {
      result = applySceneOp(working, op)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        ok: false,
        error: 'op-rejected',
        failedIndex: i,
        reason: `op threw: ${message}`,
        op,
      }
    }
    if (!result.ok) {
      return {
        ok: false,
        error: 'op-rejected',
        failedIndex: i,
        reason: result.reason,
        op,
      }
    }
    working = result.scene
  }

  const pruned = withPrunedComments(working)
  const nodeCount = collectSceneNodeIds(pruned).size
  if (nodeCount > SCENE_OPS_MAX_NODES) {
    return {
      ok: false,
      error: 'tree-too-large',
      failedIndex: Math.max(0, ops.length - 1),
      reason: `Scene has ${nodeCount} nodes (max ${SCENE_OPS_MAX_NODES})`,
    }
  }

  const masterCount = pruned.masters?.length ?? 0
  if (masterCount > SCENE_OPS_MAX_MASTERS) {
    return {
      ok: false,
      error: 'masters-too-large',
      failedIndex: Math.max(0, ops.length - 1),
      reason: `Scene has ${masterCount} masters (max ${SCENE_OPS_MAX_MASTERS})`,
    }
  }

  const pageCount = pruned.pages?.length ?? 1
  if (pageCount > SCENE_OPS_MAX_PAGES) {
    return {
      ok: false,
      error: 'pages-too-large',
      failedIndex: Math.max(0, ops.length - 1),
      reason: `Scene has ${pageCount} pages (max ${SCENE_OPS_MAX_PAGES})`,
    }
  }

  return { ok: true, scene: pruned, appliedCount: ops.length }
}
