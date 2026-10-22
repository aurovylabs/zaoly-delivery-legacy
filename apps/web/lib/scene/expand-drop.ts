/**
 * Expand-aware canvas drops for section Instances (page mode).
 * Spec: composition-masters.md · brand-token-consume.md CT-19
 */
import type { CompositionScene, SceneNode, SceneNodeId } from '@zaoly/contracts'
import {
  expandInstanceNode,
  expandSceneTree,
  findMaster,
  findNodeInTree,
  isInstanceNode,
} from './expand-instances'
import {
  INSTANCE_EXPAND_SEP,
  isExpandSelectionId,
  persistLockNodeId,
  resolveDescendantWriteTarget,
} from './instance-descendants'
import {
  masterEditAllowsPaletteInsert,
  resolveMasterVariantForInstance,
} from './master-variants'
import {
  isSceneContainerType,
  planPaletteDrop,
  type InsertPlan,
  type PaletteDropEdge,
} from './scene-drop-plan'
import { findNode, isNodeOrAncestorLocked } from './scene-tree'

export type TokenDropTarget = {
  /** Id to pass to set_token_binding / set_prop (expand id or persisted id). */
  nodeId: SceneNodeId
  /** Painted type for planTokenDrop. */
  nodeType: string
}

/**
 * Resolve a canvas drop hotspot to a bindable painted node.
 * Handles free nodes, Instance shells, and expand ids (`host::defPath`).
 */
export function resolveTokenDropTarget(
  scene: CompositionScene,
  persistedRoot: SceneNode,
  targetId: SceneNodeId,
): TokenDropTarget | null {
  const lockId = persistLockNodeId(persistedRoot, targetId)
  if (isNodeOrAncestorLocked(persistedRoot, lockId)) return null

  const direct = findNodeInTree(persistedRoot, targetId)
  if (direct) {
    if (isInstanceNode(direct)) {
      const painted = expandInstanceNode(direct, scene.masters)
      return { nodeId: targetId, nodeType: painted.type }
    }
    return { nodeId: targetId, nodeType: direct.type }
  }

  const nested = resolveDescendantWriteTarget(persistedRoot, targetId)
  if (!nested) return null
  const paintedTree = expandSceneTree(nested.host, scene.masters)
  const painted = findNodeInTree(paintedTree, targetId)
  if (!painted) return null
  return { nodeId: targetId, nodeType: painted.type }
}

export type ExpandAwarePaletteDropPlan =
  | { ok: true; mode: 'page'; parentId: SceneNodeId; index: number }
  | {
      ok: true
      mode: 'master'
      masterId: string
      variantId: string | undefined
      parentId: SceneNodeId
      index: number
    }
  | { ok: false; reason: string }

function pagePlanToExpandAware(plan: InsertPlan): ExpandAwarePaletteDropPlan {
  if (!plan.ok) return plan
  return { ok: true, mode: 'page', parentId: plan.parentId, index: plan.index }
}

/**
 * When `into` targets a Composition Instance inside a Master definition,
 * route into that nested Master's working root.
 */
function routeIntoCompositionInstance(
  scene: CompositionScene,
  instance: SceneNode,
): ExpandAwarePaletteDropPlan | null {
  if (!isInstanceNode(instance)) return null
  const master = findMaster(scene.masters, instance.instanceOf!)
  if (!master || !masterEditAllowsPaletteInsert(master)) return null
  const resolved = resolveMasterVariantForInstance(master, instance)
  return {
    ok: true,
    mode: 'master',
    masterId: master.id,
    variantId: resolved.id,
    parentId: resolved.root.id,
    index: resolved.root.children?.length ?? 0,
  }
}

/**
 * Plan palette insert for page mode: free tree first, else Master-routed
 * hydrate for Composition section Instances (and nested composition shells).
 */
export function planExpandAwarePaletteDrop(
  scene: CompositionScene,
  targetId: SceneNodeId,
  edge: PaletteDropEdge,
  root: SceneNode,
): ExpandAwarePaletteDropPlan {
  const pagePlan = planPaletteDrop(scene, targetId, edge, root)

  // Persisted Instance shell + into → Composition Master root.
  if (edge === 'into') {
    const shell = findNode(root, targetId)
    if (shell && isInstanceNode(shell)) {
      const routed = routeIntoCompositionInstance(scene, shell)
      if (routed) return routed
      return {
        ok: false,
        reason: 'Cannot insert into Instance — edit the Master or Detach',
      }
    }
  }

  if (pagePlan.ok) return pagePlanToExpandAware(pagePlan)

  if (!isExpandSelectionId(targetId)) {
    return pagePlan.ok === false ? pagePlan : { ok: false, reason: `Unknown node: ${targetId}` }
  }

  const nested = resolveDescendantWriteTarget(root, targetId)
  if (!nested || !isInstanceNode(nested.host)) {
    return { ok: false, reason: `Unknown node: ${targetId}` }
  }

  const host = nested.host
  const hostMaster = findMaster(scene.masters, host.instanceOf!)
  if (!hostMaster || !masterEditAllowsPaletteInsert(hostMaster)) {
    return {
      ok: false,
      reason: 'Cannot insert into Instance — edit the Master or Detach',
    }
  }

  const hostResolved = resolveMasterVariantForInstance(hostMaster, host)
  const workingRoot = hostResolved.root
  const suffix = nested.suffix

  // Nested expand under a nested Instance: first segment is Instance def id in host Master.
  if (suffix.includes(INSTANCE_EXPAND_SEP)) {
    const first = suffix.split(INSTANCE_EXPAND_SEP)[0]!
    const nestedInst = findNode(workingRoot, first)
    if (nestedInst && isInstanceNode(nestedInst) && edge === 'into') {
      const routed = routeIntoCompositionInstance(scene, nestedInst)
      if (routed) return routed
    }
    // Structure inside nested atom / sealed Instance — not page-writable.
    return {
      ok: false,
      reason: 'Cannot insert into Instance — edit the Master or Detach',
    }
  }

  // Direct definition descendant of the section Master.
  const defTargetId = suffix
  const defTarget = findNode(workingRoot, defTargetId)
  if (!defTarget) return { ok: false, reason: `Unknown node: ${targetId}` }

  if (edge === 'into' && isInstanceNode(defTarget)) {
    const routed = routeIntoCompositionInstance(scene, defTarget)
    if (routed) return routed
    return {
      ok: false,
      reason: 'Cannot insert into Instance — edit the Master or Detach',
    }
  }

  if (edge === 'into' && !isSceneContainerType(defTarget.type)) {
    return { ok: false, reason: 'Drop target does not accept children' }
  }

  const defPlan = planPaletteDrop(scene, defTargetId, edge, workingRoot)
  if (!defPlan.ok) return defPlan

  return {
    ok: true,
    mode: 'master',
    masterId: hostMaster.id,
    variantId: hostResolved.id,
    parentId: defPlan.parentId,
    index: defPlan.index,
  }
}
