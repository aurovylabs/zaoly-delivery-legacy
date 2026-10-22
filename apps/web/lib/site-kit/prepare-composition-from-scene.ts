/**
 * Agent path: resolve Master + expand Instances → validated Site Kit composition payload.
 * Spec: scene-agent-editing.md · site-kit-compositions.md
 */
import type { CompositionScene, SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import { isInstanceNode } from '../scene/expand-instances'
import { resolveMasterDefinitionRoot } from '../scene/master-variants'
import { materializeScenePages } from '../scene/scene-pages'
import {
  prepareSiteKitCompositionSavePayload,
  type SiteKitSavePreparedPayload,
  type SiteKitSaveValidationError,
} from './save-composition-root'

export type PrepareCompositionFromSceneInput = {
  scene: CompositionScene
  masterId: string
  name: string
  instanceNodeId?: string
  breakpoint?: SceneBreakpointId
}

function findInstanceForMaster(
  scene: CompositionScene,
  masterId: string,
  instanceNodeId?: string,
): SceneNode | null {
  const pages = materializeScenePages(scene).pages ?? []
  for (const page of pages) {
    const walk = (node: SceneNode): SceneNode | null => {
      if (isInstanceNode(node) && node.instanceOf === masterId) {
        if (!instanceNodeId || node.id === instanceNodeId) return node
      }
      for (const child of node.children ?? []) {
        const hit = walk(child)
        if (hit) return hit
      }
      return null
    }
    const found = walk(page.root)
    if (found) return found
  }
  return null
}

export function prepareCompositionFromScene(
  input: PrepareCompositionFromSceneInput,
): SiteKitSavePreparedPayload | SiteKitSaveValidationError {
  const master = input.scene.masters?.find((m) => m.id === input.masterId)
  if (!master) {
    return { ok: false, code: 'missing-master', error: `Missing master: ${input.masterId}` }
  }

  const instance = findInstanceForMaster(
    input.scene,
    input.masterId,
    input.instanceNodeId,
  )
  if (!instance) {
    return {
      ok: false,
      code: 'missing-instance',
      error: `No Instance of master ${input.masterId} in scene`,
    }
  }

  return prepareSiteKitCompositionSavePayload({
    name: input.name,
    selected: resolveMasterDefinitionRoot(master),
    persisted: instance,
    masters: input.scene.masters,
    breakpoint: input.breakpoint ?? input.scene.activeBreakpoint,
  })
}
