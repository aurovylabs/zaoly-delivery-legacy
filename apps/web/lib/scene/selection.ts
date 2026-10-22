/** Multi-select + marquee helpers for the CREATION editor (P19). */

import type { CompositionScene, SceneNode, SceneNodeId } from '@zaoly/contracts'

export type Bounds = { left: number; top: number; width: number; height: number }

export function primarySelectedId(selectedIds: SceneNodeId[]): SceneNodeId | null {
  if (!selectedIds.length) return null
  return selectedIds[selectedIds.length - 1] ?? null
}

/** Toggle id membership; primary becomes the toggled id when added. */
export function toggleSelectedId(
  selectedIds: SceneNodeId[],
  id: SceneNodeId,
): SceneNodeId[] {
  if (selectedIds.includes(id)) {
    const next = selectedIds.filter((x) => x !== id)
    return next.length ? next : [id]
  }
  return [...selectedIds.filter((x) => x !== id), id]
}

export function replaceSelection(id: SceneNodeId): SceneNodeId[] {
  return [id]
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return !(
    a.left + a.width < b.left ||
    b.left + b.width < a.left ||
    a.top + a.height < b.top ||
    b.top + b.height < a.top
  )
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (!list.length) return null
  let left = list[0].left
  let top = list[0].top
  let right = left + list[0].width
  let bottom = top + list[0].height
  for (let i = 1; i < list.length; i += 1) {
    const b = list[i]
    left = Math.min(left, b.left)
    top = Math.min(top, b.top)
    right = Math.max(right, b.left + b.width)
    bottom = Math.max(bottom, b.top + b.height)
  }
  return { left, top, width: right - left, height: bottom - top }
}

function walkVisible(node: SceneNode, out: SceneNode[]): void {
  if (node.hidden) return
  out.push(node)
  for (const child of node.children ?? []) walkVisible(child, out)
}

/** Visible (non-hidden) nodes for hit-testing / marquee. */
export function listVisibleNodes(
  scene: CompositionScene,
  root: SceneNode = scene.root,
): SceneNode[] {
  const out: SceneNode[] = []
  walkVisible(root, out)
  return out
}

export function normalizeMarquee(a: Bounds, b: { x: number; y: number }): Bounds {
  const left = Math.min(a.left, b.x)
  const top = Math.min(a.top, b.y)
  const right = Math.max(a.left + a.width, b.x)
  const bottom = Math.max(a.top + a.height, b.y)
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

/**
 * Select visible non-root nodes whose measured bounds intersect the marquee.
 * `measure(id)` returns viewport-relative bounds or null.
 */
export function selectIdsInMarquee(
  scene: CompositionScene,
  marquee: Bounds,
  measure: (id: SceneNodeId) => Bounds | null,
  root: SceneNode = scene.root,
): SceneNodeId[] {
  const hits: SceneNodeId[] = []
  for (const node of listVisibleNodes(scene, root)) {
    if (node.id === root.id) continue
    const bounds = measure(node.id)
    if (!bounds) continue
    if (boundsIntersect(marquee, bounds)) hits.push(node.id)
  }
  return hits
}
