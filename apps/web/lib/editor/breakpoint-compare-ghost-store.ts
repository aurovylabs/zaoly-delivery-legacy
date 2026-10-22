/**
 * Ghost selection outlines on inactive breakpoint-compare tiles (Wave B).
 * Spec: specs/domain/responsive-breakpoint-board.md
 */
import type { SceneBreakpointId } from '@zaoly/contracts'
import {
  BREAKPOINT_COMPARE_BPS,
  remapBreakpointBoardNodeId,
  type DigitalEditorBreakpoint,
} from '../scene/breakpoint-board'
import { remapMatrixNodeId } from '../scene/master-breakpoint-matrix'

type Listener = () => void

let ghostSet = new Set<string>()
let revision = 0
const nodeListeners = new Map<string, Set<Listener>>()

function setsEqual(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false
  for (const id of a) {
    if (!b.has(id)) return false
  }
  return true
}

function notifyNode(nodeId: string) {
  const set = nodeListeners.get(nodeId)
  if (!set) return
  for (const listener of set) listener()
}

function activeDigitalBreakpoint(bp: SceneBreakpointId): DigitalEditorBreakpoint {
  if (bp === 'tablet' || bp === 'mobile') return bp
  return 'desktop'
}

/** Remapped node ids that should paint ghost chrome for the current selection. */
export function computeBreakpointCompareGhostIds(
  selectedIds: readonly string[],
  activeBreakpoint: SceneBreakpointId,
): string[] {
  const active = activeDigitalBreakpoint(activeBreakpoint)
  const out: string[] = []
  for (const id of selectedIds) {
    if (!id || id.startsWith('__')) continue
    for (const bp of BREAKPOINT_COMPARE_BPS) {
      if (bp === active) continue
      out.push(remapBreakpointBoardNodeId(bp, id))
    }
  }
  return out
}

/**
 * Wave I — ghosts only within the active variant row’s inactive BP columns.
 */
export function computeMatrixCompareGhostIds(
  selectedIds: readonly string[],
  activeBreakpoint: SceneBreakpointId,
  activeVariantId: string,
): string[] {
  if (!activeVariantId) return []
  const active = activeDigitalBreakpoint(activeBreakpoint)
  const out: string[] = []
  for (const id of selectedIds) {
    if (!id || id.startsWith('__')) continue
    for (const bp of BREAKPOINT_COMPARE_BPS) {
      if (bp === active) continue
      out.push(remapMatrixNodeId(activeVariantId, bp, id))
    }
  }
  return out
}

export function syncBreakpointCompareGhostFromIds(ids: readonly string[]): void {
  const next = new Set(ids)
  if (setsEqual(ghostSet, next)) return

  const changed = new Set<string>()
  for (const id of ghostSet) {
    if (!next.has(id)) changed.add(id)
  }
  for (const id of next) {
    if (!ghostSet.has(id)) changed.add(id)
  }

  ghostSet = next
  revision += 1
  for (const id of changed) notifyNode(id)
}

export function clearBreakpointCompareGhosts(): void {
  syncBreakpointCompareGhostFromIds([])
}

export function subscribeBreakpointCompareGhost(nodeId: string, listener: Listener): () => void {
  let set = nodeListeners.get(nodeId)
  if (!set) {
    set = new Set()
    nodeListeners.set(nodeId, set)
  }
  set.add(listener)
  return () => {
    set!.delete(listener)
    if (set!.size === 0) nodeListeners.delete(nodeId)
  }
}

export function getBreakpointCompareGhostSnapshot(nodeId: string): boolean {
  return ghostSet.has(nodeId)
}

export function getBreakpointCompareGhostRevision(): number {
  return revision
}

/** Test-only reset. */
export function resetBreakpointCompareGhostStoreForTests(): void {
  ghostSet = new Set()
  revision = 0
  nodeListeners.clear()
}
