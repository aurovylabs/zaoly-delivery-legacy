import type { CompositionScene, SceneNode, SceneNodeId, ScenePage } from '@zaoly/contracts'
import { normalizePageFrame, prepareSceneBoardForPersist } from './scene-board'
import { hydrateAtomicSlots } from './slots'

/** Legacy single-page id synthesized on load when `pages` is missing (P80). */
export const DEFAULT_SCENE_PAGE_ID = 'page-default'

function findNodeInRoot(root: SceneNode, id: string): SceneNode | null {
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const hit = findNodeInRoot(child, id)
    if (hit) return hit
  }
  return null
}

/** Which page owns `nodeId` when `pages` is materialized; null if not found. */
export function findPageIdForNode(scene: CompositionScene, nodeId: string): string | null {
  const pages = scene.pages?.length
    ? scene.pages
    : [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: scene.root }]
  for (const page of pages) {
    if (findNodeInRoot(page.root, nodeId)) return page.id
  }
  return null
}

export function pageRootForPage(scene: CompositionScene, pageId: string): SceneNode | null {
  const pages = scene.pages?.length
    ? scene.pages
    : [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: scene.root }]
  return pages.find((p) => p.id === pageId)?.root ?? null
}

export function materializeScenePages(scene: CompositionScene): CompositionScene {
  if (scene.pages?.length) return scene
  return {
    ...scene,
    pages: [
      {
        id: DEFAULT_SCENE_PAGE_ID,
        name: 'Page 1',
        root: structuredClone(scene.root),
        frame: { x: 0, y: 0 },
      },
    ],
    activePageId: DEFAULT_SCENE_PAGE_ID,
  }
}

/** Before tree ops: ensure `root` matches the active page artboard (by reference — W8). */
export function alignActivePageRoot(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  const active = resolveActivePage(scene)
  return { ...scene, root: active.root, activePageId: active.id }
}

/**
 * After tree ops: write mutated `root` onto the active page entry.
 * Shallow page map — inactive page roots keep prior object identity (W8).
 * Callers must already own a fresh path (cloneScene or path-copy).
 */
export function persistActivePageRoot(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  const activePageId = resolveActivePageId(scene.pages, scene.activePageId)
  const pages = scene.pages.map((page) =>
    page.id === activePageId ? { ...page, root: scene.root } : page,
  )
  return { ...scene, pages, activePageId, root: scene.root }
}

export function rejectIfNotOnActivePage(
  scene: CompositionScene,
  nodeId: string,
): { ok: false; reason: string } | null {
  if (!scene.pages?.length) return null
  if (findNodeInRoot(scene.root, nodeId)) return null
  for (const page of scene.pages) {
    if (page.id === resolveActivePageId(scene.pages, scene.activePageId)) continue
    if (findNodeInRoot(page.root, nodeId)) {
      return { ok: false, reason: `Node belongs to inactive page: ${nodeId}` }
    }
  }
  return null
}

function normalizePageEntry(raw: unknown): ScenePage | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as Record<string, unknown>
  const rootRaw = p.root as SceneNode | undefined
  if (typeof p.id !== 'string' || !p.id || !rootRaw?.id || !rootRaw?.type) return null
  const name = typeof p.name === 'string' && p.name.trim() ? p.name.trim() : 'Page'
  const frame = normalizePageFrame(p.frame)
  return {
    id: p.id,
    name,
    root: hydrateAtomicSlots(rootRaw),
    ...(frame ? { frame } : {}),
  }
}

/** Parse `pages[]` from raw JSON or synthesize a single page from `sceneRoot`. */
export function normalizePagesFromRaw(
  rawPages: unknown,
  sceneRoot: SceneNode,
): ScenePage[] {
  if (!Array.isArray(rawPages) || !rawPages.length) {
    return [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: sceneRoot, frame: { x: 0, y: 0 } }]
  }
  const pages = rawPages
    .map(normalizePageEntry)
    .filter((p): p is ScenePage => Boolean(p))
  if (!pages.length) {
    return [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: sceneRoot, frame: { x: 0, y: 0 } }]
  }
  return pages
}

export function resolveActivePageId(pages: ScenePage[], activePageId: unknown): string {
  if (
    typeof activePageId === 'string' &&
    activePageId &&
    pages.some((p) => p.id === activePageId)
  ) {
    return activePageId
  }
  return pages[0]!.id
}

export function resolveActivePage(scene: CompositionScene): ScenePage {
  const pages = scene.pages?.length
    ? scene.pages
    : [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: scene.root }]
  const activeId = resolveActivePageId(pages, scene.activePageId)
  return pages.find((p) => p.id === activeId) ?? pages[0]!
}

export function activePageRoot(scene: CompositionScene): SceneNode {
  return resolveActivePage(scene).root
}

/** Dual-write `root` from the active page; validate `activePageId`. */
export function syncScenePagesRoot(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  const pages = structuredClone(scene.pages)
  const activePageId = resolveActivePageId(pages, scene.activePageId)
  const active = pages.find((p) => p.id === activePageId)
  if (!active) return scene
  return {
    ...scene,
    pages,
    activePageId,
    root: structuredClone(active.root),
  }
}

/**
 * W8e hot-path page commit: dual-write active root by reference (no deep clone).
 * Callers must already own a fresh pages array / mutated roots (path-copy or new trees).
 * Persist/import keep using `syncScenePagesRoot` for store isolation.
 */
export function commitScenePages(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  const activePageId = resolveActivePageId(scene.pages, scene.activePageId)
  const active = scene.pages.find((p) => p.id === activePageId)
  if (!active) return scene
  const pages = scene.pages.map((page) =>
    page.id === activePageId ? { ...page, root: active.root } : page,
  )
  return { ...scene, pages, activePageId, root: active.root }
}

/** Persist helper — keeps legacy root-only saves when `pages` is absent. */
export function prepareScenePagesForPersist(scene: CompositionScene): CompositionScene {
  if (!scene.pages?.length) return scene
  return syncScenePagesRoot(prepareSceneBoardForPersist(scene))
}

/** All node ids across page trees, legacy root, and master variant roots. */
export function collectSceneNodeIds(scene: CompositionScene): Set<SceneNodeId> {
  const ids = new Set<SceneNodeId>()
  const walk = (root: SceneNode) => {
    const stack: SceneNode[] = [root]
    while (stack.length) {
      const node = stack.pop()!
      ids.add(node.id)
      for (const child of node.children ?? []) stack.push(child)
    }
  }
  if (scene.pages?.length) {
    for (const page of scene.pages) walk(page.root)
  } else {
    walk(scene.root)
  }
  for (const master of scene.masters ?? []) {
    walk(master.root)
    for (const variant of master.variants ?? []) walk(variant.root)
  }
  return ids
}
