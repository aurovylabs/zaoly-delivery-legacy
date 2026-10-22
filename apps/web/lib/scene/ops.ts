import {
  WRAP_CONTAINER_TYPES,
  type CompositionScene,
  type SceneBreakpointId,
  type SceneNode,
  type SceneNodeId,
  type SceneOp,
  type SceneOpResult,
  type SceneStateId,
  type SceneStateOverride,
  type WrapContainerType,
} from '@zaoly/contracts'
import { rematerializeScenePrimary } from './primary-breakpoint'
import { slotOf, applyShellCopyProxy } from './slots'
import {
  collectInstanceRefs,
  expandToDetachedTree,
  INSTANCE_TYPE,
  isInstanceNode,
  makeInstanceRef,
} from './expand-instances'
import {
  commitDescendantBag,
  descendantOverrideBag,
  INSTANCE_EXPAND_SEP,
  persistLockNodeId,
  resolveDescendantWriteTarget,
  writeDescendantOverride,
} from './instance-descendants'
import {
  cellNameFromCombination,
  createMasterAxisId,
  createMasterVariantId,
  findVariantByCombination,
  listMasterVariants,
  masterEditAllowsPaletteInsert,
  materializeMasterVariants,
  migrateMasterAxesFromPhase2,
  resolveMasterVariant,
  resolveMasterVariantForInstance,
  variantNameTaken,
} from './master-variants'
import {
  sanitizeSiteSvgMarkup,
  siteSvgMark,
} from '@zaoly/site-kit'
import { SITE_KIT_PALETTE_IDS, paletteMasterId } from './site-kit-palette'
import { softFillStarterMasterVariants } from './starter-master-variants'
import { applySiteKitResponsiveDefaults } from './site-kit-responsive'
import { isEditorBreakpoint } from './breakpoints'
import {
  autoPlacePageFrame,
  defaultArtboardWidthForScene,
  ensureScenePageFrames,
  rejectIfBoardChrome,
} from './scene-board'
import {
  alignActivePageRoot,
  commitScenePages,
  findPageIdForNode,
  materializeScenePages,
  persistActivePageRoot,
  rejectIfNotOnActivePage,
  resolveActivePageId,
} from './scene-pages'
import { withPrunedComments } from '../scene-comments'
import {
  cloneScene,
  cloneSceneNodeWithDeterministicIds,
  cloneSceneNodeWithNewIds,
  mapParentChildren,
  updateNodeById,
  withUpdatedActiveRoot,
} from './scene-clone'
import {
  createSceneNodeId,
  findNode,
  findParent,
  hasAncestorType,
  isNodeOrAncestorLocked,
} from './scene-tree'
import {
  applySiteTableStructureOp,
  defaultChildForType,
  seedInsertChildTree,
} from './scene-insert-defaults'
import {
  isPrintPaletteType,
  isSceneContainerType,
} from './scene-drop-plan'

export {
  cloneScene,
  cloneSceneNodeWithDeterministicIds,
  cloneSceneNodeWithNewIds,
} from './scene-clone'
export { paletteMasterId } from './site-kit-palette'
export {
  createSceneNodeId,
  findSceneNode,
  findSceneParent,
  hasAncestorType,
  isNodeOrAncestorLocked,
} from './scene-tree'
export {
  applySiteTableStructureOp,
  defaultChildForType,
  seedInsertChildTree,
} from './scene-insert-defaults'
export {
  SCENE_CONTAINER_TYPES,
  crossPageLayerMoveIds,
  dropEdgeFromPoint,
  isPrintPaletteType,
  isSceneContainerType,
  paletteChildForInsert,
  planCrossPageLayerDrop,
  planLayerDrop,
  planPaletteDrop,
  type InsertPlan,
  type LayerDropPosition,
  type PaletteDropEdge,
} from './scene-drop-plan'
export {
  planExpandAwarePaletteDrop,
  resolveTokenDropTarget,
  type ExpandAwarePaletteDropPlan,
  type TokenDropTarget,
} from './expand-drop'
export {
  EDITOR_CLIPBOARD_KIND,
  clipboardNodesFromSelection,
  isValidClipboardNodes,
  parseEditorClipboard,
  planPasteInsert,
  serializeEditorClipboard,
} from './scene-clipboard'

function touch(scene: CompositionScene): CompositionScene {
  return persistActivePageRoot({ ...scene, updatedAt: new Date().toISOString() })
}

function touchPages(scene: CompositionScene): CompositionScene {
  return commitScenePages({ ...scene, updatedAt: new Date().toISOString() })
}

function collectInstanceRefsInScene(scene: CompositionScene, masterId: string): SceneNode[] {
  const refs: SceneNode[] = collectInstanceRefs(scene.root, masterId)
  if (scene.pages?.length) {
    for (const page of scene.pages) {
      refs.push(...collectInstanceRefs(page.root, masterId))
    }
  }
  return refs
}

function treeOpNodeIds(op: SceneOp): SceneNodeId[] {
  switch (op.op) {
    case 'wrap_nodes':
      return op.nodeIds
    case 'insert_child':
    case 'insert_instance':
      return [op.parentId]
    case 'move_node':
      return [op.nodeId, op.parentId]
    case 'create_master':
    case 'ensure_palette_master':
    case 'rename_master':
    case 'delete_master':
    case 'restore_master':
    case 'bind_master_composition':
    case 'add_master_variant':
    case 'rename_master_variant':
    case 'delete_master_variant':
    case 'set_master_default_variant':
    case 'update_master_root':
    case 'update_master_variant_root':
    case 'add_master_axis':
    case 'rename_master_axis':
    case 'delete_master_axis':
    case 'add_master_axis_value':
    case 'rename_master_axis_value':
    case 'delete_master_axis_value':
    case 'upsert_master_variant_cell':
    case 'add_page':
    case 'delete_page':
    case 'restore_page':
    case 'rename_page':
    case 'duplicate_page':
    case 'set_active_page':
    case 'set_cover_page':
    case 'reorder_pages':
    case 'move_page_frame':
    case 'set_page_frame':
    case 'set_page_breakpoint':
    case 'move_node_to_page':
    case 'select':
      return []
    default:
      if ('nodeId' in op && typeof op.nodeId === 'string') return [op.nodeId]
      return []
  }
}

function createEmptyPageRoot(): SceneNode {
  const stack = defaultChildForType('SiteStack')
  return { ...stack, id: createSceneNodeId('page-root') }
}

/** Nested Instance ref inside a host Master definition (expand suffix path). */
function nestedInstanceInHostDefinition(
  scene: CompositionScene,
  host: SceneNode,
  suffix: string,
): SceneNode | null {
  if (!isInstanceNode(host) || !host.instanceOf) return null
  const master = scene.masters?.find((m) => m.id === host.instanceOf)
  if (!master) return null
  const defRoot = resolveMasterVariantForInstance(master, host).root
  let scope: SceneNode = defRoot
  let hit: SceneNode | null = null
  for (const part of suffix.split(INSTANCE_EXPAND_SEP)) {
    hit = findNode(scope, part)
    if (!hit) return null
    scope = hit
  }
  return hit && isInstanceNode(hit) ? hit : null
}

function rejectIfLocked(
  root: SceneNode,
  nodeId: SceneNodeId,
  allowUnlockSelf = false,
  nextLocked?: boolean,
): SceneOpResult | null {
  const resolvedId = persistLockNodeId(root, nodeId)
  const node = findNode(root, resolvedId)
  if (!node) return { ok: false, reason: `Unknown node: ${nodeId}` }

  // Unlocking self is allowed when only this node is locked (ancestor still blocks).
  if (allowUnlockSelf && nextLocked === false && node.locked) {
    const parent = findParent(root, nodeId)
    if (parent && isNodeOrAncestorLocked(root, parent.parent.id)) {
      return { ok: false, reason: `Node is locked: ${nodeId}` }
    }
    return null
  }

  if (isNodeOrAncestorLocked(root, nodeId)) {
    return { ok: false, reason: `Node is locked: ${nodeId}` }
  }
  return null
}

const BP_IDS: SceneBreakpointId[] = ['mobile', 'tablet', 'desktop', 'print']

function isBreakpointId(value: string): value is SceneBreakpointId {
  return (BP_IDS as string[]).includes(value)
}

function isWrapContainerType(value: string): value is WrapContainerType {
  return (WRAP_CONTAINER_TYPES as readonly string[]).includes(value)
}

type WrapPlan = {
  parent: SceneNode
  ordered: SceneNode[]
}

function planWrap(
  root: SceneNode,
  nodeIds: SceneNodeId[],
): { ok: true; plan: WrapPlan } | { ok: false; reason: string } {
  const unique = [...new Set(nodeIds.filter((id) => id.trim()))]
  if (!unique.length) return { ok: false, reason: 'wrap_nodes requires nodeIds' }
  if (unique.includes(root.id)) return { ok: false, reason: 'Cannot wrap root node' }

  const located: { node: SceneNode; parent: SceneNode; index: number }[] = []
  for (const id of unique) {
    const node = findNode(root, id)
    if (!node) return { ok: false, reason: `Unknown node: ${id}` }
    const parentLoc = findParent(root, id)
    if (!parentLoc) return { ok: false, reason: 'Cannot wrap root node' }
    located.push({ node, parent: parentLoc.parent, index: parentLoc.index })
  }
  const parentId = located[0]?.parent.id
  if (!parentId || located.some((item) => item.parent.id !== parentId)) {
    return { ok: false, reason: 'wrap_nodes requires sibling nodes' }
  }
  located.sort((a, b) => a.index - b.index)
  return {
    ok: true,
    plan: {
      parent: located[0].parent,
      ordered: located.map((item) => item.node),
    },
  }
}

/** True when wrap_nodes would be accepted for these ids (siblings, not root, unlocked). */
export function canWrapSelection(
  scene: CompositionScene,
  ids: SceneNodeId[],
  root: SceneNode = scene.root,
): boolean {
  const planned = planWrap(root, ids)
  if (!planned.ok) return false
  return ids.every((id) => id && !isNodeOrAncestorLocked(root, id))
}

/** True when unwrap_node would be accepted (single Stack/Grid, not root, unlocked). */
export function canUnwrapSelection(
  scene: CompositionScene,
  ids: SceneNodeId[],
  root: SceneNode = scene.root,
): boolean {
  if (ids.length !== 1) return false
  const id = ids[0]
  if (!id || id === root.id) return false
  const node = findNode(root, id)
  if (!node || !isWrapContainerType(node.type)) return false
  return !isNodeOrAncestorLocked(root, id)
}

function isHotPathLeafOp(op: SceneOp): boolean {
  return (
    op.op === 'set_prop' ||
    op.op === 'set_style' ||
    op.op === 'set_token_binding' ||
    op.op === 'clear_token_binding' ||
    op.op === 'set_data_binding' ||
    op.op === 'clear_data_binding' ||
    op.op === 'set_breakpoint_override' ||
    op.op === 'clear_breakpoint_override' ||
    op.op === 'set_state_override' ||
    op.op === 'clear_state_override' ||
    op.op === 'add_interaction' ||
    op.op === 'remove_interaction' ||
    op.op === 'update_interaction' ||
    op.op === 'table_add_row' ||
    op.op === 'table_add_column' ||
    op.op === 'table_remove_row' ||
    op.op === 'table_remove_column'
  )
}

function isHotPathTreeOp(op: SceneOp): boolean {
  return (
    op.op === 'insert_child' ||
    op.op === 'remove_node' ||
    op.op === 'reorder_node' ||
    op.op === 'move_node' ||
    op.op === 'wrap_nodes' ||
    op.op === 'unwrap_node'
  )
}

