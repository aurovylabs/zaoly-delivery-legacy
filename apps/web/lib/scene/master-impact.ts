import type {
  CompositionScene,
  MasterImpactReport,
  MasterInstanceRef,
  SceneInstanceOverrides,
  SceneNode,
} from '@zaoly/contracts'
import { isInstanceNode } from './expand-instances'

/**
 * Scan all pages and nodes of a CompositionScene to evaluate the blast radius
 * and usage metrics of a Master Component.
 */
export function analyzeMasterImpact(
  scene: CompositionScene,
  masterId: string,
): MasterImpactReport {
  const master = scene.masters?.find((m) => m.id === masterId)
  const masterName = master?.name ?? 'Unknown Master'

  const instances: MasterInstanceRef[] = []
  const pages =
    scene.pages && scene.pages.length > 0
      ? scene.pages
      : [{ id: 'page-default', name: scene.name || 'Default Page', root: scene.root }]

  for (const page of pages) {
    function traverse(node: SceneNode, parentNodeId?: string) {
      if (isInstanceNode(node) && node.instanceOf === masterId) {
        const overrides: SceneInstanceOverrides = node.instanceOverrides ?? {}
        const overrideKeys: string[] = []

        if (overrides.props && typeof overrides.props === 'object') {
          for (const k of Object.keys(overrides.props)) {
            overrideKeys.push(`props.${k}`)
          }
        }
        if (overrides.style && typeof overrides.style === 'object') {
          for (const k of Object.keys(overrides.style)) {
            overrideKeys.push(`style.${k}`)
          }
        }
        if (overrides.tokenBindings && typeof overrides.tokenBindings === 'object') {
          for (const k of Object.keys(overrides.tokenBindings)) {
            overrideKeys.push(`tokenBindings.${k}`)
          }
        }
        if (overrides.name !== undefined) {
          overrideKeys.push('name')
        }

        const hasOverrides = overrideKeys.length > 0

        instances.push({
          instanceNodeId: node.id,
          pageId: page.id,
          pageName: page.name,
          parentNodeId,
          variantId: node.instanceVariantId,
          hasOverrides,
          overrideKeys,
        })
      }

      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child, node.id)
        }
      }
    }

    if (page.root) {
      traverse(page.root)
    }
  }

  const uniquePages = new Set(instances.map((i) => i.pageId))

  return {
    masterId,
    masterName,
    totalInstances: instances.length,
    pageCount: uniquePages.size,
    instances,
  }
}
