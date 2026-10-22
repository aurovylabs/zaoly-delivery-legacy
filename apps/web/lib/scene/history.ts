/**
 * Editor undo/redo stacks — W7 inverse-op entries with snapshot fallback.
 * Spec: specs/domain/scene-history-patches-w7.md
 */
import type { CompositionScene, SceneOp } from '@zaoly/contracts'
import { applySceneOpBatch } from './apply-scene-op-batch'
import { invertSceneOps, rewriteForwardForHistory } from './invert-scene-ops'

export type HistoryEntry =
  | { kind: 'ops'; forward: SceneOp[]; inverse: SceneOp[] }
  | { kind: 'snapshot'; scene: CompositionScene }

export type SceneHistory = {
  past: HistoryEntry[]
  present: CompositionScene
  future: HistoryEntry[]
}

const DEFAULT_LIMIT = 50

export function createHistory(present: CompositionScene): SceneHistory {
  return { past: [], present, future: [] }
}

export type PushHistoryOptions = {
  /** Forward ops that produced `next` from the previous present. */
  ops?: readonly SceneOp[]
  /** Scene before those ops (defaults to `history.present`). */
  before?: CompositionScene
}

/** Push a successful mutation; clears redo stack. Prefer ops when invertible. */
export function pushHistory(
  history: SceneHistory,
  next: CompositionScene,
  limitOrOpts: number | PushHistoryOptions = DEFAULT_LIMIT,
  maybeLimit?: number,
): SceneHistory {
  const opts: PushHistoryOptions =
    typeof limitOrOpts === 'number' ? {} : (limitOrOpts ?? {})
  const limit =
    typeof limitOrOpts === 'number'
      ? limitOrOpts
      : (maybeLimit ?? DEFAULT_LIMIT)

  const before = opts.before ?? history.present
  const ops = opts.ops
  let entry: HistoryEntry = { kind: 'snapshot', scene: history.present }
  if (ops?.length) {
    const inverse = invertSceneOps(before, ops, next)
    if (inverse) {
      entry = {
        kind: 'ops',
        forward: rewriteForwardForHistory(before, next, ops),
        inverse,
      }
    }
  }

  return {
    past: [...history.past, entry].slice(-limit),
    present: next,
    future: [],
  }
}

function applyOps(
  scene: CompositionScene,
  ops: SceneOp[],
): CompositionScene | null {
  const result = applySceneOpBatch(scene, ops)
  return result.ok ? result.scene : null
}

export function undoHistory(history: SceneHistory): SceneHistory | null {
  if (history.past.length === 0) return null
  const entry = history.past[history.past.length - 1]!
  if (entry.kind === 'snapshot') {
    return {
      past: history.past.slice(0, -1),
      present: entry.scene,
      future: [{ kind: 'snapshot', scene: history.present }, ...history.future],
    }
  }
  const present = applyOps(history.present, entry.inverse)
  if (!present) return null
  return {
    past: history.past.slice(0, -1),
    present,
    future: [entry, ...history.future],
  }
}

export function redoHistory(history: SceneHistory): SceneHistory | null {
  if (history.future.length === 0) return null
  const [entry, ...rest] = history.future
  if (!entry) return null
  if (entry.kind === 'snapshot') {
    return {
      past: [...history.past, { kind: 'snapshot', scene: history.present }],
      present: entry.scene,
      future: rest,
    }
  }
  const present = applyOps(history.present, entry.forward)
  if (!present) return null
  return {
    past: [...history.past, entry],
    present,
    future: rest,
  }
}

export function canUndo(history: SceneHistory): boolean {
  return history.past.length > 0
}

export function canRedo(history: SceneHistory): boolean {
  return history.future.length > 0
}