/** Mutate a shallow-cloned node for a hot-path leaf op. Returns error reason or null. */
function mutateHotPathNode(node: SceneNode, op: SceneOp): string | null {
  if (op.op === 'set_prop') {
    const key = typeof op.key === 'string' ? op.key.trim() : ''
    if (!key) return 'Prop key required (use key, not prop/property alone)'

    let propValue: unknown = op.value
    let svgPropPatch: Record<string, unknown> | undefined
    if (key === 'markup' && node.type === 'SiteSvg') {
      const sanitized = sanitizeSiteSvgMarkup(String(op.value ?? ''))
      if (!sanitized.ok) return `SiteSvg markup rejected: ${sanitized.reason}`
      propValue = sanitized.markup
      svgPropPatch = {
        mark: 'custom',
        ...(sanitized.viewBox ? { viewBox: sanitized.viewBox } : {}),
      }
    }
    if (key === 'mark' && node.type === 'SiteSvg') {
      const markId = String(op.value ?? '')
      if (markId === 'custom') {
        propValue = 'custom'
      } else {
        const mark = siteSvgMark(markId)
        if (!mark) return `Unknown SiteSvg mark: ${markId}`
        propValue = mark.id
        svgPropPatch = {
          markup: mark.markup,
          viewBox: mark.viewBox,
          alt: mark.alt,
        }
      }
    }

    if (isInstanceNode(node)) {
      const ov = { ...(node.instanceOverrides ?? {}) }
      if (key === 'name') {
        ov.name = typeof op.value === 'string' ? op.value : String(op.value ?? '')
        node.name = ov.name
      } else {
        ov.props = {
          ...(ov.props ?? {}),
          [key]: propValue,
          ...(svgPropPatch ?? {}),
        }
      }
      node.instanceOverrides = ov
      return null
    }
    if (key === 'name') {
      node.name = typeof op.value === 'string' ? op.value : String(op.value ?? '')
      return null
    }
    if (applyShellCopyProxy(node, key, op.value)) return null
    node.props = {
      ...(node.props ?? {}),
      [key]: propValue,
      ...(svgPropPatch ?? {}),
    }
    if ((key === 'width' || key === 'height') && node.style?.[key] != null) {
      const nextStyle = { ...node.style }
      delete nextStyle[key]
      node.style = Object.keys(nextStyle).length ? nextStyle : undefined
    }
    return null
  }

  if (op.op === 'set_token_binding') {
    const key = typeof op.key === 'string' ? op.key.trim() : ''
    const tokenPath = typeof op.tokenPath === 'string' ? op.tokenPath.trim() : ''
    if (!key || !tokenPath) {
      return 'Token binding key and path required'
    }
    if (isInstanceNode(node)) {
      const ov = { ...(node.instanceOverrides ?? {}) }
      ov.tokenBindings = { ...(ov.tokenBindings ?? {}), [key]: tokenPath }
      if ((key === 'width' || key === 'height') && ov.style?.[key] != null) {
        const nextStyle = { ...ov.style }
        delete nextStyle[key]
        ov.style = Object.keys(nextStyle).length ? nextStyle : undefined
      }
      node.instanceOverrides = ov
      return null
    }
    node.tokenBindings = { ...(node.tokenBindings ?? {}), [key]: tokenPath }
    if ((key === 'width' || key === 'height') && node.style?.[key] != null) {
      const nextStyle = { ...node.style }
      delete nextStyle[key]
      node.style = Object.keys(nextStyle).length ? nextStyle : undefined
    }
    return null
  }

  if (op.op === 'clear_token_binding') {
    const key = typeof op.key === 'string' ? op.key.trim() : ''
    if (!key) return 'Token binding key required'
    if (isInstanceNode(node)) {
      if (!node.instanceOverrides?.tokenBindings?.[key]) return null
      const ov = { ...(node.instanceOverrides ?? {}) }
      const tb = { ...(ov.tokenBindings ?? {}) }
      delete tb[key]
      ov.tokenBindings = Object.keys(tb).length ? tb : undefined
      node.instanceOverrides = ov
      return null
    }
    if (!node.tokenBindings?.[key]) return `No binding for key: ${key}`
    const nextBindings = { ...node.tokenBindings }
    delete nextBindings[key]
    node.tokenBindings = Object.keys(nextBindings).length ? nextBindings : undefined
    return null
  }

  if (op.op === 'set_data_binding') {
    const key = typeof op.key === 'string' ? op.key.trim() : ''
    const dataRef = typeof op.dataRef === 'string' ? op.dataRef.trim() : ''
    if (!key || !dataRef) {
      return 'Data binding key and ref required'
    }
    if (isInstanceNode(node)) {
      const ov = { ...(node.instanceOverrides ?? {}) }
      ov.dataBindings = { ...(ov.dataBindings ?? {}), [key]: dataRef }
      node.instanceOverrides = ov
      return null
    }
    node.dataBindings = { ...(node.dataBindings ?? {}), [key]: dataRef }
    return null
  }

  if (op.op === 'clear_data_binding') {
    const key = typeof op.key === 'string' ? op.key.trim() : ''
    if (!key) return 'Data binding key required'
    if (isInstanceNode(node)) {
      if (!node.instanceOverrides?.dataBindings?.[key]) return null
      const ov = { ...(node.instanceOverrides ?? {}) }
      const db = { ...(ov.dataBindings ?? {}) }
      delete db[key]
      ov.dataBindings = Object.keys(db).length ? db : undefined
      node.instanceOverrides = ov
      return null
    }
    if (!node.dataBindings?.[key]) return `No data binding for key: ${key}`
    const nextBindings = { ...node.dataBindings }
    delete nextBindings[key]
    node.dataBindings = Object.keys(nextBindings).length ? nextBindings : undefined
    return null
  }

  if (op.op === 'set_style') {
    const key = typeof op.key === 'string' ? op.key.trim() : ''
    if (key !== 'width' && key !== 'height') {
      return 'Style key must be width or height'
    }
    if (typeof op.value !== 'number' || !Number.isFinite(op.value) || op.value < 0) {
      return 'Style dimensions must be finite non-negative numbers'
    }
    if (isInstanceNode(node)) {
      const ov = { ...(node.instanceOverrides ?? {}) }
      ov.style = { ...(ov.style ?? {}), [key]: op.value }
      if (ov.tokenBindings?.[key]) {
        const nextBindings = { ...ov.tokenBindings }
        delete nextBindings[key]
        ov.tokenBindings = Object.keys(nextBindings).length ? nextBindings : undefined
      }
      node.instanceOverrides = ov
      return null
    }
    node.style = { ...(node.style ?? {}), [key]: op.value }
    if (node.tokenBindings?.[key]) {
      const nextBindings = { ...node.tokenBindings }
      delete nextBindings[key]
      node.tokenBindings = Object.keys(nextBindings).length ? nextBindings : undefined
    }
    return null
  }

  if (op.op === 'set_breakpoint_override') {
    if (!isBreakpointId(op.breakpoint)) {
      return `Unknown breakpoint: ${op.breakpoint}`
    }
    if (!op.props && !op.tokenBindings && op.hidden === undefined) {
      return 'Breakpoint override requires props, tokenBindings, and/or hidden'
    }
    const prev = node.breakpoints?.[op.breakpoint] ?? {}
    const merged = {
      props: op.props ? { ...(prev.props ?? {}), ...op.props } : prev.props,
      tokenBindings: op.tokenBindings
        ? { ...(prev.tokenBindings ?? {}), ...op.tokenBindings }
        : prev.tokenBindings,
      hidden: op.hidden !== undefined ? op.hidden : prev.hidden,
    }
    node.breakpoints = {
      ...(node.breakpoints ?? {}),
      [op.breakpoint]: {
        ...(merged.props && Object.keys(merged.props).length
          ? { props: merged.props }
          : {}),
        ...(merged.tokenBindings && Object.keys(merged.tokenBindings).length
          ? { tokenBindings: merged.tokenBindings }
          : {}),
        ...(typeof merged.hidden === 'boolean' ? { hidden: merged.hidden } : {}),
      },
    }
    return null
  }

  if (op.op === 'clear_breakpoint_override') {
    if (!isBreakpointId(op.breakpoint)) {
      return `Unknown breakpoint: ${op.breakpoint}`
    }
    const current = node.breakpoints?.[op.breakpoint]
    if (!current) return `No override for breakpoint: ${op.breakpoint}`
    if (!op.keys?.length && !op.clearHidden) {
      const nextBp = { ...(node.breakpoints ?? {}) }
      delete nextBp[op.breakpoint]
      node.breakpoints = Object.keys(nextBp).length ? nextBp : undefined
      return null
    }
    if (!op.keys?.length && op.clearHidden) {
      const nextLane = {
        ...(current.props && Object.keys(current.props).length
          ? { props: current.props }
          : {}),
        ...(current.tokenBindings && Object.keys(current.tokenBindings).length
          ? { tokenBindings: current.tokenBindings }
          : {}),
      }
      if (!Object.keys(nextLane).length) {
        const nextBp = { ...(node.breakpoints ?? {}) }
        delete nextBp[op.breakpoint]
        node.breakpoints = Object.keys(nextBp).length ? nextBp : undefined
      } else {
        node.breakpoints = { ...(node.breakpoints ?? {}), [op.breakpoint]: nextLane }
      }
      return null
    }
    const clearProps = op.clearProps !== false
    const clearTokens = op.clearTokens !== false
    const nextOverride = {
      props: clearProps ? { ...(current.props ?? {}) } : current.props,
      tokenBindings: clearTokens
        ? { ...(current.tokenBindings ?? {}) }
        : current.tokenBindings,
      hidden: op.clearHidden ? undefined : current.hidden,
    }
    for (const key of op.keys ?? []) {
      if (clearProps && nextOverride.props) delete nextOverride.props[key]
      if (clearTokens && nextOverride.tokenBindings) delete nextOverride.tokenBindings[key]
    }
    const cleaned = {
      ...(nextOverride.props && Object.keys(nextOverride.props).length
        ? { props: nextOverride.props }
        : {}),
      ...(nextOverride.tokenBindings && Object.keys(nextOverride.tokenBindings).length
        ? { tokenBindings: nextOverride.tokenBindings }
        : {}),
      ...(typeof nextOverride.hidden === 'boolean'
        ? { hidden: nextOverride.hidden }
        : {}),
    }
    if (!Object.keys(cleaned).length) {
      const nextBp = { ...(node.breakpoints ?? {}) }
      delete nextBp[op.breakpoint]
      node.breakpoints = Object.keys(nextBp).length ? nextBp : undefined
    } else {
      node.breakpoints = { ...(node.breakpoints ?? {}), [op.breakpoint]: cleaned }
    }
    return null
  }

  if (op.op === 'set_state_override') {
    if (!op.props && !op.tokenBindings && !op.style) {
      return 'State override requires props, tokenBindings, or style'
    }
    const prev = node.states?.[op.state] ?? {}
    const merged = {
      props: op.props ? { ...(prev.props ?? {}), ...op.props } : prev.props,
      tokenBindings: op.tokenBindings
        ? { ...(prev.tokenBindings ?? {}), ...op.tokenBindings }
        : prev.tokenBindings,
      style: op.style ? { ...(prev.style ?? {}), ...op.style } : prev.style,
    }
    node.states = {
      ...(node.states ?? {}),
      [op.state]: {
        ...(merged.props && Object.keys(merged.props).length ? { props: merged.props } : {}),
        ...(merged.tokenBindings && Object.keys(merged.tokenBindings).length
          ? { tokenBindings: merged.tokenBindings }
          : {}),
        ...(merged.style && Object.keys(merged.style).length ? { style: merged.style } : {}),
      },
    }
    return null
  }

  if (op.op === 'clear_state_override') {
    const current = node.states?.[op.state]
    if (!current) return `No override for state: ${op.state}`
    if (!op.keys?.length) {
      const states = { ...(node.states ?? {}) }
      delete states[op.state]
      node.states = Object.keys(states).length ? states : undefined
      return null
    }
    const clearProps = op.clearProps !== false
    const clearTokens = op.clearTokens !== false
    const clearStyle = op.clearStyle !== false
    const changed = {
      props: clearProps ? { ...(current.props ?? {}) } : current.props,
      tokenBindings: clearTokens ? { ...(current.tokenBindings ?? {}) } : current.tokenBindings,
      style: clearStyle ? { ...(current.style ?? {}) } : current.style,
    }
    for (const key of op.keys) {
      if (clearProps && changed.props) delete changed.props[key]
      if (clearTokens && changed.tokenBindings) delete changed.tokenBindings[key]
      if (clearStyle && changed.style) delete changed.style[key]
    }
    const cleaned = {
      ...(changed.props && Object.keys(changed.props).length ? { props: changed.props } : {}),
      ...(changed.tokenBindings && Object.keys(changed.tokenBindings).length
        ? { tokenBindings: changed.tokenBindings }
        : {}),
      ...(changed.style && Object.keys(changed.style).length ? { style: changed.style } : {}),
    }
    if (!Object.keys(cleaned).length) {
      const states = { ...(node.states ?? {}) }
      delete states[op.state]
      node.states = Object.keys(states).length ? states : undefined
    } else {
      node.states = { ...(node.states ?? {}), [op.state]: cleaned }
    }
    return null
  }

  if (op.op === 'add_interaction') {
    node.interactions = [...(node.interactions ?? []), op.interaction]
    return null
  }
  if (op.op === 'remove_interaction') {
    const list = (node.interactions ?? []).filter((item) => item.id !== op.interactionId)
    node.interactions = list.length ? list : undefined
    return null
  }
  if (op.op === 'update_interaction') {
    node.interactions = (node.interactions ?? []).map((item) =>
      item.id === op.interaction.id ? op.interaction : item,
    )
    return null
  }

  if (
    op.op === 'table_add_row' ||
    op.op === 'table_add_column' ||
    op.op === 'table_remove_row' ||
    op.op === 'table_remove_column'
  ) {
    if (isInstanceNode(node) || node.instanceOf) {
      return 'Table structure is sealed on Instances — Edit Master or Detach first'
    }
    if (node.type !== 'SiteTable') {
      return 'Table structure ops require SiteTable'
    }
    // Detach row graph before in-place structure mutate (shared siblings must stay intact).
    node.children = structuredClone(node.children ?? [])
    const result = applySiteTableStructureOp(node, op.op)
    if (!result.ok) return result.reason
    return null
  }

  return 'Unsupported hot-path op'
}

