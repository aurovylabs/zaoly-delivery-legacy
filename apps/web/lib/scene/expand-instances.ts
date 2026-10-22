/**
 * Expand Instance refs for paint / layers (`specs/domain/composition-masters.md`).
 */
import type {
  CompositionScene,
  SceneInstanceOverrides,
  SceneMaster,
  SceneNode,
  SceneNodeId,
} from '@zaoly/contracts'
import { activePageRoot } from './scene-pages'
import {
  SCENE_BOARD_FRAME_PREFIX,
  boardPagesForScene,
  findPageBodyInBoard,
  isBoardPagePlaceholderBody,
  isSceneBoardNodeId,
  pageIdFromBoardFrameNodeId,
  sceneBoardFrameNodeId,
} from './scene-board'
import {
  MASTER_BOARD_TILE_PREFIX,
  resolveMasterDefinitionRootForInstance,
  resolveMasterVariantForInstance,
} from './master-variants'
import { BREAKPOINT_BOARD_TILE_PREFIX } from './breakpoint-board'
import {
  applyDescendantOverridesToExpanded,
  bakeDescendantsIntoDefinition,
  stampDescendantInstanceVariantPicks,
} from './instance-descendants'

export const INSTANCE_TYPE = 'Instance' as const

let expandSeq = 0

function freshId(prefix: string): SceneNodeId {
  expandSeq += 1
  return `${prefix}-${Date.now().toString(36)}-${expandSeq}`
}

/** Deterministic expand id for a definition node under an Instance (P78). */
export function stableExpandDescendantId(
  instanceId: SceneNodeId,
  definitionNodeId: SceneNodeId,
): SceneNodeId {
  return `${instanceId}::${definitionNodeId}`
}

/** Deep-clone with ids namespaced by instance id (stable across re-expand). */
function cloneWithStableIds(node: SceneNode, instanceId: SceneNodeId): SceneNode {
  const next: SceneNode = {
    id: stableExpandDescendantId(instanceId, node.id),
    type: node.type,
  }
  if (node.name != null) next.name = node.name
  if (node.props) next.props = { ...node.props }
  if (node.style) next.style = { ...node.style }
  if (node.tokenBindings) next.tokenBindings = { ...node.tokenBindings }
  if (node.breakpoints) next.breakpoints = structuredClone(node.breakpoints)
  if (node.hidden) next.hidden = true
  if (node.locked) next.locked = true
  if (node.instanceOf) next.instanceOf = node.instanceOf
  if (node.instanceVariantId) next.instanceVariantId = node.instanceVariantId
  if (node.instanceVariantAxes) next.instanceVariantAxes = { ...node.instanceVariantAxes }
  if (node.instanceOverrides) next.instanceOverrides = structuredClone(node.instanceOverrides)
  if (node.children?.length) {
    next.children = node.children.map((c) => cloneWithStableIds(c, instanceId))
  }
  return next
}

/** Deep-clone with fresh ids (detach write — not paint expand). */
function cloneWithNewIds(node: SceneNode): SceneNode {
  const next: SceneNode = {
    id: freshId(node.type.toLowerCase()),
    type: node.type,
  }
  if (node.name != null) next.name = node.name
  if (node.props) next.props = { ...node.props }
  if (node.style) next.style = { ...node.style }
  if (node.tokenBindings) next.tokenBindings = { ...node.tokenBindings }
  if (node.breakpoints) next.breakpoints = structuredClone(node.breakpoints)
  if (node.hidden) next.hidden = true
  if (node.locked) next.locked = true
  if (node.instanceOf) next.instanceOf = node.instanceOf
  if (node.instanceVariantId) next.instanceVariantId = node.instanceVariantId
  if (node.instanceVariantAxes) next.instanceVariantAxes = { ...node.instanceVariantAxes }
  if (node.instanceOverrides) next.instanceOverrides = structuredClone(node.instanceOverrides)
  if (node.children?.length) {
    next.children = node.children.map(cloneWithNewIds)
  }
  return next
}

export function isInstanceNode(node: SceneNode): boolean {
  return node.type === INSTANCE_TYPE && typeof node.instanceOf === 'string' && !!node.instanceOf
}

