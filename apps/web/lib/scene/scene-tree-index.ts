import type { CompositionScene, SceneBreakpointId, SceneNode, SceneNodeId } from '@zaoly/contracts'
import { activePageRoot, materializeScenePages, resolveActivePageId } from './scene-pages'

export type SceneTreeIndexNode = {
  id: string
  type: string
  name?: string
  parentId: string | null
  index: number
  instanceOf?: string
  instanceVariantId?: string
  instanceVariantAxes?: Record<string, string>
  hidden?: boolean
  locked?: boolean
  childCount: number
}

export type SceneTreeIndex = {
  sceneId: string
  updatedAt: string
  activePageId: string | null
  activeBreakpoint: SceneBreakpointId | null
  platformProjectId: string | null
  nodeCount: number
  masterCount: number
  pageCount: number
  nodes: SceneTreeIndexNode[]
  masters: Array<{ id: string; name: string; sourceKey?: string; variantCount: number }>
  pages: Array<{ id: string; name: string }>
}

function walkTree(
  node: SceneNode,
  parentId: string | null,
  index: number,
  out: SceneTreeIndexNode[],
): void {
  const children = node.children ?? []
  out.push({
    id: node.id,
    type: node.type,
    ...(node.name ? { name: node.name } : {}),
    parentId,
    index: parentId == null ? 0 : index,
    ...(node.instanceOf ? { instanceOf: node.instanceOf } : {}),
    ...(node.instanceVariantId ? { instanceVariantId: node.instanceVariantId } : {}),
    ...(node.instanceVariantAxes
      ? { instanceVariantAxes: { ...node.instanceVariantAxes } }
      : {}),
    ...(node.hidden ? { hidden: true } : {}),
    ...(node.locked ? { locked: true } : {}),
    childCount: children.length,
  })
  children.forEach((child, childIndex) => {
    walkTree(child, node.id, childIndex, out)
  })
}

export function buildSceneTreeIndex(scene: CompositionScene): SceneTreeIndex {
  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const activePageId = pages.length
    ? resolveActivePageId(pages, materialized.activePageId)
    : null
  const root = activePageRoot(materialized)

  const nodes: SceneTreeIndexNode[] = []
  walkTree(root, null, 0, nodes)

  const masters = (scene.masters ?? []).map((master) => ({
    id: master.id,
    name: master.name,
    ...(master.sourceKey ? { sourceKey: master.sourceKey } : {}),
    variantCount: master.variants?.length ?? 0,
  }))

  const pageRows = pages.length
    ? pages.map((page) => ({ id: page.id, name: page.name }))
    : [{ id: 'page-default', name: 'Page 1' }]

  return {
    sceneId: scene.id,
    updatedAt: scene.updatedAt,
    activePageId,
    activeBreakpoint: scene.activeBreakpoint ?? null,
    platformProjectId: scene.platformProjectId ?? null,
    nodeCount: nodes.length,
    masterCount: masters.length,
    pageCount: pageRows.length,
    nodes,
    masters,
    pages: pageRows,
  }
}

/** All node ids under the active page root (for tests). */
export function activePageNodeIds(scene: CompositionScene): Set<SceneNodeId> {
  const root = activePageRoot(materializeScenePages(scene))
  const ids = new Set<SceneNodeId>()
  const walk = (node: SceneNode) => {
    ids.add(node.id)
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return ids
}
