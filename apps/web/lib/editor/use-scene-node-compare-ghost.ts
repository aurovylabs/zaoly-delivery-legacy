'use client'

import { useSyncExternalStore } from 'react'
import {
  getBreakpointCompareGhostSnapshot,
  subscribeBreakpointCompareGhost,
} from './breakpoint-compare-ghost-store'

/** Per-node compare-board ghost outline (inactive BP tiles). */
export function useSceneNodeCompareGhost(nodeId: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeBreakpointCompareGhost(nodeId, onStoreChange),
    () => getBreakpointCompareGhostSnapshot(nodeId),
    () => false,
  )
}
