import type {
  CompositionScene,
  PageDiffSummary,
  PropertyDiff,
  SceneDiffResult,
  SceneNode,
  SceneNodeDiff,
} from '@zaoly/contracts'

function flattenNodeMap(root: SceneNode): Map<string, SceneNode> {
  const map = new Map<string, SceneNode>()
  function traverse(node: SceneNode) {
    map.set(node.id, node)
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }
  traverse(root)
  return map
}

function compareObjects(
  baseObj: Record<string, unknown> | undefined,
  targetObj: Record<string, unknown> | undefined,
  kind: 'prop' | 'style' | 'tokenBinding'
): PropertyDiff[] {
  const diffs: PropertyDiff[] = []
  const baseKeys = Object.keys(baseObj ?? {})
  const targetKeys = Object.keys(targetObj ?? {})
  const allKeys = new Set([...baseKeys, ...targetKeys])

  for (const key of allKeys) {
    const oldVal = baseObj ? baseObj[key] : undefined
    const newVal = targetObj ? targetObj[key] : undefined

    const oldStr = JSON.stringify(oldVal)
    const newStr = JSON.stringify(newVal)

    if (oldStr !== newStr) {
      diffs.push({
        key,
        kind,
        oldValue: oldVal,
        newValue: newVal,
      })
    }
  }

  return diffs
}

/**
 * Compare two AST nodes with the same ID to detect mutated properties, styles, and token bindings.
 */
export function diffNodePair(baseNode: SceneNode, targetNode: SceneNode): SceneNodeDiff {
  const propertyDiffs: PropertyDiff[] = []

  if (baseNode.type !== targetNode.type) {
    propertyDiffs.push({
      key: 'type',
      kind: 'prop',
      oldValue: baseNode.type,
      newValue: targetNode.type,
    })
  }

  if (baseNode.name !== targetNode.name) {
    propertyDiffs.push({
      key: 'name',
      kind: 'prop',
      oldValue: baseNode.name,
      newValue: targetNode.name,
    })
  }

  propertyDiffs.push(...compareObjects(baseNode.props, targetNode.props, 'prop'))
  propertyDiffs.push(...compareObjects(baseNode.style, targetNode.style, 'style'))
  propertyDiffs.push(...compareObjects(baseNode.tokenBindings, targetNode.tokenBindings, 'tokenBinding'))

  const isModified = propertyDiffs.length > 0

  return {
    nodeId: targetNode.id,
    type: targetNode.type,
    name: targetNode.name ?? baseNode.name,
    kind: isModified ? 'modified' : 'unchanged',
    propertyDiffs,
  }
}

function getEffectivePages(scene: CompositionScene) {
  if (scene.pages && scene.pages.length > 0) {
    return scene.pages
  }
  return [{ id: 'page-default', name: scene.name || 'Default Page', root: scene.root }]
}

/**
 * Compare two versions of a CompositionScene and produce a structured diff report.
 */
export function compareScenes(baseScene: CompositionScene, targetScene: CompositionScene): SceneDiffResult {
  const basePages = getEffectivePages(baseScene)
  const targetPages = getEffectivePages(targetScene)

  const basePageMap = new Map(basePages.map((p) => [p.id, p]))
  const targetPageMap = new Map(targetPages.map((p) => [p.id, p]))

  const allPageIds = new Set([...basePageMap.keys(), ...targetPageMap.keys()])
  const pages: PageDiffSummary[] = []

  let totalAdded = 0
  let totalRemoved = 0
  let totalModified = 0

  for (const pageId of allPageIds) {
    const basePage = basePageMap.get(pageId)
    const targetPage = targetPageMap.get(pageId)

    const nodeDiffs: SceneNodeDiff[] = []
    let addedCount = 0
    let removedCount = 0
    let modifiedCount = 0

    if (!basePage && targetPage) {
      // Entire page was added
      const targetNodes = flattenNodeMap(targetPage.root)
      for (const node of targetNodes.values()) {
        addedCount++
        nodeDiffs.push({
          nodeId: node.id,
          type: node.type,
          name: node.name,
          kind: 'added',
          propertyDiffs: [],
        })
      }
    } else if (basePage && !targetPage) {
      // Entire page was removed
      const baseNodes = flattenNodeMap(basePage.root)
      for (const node of baseNodes.values()) {
        removedCount++
        nodeDiffs.push({
          nodeId: node.id,
          type: node.type,
          name: node.name,
          kind: 'removed',
          propertyDiffs: [],
        })
      }
    } else if (basePage && targetPage) {
      const baseNodes = flattenNodeMap(basePage.root)
      const targetNodes = flattenNodeMap(targetPage.root)

      // Check added and modified nodes
      for (const [targetId, targetNode] of targetNodes.entries()) {
        const baseNode = baseNodes.get(targetId)
        if (!baseNode) {
          addedCount++
          nodeDiffs.push({
            nodeId: targetNode.id,
            type: targetNode.type,
            name: targetNode.name,
            kind: 'added',
            propertyDiffs: [],
          })
        } else {
          const diff = diffNodePair(baseNode, targetNode)
          if (diff.kind === 'modified') {
            modifiedCount++
            nodeDiffs.push(diff)
          }
        }
      }

      // Check removed nodes
      for (const [baseId, baseNode] of baseNodes.entries()) {
        if (!targetNodes.has(baseId)) {
          removedCount++
          nodeDiffs.push({
            nodeId: baseNode.id,
            type: baseNode.type,
            name: baseNode.name,
            kind: 'removed',
            propertyDiffs: [],
          })
        }
      }
    }

    totalAdded += addedCount
    totalRemoved += removedCount
    totalModified += modifiedCount

    pages.push({
      pageId,
      pageName: targetPage?.name ?? basePage?.name ?? 'Unknown Page',
      addedCount,
      removedCount,
      modifiedCount,
      nodeDiffs,
    })
  }

  return {
    baseSceneId: baseScene.id,
    targetSceneId: targetScene.id,
    totalAdded,
    totalRemoved,
    totalModified,
    pages,
  }
}
