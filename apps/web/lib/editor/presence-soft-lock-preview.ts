import type { ScenePresenceUser } from '@zaoly/contracts'
import { getSoftLockPeers } from './peer-presence-store'

/** Soft-lock owner for a single node (conflict preview). */
export function softLockOwnerForNode(
  nodeId: string,
  peers: readonly ScenePresenceUser[] = getSoftLockPeers(),
): ScenePresenceUser | null {
  if (!nodeId) return null
  return peers.find((p) => (p.selectedIds ?? []).includes(nodeId)) ?? null
}

/**
 * Non-blocking preview when local selection intersects a peer lock.
 * Does not reject — mutating ops still go through `softLockConflict`.
 */
export function softLockSelectionPreview(
  selectedIds: readonly string[],
  peers: readonly ScenePresenceUser[] = getSoftLockPeers(),
): string | null {
  if (!selectedIds.length || !peers.length) return null
  for (const id of selectedIds) {
    const peer = softLockOwnerForNode(id, peers)
    if (peer) {
      return `Soft-lock preview: ${peer.name} has this selection — edits are blocked.`
    }
  }
  return null
}

export function peerHaloLockLabel(name: string): string {
  return `Locked · ${name}`
}
