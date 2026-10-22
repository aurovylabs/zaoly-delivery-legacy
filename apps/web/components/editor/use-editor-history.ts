'use client'

/**
 * Undo/redo history slice + mutation revision (W5e/W5f/W7).
 * Spec: specs/domain/scene-core-split-w5.md · specs/domain/scene-history-patches-w7.md
 */
import { useCallback, useRef, useState } from 'react'
import type { CompositionScene, SceneOp } from '@zaoly/contracts'
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type SceneHistory,
} from '../../lib/scene/history'

export function useEditorHistory(initial: SceneHistory) {
  const [history, setHistory] = useState(initial)
  const [revision, setRevision] = useState(0)
  const historyRef = useRef(history)
  historyRef.current = history
  const revisionRef = useRef(0)
  const seqRef = useRef(0)
  const pastRevRef = useRef<number[]>([])
  const futureRevRef = useRef<number[]>([])
  const scene = history.present

  const commitRevision = useCallback((next: number) => {
    revisionRef.current = next
    setRevision(next)
  }, [])

  const pushPresent = useCallback(
    (next: CompositionScene, ops?: readonly SceneOp[]) => {
      pastRevRef.current.push(revisionRef.current)
      futureRevRef.current = []
      const nextRev = seqRef.current + 1
      seqRef.current = nextRev
      commitRevision(nextRev)
      const before = historyRef.current.present
      setHistory((h) =>
        pushHistory(h, next, ops?.length ? { ops, before } : undefined),
      )
    },
    [commitRevision],
  )

  const undo = useCallback(() => {
    const h = historyRef.current
    if (!canUndo(h)) return
    const next = undoHistory(h)
    if (!next) return
    const prevRev = pastRevRef.current.pop()
    if (prevRev === undefined) {
      // History moved but revision stack was empty (legacy bypass) — still apply present.
      setHistory(next)
      return
    }
    futureRevRef.current.push(revisionRef.current)
    commitRevision(prevRev)
    setHistory(next)
  }, [commitRevision])

  const redo = useCallback(() => {
    const h = historyRef.current
    if (!canRedo(h)) return
    const next = redoHistory(h)
    if (!next) return
    const nextRev = futureRevRef.current.pop()
    if (nextRev === undefined) {
      setHistory(next)
      return
    }
    pastRevRef.current.push(revisionRef.current)
    commitRevision(nextRev)
    setHistory(next)
  }, [commitRevision])

  /** Replace present and clear stacks (reload / snapshot). Resets revision to 0. */
  const resetPresent = useCallback(
    (next: CompositionScene) => {
      pastRevRef.current = []
      futureRevRef.current = []
      seqRef.current = 0
      commitRevision(0)
      setHistory(createHistory(next))
    },
    [commitRevision],
  )

  /**
   * Patch present without a history entry (breakpoint / bind metadata).
   * Still bumps revision so dirty tracking stays O(1).
   */
  const mutatePresent = useCallback(
    (fn: (present: CompositionScene) => CompositionScene) => {
      const nextRev = seqRef.current + 1
      seqRef.current = nextRev
      commitRevision(nextRev)
      setHistory((h) => ({ ...h, present: fn(h.present) }))
    },
    [commitRevision],
  )

  return {
    history,
    /** @internal Prefer pushPresent / undo / redo / resetPresent / mutatePresent. */
    setHistory,
    scene,
    revision,
    pushPresent,
    undo,
    redo,
    resetPresent,
    mutatePresent,
    canUndo: () => canUndo(history),
    canRedo: () => canRedo(history),
  }
}