/**
 * W8–W8f path-copy fast path for leaf/override/tree/wrap/table/interaction/set_flags.
 * Returns null when the op should use the page/master prepare path or cloneScene.
 */
function tryApplyHotPathOp(scene: CompositionScene, op: SceneOp): SceneOpResult | null {
  if (isHotPathTreeOp(op)) return tryApplyHotPathTreeOp(scene, op)
  if (op.op === 'set_flags') return tryApplyHotPathSetFlags(scene, op)
  if (!isHotPathLeafOp(op)) return null
  if (!('nodeId' in op) || typeof op.nodeId !== 'string') return null

  const aligned = alignActivePageRoot(scene)
  for (const nodeId of treeOpNodeIds(op)) {
    const persistId = persistLockNodeId(aligned.root, nodeId)
    const board = rejectIfBoardChrome(persistId)
    if (board) return board
    const inactive = rejectIfNotOnActivePage(aligned, persistId)
    if (inactive) return inactive
  }
  const locked = rejectIfLocked(aligned.root, op.nodeId)
  if (locked) return locked

  const nested = resolveDescendantWriteTarget(aligned.root, op.nodeId)
  if (nested) {
    const bag = descendantOverrideBag(nested.host, nested.suffix)
    const failNested = mutateHotPathNode(bag, op)
    if (failNested) return { ok: false, reason: failNested }
    const nextRoot = updateNodeById(aligned.root, nested.host.id, (host) => {
      commitDescendantBag(host, nested.suffix, bag)
    })
    if (!nextRoot) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, nextRoot)) }
  }

  let fail: string | null = null
  let nextRoot = updateNodeById(aligned.root, op.nodeId, (node) => {
    fail = mutateHotPathNode(node, op)
  })
  if (!nextRoot) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
  if (fail) return { ok: false, reason: fail }

  let nextScene = touch(withUpdatedActiveRoot(aligned, nextRoot))

  // SiteChart kind: keep chartType ↔ variant aliases in sync, and stamp the palette
  // Master definition so Instance expands cannot snap back to seed `bar`.
  if (
    op.op === 'set_prop' &&
    (op.key === 'chartType' || op.key === 'variant') &&
    op.value != null &&
    op.value !== ''
  ) {
    const aliasKey = op.key === 'chartType' ? 'variant' : 'chartType'
    const aliasOp: SceneOp = {
      op: 'set_prop',
      nodeId: op.nodeId,
      key: aliasKey,
      value: op.value,
    }
    let aliasFail: string | null = null
    const aliasedRoot = updateNodeById(nextRoot, op.nodeId, (node) => {
      aliasFail = mutateHotPathNode(node, aliasOp)
    })
    if (aliasedRoot && !aliasFail) {
      nextRoot = aliasedRoot
      nextScene = touch(withUpdatedActiveRoot(aligned, aliasedRoot))
    }

    const persisted = findNode(nextRoot, op.nodeId)
    const masterId = persisted && isInstanceNode(persisted) ? persisted.instanceOf : null
    const master = masterId
      ? nextScene.masters?.find((m) => m.id === masterId)
      : undefined
    if (
      master &&
      (master.sourceKey === 'SiteChart' || master.root.type === 'SiteChart')
    ) {
      const root = {
        ...master.root,
        props: {
          ...(master.root.props ?? {}),
          chartType: op.value,
          variant: op.value,
        },
      }
      nextScene = touch({
        ...nextScene,
        masters: (nextScene.masters ?? []).map((m) =>
          m.id === master.id ? { ...m, root } : m,
        ),
      })
    }
  }

  return { ok: true, scene: nextScene }
}

function tryApplyHotPathSetFlags(
  scene: CompositionScene,
  op: Extract<SceneOp, { op: 'set_flags' }>,
): SceneOpResult {
  const aligned = alignActivePageRoot(scene)
  const board = rejectIfBoardChrome(op.nodeId)
  if (board) return board
  const inactive = rejectIfNotOnActivePage(aligned, op.nodeId)
  if (inactive) return inactive

  if (op.hidden === undefined && op.locked === undefined) {
    return { ok: false, reason: 'set_flags requires hidden and/or locked' }
  }

  const existing = findNode(aligned.root, op.nodeId)
  if (!existing) return { ok: false, reason: `Unknown node: ${op.nodeId}` }

  if (!isInstanceNode(existing)) {
    const lockReject = rejectIfLocked(aligned.root, op.nodeId, true, op.locked)
    if (op.locked !== false && lockReject && op.locked !== undefined) {
      const parent = findParent(aligned.root, op.nodeId)
      if (parent && isNodeOrAncestorLocked(aligned.root, parent.parent.id)) {
        return lockReject
      }
    } else if (op.locked === undefined && op.hidden !== undefined) {
      const parent = findParent(aligned.root, op.nodeId)
      if (
        (existing.locked || (parent && isNodeOrAncestorLocked(aligned.root, parent.parent.id))) &&
        parent &&
        isNodeOrAncestorLocked(aligned.root, parent.parent.id)
      ) {
        return { ok: false, reason: `Node is locked: ${op.nodeId}` }
      }
    }
  }

  const nextRoot = updateNodeById(aligned.root, op.nodeId, (node) => {
    if (isInstanceNode(node)) {
      const ov = { ...(node.instanceOverrides ?? {}) }
      if (op.hidden !== undefined) ov.hidden = op.hidden
      if (op.locked !== undefined) ov.locked = op.locked
      node.instanceOverrides = ov
      return
    }
    if (op.hidden !== undefined) {
      if (op.hidden) node.hidden = true
      else delete node.hidden
    }
    if (op.locked !== undefined) {
      if (op.locked) node.locked = true
      else delete node.locked
    }
  })
  if (!nextRoot) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
  return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, nextRoot)) }
}

