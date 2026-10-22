/** Selective selection subscriptions for SceneNodeView (P99–P101). */

type Listener = () => void

let selectedSet = new Set<string>()
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

/** Push React selection SSOT into the canvas paint store. */
export function syncEditorSelectionFromIds(ids: readonly string[]): void {
  const next = new Set(ids)
  if (setsEqual(selectedSet, next)) return

  const changed = new Set<string>()
  for (const id of selectedSet) {
    if (!next.has(id)) changed.add(id)
  }
  for (const id of next) {
    if (!selectedSet.has(id)) changed.add(id)
  }

  selectedSet = next
  revision += 1
  for (const id of changed) notifyNode(id)
}

export function subscribeSceneNodeSelection(nodeId: string, listener: Listener): () => void {
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

export function getSceneNodeSelectedSnapshot(nodeId: string): boolean {
  return selectedSet.has(nodeId)
}

export function getEditorSelectionRevision(): number {
  return revision
}

export function getEditorSelectionSetSnapshot(): ReadonlySet<string> {
  return selectedSet
}

/** Test-only reset. */
export function resetEditorSelectionStoreForTests(): void {
  selectedSet = new Set()
  revision = 0
  nodeListeners.clear()
}
