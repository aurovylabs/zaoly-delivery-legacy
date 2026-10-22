'use client'

import { useSyncExternalStore } from 'react'
import {
  getSceneNodePeerHaloSnapshot,
  subscribeSceneNodePeerPresence,
  type PeerHalo,
} from './peer-presence-store'

/** Per-node peer selection halo — re-renders only when this id's peer paint changes (P114). */
export function useSceneNodePeerHalo(nodeId: string): PeerHalo | null {
  return useSyncExternalStore(
    (onStoreChange) => subscribeSceneNodePeerPresence(nodeId, onStoreChange),
    () => getSceneNodePeerHaloSnapshot(nodeId),
    () => null,
  )
}
