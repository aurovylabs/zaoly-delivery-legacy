/**
 * LRU cache for Instance expand paint paths — `specs/domain/editor-performance.md` P97.
 */
import type { CompositionScene, SceneMaster, SceneNode, SceneNodeId } from '@zaoly/contracts'
import { activePageRoot } from './scene-pages'
import { findNodeInTree, isInstanceNode } from './expand-instances'
import {
  expandBreakpointBoardForPaint,
  expandCompositionScene,
  expandInstanceNode,
  expandMasterVariantBoardForPaint,
  expandSceneBoardForPaint,
  expandSceneTree,
} from './expand-instances'

export const EXPAND_CACHE_MAX_ENTRIES = 16

type ExpandCacheStore = {
  order: string[]
  entries: Map<string, SceneNode>
}

const store: ExpandCacheStore = {
  order: [],
  entries: new Map(),
}

function cloneCached(node: SceneNode): SceneNode {
  return structuredClone(node)
}

function cacheGet(key: string): SceneNode | undefined {
  const hit = store.entries.get(key)
  if (!hit) return undefined
  store.order = store.order.filter((k) => k !== key)
  store.order.push(key)
  return cloneCached(hit)
}

function cacheSet(key: string, value: SceneNode): void {
  if (store.entries.has(key)) {
    store.order = store.order.filter((k) => k !== key)
  } else if (store.order.length >= EXPAND_CACHE_MAX_ENTRIES) {
    const evict = store.order.shift()
    if (evict) store.entries.delete(evict)
  }
  store.entries.set(key, structuredClone(value))
  store.order.push(key)
}

/** Test / hot-reload reset. */
export function clearSceneExpandCache(): void {
  store.order = []
  store.entries.clear()
}

export function cachedExpandSceneTree(
  root: SceneNode,
  masters: SceneMaster[] | undefined,
  docFingerprint: string,
): SceneNode {
  const key = `tree:${docFingerprint}:${root.id}`
  const hit = cacheGet(key)
  if (hit) return hit
  const expanded = expandSceneTree(root, masters)
  cacheSet(key, expanded)
  return cloneCached(expanded)
}

export function cachedExpandCompositionScene(scene: CompositionScene, docFingerprint: string): SceneNode {
  const key = `composition:${docFingerprint}`
  const hit = cacheGet(key)
  if (hit) return hit
  const expanded = expandCompositionScene(scene)
  cacheSet(key, expanded)
  return cloneCached(expanded)
}

export function cachedExpandSceneBoardForPaint(
  board: SceneNode,
  masters: SceneMaster[] | undefined,
  docFingerprint: string,
): SceneNode {
  const key = `board:${docFingerprint}:${board.id}`
  const hit = cacheGet(key)
  if (hit) return hit
  const expanded = expandSceneBoardForPaint(board, masters)
  cacheSet(key, expanded)
  return cloneCached(expanded)
}

/**
 * Expand Master-Edit board for paint.
 * `paintKey` MUST change when the active variant / axis filters change — those are
 * UI-only and do not bump `docFingerprint`, otherwise the LRU returns a stale
 * active/inactive chrome (click another variant → highlight stuck).
 */
export function cachedExpandMasterVariantBoardForPaint(
  board: SceneNode,
  masters: SceneMaster[] | undefined,
  docFingerprint: string,
  paintKey = '',
): SceneNode {
  const key = `master-board:${docFingerprint}:${board.id}:${paintKey}`
  const hit = cacheGet(key)
  if (hit) return hit
  const expanded = expandMasterVariantBoardForPaint(board, masters)
  cacheSet(key, expanded)
  return cloneCached(expanded)
}

/** Expand breakpoint compare board. `paintKey` must include activeBreakpoint (UI-only). */
export function cachedExpandBreakpointBoardForPaint(
  board: SceneNode,
  masters: SceneMaster[] | undefined,
  docFingerprint: string,
  paintKey = '',
): SceneNode {
  const key = `bp-board:${docFingerprint}:${board.id}:${paintKey}`
  const hit = cacheGet(key)
  if (hit) return hit
  const expanded = expandBreakpointBoardForPaint(board, masters)
  cacheSet(key, expanded)
  return cloneCached(expanded)
}

export function cachedExpandInstanceNode(
  instance: SceneNode,
  masters: SceneMaster[] | undefined,
  docFingerprint: string,
): SceneNode {
  const key = `instance:${docFingerprint}:${instance.id}`
  const hit = cacheGet(key)
  if (hit) return hit
  const expanded = expandInstanceNode(instance, masters)
  cacheSet(key, expanded)
  return cloneCached(expanded)
}

export function resolveCachedInspectSubject(
  scene: CompositionScene,
  nodeId: SceneNodeId | null,
  docFingerprint: string,
): SceneNode | null {
  if (!nodeId) return null
  const persisted = findNodeInTree(activePageRoot(scene), nodeId)
  if (persisted) {
    if (isInstanceNode(persisted)) {
      return cachedExpandInstanceNode(persisted, scene.masters, docFingerprint)
    }
    return persisted
  }
  return findNodeInTree(cachedExpandCompositionScene(scene, docFingerprint), nodeId)
}

/** @internal test helper */
export function expandCacheSize(): number {
  return store.entries.size
}

/** @internal test helper */
export function expandCacheHas(keyPrefix: string): boolean {
  return [...store.entries.keys()].some((k) => k.startsWith(keyPrefix))
}