export function findMaster(
  masters: SceneMaster[] | undefined,
  masterId: string,
): SceneMaster | undefined {
  return masters?.find((m) => m.id === masterId)
}

export function walkSceneNodes(root: SceneNode, visit: (n: SceneNode) => void): void {
  visit(root)
  for (const child of root.children ?? []) walkSceneNodes(child, visit)
}

export function collectInstanceRefs(root: SceneNode, masterId?: string): SceneNode[] {
  const out: SceneNode[] = []
  walkSceneNodes(root, (n) => {
    if (!isInstanceNode(n)) return
    if (masterId && n.instanceOf !== masterId) return
    out.push(n)
  })
  return out
}

function mergeOverrides(base: SceneNode, overrides?: SceneInstanceOverrides): SceneNode {
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
  if (overrides.props) next.props = { ...(base.props ?? {}), ...overrides.props }
  if (overrides.tokenBindings) {
    next.tokenBindings = { ...(base.tokenBindings ?? {}), ...overrides.tokenBindings }
  }
  if (overrides.style) next.style = { ...(base.style ?? {}), ...overrides.style }
  return next
}

/**
 * Clone Master (variant) root with fresh descendant ids; keep instance `id` on the expanded root.
 * Preserves `instanceOf` on the root for Inspect/Layers chips.
 */
export function expandInstanceNode(
  instance: SceneNode,
  masters: SceneMaster[] | undefined,
  options?: { circularMasterId?: string },
): SceneNode {
  if (!isInstanceNode(instance)) return instance
  const master = findMaster(masters, instance.instanceOf!)
  if (!master) {
    return {
      id: instance.id,
      type: INSTANCE_TYPE,
      name: instance.name ?? 'Missing master',
      instanceOf: instance.instanceOf,
      ...(instance.instanceVariantId
        ? { instanceVariantId: instance.instanceVariantId }
        : {}),
      ...(instance.instanceVariantAxes
        ? { instanceVariantAxes: { ...instance.instanceVariantAxes } }
        : {}),
      props: { children: `Missing master: ${instance.instanceOf}` },
    }
  }
  if (options?.circularMasterId === instance.instanceOf) {
    return {
      id: instance.id,
      type: INSTANCE_TYPE,
      name: instance.name ?? 'Circular master',
      instanceOf: instance.instanceOf,
      ...(instance.instanceVariantId
        ? { instanceVariantId: instance.instanceVariantId }
        : {}),
      ...(instance.instanceVariantAxes
        ? { instanceVariantAxes: { ...instance.instanceVariantAxes } }
        : {}),
      props: { children: `Circular master reference: ${instance.instanceOf}` },
    }
  }
  const resolved = resolveMasterVariantForInstance(master, instance)
  const definition = resolved.root
  const cloned = cloneWithStableIds(definition, instance.id)
  const merged = mergeOverrides(cloned, instance.instanceOverrides)
  return {
    ...merged,
    id: instance.id,
    instanceOf: instance.instanceOf,
    instanceVariantId: resolved.id,
    ...(instance.instanceVariantAxes
      ? { instanceVariantAxes: { ...instance.instanceVariantAxes } }
      : resolved.combination
        ? { instanceVariantAxes: { ...resolved.combination } }
        : {}),
    name: instance.instanceOverrides?.name ?? instance.name ?? master.name ?? merged.name,
  }
}

export function expandSceneTree(
  root: SceneNode,
  masters: SceneMaster[] | undefined,
  expandingMasterIds: Set<string> = new Set(),
): SceneNode {
  if (isInstanceNode(root)) {
    const masterId = root.instanceOf!
    const circular = expandingMasterIds.has(masterId)
    const expanded = expandInstanceNode(root, masters, {
      circularMasterId: circular ? masterId : undefined,
    })
    const nextExpanding = new Set(expandingMasterIds)
    if (!circular) nextExpanding.add(masterId)
    const stampedChildren = (expanded.children ?? []).map((c) =>
      stampDescendantInstanceVariantPicks(c, root.id, root.instanceOverrides?.descendants),
    )
    const withChildren: SceneNode = {
      ...expanded,
      children: stampedChildren.map((c) => expandSceneTree(c, masters, nextExpanding)),
    }
    return applyDescendantOverridesToExpanded(
      withChildren,
      root.id,
      root.instanceOverrides?.descendants,
    )
  }
  return {
    ...root,
    children: (root.children ?? []).map((c) => expandSceneTree(c, masters, expandingMasterIds)),
  }
}

