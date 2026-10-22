/**
 * Nested Instance overrides — canvas edits on expanded descendants.
 * Spec: `specs/domain/composition-masters.md`
 */
import type { SceneInstanceOverrides, SceneNode, SceneNodeId } from '@zaoly/contracts'
import { findNode } from './scene-tree'

export const INSTANCE_EXPAND_SEP = '::'

function isPersistedInstance(node: SceneNode): boolean {
  return node.type === 'Instance' && typeof node.instanceOf === 'string' && !!node.instanceOf
}

export type DescendantWriteTarget = {
  host: SceneNode
  suffix: string
}

export function isExpandSelectionId(id: string): boolean {
  return id.includes(INSTANCE_EXPAND_SEP)
}

/** Longest persisted Instance prefix + remaining definition path. */
export function resolveDescendantWriteTarget(
  persistedRoot: SceneNode,
  nodeId: SceneNodeId,
): DescendantWriteTarget | null {
  if (!isExpandSelectionId(nodeId)) return null
  const parts = nodeId.split(INSTANCE_EXPAND_SEP)
  for (let i = 1; i < parts.length; i += 1) {
    const prefix = parts.slice(0, i).join(INSTANCE_EXPAND_SEP)
    const host = findNode(persistedRoot, prefix)
    if (host && isPersistedInstance(host)) {
      return { host, suffix: parts.slice(i).join(INSTANCE_EXPAND_SEP) }
    }
  }
  return null
}

export function persistLockNodeId(root: SceneNode, nodeId: SceneNodeId): SceneNodeId {
  const nested = resolveDescendantWriteTarget(root, nodeId)
  return nested?.host.id ?? nodeId
}

function mergeOverrideBags(
  base: SceneInstanceOverrides | undefined,
  patch: SceneInstanceOverrides,
): SceneInstanceOverrides {
  const next: SceneInstanceOverrides = { ...(base ?? {}) }
  if (patch.name !== undefined) next.name = patch.name
  if (patch.hidden !== undefined) next.hidden = patch.hidden
  if (patch.locked !== undefined) next.locked = patch.locked
  if (patch.instanceVariantId !== undefined) next.instanceVariantId = patch.instanceVariantId
  if (patch.instanceVariantAxes !== undefined) {
    next.instanceVariantAxes = { ...patch.instanceVariantAxes }
  }
  if (patch.props) next.props = { ...(next.props ?? {}), ...patch.props }
  if (patch.tokenBindings) {
    next.tokenBindings = { ...(next.tokenBindings ?? {}), ...patch.tokenBindings }
  }
  if (patch.dataBindings) {
    next.dataBindings = { ...(next.dataBindings ?? {}), ...patch.dataBindings }
  }
  if (patch.style) next.style = { ...(next.style ?? {}), ...patch.style }
  if (patch.descendants) {
    next.descendants = { ...(next.descendants ?? {}), ...patch.descendants }
  }
  return next
}

/**
 * Stamp nested Instance variant picks from host `descendants` onto the expand
 * subtree **before** recursive expand (variant roots must resolve at expand time).
 * Walks the full subtree — Kit patterns nest Instances under Stack/Frame, not only
 * as direct children of the host root.
 */
export function stampDescendantInstanceVariantPicks(
  node: SceneNode,
  hostId: SceneNodeId,
  descendants?: Record<string, SceneInstanceOverrides> | null,
): SceneNode {
  if (!descendants) return node
  let next = node
  if (isPersistedInstance(node)) {
    const prefix = `${hostId}${INSTANCE_EXPAND_SEP}`
    if (node.id.startsWith(prefix)) {
      const suffix = node.id.slice(prefix.length)
      const ov = descendants[suffix]
      if (ov && (ov.instanceVariantId !== undefined || ov.instanceVariantAxes !== undefined)) {
        next = { ...node }
        if (ov.instanceVariantId !== undefined) next.instanceVariantId = ov.instanceVariantId
        if (ov.instanceVariantAxes !== undefined) {
          next.instanceVariantAxes = { ...ov.instanceVariantAxes }
        }
      }
    }
  }
  if (!next.children?.length) return next
  let changed = next !== node
  const children = next.children.map((child) => {
    const stamped = stampDescendantInstanceVariantPicks(child, hostId, descendants)
    if (stamped !== child) changed = true
    return stamped
  })
  return changed ? { ...next, children } : next
}

export function writeDescendantOverride(
  host: SceneNode,
  suffix: string,
  patch: SceneInstanceOverrides,
): void {
  const ov = { ...(host.instanceOverrides ?? {}) }
  const current = ov.descendants?.[suffix]
  const merged = mergeOverrideBags(current, patch)
  ov.descendants = { ...(ov.descendants ?? {}), [suffix]: merged }
  host.instanceOverrides = ov
}