function tryApplyHotPathTreeOp(scene: CompositionScene, op: SceneOp): SceneOpResult | null {
  const aligned = alignActivePageRoot(scene)

  for (const nodeId of treeOpNodeIds(op)) {
    const board = rejectIfBoardChrome(nodeId)
    if (board) return board
    const inactive = rejectIfNotOnActivePage(aligned, nodeId)
    if (inactive) return inactive
  }

  if (op.op === 'insert_child') {
    const locked = rejectIfLocked(aligned.root, op.parentId)
    if (locked) return locked
    const parent = findNode(aligned.root, op.parentId)
    if (!parent) return { ok: false, reason: `Unknown parent: ${op.parentId}` }
    if (isInstanceNode(parent)) {
      return { ok: false, reason: 'Cannot insert into Instance — edit the Master or Detach' }
    }
    if (!op.child?.id || !op.child?.type) {
      return { ok: false, reason: 'Child requires id and type' }
    }
    if (findNode(aligned.root, op.child.id)) {
      return { ok: false, reason: `Duplicate node id: ${op.child.id}` }
    }
    const child = seedInsertChildTree(op.child)
    const mapped = mapParentChildren(aligned.root, op.parentId, (children) => {
      const index =
        op.index == null ? children.length : Math.max(0, Math.min(op.index, children.length))
      const next = [...children]
      next.splice(index, 0, child)
      return next
    })
    if (!mapped.ok) return { ok: false, reason: mapped.error }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, mapped.root)) }
  }

  if (op.op === 'remove_node') {
    if (op.nodeId === aligned.root.id) {
      return { ok: false, reason: 'Cannot remove root node' }
    }
    const locked = rejectIfLocked(aligned.root, op.nodeId)
    if (locked) return locked
    const located = findParent(aligned.root, op.nodeId)
    if (!located) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    const mapped = mapParentChildren(aligned.root, located.parent.id, (children) =>
      children.filter((_, i) => i !== located.index),
    )
    if (!mapped.ok) return { ok: false, reason: mapped.error }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, mapped.root)) }
  }

  if (op.op === 'reorder_node') {
    if (op.nodeId === aligned.root.id) {
      return { ok: false, reason: 'Cannot reorder root node' }
    }
    if (!Number.isInteger(op.index) || op.index < 0) {
      return { ok: false, reason: 'Reorder index must be a non-negative integer' }
    }
    const locked = rejectIfLocked(aligned.root, op.nodeId)
    if (locked) return locked
    const located = findParent(aligned.root, op.nodeId)
    if (!located) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    const mapped = mapParentChildren(aligned.root, located.parent.id, (children) => {
      const siblings = [...children]
      const [moved] = siblings.splice(located.index, 1)
      if (!moved) return { error: `Unknown node: ${op.nodeId}` }
      const clamped = Math.max(0, Math.min(op.index, siblings.length))
      siblings.splice(clamped, 0, moved)
      return siblings
    })
    if (!mapped.ok) return { ok: false, reason: mapped.error }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, mapped.root)) }
  }

  if (op.op === 'move_node') {
    if (op.nodeId === aligned.root.id) {
      return { ok: false, reason: 'Cannot move root node' }
    }
    if (op.nodeId === op.parentId) {
      return { ok: false, reason: 'Cannot move node into itself' }
    }
    if (!Number.isInteger(op.index) || op.index < 0) {
      return { ok: false, reason: 'Move index must be a non-negative integer' }
    }
    const locked = rejectIfLocked(aligned.root, op.nodeId)
    if (locked) return locked
    const node = findNode(aligned.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    const destParent = findNode(aligned.root, op.parentId)
    if (!destParent) return { ok: false, reason: `Unknown parent: ${op.parentId}` }
    if (!isSceneContainerType(destParent.type)) {
      return { ok: false, reason: 'Drop target does not accept children' }
    }
    if (findNode(node, op.parentId)) {
      return { ok: false, reason: 'Cannot move into own descendant' }
    }
    const destLocked = rejectIfLocked(aligned.root, op.parentId)
    if (destLocked) return destLocked

    const located = findParent(aligned.root, op.nodeId)
    if (!located) return { ok: false, reason: `Unknown node: ${op.nodeId}` }

    if (located.parent.id === op.parentId) {
      const mapped = mapParentChildren(aligned.root, op.parentId, (children) => {
        const siblings = [...children]
        const [moved] = siblings.splice(located.index, 1)
        if (!moved) return { error: `Unknown node: ${op.nodeId}` }
        let insertAt = op.index
        if (located.index < insertAt) insertAt -= 1
        const clamped = Math.max(0, Math.min(insertAt, siblings.length))
        siblings.splice(clamped, 0, moved)
        return siblings
      })
      if (!mapped.ok) return { ok: false, reason: mapped.error }
      return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, mapped.root)) }
    }

    let movedNode: SceneNode | null = null
    const afterRemove = mapParentChildren(aligned.root, located.parent.id, (children) => {
      const siblings = [...children]
      const [moved] = siblings.splice(located.index, 1)
      if (!moved) return { error: `Unknown node: ${op.nodeId}` }
      movedNode = moved
      return siblings
    })
    if (!afterRemove.ok) return { ok: false, reason: afterRemove.error }
    if (!movedNode) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    const afterInsert = mapParentChildren(afterRemove.root, op.parentId, (children) => {
      const destChildren = [...children]
      const clamped = Math.max(0, Math.min(op.index, destChildren.length))
      destChildren.splice(clamped, 0, movedNode!)
      return destChildren
    })
    if (!afterInsert.ok) return { ok: false, reason: afterInsert.error }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, afterInsert.root)) }
  }

  if (op.op === 'wrap_nodes') {
    if (!isWrapContainerType(op.containerType)) {
      return { ok: false, reason: 'containerType must be Stack, Grid, SiteStack, or SiteGrid' }
    }
    if (!op.containerId.trim()) {
      return { ok: false, reason: 'containerId required' }
    }
    if (findNode(aligned.root, op.containerId)) {
      return { ok: false, reason: `Duplicate node id: ${op.containerId}` }
    }
    const planned = planWrap(aligned.root, op.nodeIds)
    if (!planned.ok) return planned
    for (const id of new Set(op.nodeIds)) {
      const locked = rejectIfLocked(aligned.root, id)
      if (locked) return locked
    }
    const wrapSet = new Set(planned.plan.ordered.map((node) => node.id))
    const container = defaultChildForType(op.containerType)
    container.id = op.containerId
    container.children = planned.plan.ordered
    const mapped = mapParentChildren(aligned.root, planned.plan.parent.id, (children) => {
      const nextChildren: SceneNode[] = []
      let inserted = false
      for (const child of children) {
        if (wrapSet.has(child.id)) {
          if (!inserted) {
            nextChildren.push(container)
            inserted = true
          }
        } else {
          nextChildren.push(child)
        }
      }
      return nextChildren
    })
    if (!mapped.ok) return { ok: false, reason: mapped.error }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, mapped.root)) }
  }

  if (op.op === 'unwrap_node') {
    if (op.nodeId === aligned.root.id) {
      return { ok: false, reason: 'Cannot unwrap root node' }
    }
    const locked = rejectIfLocked(aligned.root, op.nodeId)
    if (locked) return locked
    const node = findNode(aligned.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    if (!isWrapContainerType(node.type)) {
      return { ok: false, reason: 'unwrap_node requires a Stack or Grid' }
    }
    const located = findParent(aligned.root, op.nodeId)
    if (!located) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    const mapped = mapParentChildren(aligned.root, located.parent.id, (children) => {
      const siblings = [...children]
      siblings.splice(located.index, 1, ...(node.children ?? []))
      return siblings
    })
    if (!mapped.ok) return { ok: false, reason: mapped.error }
    return { ok: true, scene: touch(withUpdatedActiveRoot(aligned, mapped.root)) }
  }

  return null
}

function isHotPathPageOp(op: SceneOp): boolean {
  return (
    op.op === 'add_page' ||
    op.op === 'delete_page' ||
    op.op === 'restore_page' ||
    op.op === 'rename_page' ||
    op.op === 'duplicate_page' ||
    op.op === 'set_active_page' ||
    op.op === 'set_cover_page' ||
    op.op === 'reorder_pages' ||
    op.op === 'move_page_frame' ||
    op.op === 'set_page_frame' ||
    op.op === 'set_page_breakpoint' ||
    op.op === 'move_node_to_page'
  )
}

function isHotPathMasterOp(op: SceneOp): boolean {
  return (
    op.op === 'create_master' ||
    op.op === 'ensure_palette_master' ||
    op.op === 'rename_master' ||
    op.op === 'bind_master_composition' ||
    op.op === 'delete_master' ||
    op.op === 'restore_master' ||
    op.op === 'insert_instance' ||
    op.op === 'detach_instance' ||
    op.op === 'update_master_root' ||
    op.op === 'add_master_variant' ||
    op.op === 'rename_master_variant' ||
    op.op === 'delete_master_variant' ||
    op.op === 'set_master_default_variant' ||
    op.op === 'set_instance_variant' ||
    op.op === 'update_master_variant_root' ||
    op.op === 'add_master_axis' ||
    op.op === 'rename_master_axis' ||
    op.op === 'delete_master_axis' ||
    op.op === 'add_master_axis_value' ||
    op.op === 'rename_master_axis_value' ||
    op.op === 'delete_master_axis_value' ||
    op.op === 'set_instance_variant_axes' ||
    op.op === 'upsert_master_variant_cell'
  )
}

function masterOpMutatesActiveTree(op: SceneOp): boolean {
  return (
    op.op === 'create_master' ||
    op.op === 'insert_instance' ||
    op.op === 'detach_instance' ||
    op.op === 'set_instance_variant' ||
    op.op === 'set_instance_variant_axes'
  )
}

/**
 * W8e working copy: share inactive page roots and untouched masters.
 * Avoids full-scene cloneScene for page/master ops.
 * Master ops MUST NOT invent `pages` (legacy root-only scenes stay root-only for applyMasterEditOp).
 */
function prepareW8eWorkingCopy(scene: CompositionScene, op: SceneOp): CompositionScene {
  if (isHotPathPageOp(op)) {
    const aligned = alignActivePageRoot(materializeScenePages(scene))
    return {
      ...aligned,
      pages: [...(aligned.pages ?? [])],
    }
  }
  const aligned = alignActivePageRoot(scene)
  const treeMut = masterOpMutatesActiveTree(op)
  const root = treeMut ? structuredClone(aligned.root) : aligned.root
  const activePageId = aligned.pages?.length
    ? resolveActivePageId(aligned.pages, aligned.activePageId)
    : null
  let masters = aligned.masters
  if (
    op.op === 'create_master' ||
    op.op === 'ensure_palette_master' ||
    op.op === 'restore_master'
  ) {
    masters = [...(aligned.masters ?? [])]
  } else if (masters?.length) {
    if (
      op.op === 'insert_instance' ||
      op.op === 'detach_instance' ||
      op.op === 'set_instance_variant' ||
      op.op === 'set_instance_variant_axes'
    ) {
      masters = masters
    } else if (op.op === 'delete_master') {
      masters = [...masters]
    } else if ('masterId' in op && typeof op.masterId === 'string') {
      masters = masters.map((m) => (m.id === op.masterId ? structuredClone(m) : m))
    } else {
      masters = structuredClone(masters)
    }
  }
  return {
    ...aligned,
    root,
    masters,
    pages:
      aligned.pages && activePageId
        ? aligned.pages.map((page) =>
            page.id === activePageId && treeMut ? { ...page, root } : page,
          )
        : aligned.pages,
  }
}