/** Instance refs left after expand (missing master, cycle, or empty masters list). */
export function collectUnresolvedInstances(root: SceneNode): SceneNode[] {
  const out: SceneNode[] = []
  walkSceneNodes(root, (n) => {
    if (isInstanceNode(n)) out.push(n)
  })
  return out
}

export function expandCompositionScene(scene: CompositionScene): SceneNode {
  return expandSceneTree(activePageRoot(scene), scene.masters)
}

/**
 * Node to drive Inspect field catalog: Instances show Master definition + overrides
 * (page edit mode), while persisting still targets the Instance id / overrides.
 */
export function resolveInspectSubject(
  scene: CompositionScene,
  nodeId: SceneNodeId | null,
): SceneNode | null {
  if (!nodeId) return null
  const persisted = findNodeInTree(activePageRoot(scene), nodeId)
  if (persisted) {
    if (isInstanceNode(persisted)) {
      return expandInstanceNode(persisted, scene.masters)
    }
    return persisted
  }
  const expanded = expandCompositionScene(scene)
  return findNodeInTree(expanded, nodeId)
}

/**
 * Inspect subject inside Master-Edit: expand nested palette Instances for field catalog.
 */
export function resolveMasterEditInspectSubject(
  variantRoot: SceneNode,
  nodeId: SceneNodeId | null,
  masters: SceneMaster[] | undefined,
): SceneNode | null {
  if (!nodeId) return null
  let persisted = findNodeInTree(variantRoot, nodeId)
  if (!persisted && masters?.length) {
    const expanded = expandSceneTree(variantRoot, masters)
    const mappedId = resolvePersistedSelectionId(variantRoot, expanded, nodeId)
    persisted = findNodeInTree(variantRoot, mappedId)
  }
  if (!persisted) return null
  if (isInstanceNode(persisted)) {
    return expandInstanceNode(persisted, masters)
  }
  return persisted
}

/** Paint scene board with Instance refs expanded in every page frame body. */
export function expandSceneBoardForPaint(
  board: SceneNode,
  masters: SceneMaster[] | undefined,
): SceneNode {
  if (!masters?.length) return board
  return {
    ...board,
    children: (board.children ?? []).map((frame) => {
      if (!frame.id.startsWith(SCENE_BOARD_FRAME_PREFIX)) return frame
      const body = frame.children?.[1]
      if (!body || isBoardPagePlaceholderBody(body)) return frame
      const nextChildren = [...(frame.children ?? [])]
      nextChildren[1] = expandSceneTree(body, masters)
      return { ...frame, children: nextChildren }
    }),
  }
}

/** Map expanded board click id to persisted page / frame selection id. */
export function resolveSceneBoardSelectionId(
  scene: CompositionScene,
  paintedBoard: SceneNode,
  clickedId: SceneNodeId,
  masters: SceneMaster[] | undefined,
): SceneNodeId {
  if (isSceneBoardNodeId(clickedId)) {
    const pageId = pageIdFromBoardFrameNodeId(clickedId)
    if (pageId) return sceneBoardFrameNodeId(pageId)
    return clickedId
  }
  const pages = boardPagesForScene(scene)
  for (const page of pages) {
    const body = findPageBodyInBoard(paintedBoard, page.id)
    if (!body) continue
    const expandedBody = masters?.length ? expandSceneTree(body, masters) : body
    if (findInTree(expandedBody, clickedId) || findInTree(page.root, clickedId)) {
      return resolvePersistedSelectionId(page.root, expandedBody, clickedId)
    }
  }
  return clickedId
}

