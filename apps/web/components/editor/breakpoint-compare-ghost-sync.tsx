'use client'

import { useLayoutEffect } from 'react'
import type { EditorBreakpoint } from '../../lib/scene/breakpoints'
import {
  clearBreakpointCompareGhosts,
  computeBreakpointCompareGhostIds,
  computeMatrixCompareGhostIds,
  syncBreakpointCompareGhostFromIds,
} from '../../lib/editor/breakpoint-compare-ghost-store'

/** Syncs ghost outlines on inactive compare / matrix tiles from React selection SSOT. */
export function BreakpointCompareGhostSync({
  enabled,
  selectedIds,
  activeBreakpoint,
  /** Wave I — when set, ghosts use matrix remap ids for this variant row only. */
  matrixVariantId = null,
}: {
  enabled: boolean
  selectedIds: string[]
  activeBreakpoint: EditorBreakpoint
  matrixVariantId?: string | null
}) {
  useLayoutEffect(() => {
    if (!enabled) {
      clearBreakpointCompareGhosts()
      return
    }
    const ids = matrixVariantId
      ? computeMatrixCompareGhostIds(selectedIds, activeBreakpoint, matrixVariantId)
      : computeBreakpointCompareGhostIds(selectedIds, activeBreakpoint)
    syncBreakpointCompareGhostFromIds(ids)
  }, [enabled, selectedIds, activeBreakpoint, matrixVariantId])

  useLayoutEffect(() => {
    return () => clearBreakpointCompareGhosts()
  }, [])

  return null
}
