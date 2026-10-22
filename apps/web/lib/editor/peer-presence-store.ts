/** Peer selection paint store for SceneNodeView (P114). */

import type { ScenePresenceUser } from '@zaoly/contracts'

export type PeerHalo = {
  userId: string
  name: string
  color: string
}

type Listener = () => void

let peerByNode = new Map<string, PeerHalo>()
let revision = 0
const nodeListeners = new Map<string, Set<Listener>>()
let globalListeners = new Set<Listener>()

function notifyNode(nodeId: string) {
  const set = nodeListeners.get(nodeId)
  if (set) for (const listener of set) listener()
}

function notifyGlobal() {
  for (const listener of globalListeners) listener()
}

/** Sync remote peer selections into the canvas paint store (excludes local user). */
export function syncPeerPresenceFromUsers(
  users: readonly ScenePresenceUser[],
  localUserId?: string | null,
): void {
  const next = new Map<string, PeerHalo>()
  for (const user of users) {
    if (localUserId && user.userId === localUserId) continue
    for (const nodeId of user.selectedIds ?? []) {
      if (!nodeId || next.has(nodeId)) continue
      next.set(nodeId, {
        userId: user.userId,
        name: user.name,
        color: user.color,
      })
    }
  }

  const changed = new Set<string>()
  for (const id of peerByNode.keys()) {
    if (!next.has(id)) changed.add(id)
  }
  for (const [id, halo] of next) {
    const prev = peerByNode.get(id)
    if (!prev || prev.userId !== halo.userId || prev.color !== halo.color || prev.name !== halo.name) {
      changed.add(id)
    }
  }

  peerByNode = next
  revision += 1
  for (const id of changed) notifyNode(id)
  if (changed.size) notifyGlobal()
}

export function subscribeSceneNodePeerPresence(
  nodeId: string,
  listener: Listener,
): () => void {
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

export function getSceneNodePeerHaloSnapshot(nodeId: string): PeerHalo | null {
  return peerByNode.get(nodeId) ?? null
}

export function getPeerSelectedNodeIds(): ReadonlySet<string> {
  return new Set(peerByNode.keys())
}

/** Snapshot of all remote selected ids (for soft-lock). */
export function getPeerPresenceUsersSnapshot(): ScenePresenceUser[] {
  // Reconstruct minimal list from node map is lossy; soft-lock uses a separate cache.
  return []
}

let softLockPeers: ScenePresenceUser[] = []

export function setSoftLockPeers(users: readonly ScenePresenceUser[], localUserId?: string | null): void {
  softLockPeers = users.filter((u) => !localUserId || u.userId !== localUserId)
}

export function getSoftLockPeers(): readonly ScenePresenceUser[] {
  return softLockPeers
}

export function __resetPeerPresenceForTests(): void {
  peerByNode = new Map()
  softLockPeers = []
  revision = 0
  nodeListeners.clear()
  globalListeners = new Set()
}

export function getPeerPresenceRevision(): number {
  return revision
}
