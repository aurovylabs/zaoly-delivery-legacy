/**
 * Resolve Kit Playground deep-link from editor ⌘E export target.
 * Spec: code-export-handoff.md · site-kit-playground.md
 */
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { kitPlaygroundHref } from '../paths'
import { EDITOR_TO_SITE_KIT_TYPE } from './coerce-editor-tree-to-site-kit'
import { atomForkComponentId } from './override-ids'
import { kitComponentIdForMaster } from './pull-merge'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'

export type KitExploreFromExport = {
  href: string
  componentId: string | null
}

function siteKitTypeForNode(node: SceneNode): string | null {
  if (isSiteKitInsertableType(node.type)) return node.type
  const mapped = EDITOR_TO_SITE_KIT_TYPE[node.type]
  if (mapped && isSiteKitInsertableType(mapped)) return mapped
  return null
}

/**
 * Prefer Instance → Master kit id; else Site Kit atom (Collection fork when bound).
 * Always includes `platformProjectId` when the scene has one.
 */
export function resolveKitExploreFromExport(
  scene: CompositionScene,
  targetNode: SceneNode,
): KitExploreFromExport {
  const platformProjectId = scene.platformProjectId?.trim() || null
  let componentId: string | null = null

  if (targetNode.type === 'Instance' && targetNode.instanceOf) {
    const master = scene.masters?.find((m) => m.id === targetNode.instanceOf)
    if (master) {
      componentId = kitComponentIdForMaster(master, platformProjectId)
    }
  }

  if (!componentId) {
    const atomType = siteKitTypeForNode(targetNode)
    if (atomType) {
      componentId = platformProjectId
        ? atomForkComponentId(atomType, platformProjectId)
        : atomType
    }
  }

  return {
    componentId,
    href: kitPlaygroundHref({
      componentId,
      platformProjectId,
    }),
  }
}
