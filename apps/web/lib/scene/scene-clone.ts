/**
 * Scene / node clone + path-copy helpers (W5a / W8).
 * Spec: specs/domain/scene-core-split-w5.md · specs/domain/scene-structural-sharing-w8.md
 *
 * Slow-path ops use cloneScene (structuredClone). Hot-path leaf ops use updateNodeById.
 */
import type { CompositionScene, SceneNode, SceneNodeId } from '@zaoly/contracts'
import { createSceneNodeId } from './scene-tree'
import { resolveActivePageId } from './scene-pages'

export function cloneScene(scene: CompositionScene): CompositionScene {
  return structuredClone(scene)
}

/** Shallow-copy a node; children / nested object refs are shared until overwritten. */
export function shallowCloneSceneNode(node: SceneNode): SceneNode {
  const next: SceneNode = { id: node.id, type: node.type }
  if (node.name != null) next.name = node.name
  if (node.props) next.props = node.props
  if (node.style) next.style = node.style
  if (node.tokenBindings) next.tokenBindings = node.tokenBindings
  if (node.dataBindings) next.dataBindings = node.dataBindings
  if (node.breakpoints) next.breakpoints = node.breakpoints
  if (node.states) next.states = node.states
  if (node.interactions) next.interactions = node.interactions
  if (node.hidden) next.hidden = true
  if (node.locked) next.locked = true
  if (node.instanceOf) next.instanceOf = node.instanceOf
  if (node.instanceVariantId) next.instanceVariantId = node.instanceVariantId
  if (node.instanceVariantAxes) next.instanceVariantAxes = node.instanceVariantAxes
  if (node.instanceOverrides) next.instanceOverrides = node.instanceOverrides
  if (node.children) next.children = node.children
  return next
}

/**
 * Path-copy update: ancestors are shallow-copied; untouched siblings keep identity.
 * `updater` receives a shallow-cloned target and may mutate it in place.
 */
export function updateNodeById(
  root: SceneNode,
  id: SceneNodeId,
  updater: (node: SceneNode) => void,
): SceneNode | null {
  if (root.id === id) {
    const copy = shallowCloneSceneNode(root)
    updater(copy)
    return copy
  }
  const children = root.children
  if (!children?.length) return null
  let hitIndex = -1
  let updatedChild: SceneNode | null = null
  for (let i = 0; i < children.length; i += 1) {
    const next = updateNodeById(children[i]!, id, updater)
    if (next) {
      hitIndex = i
      updatedChild = next
      break
    }
  }
  if (hitIndex < 0 || !updatedChild) return null
  const nextChildren = children.map((child, i) => (i === hitIndex ? updatedChild! : child))
  return { ...shallowCloneSceneNode(root), children: nextChildren }
}

/** Point scene.root / active page at `nextRoot`; inactive pages keep prior object identity. */
export function withUpdatedActiveRoot(
  scene: CompositionScene,
  nextRoot: SceneNode,
): CompositionScene {
  if (!scene.pages?.length) {
    return { ...scene, root: nextRoot }
  }
  const activePageId = resolveActivePageId(scene.pages, scene.activePageId)
  const pages = scene.pages.map((page) =>
    page.id === activePageId ? { ...page, root: nextRoot } : page,
  )
  return { ...scene, pages, activePageId, root: nextRoot }
}

export type MapParentChildrenResult =
  | { ok: true; root: SceneNode }
  | { ok: false; error: string }

/**
 * Path-copy to `parentId` and replace its children array via `map`.
 * Untouched sibling subtrees keep object identity (W8c).
 * Returns null from the recursive walk when `parentId` is absent in that subtree.
 */
function mapParentChildrenInner(
  root: SceneNode,
  parentId: SceneNodeId,
  map: (children: SceneNode[]) => SceneNode[] | { error: string },
): MapParentChildrenResult | null {
  if (root.id === parentId) {
    const mapped = map([...(root.children ?? [])])
    if (!Array.isArray(mapped)) return { ok: false, error: mapped.error }
    return { ok: true, root: { ...shallowCloneSceneNode(root), children: mapped } }
  }
  const children = root.children
  if (!children?.length) return null
  for (let i = 0; i < children.length; i += 1) {
    const result = mapParentChildrenInner(children[i]!, parentId, map)
    if (result === null) continue
    if (!result.ok) return result
    const nextChildren = children.map((child, idx) => (idx === i ? result.root : child))
    return {
      ok: true,
      root: { ...shallowCloneSceneNode(root), children: nextChildren },
    }
  }
  return null
}

export function mapParentChildren(
  root: SceneNode,
  parentId: SceneNodeId,
  map: (children: SceneNode[]) => SceneNode[] | { error: string },
): MapParentChildrenResult {
  const result = mapParentChildrenInner(root, parentId, map)
  if (result === null) return { ok: false, error: `Unknown parent: ${parentId}` }
  return result
}

/** Deep-clone a node tree with fresh ids (for duplicate / insert seeds). */
export function cloneSceneNodeWithNewIds(node: SceneNode): SceneNode {
  const next: SceneNode = {
    id: createSceneNodeId(node.type.toLowerCase()),
    type: node.type,
  }
  if (node.name != null) next.name = node.name
  if (node.props) next.props = { ...node.props }
  if (node.style) next.style = { ...node.style }
  if (node.tokenBindings) next.tokenBindings = { ...node.tokenBindings }
  if (node.breakpoints) next.breakpoints = structuredClone(node.breakpoints)
  if (node.hidden) next.hidden = true
  if (node.locked) next.locked = true
  if (node.instanceOf) next.instanceOf = node.instanceOf
  if (node.instanceVariantId) next.instanceVariantId = node.instanceVariantId
  if (node.instanceVariantAxes) next.instanceVariantAxes = { ...node.instanceVariantAxes }
  if (node.instanceOverrides) next.instanceOverrides = structuredClone(node.instanceOverrides)
  if (node.children?.length) {
    next.children = node.children.map(cloneSceneNodeWithNewIds)
  }
  return next
}

/**
 * Clone a tree with deterministic ids (`${prefix}-1`, `${prefix}-2`, …).
 * Used for palette Master seeds so SSR and client hydration match.
 */
export function cloneSceneNodeWithDeterministicIds(
  node: SceneNode,
  prefix: string,
): SceneNode {
  let seq = 0
  const walk = (n: SceneNode): SceneNode => {
    seq += 1
    const next: SceneNode = {
      id: `${prefix}-${seq}`,
      type: n.type,
    }
    if (n.name != null) next.name = n.name
    if (n.props) next.props = { ...n.props }
    if (n.style) next.style = { ...n.style }
    if (n.tokenBindings) next.tokenBindings = { ...n.tokenBindings }
    if (n.breakpoints) next.breakpoints = structuredClone(n.breakpoints)
    if (n.hidden) next.hidden = true
    if (n.locked) next.locked = true
    if (n.instanceOf) next.instanceOf = n.instanceOf
    if (n.instanceVariantId) next.instanceVariantId = n.instanceVariantId
    if (n.instanceVariantAxes) next.instanceVariantAxes = { ...n.instanceVariantAxes }
    if (n.instanceOverrides) next.instanceOverrides = structuredClone(n.instanceOverrides)
    if (n.children?.length) {
      next.children = n.children.map(walk)
    }
    return next
  }
  return walk(node)
}
