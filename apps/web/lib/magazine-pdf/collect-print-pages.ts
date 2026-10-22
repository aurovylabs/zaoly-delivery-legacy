import type { SceneNode } from '@zaoly/contracts'
import { isPrintModuleType, isPrintSceneType } from './print-types'

/**
 * Collect PrintPage nodes in document order.
 * Orphan Print* modules (no PrintPage ancestor in the walk) are wrapped once
 * into a synthetic PrintPage (P38 auto-wrap parity).
 */
export function collectPrintPages(root: SceneNode): SceneNode[] {
  const pages: SceneNode[] = []
  const orphans: SceneNode[] = []

  function walk(node: SceneNode, underPrintPage: boolean): void {
    if (node.hidden) return
    if (node.type === 'PrintPage') {
      pages.push(node)
      for (const child of node.children ?? []) walk(child, true)
      return
    }
    if (!underPrintPage && isPrintModuleType(node.type)) {
      orphans.push(node)
      return
    }
    for (const child of node.children ?? []) walk(child, underPrintPage)
  }

  walk(root, false)

  if (orphans.length) {
    pages.push({
      id: `__synthetic_print_page__${root.id}`,
      type: 'PrintPage',
      children: orphans,
    })
  }

  return pages
}

export function hasPrintableContent(root: SceneNode): boolean {
  return collectPrintPages(root).length > 0
}

export function sceneHasAnyPrintNode(node: SceneNode): boolean {
  if (isPrintSceneType(node.type)) return true
  return (node.children ?? []).some(sceneHasAnyPrintNode)
}