/** Fold page-level descendants onto nested Instance refs before detach clone. */
export function bakeDescendantsIntoDefinition(
  definition: SceneNode,
  descendants?: Record<string, SceneInstanceOverrides> | null,
): SceneNode {
  if (!descendants || Object.keys(descendants).length === 0) return definition
  let next = definition
  for (const [suffix, ov] of Object.entries(descendants)) {
    const sep = suffix.indexOf(INSTANCE_EXPAND_SEP)
    if (sep < 0) {
      next = patchNodeById(next, suffix, (node) => {
        if (isPersistedInstance(node)) {
          const merged = mergeOverrideBags(node.instanceOverrides, ov)
          return { ...node, instanceOverrides: merged }
        }
        return mergeOverridesOntoNode(node, ov)
      })
      continue
    }
    const first = suffix.slice(0, sep)
    const rest = suffix.slice(sep + INSTANCE_EXPAND_SEP.length)
    next = patchNodeById(next, first, (node) => {
      const clone = { ...node }
      writeDescendantOverride(clone, rest, ov)
      return clone
    })
  }
  return next
}

export function mergeOverridesOntoNode(
  base: SceneNode,
  overrides?: SceneInstanceOverrides,
): SceneNode {
  if (!overrides) return base
  const next: SceneNode = { ...base }
  if (overrides.name !== undefined) next.name = overrides.name
  if (overrides.hidden !== undefined) {
    if (overrides.hidden) next.hidden = true
    else delete next.hidden
  }
  if (overrides.locked !== undefined) {
    if (overrides.locked) next.locked = true
    else delete next.locked
  }
  if (overrides.instanceVariantId !== undefined) {
    next.instanceVariantId = overrides.instanceVariantId
  }
  if (overrides.instanceVariantAxes !== undefined) {
    next.instanceVariantAxes = { ...overrides.instanceVariantAxes }
  }
  if (overrides.props) next.props = { ...(base.props ?? {}), ...overrides.props }
  if (overrides.tokenBindings) {
    next.tokenBindings = { ...(base.tokenBindings ?? {}), ...overrides.tokenBindings }
  }
  if (overrides.dataBindings) {
    next.dataBindings = { ...(base.dataBindings ?? {}), ...overrides.dataBindings }
  }
  if (overrides.style) next.style = { ...(base.style ?? {}), ...overrides.style }
  if (overrides.descendants) {
    const nested = {
      ...(base.instanceOverrides?.descendants ?? {}),
      ...overrides.descendants,
    }
    next.instanceOverrides = { ...(base.instanceOverrides ?? {}), descendants: nested }
  }
  return next
}

/** After expand, overlay host `descendants` onto `{hostId}::{suffix}` nodes. */
export function applyDescendantOverridesToExpanded(
  expanded: SceneNode,
  hostId: SceneNodeId,
  descendants?: Record<string, SceneInstanceOverrides> | null,
): SceneNode {
  if (!descendants || Object.keys(descendants).length === 0) return expanded
  let next = expanded
  for (const [suffix, ov] of Object.entries(descendants)) {
    const id = `${hostId}${INSTANCE_EXPAND_SEP}${suffix}`
    next = patchNodeById(next, id, (node) => mergeOverridesOntoNode(node, ov))
  }
  return next
}

function patchNodeById(
  root: SceneNode,
  id: SceneNodeId,
  patch: (node: SceneNode) => SceneNode,
): SceneNode {
  if (root.id === id) return patch(root)
  if (!root.children?.length) return root
  let changed = false
  const children = root.children.map((child) => {
    const next = patchNodeById(child, id, patch)
    if (next !== child) changed = true
    return next
  })
  return changed ? { ...root, children } : root
}

/** Synthetic Instance so `mutateHotPathNode` writes `instanceOverrides` for a descendant. */
export function descendantOverrideBag(
  host: SceneNode,
  suffix: string,
): SceneNode {
  const existing = host.instanceOverrides?.descendants?.[suffix]
  return {
    id: `${host.id}${INSTANCE_EXPAND_SEP}${suffix}`,
    type: 'Instance',
    instanceOf: host.instanceOf,
    ...(existing ? { instanceOverrides: structuredClone(existing) } : {}),
  }
}

export function commitDescendantBag(host: SceneNode, suffix: string, bag: SceneNode): void {
  const ov = { ...(host.instanceOverrides ?? {}) }
  if (bag.instanceOverrides && Object.keys(bag.instanceOverrides).length) {
    ov.descendants = { ...(ov.descendants ?? {}), [suffix]: bag.instanceOverrides }
  } else if (ov.descendants) {
    const next = { ...ov.descendants }
    delete next[suffix]
    if (Object.keys(next).length) ov.descendants = next
    else delete ov.descendants
  }
  if (Object.keys(ov).length) host.instanceOverrides = ov
  else delete host.instanceOverrides
}
