/**
 * Scene tree navigation + id minting (W5a).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import type { CompositionScene, SceneNode, SceneNodeId } from '@zaoly/contracts'

let nodeSeq = 0

export function createSceneNodeId(prefix = 'node'): SceneNodeId {
  nodeSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${nodeSeq}`
}

/** Test helper — reset id sequence. */
export function __resetSceneNodeIdSeqForTests(): void {
  nodeSeq = 0
}

export function findNode(root: SceneNode, id: SceneNodeId): SceneNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const hit = findNode(child, id)
    if (hit) return hit
  }
  return null
}

export function findParent(
  root: SceneNode,
  id: SceneNodeId,
): { parent: SceneNode; index: number } | null {
  const children = root.children ?? []
  for (let i = 0; i < children.length; i += 1) {
    if (children[i].id === id) return { parent: root, index: i }
    const nested = findParent(children[i], id)
    if (nested) return nested
  }
  return null
}

/** True when node or any ancestor is locked. */
export function isNodeOrAncestorLocked(root: SceneNode, id: SceneNodeId): boolean {
  let current: SceneNodeId | null = id
  while (current) {
    const node = findNode(root, current)
    if (!node) return false
    if (node.locked) return true
    if (current === root.id) return false
    const parent = findParent(root, current)
    current = parent?.parent.id ?? null
  }
  return false
}

export function pathToNode(root: SceneNode, id: SceneNodeId): SceneNode[] | null {
  if (root.id === id) return [root]
  for (const child of root.children ?? []) {
    const path = pathToNode(child, id)
    if (path) return [root, ...path]
  }
  return null
}

export function hasAncestorType(root: SceneNode, nodeId: SceneNodeId, type: string): boolean {
  const path = pathToNode(root, nodeId)
  return path ? path.some((node) => node.type === type) : false
}

export function findSceneNode(
  scene: CompositionScene,
  id: SceneNodeId | null,
  root: SceneNode = scene.root,
): SceneNode | null {
  if (!id) return null
  return findNode(root, id)
}

/** Parent + sibling index for a node (null for root / missing). */
export function findSceneParent(
  scene: CompositionScene,
  id: SceneNodeId,
  root: SceneNode = scene.root,
): { parent: SceneNode; index: number } | null {
  if (id === root.id) return null
  return findParent(root, id)
}