/** Validate-before-write scene ops (CREATION editor). */
export function applySceneOp(scene: CompositionScene, op: SceneOp): SceneOpResult {
  if (op.op === 'select') {
    return { ok: true, scene }
  }

  if (op.op === 'set_primary_breakpoint') {
    if (
      op.breakpoint !== 'desktop' &&
      op.breakpoint !== 'tablet' &&
      op.breakpoint !== 'mobile'
    ) {
      return { ok: false, reason: 'Invalid primary breakpoint' }
    }
    return {
      ok: true,
      scene: rematerializeScenePrimary(scene, op.breakpoint),
    }
  }

  const hot = tryApplyHotPathOp(scene, op)
  if (hot) return hot

  const next =
    isHotPathPageOp(op) || isHotPathMasterOp(op)
      ? prepareW8eWorkingCopy(scene, op)
      : alignActivePageRoot(cloneScene(scene))

  if (op.op === 'add_page') {
    let working = ensureScenePageFrames(materializeScenePages(next))
    const pages = [...(working.pages ?? [])]
    const anchorPageId = resolveActivePageId(pages, working.activePageId)
    let root: SceneNode
    if (op.duplicatePageId) {
      const source = pages.find((p) => p.id === op.duplicatePageId)
      if (!source) return { ok: false, reason: `Unknown page: ${op.duplicatePageId}` }
      root = cloneSceneNodeWithNewIds(source.root)
    } else {
      root = createEmptyPageRoot()
    }
    const id = createSceneNodeId('page')
    const name = op.name?.trim() || `Page ${pages.length + 1}`
    const placeWidth =
      !op.duplicatePageId &&
      op.frameWidth != null &&
      Number.isFinite(op.frameWidth) &&
      op.frameWidth > 0
        ? op.frameWidth
        : defaultArtboardWidthForScene(working)
    const frame = autoPlacePageFrame(pages, anchorPageId, placeWidth)
    if (!op.duplicatePageId) {
      if (op.frameWidth != null) {
        if (!Number.isFinite(op.frameWidth) || op.frameWidth <= 0) {
          return { ok: false, reason: 'Frame width must be a positive finite number' }
        }
        frame.width = op.frameWidth
      }
      if (op.frameHeight != null) {
        if (!Number.isFinite(op.frameHeight) || op.frameHeight <= 0) {
          return { ok: false, reason: 'Frame height must be a positive finite number' }
        }
        frame.height = op.frameHeight
      }
    }
    const page: (typeof pages)[number] = { id, name, root, frame }
    if (!op.duplicatePageId && op.breakpoint != null) {
      if (!isEditorBreakpoint(op.breakpoint)) {
        return { ok: false, reason: `Invalid breakpoint: ${op.breakpoint}` }
      }
      page.breakpoint = op.breakpoint
    }
    pages.push(page)
    working = {
      ...working,
      pages,
      activePageId: id,
      root,
      ...(page.breakpoint ? { activeBreakpoint: page.breakpoint } : {}),
    }
    return { ok: true, scene: touchPages(working) }
  }

  if (op.op === 'delete_page') {
    const working = materializeScenePages(next)
    const pages = working.pages ?? []
    if (pages.length <= 1) return { ok: false, reason: 'Cannot delete the last page' }
    const idx = pages.findIndex((p) => p.id === op.pageId)
    if (idx < 0) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    const remaining = pages.filter((p) => p.id !== op.pageId)
    let activePageId = working.activePageId
    if (activePageId === op.pageId) {
      const neighbor = remaining[Math.min(idx, remaining.length - 1)]!
      activePageId = neighbor.id
    }
    const activeRoot = remaining.find((p) => p.id === activePageId)!.root
    const nextCover =
      working.coverPageId && remaining.some((p) => p.id === working.coverPageId)
        ? working.coverPageId
        : undefined
    const { coverPageId: _removedCover, ...withoutCover } = working
    const pruned = withPrunedComments({
      ...withoutCover,
      pages: remaining,
      activePageId,
      root: activeRoot,
      ...(nextCover ? { coverPageId: nextCover } : {}),
    })
    return { ok: true, scene: touchPages(pruned) }
  }

  if (op.op === 'restore_page') {
    const working = ensureScenePageFrames(materializeScenePages(next))
    const pages = [...(working.pages ?? [])]
    if (!op.page?.id?.trim() || !op.page.root) {
      return { ok: false, reason: 'restore_page requires page id and root' }
    }
    if (pages.some((p) => p.id === op.page.id)) {
      return { ok: false, reason: `Page already exists: ${op.page.id}` }
    }
    if (!Number.isInteger(op.index) || op.index < 0) {
      return { ok: false, reason: 'restore_page index must be a non-negative integer' }
    }
    const page = structuredClone(op.page)
    const index = Math.max(0, Math.min(op.index, pages.length))
    pages.splice(index, 0, page)

    let comments = working.comments
    if (op.comments?.length) {
      const existing = new Set((comments ?? []).map((c) => c.id))
      const restored = structuredClone(op.comments).filter((c) => !existing.has(c.id))
      if (restored.length) {
        comments = [...(comments ?? []), ...restored]
      }
    }

    const requestedActive = op.activePageId?.trim()
    const activePageId =
      requestedActive && pages.some((p) => p.id === requestedActive)
        ? requestedActive
        : resolveActivePageId(pages, working.activePageId)
    const activeRoot = pages.find((p) => p.id === activePageId)!.root

    let coverPageId = working.coverPageId
    if (op.coverPageId === null) {
      coverPageId = undefined
    } else if (typeof op.coverPageId === 'string') {
      if (!pages.some((p) => p.id === op.coverPageId)) {
        return { ok: false, reason: `Unknown cover page: ${op.coverPageId}` }
      }
      coverPageId = op.coverPageId
    }

    const { coverPageId: _prevCover, ...withoutCover } = working
    return {
      ok: true,
      scene: touchPages({
        ...withoutCover,
        pages,
        activePageId,
        root: activeRoot,
        ...(comments ? { comments } : {}),
        ...(coverPageId ? { coverPageId } : {}),
      }),
    }
  }

  if (op.op === 'rename_page') {
    const working = materializeScenePages(next)
    const name = op.name.trim()
    if (!name) return { ok: false, reason: 'Page name required' }
    const pages = working.pages ?? []
    if (!pages.some((p) => p.id === op.pageId)) {
      return { ok: false, reason: `Unknown page: ${op.pageId}` }
    }
    return {
      ok: true,
      scene: touchPages({
        ...working,
        pages: pages.map((p) => (p.id === op.pageId ? { ...p, name } : p)),
      }),
    }
  }

  if (op.op === 'duplicate_page') {
    const working = ensureScenePageFrames(materializeScenePages(next))
    const pages = working.pages ?? []
    const source = pages.find((p) => p.id === op.pageId)
    if (!source) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    const id = createSceneNodeId('page')
    const name = op.name?.trim() || `${source.name} copy`
    const root = cloneSceneNodeWithNewIds(source.root)
    const frame = autoPlacePageFrame(
      pages,
      source.id,
      defaultArtboardWidthForScene(working),
    )
    return {
      ok: true,
      scene: touchPages({
        ...working,
        pages: [...pages, { id, name, root, frame }],
        activePageId: id,
        root,
      }),
    }
  }

  if (op.op === 'set_active_page') {
    const working = materializeScenePages(next)
    const page = working.pages?.find((p) => p.id === op.pageId)
    if (!page) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    return {
      ok: true,
      scene: touchPages({
        ...working,
        activePageId: op.pageId,
        root: page.root,
      }),
    }
  }

  if (op.op === 'set_cover_page') {
    const working = materializeScenePages(next)
    const page = working.pages?.find((p) => p.id === op.pageId)
    if (!page) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    return {
      ok: true,
      scene: touchPages({
        ...working,
        coverPageId: op.pageId,
      }),
    }
  }

  if (op.op === 'reorder_pages') {
    const working = materializeScenePages(next)
    const pages = working.pages ?? []
    if (op.pageIds.length !== pages.length) {
      return { ok: false, reason: 'reorder_pages requires all page ids' }
    }
    const byId = new Map(pages.map((p) => [p.id, p]))
    if (op.pageIds.some((id) => !byId.has(id))) {
      return { ok: false, reason: 'Unknown page in reorder_pages' }
    }
    if (new Set(op.pageIds).size !== op.pageIds.length) {
      return { ok: false, reason: 'Duplicate page id in reorder_pages' }
    }
    return {
      ok: true,
      scene: touchPages({
        ...working,
        pages: op.pageIds.map((id) => byId.get(id)!),
      }),
    }
  }

  if (op.op === 'move_page_frame') {
    if (!Number.isFinite(op.x) || !Number.isFinite(op.y)) {
      return { ok: false, reason: 'Frame coordinates must be finite numbers' }
    }
    const working = ensureScenePageFrames(materializeScenePages(next))
    const pages = working.pages ?? []
    const idx = pages.findIndex((p) => p.id === op.pageId)
    if (idx < 0) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    const page = pages[idx]!
    const frame = {
      x: op.x,
      y: op.y,
      ...(typeof page.frame?.width === 'number' && page.frame.width > 0
        ? { width: page.frame.width }
        : {}),
      ...(typeof page.frame?.height === 'number' && page.frame.height > 0
        ? { height: page.frame.height }
        : {}),
    }
    const nextPages = pages.map((p) => (p.id === op.pageId ? { ...p, frame } : p))
    return {
      ok: true,
      scene: touchPages({ ...working, pages: nextPages }),
    }
  }

  if (op.op === 'set_page_frame') {
    const working = ensureScenePageFrames(materializeScenePages(next))
    const pages = working.pages ?? []
    const idx = pages.findIndex((p) => p.id === op.pageId)
    if (idx < 0) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    const page = pages[idx]!
    const frame = { ...(page.frame ?? { x: 0, y: 0 }) }
    if (op.x !== undefined) {
      if (!Number.isFinite(op.x)) return { ok: false, reason: 'Frame x must be a finite number' }
      frame.x = op.x
    }
    if (op.y !== undefined) {
      if (!Number.isFinite(op.y)) return { ok: false, reason: 'Frame y must be a finite number' }
      frame.y = op.y
    }
    if (op.width !== undefined) {
      if (!Number.isFinite(op.width) || op.width <= 0) {
        return { ok: false, reason: 'Frame width must be a positive finite number' }
      }
      frame.width = op.width
    }
    if (op.clearWidth) {
      delete frame.width
    }
    if (op.height !== undefined) {
      if (!Number.isFinite(op.height) || op.height <= 0) {
        return { ok: false, reason: 'Frame height must be a positive finite number' }
      }
      frame.height = op.height
    }
    if (op.clearHeight) {
      delete frame.height
    }
    const nextPages = pages.map((p) => (p.id === op.pageId ? { ...p, frame } : p))
    return {
      ok: true,
      scene: touchPages({ ...working, pages: nextPages }),
    }
  }

  if (op.op === 'set_page_breakpoint') {
    const working = materializeScenePages(next)
    const pages = working.pages ?? []
    const idx = pages.findIndex((p) => p.id === op.pageId)
    if (idx < 0) return { ok: false, reason: `Unknown page: ${op.pageId}` }
    const page = pages[idx]!
    const nextPage = { ...page }
    if (op.breakpoint === null || op.breakpoint === undefined) {
      delete nextPage.breakpoint
    } else if (!isEditorBreakpoint(op.breakpoint)) {
      return { ok: false, reason: `Invalid breakpoint: ${op.breakpoint}` }
    } else {
      nextPage.breakpoint = op.breakpoint
    }
    const nextPages = pages.map((p) => (p.id === op.pageId ? nextPage : p))
    return {
      ok: true,
      scene: touchPages({ ...working, pages: nextPages }),
    }
  }

  if (op.op === 'move_node_to_page') {
    const working = ensureScenePageFrames(materializeScenePages(next))
    const pages = [...(working.pages ?? [])]
    const toPageIdx = pages.findIndex((p) => p.id === op.toPageId)
    if (toPageIdx < 0) return { ok: false, reason: `Unknown page: ${op.toPageId}` }

    let fromPageIdx = -1
    for (let i = 0; i < pages.length; i++) {
      if (findNode(pages[i]!.root, op.nodeId)) {
        fromPageIdx = i
        break
      }
    }
    if (fromPageIdx < 0) return { ok: false, reason: `Unknown node: ${op.nodeId}` }

    const fromPage = pages[fromPageIdx]!
    const toPage = pages[toPageIdx]!

    if (op.nodeId === fromPage.root.id || op.nodeId === toPage.root.id) {
      return { ok: false, reason: 'Cannot move page root' }
    }

    const board = rejectIfBoardChrome(op.nodeId)
    if (board) return board

    if (isNodeOrAncestorLocked(fromPage.root, op.nodeId)) {
      return { ok: false, reason: `Node is locked: ${op.nodeId}` }
    }

    const destParentId = op.parentId ?? toPage.root.id
    const destParent = findNode(toPage.root, destParentId)
    if (!destParent) return { ok: false, reason: `Unknown parent: ${destParentId}` }
    if (!isSceneContainerType(destParent.type)) {
      return { ok: false, reason: 'Drop target does not accept children' }
    }

    const node = findNode(fromPage.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    if (findNode(node, destParentId)) {
      return { ok: false, reason: 'Cannot move into own descendant' }
    }

    const destLocked = rejectIfLocked(toPage.root, destParentId)
    if (destLocked) return destLocked

    const insertAtRaw = op.index ?? destParent.children?.length ?? 0
    if (!Number.isInteger(insertAtRaw) || insertAtRaw < 0) {
      return { ok: false, reason: 'Move index must be a non-negative integer' }
    }

    const located = findParent(fromPage.root, op.nodeId)
    if (!located) return { ok: false, reason: `Unknown node: ${op.nodeId}` }

    let insertAt = insertAtRaw
    if (fromPageIdx === toPageIdx && located.parent.id === destParentId && located.index < insertAt) {
      insertAt -= 1
    }

    let movedNode: SceneNode | null = null
    const afterRemove = mapParentChildren(fromPage.root, located.parent.id, (children) => {
      const siblings = [...children]
      const [moved] = siblings.splice(located.index, 1)
      if (!moved) return { error: `Unknown node: ${op.nodeId}` }
      movedNode = moved
      return siblings
    })
    if (!afterRemove.ok) return { ok: false, reason: afterRemove.error }
    if (!movedNode) return { ok: false, reason: `Unknown node: ${op.nodeId}` }

    let destRoot: SceneNode
    if (fromPageIdx === toPageIdx) {
      const afterInsert = mapParentChildren(afterRemove.root, destParentId, (children) => {
        const destChildren = [...children]
        const clamped = Math.max(0, Math.min(insertAt, destChildren.length))
        destChildren.splice(clamped, 0, movedNode!)
        return destChildren
      })
      if (!afterInsert.ok) return { ok: false, reason: afterInsert.error }
      destRoot = afterInsert.root
      pages[fromPageIdx] = { ...fromPage, root: destRoot }
    } else {
      const afterInsert = mapParentChildren(toPage.root, destParentId, (children) => {
        const destChildren = [...children]
        const clamped = Math.max(0, Math.min(insertAt, destChildren.length))
        destChildren.splice(clamped, 0, movedNode!)
        return destChildren
      })
      if (!afterInsert.ok) return { ok: false, reason: afterInsert.error }
      destRoot = afterInsert.root
      pages[fromPageIdx] = { ...fromPage, root: afterRemove.root }
      pages[toPageIdx] = { ...toPage, root: destRoot }
    }

    return {
      ok: true,
      scene: touchPages({
        ...working,
        pages,
        activePageId: op.toPageId,
        root: destRoot,
      }),
    }
  }

  for (const nodeId of treeOpNodeIds(op)) {
    const board = rejectIfBoardChrome(nodeId)
    if (board) return board
    const inactive = rejectIfNotOnActivePage(next, nodeId)
    if (inactive) return inactive
  }

  // Mutating ops below respect lock.
  const mutatingNodeId =
    op.op === 'insert_child' || op.op === 'insert_instance'
      ? op.parentId
      : 'nodeId' in op
        ? op.nodeId
        : null
  if (mutatingNodeId) {
    const locked = rejectIfLocked(next.root, mutatingNodeId)
    if (locked) return locked
  }

  if (op.op === 'create_master') {
    if (op.nodeId === next.root.id) {
      return { ok: false, reason: 'Cannot create Master from root' }
    }
    const node = findNode(next.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    if (isInstanceNode(node)) {
      return { ok: false, reason: 'Node is already an Instance' }
    }
    const located = findParent(next.root, op.nodeId)
    if (!located) return { ok: false, reason: 'Cannot create Master from root' }
    const masterId = createSceneNodeId('master')
    const masterRoot = cloneSceneNodeWithNewIds(node)
    const masterName =
      (op.name && op.name.trim()) ||
      node.name?.trim() ||
      node.type ||
      'Master'
    next.masters = [
      ...(next.masters ?? []),
      { id: masterId, name: masterName, root: masterRoot },
    ]
    const instance: SceneNode = {
      id: node.id,
      type: INSTANCE_TYPE,
      name: masterName,
      instanceOf: masterId,
    }
    const siblings = [...(located.parent.children ?? [])]
    siblings[located.index] = instance
    located.parent.children = siblings
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'ensure_palette_master') {
    const sourceKey = op.sourceKey.trim()
    if (!sourceKey) return { ok: false, reason: 'sourceKey required' }
    if (!op.root?.id || !op.root?.type) {
      return { ok: false, reason: 'Master root requires id and type' }
    }
    const existing = findMasterBySourceKey(next.masters, sourceKey)
    if (existing) {
      return { ok: true, scene }
    }
    const masterName =
      (op.name && op.name.trim()) ||
      op.root.name?.trim() ||
      sourceKey.replace(/^Composition:/, '').replace(/^Site/, '') ||
      'Master'
    // Stable id from sourceKey — avoids SSR/client hydration drift on editor boot.
    const masterId = paletteMasterId(sourceKey)
    if (next.masters?.some((m) => m.id === masterId)) {
      return { ok: false, reason: `Master id already used: ${masterId}` }
    }
    const masterRoot = cloneSceneNodeWithDeterministicIds(op.root, `mroot-${sourceKey}`)
    next.masters = [
      ...(next.masters ?? []),
      { id: masterId, name: masterName, root: masterRoot, sourceKey },
    ]
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'rename_master') {
    const master = next.masters?.find((m) => m.id === op.masterId)
    if (!master) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const name = op.name.trim()
    if (!name) return { ok: false, reason: 'Master name required' }
    master.name = name
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'bind_master_composition') {
    const master = next.masters?.find((m) => m.id === op.masterId)
    if (!master) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const exportName = op.exportName.trim()
    if (!exportName || !/^[A-Z][A-Za-z0-9]*$/.test(exportName)) {
      return { ok: false, reason: 'exportName must be PascalCase' }
    }
    const sourceKey = `Composition:${exportName}`
    const existing = findMasterBySourceKey(next.masters, sourceKey)
    if (existing && existing.id !== op.masterId) {
      return {
        ok: false,
        reason: `Composition name already bound to another Master: ${exportName}`,
      }
    }
    const current = master.sourceKey?.trim()
    if (current && !current.startsWith('Composition:') && current !== sourceKey) {
      return { ok: false, reason: 'Cannot bind palette atom Master as composition' }
    }
    if (current === sourceKey) {
      return { ok: true, scene: touch(next) }
    }
    master.sourceKey = sourceKey
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'delete_master') {
    const master = next.masters?.find((m) => m.id === op.masterId)
    if (!master) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const live = collectInstanceRefsInScene(next, op.masterId)
    if (live.length) {
      return {
        ok: false,
        reason: `Master has ${live.length} Instance(s) — detach or remove them first`,
      }
    }
    next.masters = (next.masters ?? []).filter((m) => m.id !== op.masterId)
    if (!next.masters.length) delete next.masters
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'restore_master') {
    if (!op.master?.id?.trim() || !op.master.root?.id || !op.master.root?.type) {
      return { ok: false, reason: 'restore_master requires master id and root' }
    }
    const name = op.master.name?.trim()
    if (!name) return { ok: false, reason: 'Master name required' }
    const master = structuredClone(op.master)
    master.name = name
    const masters = [...(next.masters ?? [])]
    const existingIdx = masters.findIndex((m) => m.id === master.id)
    if (existingIdx >= 0) {
      masters[existingIdx] = master
    } else {
      const index =
        typeof op.index === 'number' && Number.isInteger(op.index) && op.index >= 0
          ? Math.min(op.index, masters.length)
          : masters.length
      masters.splice(index, 0, master)
    }
    next.masters = masters
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'insert_instance') {
    const master = next.masters?.find((m) => m.id === op.masterId)
    if (!master) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const parent = findNode(next.root, op.parentId)
    if (!parent) return { ok: false, reason: `Unknown parent: ${op.parentId}` }
    if (isInstanceNode(parent)) {
      return { ok: false, reason: 'Cannot insert into Instance — edit the Master or Detach' }
    }
    if (parent.id !== next.root.id && !isSceneContainerType(parent.type)) {
      return { ok: false, reason: 'Parent must be a container' }
    }
    const defaultVariantId = master.variants?.length
      ? master.defaultVariantId ?? master.variants[0]?.id
      : undefined
    const child = makeInstanceRef(
      op.masterId,
      op.name?.trim() || master.name,
      defaultVariantId,
    )
    if (op.props && Object.keys(op.props).length) {
      child.instanceOverrides = { props: { ...op.props } }
    }
    const children = [...(parent.children ?? [])]
    const index =
      op.index == null ? children.length : Math.max(0, Math.min(op.index, children.length))
    children.splice(index, 0, child)
    parent.children = children
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'detach_instance') {
    const node = findNode(next.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    if (!isInstanceNode(node)) {
      return { ok: false, reason: 'detach_instance requires an Instance' }
    }
    if (op.nodeId === next.root.id) {
      return { ok: false, reason: 'Cannot detach root' }
    }
    const located = findParent(next.root, op.nodeId)
    if (!located) return { ok: false, reason: 'Cannot detach root' }
    const free = expandToDetachedTree(node, next.masters)
    if (!free) return { ok: false, reason: `Unknown master: ${node.instanceOf}` }
    const siblings = [...(located.parent.children ?? [])]
    siblings[located.index] = free
    located.parent.children = siblings
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'update_master_root') {
    const master = next.masters?.find((m) => m.id === op.masterId)
    if (!master) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    if (!op.root?.id || !op.root?.type) {
      return { ok: false, reason: 'Master root requires id and type' }
    }
    const root = structuredClone(op.root)
    master.root = root
    if (master.variants?.length) {
      const defaultId = master.defaultVariantId ?? master.variants[0]!.id
      master.defaultVariantId = defaultId
      master.variants = master.variants.map((v) =>
        v.id === defaultId ? { ...v, root: structuredClone(root) } : v,
      )
    }
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'add_master_variant') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const name = op.name.trim()
    if (!name) return { ok: false, reason: 'Variant name required' }
    let master = next.masters[idx]!
    if (variantNameTaken(master, name)) {
      return { ok: false, reason: `Variant name already used: ${name}` }
    }
    master = materializeMasterVariants(master)
    const fromId = op.fromVariantId ?? master.defaultVariantId
    const source = resolveMasterVariant(master, fromId)
    const variantId = createMasterVariantId()
    const combination =
      master.axes?.length === 1 && master.axes[0]
        ? { [master.axes[0].id]: name }
        : undefined
    // When cloning into a single Variant-axis Master, also register the new name as a value.
    if (combination && master.axes?.[0] && !master.axes[0].values.includes(name)) {
      master = {
        ...master,
        axes: master.axes.map((a, i) =>
          i === 0 ? { ...a, values: [...a.values, name] } : a,
        ),
      }
    }
    const newVariant = {
      id: variantId,
      name,
      root: cloneSceneNodeWithNewIds(source.root),
      ...(combination ? { combination } : {}),
    }
    master = {
      ...master,
      variants: [...(master.variants ?? []), newVariant],
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'rename_master_variant') {
    const master = next.masters?.find((m) => m.id === op.masterId)
    if (!master) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    if (!master.variants?.length) {
      return { ok: false, reason: 'Master has no variants to rename' }
    }
    const name = op.name.trim()
    if (!name) return { ok: false, reason: 'Variant name required' }
    if (variantNameTaken(master, name, op.variantId)) {
      return { ok: false, reason: `Variant name already used: ${name}` }
    }
    const variant = master.variants.find((v) => v.id === op.variantId)
    if (!variant) return { ok: false, reason: `Unknown variant: ${op.variantId}` }
    const prevName = variant.name
    variant.name = name
    // Keep Phase-2 migrate axis combination + values in sync when renaming.
    if (master.axes?.length === 1 && master.axes[0] && variant.combination) {
      const axis = master.axes[0]
      const axisId = axis.id
      if (variant.combination[axisId] === prevName || !variant.combination[axisId]) {
        variant.combination = { ...variant.combination, [axisId]: name }
      }
      if (!axis.values.includes(name)) {
        master.axes = master.axes.map((a) =>
          a.id === axisId
            ? {
                ...a,
                values: a.values.map((v) => (v === prevName ? name : v)).concat(
                  a.values.includes(prevName) ? [] : [name],
                ),
              }
            : a,
        )
        // Dedupe after map-replace
        const values = [...new Set(master.axes.find((a) => a.id === axisId)!.values)]
        master.axes = master.axes.map((a) => (a.id === axisId ? { ...a, values } : a))
      } else if (axis.values.includes(prevName) && prevName !== name) {
        const stillUsed = master.variants.some(
          (v) => v.id !== op.variantId && v.combination?.[axisId] === prevName,
        )
        if (!stillUsed) {
          master.axes = master.axes.map((a) =>
            a.id === axisId
              ? { ...a, values: a.values.map((v) => (v === prevName ? name : v)) }
              : a,
          )
        }
      }
    }
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'delete_master_variant') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    let master = next.masters[idx]!
    if (!master.variants?.length) {
      return { ok: false, reason: 'Master has no variants to delete' }
    }
    if (master.variants.length <= 1) {
      return { ok: false, reason: 'Master must keep at least one variant' }
    }
    if (!master.variants.some((v) => v.id === op.variantId)) {
      return { ok: false, reason: `Unknown variant: ${op.variantId}` }
    }
    const live = collectInstanceRefsInScene(next, op.masterId).filter(
      (n) => n.instanceVariantId === op.variantId,
    )
    if (live.length) {
      return {
        ok: false,
        reason: `Variant has ${live.length} Instance(s) — reassign or detach them first`,
      }
    }
    const variants = master.variants.filter((v) => v.id !== op.variantId)
    const defaultVariantId =
      master.defaultVariantId === op.variantId
        ? variants[0]!.id
        : master.defaultVariantId && variants.some((v) => v.id === master.defaultVariantId)
          ? master.defaultVariantId
          : variants[0]!.id
    const def = variants.find((v) => v.id === defaultVariantId)!
    master = {
      ...master,
      variants,
      defaultVariantId,
      root: structuredClone(def.root),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'set_master_default_variant') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    let master = next.masters[idx]!
    master = materializeMasterVariants(master)
    const variant = master.variants?.find((v) => v.id === op.variantId)
    if (!variant) return { ok: false, reason: `Unknown variant: ${op.variantId}` }
    master = {
      ...master,
      defaultVariantId: variant.id,
      root: structuredClone(variant.root),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'set_instance_variant') {
    const nested = resolveDescendantWriteTarget(next.root, op.nodeId)
    const node = nested
      ? nestedInstanceInHostDefinition(next, nested.host, nested.suffix)
      : findNode(next.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    if (!isInstanceNode(node)) {
      return { ok: false, reason: 'set_instance_variant requires an Instance' }
    }
    const master = next.masters?.find((m) => m.id === node.instanceOf)
    if (!master) return { ok: false, reason: `Unknown master: ${node.instanceOf}` }
    const variants = listMasterVariants(master)
    const hit = variants.find((v) => v.id === op.variantId)
    if (!hit) {
      return { ok: false, reason: `Unknown variant: ${op.variantId}` }
    }
    if (nested) {
      const axes = hit.combination ? { ...hit.combination } : undefined
      writeDescendantOverride(nested.host, nested.suffix, {
        instanceVariantId: op.variantId,
        ...(axes ? { instanceVariantAxes: axes } : {}),
      })
      return { ok: true, scene: touch(next) }
    }
    node.instanceVariantId = op.variantId
    if (hit.combination) {
      node.instanceVariantAxes = { ...hit.combination }
    }
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'update_master_variant_root') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    if (!op.root?.id || !op.root?.type) {
      return { ok: false, reason: 'Master variant root requires id and type' }
    }
    let master = next.masters[idx]!
    master = materializeMasterVariants(master)
    if (!master.variants?.some((v) => v.id === op.variantId)) {
      return { ok: false, reason: `Unknown variant: ${op.variantId}` }
    }
    const root = structuredClone(op.root)
    master = {
      ...master,
      variants: master.variants!.map((v) =>
        v.id === op.variantId ? { ...v, root } : v,
      ),
      ...(master.defaultVariantId === op.variantId ||
      (!master.defaultVariantId && master.variants![0]?.id === op.variantId)
        ? { root: structuredClone(root) }
        : {}),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'add_master_axis') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const name = op.name.trim()
    if (!name) return { ok: false, reason: 'Axis name required' }
    let master = materializeMasterVariants(next.masters[idx]!)
    const values = (op.values ?? [])
      .map((v) => v.trim())
      .filter(Boolean)
    const axisValues = values.length ? values : ['Default']
    const axisId = createMasterAxisId()
    const axes = [...(master.axes ?? []), { id: axisId, name, values: axisValues }]
    const defaultValue = axisValues[0]!
    const variants = (master.variants ?? []).map((v) => ({
      ...v,
      combination: { ...(v.combination ?? {}), [axisId]: defaultValue },
    }))
    master = { ...master, axes, variants }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'rename_master_axis') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const name = op.name.trim()
    if (!name) return { ok: false, reason: 'Axis name required' }
    let master = next.masters[idx]!
    if (!master.axes?.some((a) => a.id === op.axisId)) {
      return { ok: false, reason: `Unknown axis: ${op.axisId}` }
    }
    master = {
      ...master,
      axes: master.axes!.map((a) => (a.id === op.axisId ? { ...a, name } : a)),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'delete_master_axis') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    let master = next.masters[idx]!
    if (!master.axes?.some((a) => a.id === op.axisId)) {
      return { ok: false, reason: `Unknown axis: ${op.axisId}` }
    }
    const remainingAxes = master.axes!.filter((a) => a.id !== op.axisId)
    const remainingIds = remainingAxes.map((a) => a.id)
    const stripped = (master.variants ?? []).map((v) => {
      if (!v.combination) return v
      const combination = { ...v.combination }
      delete combination[op.axisId]
      return {
        ...v,
        combination: Object.keys(combination).length ? combination : undefined,
      }
    })
    // Reject if stripping would leave ambiguous cells (same remaining combination).
    if (remainingIds.length) {
      const keys = new Set<string>()
      for (const v of stripped) {
        const key = remainingIds.map((id) => `${id}=${v.combination?.[id] ?? ''}`).join('|')
        if (keys.has(key)) {
          return {
            ok: false,
            reason: 'Deleting this axis would leave ambiguous cells — resolve duplicates first',
          }
        }
        keys.add(key)
      }
    }
    master = {
      ...master,
      axes: remainingAxes.length ? remainingAxes : undefined,
      variants: stripped,
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'add_master_axis_value') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const value = op.value.trim()
    if (!value) return { ok: false, reason: 'Axis value required' }
    let master = next.masters[idx]!
    const axis = master.axes?.find((a) => a.id === op.axisId)
    if (!axis) return { ok: false, reason: `Unknown axis: ${op.axisId}` }
    if (axis.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      return { ok: false, reason: `Axis value already used: ${value}` }
    }
    // Sparse: append value only — do not auto-create cells.
    master = {
      ...master,
      axes: master.axes!.map((a) =>
        a.id === op.axisId ? { ...a, values: [...a.values, value] } : a,
      ),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'rename_master_axis_value') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    const toValue = op.toValue.trim()
    if (!toValue) return { ok: false, reason: 'Axis value required' }
    let master = next.masters[idx]!
    const axis = master.axes?.find((a) => a.id === op.axisId)
    if (!axis) return { ok: false, reason: `Unknown axis: ${op.axisId}` }
    if (!axis.values.includes(op.fromValue)) {
      return { ok: false, reason: `Unknown axis value: ${op.fromValue}` }
    }
    if (
      toValue.toLowerCase() !== op.fromValue.toLowerCase() &&
      axis.values.some((v) => v.toLowerCase() === toValue.toLowerCase())
    ) {
      return { ok: false, reason: `Axis value already used: ${toValue}` }
    }
    master = {
      ...master,
      axes: master.axes!.map((a) =>
        a.id === op.axisId
          ? { ...a, values: a.values.map((v) => (v === op.fromValue ? toValue : v)) }
          : a,
      ),
      variants: (master.variants ?? []).map((v) => {
        if (v.combination?.[op.axisId] !== op.fromValue) return v
        return {
          ...v,
          combination: { ...v.combination, [op.axisId]: toValue },
          name:
            v.combination && Object.keys(v.combination).length
              ? cellNameFromCombination(master, {
                  ...v.combination,
                  [op.axisId]: toValue,
                })
              : v.name,
        }
      }),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'delete_master_axis_value') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    let master = next.masters[idx]!
    const axis = master.axes?.find((a) => a.id === op.axisId)
    if (!axis) return { ok: false, reason: `Unknown axis: ${op.axisId}` }
    if (!axis.values.includes(op.value)) {
      return { ok: false, reason: `Unknown axis value: ${op.value}` }
    }
    if (axis.values.length <= 1) {
      return { ok: false, reason: 'Axis must keep at least one value' }
    }
    const cellsUsing = (master.variants ?? []).filter(
      (v) => v.combination?.[op.axisId] === op.value,
    )
    const live = collectInstanceRefsInScene(next, op.masterId).filter((n) => {
      if (n.instanceVariantAxes?.[op.axisId] === op.value) return true
      if (n.instanceVariantId && cellsUsing.some((c) => c.id === n.instanceVariantId)) {
        return true
      }
      return false
    })
    if (live.length) {
      return {
        ok: false,
        reason: `Axis value has ${live.length} Instance(s) — reassign or detach them first`,
      }
    }
    const variants = (master.variants ?? []).filter(
      (v) => v.combination?.[op.axisId] !== op.value,
    )
    if (!variants.length) {
      return { ok: false, reason: 'Master must keep at least one variant cell' }
    }
    const defaultVariantId =
      master.defaultVariantId && variants.some((v) => v.id === master.defaultVariantId)
        ? master.defaultVariantId
        : variants[0]!.id
    const def = variants.find((v) => v.id === defaultVariantId)!
    master = {
      ...master,
      axes: master.axes!.map((a) =>
        a.id === op.axisId
          ? { ...a, values: a.values.filter((v) => v !== op.value) }
          : a,
      ),
      variants,
      defaultVariantId,
      root: structuredClone(def.root),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'set_instance_variant_axes') {
    const nested = resolveDescendantWriteTarget(next.root, op.nodeId)
    const node = nested
      ? nestedInstanceInHostDefinition(next, nested.host, nested.suffix)
      : findNode(next.root, op.nodeId)
    if (!node) return { ok: false, reason: `Unknown node: ${op.nodeId}` }
    if (!isInstanceNode(node)) {
      return { ok: false, reason: 'set_instance_variant_axes requires an Instance' }
    }
    const master = next.masters?.find((m) => m.id === node.instanceOf)
    if (!master) return { ok: false, reason: `Unknown master: ${node.instanceOf}` }
    const migrated = migrateMasterAxesFromPhase2(master)
    if (!migrated.axes?.length) {
      return { ok: false, reason: 'Master has no axes' }
    }
    for (const axis of migrated.axes) {
      const pick = op.axes[axis.id]
      if (!pick || !axis.values.includes(pick)) {
        return { ok: false, reason: `Invalid value for axis ${axis.name}` }
      }
    }
    const axesPick: Record<string, string> = {}
    for (const axis of migrated.axes) {
      axesPick[axis.id] = op.axes[axis.id]!
    }
    const resolved = resolveMasterVariantForInstance(migrated, {
      instanceVariantAxes: axesPick,
      instanceVariantId: node.instanceVariantId,
    })
    if (nested) {
      writeDescendantOverride(nested.host, nested.suffix, {
        instanceVariantAxes: axesPick,
        instanceVariantId: resolved.id,
      })
      return { ok: true, scene: touch(next) }
    }
    node.instanceVariantAxes = axesPick
    node.instanceVariantId = resolved.id
    return { ok: true, scene: touch(next) }
  }

  if (op.op === 'upsert_master_variant_cell') {
    const idx = next.masters?.findIndex((m) => m.id === op.masterId) ?? -1
    if (idx < 0 || !next.masters) return { ok: false, reason: `Unknown master: ${op.masterId}` }
    let master = materializeMasterVariants(next.masters[idx]!)
    if (!master.axes?.length) {
      return { ok: false, reason: 'Master has no axes — add axes before cells' }
    }
    for (const axis of master.axes) {
      const pick = op.combination[axis.id]
      if (!pick || !axis.values.includes(pick)) {
        return { ok: false, reason: `Invalid combination for axis ${axis.name}` }
      }
    }
    const combination: Record<string, string> = {}
    for (const axis of master.axes) {
      combination[axis.id] = op.combination[axis.id]!
    }
    const existing = findVariantByCombination(master, combination)
    if (existing) {
      // Already present — dual-write root when it is the default cell.
      if (existing.id === master.defaultVariantId) {
        master = { ...master, root: structuredClone(existing.root) }
        next.masters[idx] = master
      }
      return { ok: true, scene: touch(next) }
    }
    const fromId = op.fromVariantId ?? master.defaultVariantId
    const source = resolveMasterVariant(master, fromId)
    const name = (op.name?.trim() || cellNameFromCombination(master, combination)).trim()
    const variantId = createMasterVariantId()
    const newVariant = {
      id: variantId,
      name,
      root: cloneSceneNodeWithNewIds(source.root),
      combination,
    }
    const variants = [...(master.variants ?? []), newVariant]
    const isFirstCell = variants.length === 1
    master = {
      ...master,
      variants,
      ...(isFirstCell
        ? { defaultVariantId: variantId, root: structuredClone(newVariant.root) }
        : {}),
    }
    next.masters[idx] = master
    return { ok: true, scene: touch(next) }
  }

  return { ok: false, reason: 'Unsupported op' }
}

export function findMasterBySourceKey(
  masters: CompositionScene['masters'],
  sourceKey: string,
): NonNullable<CompositionScene['masters']>[number] | undefined {
  const key = sourceKey.trim()
  if (!key) return undefined
  return masters?.find((m) => m.sourceKey === key)
}

/**
 * Editor open: ensure Masters for every Site Kit palette atom (list only — no canvas Instances).
 * Existing `sourceKey` Masters keep their root (scene wins). Does not bump `updatedAt`.
 */
export function seedSiteKitPaletteMasters(scene: CompositionScene): CompositionScene {
  const additions: NonNullable<CompositionScene['masters']> = []
  let masters = [...(scene.masters ?? [])]
  let changed = false

  for (const type of SITE_KIT_PALETTE_IDS) {
    const existing = findMasterBySourceKey(masters, type)
    if (existing) {
      const defaults = defaultChildForType(type)
      let soft = softFillTokenBindings(existing.root, defaults.tokenBindings ?? {})
      soft = softFillInteractiveStates(soft, defaults.states ?? {})
      soft = applySiteKitResponsiveDefaults(soft)
      const base = soft !== existing.root ? { ...existing, root: soft } : existing
      const withVariants = softFillStarterMasterVariants(base)
      if (withVariants !== existing) {
        masters = masters.map((m) => (m.id === existing.id ? withVariants : m))
        changed = true
      }
      continue
    }
    if (findMasterBySourceKey(additions, type)) continue
    const name = type.replace(/^Site/, '') || type
    const root = applySiteKitResponsiveDefaults(
      cloneSceneNodeWithDeterministicIds(defaultChildForType(type), `mroot-${type}`),
    )
    additions.push(
      softFillStarterMasterVariants({
        id: paletteMasterId(type),
        name,
        sourceKey: type,
        // Deterministic tree ids — createEditorBoot runs on SSR + client.
        root,
      }),
    )
  }
  if (!additions.length && !changed) return scene
  return {
    ...scene,
    masters: [...masters, ...additions],
  }
}

/** Merge default binding paths only where the node is missing keys (existing keys win). */
export function softFillTokenBindings(
  root: SceneNode,
  defaults: Record<string, string>,
): SceneNode {
  const keys = Object.keys(defaults)
  if (!keys.length) return root
  const existing = root.tokenBindings ?? {}
  let missing = false
  for (const key of keys) {
    if (!(key in existing)) {
      missing = true
      break
    }
  }
  if (!missing) return root
  return { ...root, tokenBindings: { ...defaults, ...existing } }
}

type InteractiveStateKey = Exclude<SceneStateId, 'default'>

/**
 * Soft-fill interactive state overrides (hover/focus/active/disabled).
 * Existing state keys and existing binding keys within a state win.
 */
export function softFillInteractiveStates(
  root: SceneNode,
  defaults: Partial<Record<InteractiveStateKey, SceneStateOverride>>,
): SceneNode {
  const entries = Object.entries(defaults) as [InteractiveStateKey, SceneStateOverride][]
  if (!entries.length) return root

  const existing = root.states ?? {}
  let changed = false
  const next: NonNullable<SceneNode['states']> = { ...existing }

  for (const [state, override] of entries) {
    const cur = existing[state]
    if (!cur) {
      next[state] = override
      changed = true
      continue
    }
    const defBindings = override.tokenBindings ?? {}
    const curBindings = cur.tokenBindings ?? {}
    let missingBinding = false
    for (const key of Object.keys(defBindings)) {
      if (!(key in curBindings)) {
        missingBinding = true
        break
      }
    }
    if (!missingBinding) continue
    next[state] = {
      ...cur,
      tokenBindings: { ...defBindings, ...curBindings },
    }
    changed = true
  }

  if (!changed) return root
  return { ...root, states: next }
}

/**
 * Palette Hydrate: ensure Master by sourceKey (scene wins if exists), then insert Instance.
 * Print auto-wrap wraps the Instance (not expanded children). Returns selectId of the Instance.
 */
export function applyPaletteHydrateInsert(
  scene: CompositionScene,
  opts: {
    sourceKey: string
    root: SceneNode
    name?: string
    parentId: SceneNodeId
    index?: number
  },
): SceneOpResult & { selectId?: string } {
  const ensured = applySceneOp(scene, {
    op: 'ensure_palette_master',
    sourceKey: opts.sourceKey,
    root: opts.root,
    name: opts.name,
  })
  if (!ensured.ok) return ensured
  const master = findMasterBySourceKey(ensured.scene.masters, opts.sourceKey)
  if (!master) {
    return { ok: false, reason: `Master missing after ensure: ${opts.sourceKey}` }
  }

  let parentId = opts.parentId
  let index = opts.index
  let working = ensured.scene

  const atomType = opts.sourceKey.startsWith('Composition:') ? '' : opts.sourceKey
  const needsPrintWrap =
    Boolean(atomType) &&
    atomType !== 'PrintPage' &&
    isPrintPaletteType(atomType) &&
    !hasAncestorType(working.root, parentId, 'PrintPage')

  if (needsPrintWrap) {
    const page = defaultChildForType('PrintPage')
    const chrome = (page.children ?? []).filter((child) => slotOf(child) !== 'body')
    page.children = chrome
    const wrapped = applySceneOp(working, {
      op: 'insert_child',
      parentId,
      index,
      child: page,
    })
    if (!wrapped.ok) return wrapped
    working = wrapped.scene
    parentId = page.id
    index = undefined
  }

  const inserted =
    atomType === 'SiteChart' || atomType === 'SiteGauge'
      ? // Fixture data-viz atoms: free nodes so Chart type / series stick on the node.
        // Shared palette Masters made Instance `variant` writes look like they snapped back to bar.
        applySceneOp(working, {
          op: 'insert_child',
          parentId,
          index,
          child: cloneSceneNodeWithNewIds(opts.root),
        })
      : applySceneOp(working, {
          op: 'insert_instance',
          masterId: master.id,
          parentId,
          index,
        })
  if (!inserted.ok) return inserted
  const parent = findNode(inserted.scene.root, parentId)
  const children = parent?.children ?? []
  const selectIndex =
    index == null
      ? children.length - 1
      : Math.max(0, Math.min(index, children.length - 1))
  const selectId = children[selectIndex]?.id
  return { ok: true, scene: inserted.scene, selectId }
}

/**
 * Palette hydrate while Master-Edit is open: ensure Kit Master on the scene,
 * then insert into the **edited** Master's working root (section / composition).
 * Palette atom Masters are sealed — reject with a human-readable reason.
 */
export function applyPaletteHydrateInsertIntoMaster(
  scene: CompositionScene,
  editingMasterId: string,
  editingVariantId: string | undefined,
  opts: {
    sourceKey: string
    root: SceneNode
    name?: string
    parentId: SceneNodeId
    index?: number
  },
): SceneOpResult & { selectId?: string } {
  const editing = scene.masters?.find((m) => m.id === editingMasterId)
  if (!editing) return { ok: false, reason: `Unknown master: ${editingMasterId}` }
  if (!masterEditAllowsPaletteInsert(editing)) {
    return {
      ok: false,
      reason:
        'Site Kit atom Masters are sealed — nest components inside section Masters, or Detach',
    }
  }

  const ensured = applySceneOp(scene, {
    op: 'ensure_palette_master',
    sourceKey: opts.sourceKey,
    root: opts.root,
    name: opts.name,
  })
  if (!ensured.ok) return ensured
  const kitMaster = findMasterBySourceKey(ensured.scene.masters, opts.sourceKey)
  if (!kitMaster) {
    return { ok: false, reason: `Master missing after ensure: ${opts.sourceKey}` }
  }

  const atomType = opts.sourceKey.startsWith('Composition:') ? '' : opts.sourceKey
  const insertOp: SceneOp =
    atomType === 'SiteChart' || atomType === 'SiteGauge'
      ? {
          op: 'insert_child',
          parentId: opts.parentId,
          index: opts.index,
          child: cloneSceneNodeWithNewIds(opts.root),
        }
      : {
          op: 'insert_instance',
          masterId: kitMaster.id,
          parentId: opts.parentId,
          index: opts.index,
        }

  const inserted = applyMasterEditOp(
    ensured.scene,
    editingMasterId,
    insertOp,
    editingVariantId,
  )
  if (!inserted.ok) return inserted

  const working = resolveMasterVariant(
    inserted.scene.masters?.find((m) => m.id === editingMasterId) ?? editing,
    editingVariantId,
  ).root
  const parent = findNode(working, opts.parentId)
  const children = parent?.children ?? []
  const selectIndex =
    opts.index == null
      ? children.length - 1
      : Math.max(0, Math.min(opts.index, children.length - 1))
  const selectId = children[selectIndex]?.id
  return { ok: true, scene: inserted.scene, selectId }
}

/** Apply a scene op against a Master's (active) variant root, then persist. */
export function applyMasterEditOp(
  scene: CompositionScene,
  masterId: string,
  op: SceneOp,
  variantId?: string,
): SceneOpResult {
  const master = scene.masters?.find((m) => m.id === masterId)
  if (!master) return { ok: false, reason: `Unknown master: ${masterId}` }
  if (
    op.op === 'create_master' ||
    op.op === 'delete_master' ||
    op.op === 'restore_master' ||
    op.op === 'rename_master' ||
    op.op === 'bind_master_composition' ||
    op.op === 'detach_instance' ||
    op.op === 'update_master_root' ||
    op.op === 'ensure_palette_master' ||
    op.op === 'add_master_variant' ||
    op.op === 'rename_master_variant' ||
    op.op === 'delete_master_variant' ||
    op.op === 'set_master_default_variant' ||
    op.op === 'set_instance_variant' ||
    op.op === 'update_master_variant_root' ||
    op.op === 'add_master_axis' ||
    op.op === 'rename_master_axis' ||
    op.op === 'delete_master_axis' ||
    op.op === 'add_master_axis_value' ||
    op.op === 'rename_master_axis_value' ||
    op.op === 'delete_master_axis_value' ||
    op.op === 'set_instance_variant_axes' ||
    op.op === 'upsert_master_variant_cell' ||
    op.op === 'add_page' ||
    op.op === 'delete_page' ||
    op.op === 'restore_page' ||
    op.op === 'rename_page' ||
    op.op === 'duplicate_page' ||
    op.op === 'set_active_page' ||
    op.op === 'set_cover_page' ||
    op.op === 'reorder_pages' ||
    op.op === 'move_page_frame' ||
    op.op === 'set_page_frame' ||
    op.op === 'set_page_breakpoint'
  ) {
    return { ok: false, reason: 'Master-edit mode does not support this op' }
  }
  const target = resolveMasterVariant(master, variantId)
  // Omit pages so alignActivePageRoot cannot steal the variant working root
  // (composition-masters.md · Master Edit P78 multi-page).
  // Keep masters for insert_instance so nested Kit Masters resolve by id;
  // the write-back only persists `result.scene.root` onto the edited Master.
  const temp: CompositionScene = {
    ...scene,
    root: structuredClone(target.root),
    masters: op.op === 'insert_instance' ? scene.masters : undefined,
    pages: undefined,
    activePageId: undefined,
    coverPageId: undefined,
  }
  const result = applySceneOp(temp, op)
  if (!result.ok) return result
  if (master.variants?.length) {
    return applySceneOp(scene, {
      op: 'update_master_variant_root',
      masterId,
      variantId: target.id,
      root: result.scene.root,
    })
  }
  return applySceneOp(scene, {
    op: 'update_master_root',
    masterId,
    root: result.scene.root,
  })
}

