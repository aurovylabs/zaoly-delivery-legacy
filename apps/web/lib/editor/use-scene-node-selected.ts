'use client'

import { useSyncExternalStore } from 'react'
import {
  getSceneNodeSelectedSnapshot,
  subscribeSceneNodeSelection,
} from './editor-selection-store'

/** Per-node selection subscription — re-renders only when this id toggles (P100). */
export function useSceneNodeSelected(nodeId: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeSceneNodeSelection(nodeId, onStoreChange),
    () => getSceneNodeSelectedSnapshot(nodeId),
    () => false,
  )
}