/** Paint Master-Edit board with nested Instance refs expanded (palette atoms inside custom Masters). */
export function expandMasterVariantBoardForPaint(
  board: SceneNode,
  masters: SceneMaster[] | undefined,
): SceneNode {
  if (!masters?.length) return board

  function expandTileOrRow(node: SceneNode): SceneNode {
    if (node.id.startsWith(MASTER_BOARD_TILE_PREFIX)) {
      const body = node.children?.[1]
      if (!body) return node
      const nextChildren = [...(node.children ?? [])]
      nextChildren[1] = expandSceneTree(body, masters)
      return { ...node, children: nextChildren }
    }
    if (!node.children?.length) return node
    return {
      ...node,
      children: node.children.map(expandTileOrRow),
    }
  }

  return {
    ...board,
    children: (board.children ?? []).map(expandTileOrRow),
  }
}

/** Paint breakpoint compare board — expand Instance refs inside each tile body. */
export function expandBreakpointBoardForPaint(
  board: SceneNode,
  masters: SceneMaster[] | undefined,
): SceneNode {
  if (!masters?.length) return board
  return {
    ...board,
    children: (board.children ?? []).map((tile) => {
      if (!tile.id.startsWith(BREAKPOINT_BOARD_TILE_PREFIX)) return tile
      const body = tile.children?.[1]
      if (!body) return tile
      const pageBody = body.children?.[0]
      if (!pageBody) return tile
      const nextBodyChildren = [...(body.children ?? [])]
      nextBodyChildren[0] = expandSceneTree(pageBody, masters)
      const nextTileChildren = [...(tile.children ?? [])]
      nextTileChildren[1] = { ...body, children: nextBodyChildren }
      return { ...tile, children: nextTileChildren }
    }),
  }
}

function findPath(
  root: SceneNode,
  id: SceneNodeId,
  acc: SceneNode[],
): SceneNode[] | null {
  const next = [...acc, root]
  if (root.id === id) return next
  for (const child of root.children ?? []) {
    const hit = findPath(child, id, next)
    if (hit) return hit
  }
  return null
}

function findInTree(root: SceneNode, id: SceneNodeId): boolean {
  if (root.id === id) return true
  return (root.children ?? []).some((c) => findInTree(c, id))
}

export function findNodeInTree(root: SceneNode, id: SceneNodeId | null): SceneNode | null {
  if (!id) return null
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const hit = findNodeInTree(child, id)
    if (hit) return hit
  }
  return null
}

export function findParentInTree(
  root: SceneNode,
  id: SceneNodeId,
): { parent: SceneNode; index: number } | null {
  if (id === root.id) return null
  const children = root.children ?? []
  for (let i = 0; i < children.length; i += 1) {
    if (children[i].id === id) return { parent: root, index: i }
    const nested = findParentInTree(children[i], id)
    if (nested) return nested
  }
  return null
}

/** Map a click on an expanded descendant to a selectable id (nested Instance or host). */
export function resolvePersistedSelectionId(
  persistedRoot: SceneNode,
  expandedRoot: SceneNode,
  clickedId: SceneNodeId,
): SceneNodeId {
  if (findInTree(persistedRoot, clickedId)) return clickedId
  const path = findPath(expandedRoot, clickedId, [])
  if (!path) return clickedId
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const n = path[i]
    if (!n.instanceOf) continue
    if (findInTree(persistedRoot, n.id)) return n.id
    if (n.id.includes('::')) return n.id
  }
  return clickedId
}

export function makeInstanceRef(
  masterId: string,
  name?: string,
  variantId?: string,
): SceneNode {
  return {
    id: freshId('instance'),
    type: INSTANCE_TYPE,
    name: name || 'Instance',
    instanceOf: masterId,
    ...(variantId ? { instanceVariantId: variantId } : {}),
  }
}

/** Detach: expanded free tree (fresh ids), no instanceOf. */
export function expandToDetachedTree(
  instance: SceneNode,
  masters: SceneMaster[] | undefined,
): SceneNode | null {
  if (!isInstanceNode(instance)) return null
  const master = findMaster(masters, instance.instanceOf!)
  if (!master) return null
  const definition = resolveMasterDefinitionRootForInstance(master, instance)
  const baked = bakeDescendantsIntoDefinition(
    definition,
    instance.instanceOverrides?.descendants,
  )
  const cloned = cloneWithNewIds(baked)
  const merged = mergeOverrides(cloned, instance.instanceOverrides)
  delete merged.instanceOf
  delete merged.instanceOverrides
  delete merged.instanceVariantId
  delete merged.instanceVariantAxes
  return merged
}
