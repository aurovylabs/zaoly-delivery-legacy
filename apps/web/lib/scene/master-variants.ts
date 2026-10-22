/**
 * Master named variants + Component Sets — `specs/domain/composition-masters.md`
 * Phase 2 + Phase 3.
 */
import type {
  SceneMaster,
  SceneMasterAxis,
  SceneMasterVariant,
  SceneNode,
  SceneNodeId,
} from '@zaoly/contracts'
import { isSiteKitPaletteType } from './site-kit-palette'

function findNodeIdInTree(root: SceneNode, id: SceneNodeId): boolean {
  if (root.id === id) return true
  return (root.children ?? []).some((c) => findNodeIdInTree(c, id))
}

/**
 * Site Kit palette atom Masters (sourceKey = SiteButton, …) stay sealed shells.
 * Section / composition / freeform Masters accept nested palette inserts in Master-Edit.
 */
export function masterEditAllowsPaletteInsert(master: SceneMaster): boolean {
  const key = master.sourceKey?.trim()
  if (!key) return true
  if (key.startsWith('Composition:')) return true
  if (isSiteKitPaletteType(key)) return false
  return true
}

/**
 * Map a painted Master-board drop target onto the active variant working root.
 * Board chrome ids (`__master-variant-tile:…`) are not in the working tree.
 */
export function resolveMasterBoardDropTargetId(
  targetId: SceneNodeId,
  workingRoot: SceneNode,
  activeVariantId: string,
): SceneNodeId | null {
  if (findNodeIdInTree(workingRoot, targetId)) return targetId
  if (isMasterBoardAddId(targetId)) return null
  if (masterBoardPlaceholderCombination(targetId)) return null
  const tileVariantId = masterBoardTileVariantId(targetId)
  if (tileVariantId) {
    if (tileVariantId !== activeVariantId) return null
    return workingRoot.id
  }
  if (targetId === MASTER_BOARD_ID || targetId.startsWith(`${MASTER_BOARD_ID}:`)) {
    return workingRoot.id
  }
  return null
}

export const MASTER_BOARD_ID = '__master-variant-board__'
export const MASTER_BOARD_TILE_PREFIX = '__master-variant-tile:'
export const MASTER_BOARD_PLACEHOLDER_PREFIX = '__master-variant-placeholder:'
/** Trailing + tile on Phase-2 / single-axis boards. */
export const MASTER_BOARD_ADD_ID = '__master-variant-add__'
export const DEFAULT_VARIANT_NAME = 'Default'
/** Phase-2 → Phase-3 migrate axis id (idempotent). */
export const PHASE2_MIGRATE_AXIS_ID = 'axis-variant'
export const PHASE2_MIGRATE_AXIS_NAME = 'Variant'
/** Non-blocking Inspect warn when product of axis value counts ≥ this. */
export const MASTER_AXIS_PRODUCT_WARN_AT = 30

let variantSeq = 0
let axisSeq = 0

export function createMasterVariantId(): string {
  variantSeq += 1
  return `mvar-${Date.now().toString(36)}-${variantSeq}`
}

export function createMasterAxisId(): string {
  axisSeq += 1
  return `axis-${Date.now().toString(36)}-${axisSeq}`
}

export function isMasterBoardId(id: SceneNodeId | null | undefined): boolean {
  if (!id) return false
  return (
    id === MASTER_BOARD_ID ||
    id === MASTER_BOARD_ADD_ID ||
    id.startsWith(`${MASTER_BOARD_ADD_ID}:`) ||
    id.startsWith(MASTER_BOARD_TILE_PREFIX) ||
    id.startsWith(MASTER_BOARD_PLACEHOLDER_PREFIX)
  )
}

export function isMasterBoardAddId(id: SceneNodeId | null | undefined): boolean {
  if (!id) return false
  return id === MASTER_BOARD_ADD_ID || id.startsWith(`${MASTER_BOARD_ADD_ID}:`)
}

/** Next unique board/Inspect name for a new Phase-2 variant (`Variant 2`, …). */
export function nextMasterVariantName(master: SceneMaster): string {
  const taken = new Set(
    listMasterVariants(master).map((v) => v.name.trim().toLowerCase()),
  )
  for (const axis of master.axes ?? []) {
    for (const value of axis.values) taken.add(value.trim().toLowerCase())
  }
  let i = 2
  for (;;) {
    const name = `Variant ${i}`
    if (!taken.has(name.toLowerCase())) return name
    i += 1
  }
}

export function masterBoardTileVariantId(id: SceneNodeId): string | null {
  if (!id.startsWith(MASTER_BOARD_TILE_PREFIX)) return null
  const rest = id.slice(MASTER_BOARD_TILE_PREFIX.length)
  const variantId = rest.split(':')[0]
  return variantId || null
}

export function masterBoardPlaceholderCombination(
  id: SceneNodeId,
): Record<string, string> | null {
  if (!id.startsWith(MASTER_BOARD_PLACEHOLDER_PREFIX)) return null
  const encoded = id.slice(MASTER_BOARD_PLACEHOLDER_PREFIX.length)
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof k === 'string' && typeof v === 'string') out[k] = v
    }
    return Object.keys(out).length ? out : null
  } catch {
    return null
  }
}

function placeholderTileId(combination: Record<string, string>): string {
  return `${MASTER_BOARD_PLACEHOLDER_PREFIX}${encodeURIComponent(JSON.stringify(combination))}`
}

/** Effective variant list — MVP masters surface a synthetic Default from `root`. */
export function listMasterVariants(master: SceneMaster): SceneMasterVariant[] {
  if (master.variants?.length) return master.variants
  return [
    {
      id: master.defaultVariantId ?? `${master.id}__default`,
      name: DEFAULT_VARIANT_NAME,
      root: master.root,
    },
  ]
}

export function masterHasAxes(master: SceneMaster): boolean {
  return Boolean(master.axes?.length)
}

export function masterAxisValueProduct(master: SceneMaster): number {
  const axes = master.axes ?? []
  if (!axes.length) return 0
  return axes.reduce((acc, a) => acc * Math.max(1, a.values.length), 1)
}

export function combinationsMatch(
  a: Record<string, string> | undefined,
  b: Record<string, string> | undefined,
  axisIds: string[],
): boolean {
  if (!axisIds.length) return false
  for (const id of axisIds) {
    if ((a?.[id] ?? '') !== (b?.[id] ?? '')) return false
  }
  return true
}

export function findVariantByCombination(
  master: SceneMaster,
  combination: Record<string, string>,
): SceneMasterVariant | undefined {
  const axes = master.axes ?? []
  if (!axes.length) return undefined
  const axisIds = axes.map((a) => a.id)
  return listMasterVariants(master).find((v) =>
    combinationsMatch(v.combination, combination, axisIds),
  )
}

/**
 * Resolve cell for paint/expand: prefer `instanceVariantAxes` match on combination,
 * then `instanceVariantId`, then default.
 */
export function resolveMasterVariantForInstance(
  master: SceneMaster,
  instance: {
    instanceVariantId?: string | null
    instanceVariantAxes?: Record<string, string> | null
  },
): SceneMasterVariant {
  const axes = master.axes ?? []
  if (axes.length && instance.instanceVariantAxes) {
    const hit = findVariantByCombination(master, instance.instanceVariantAxes)
    if (hit) return hit
  }
  return resolveMasterVariant(master, instance.instanceVariantId)
}

export function resolveMasterVariant(
  master: SceneMaster,
  variantId?: string | null,
): SceneMasterVariant {
  const variants = listMasterVariants(master)
  if (variantId) {
    const hit = variants.find((v) => v.id === variantId)
    if (hit) return hit
  }
  if (master.defaultVariantId) {
    const def = variants.find((v) => v.id === master.defaultVariantId)
    if (def) return def
  }
  return variants[0]!
}

export function resolveMasterDefinitionRoot(
  master: SceneMaster,
  variantId?: string | null,
): SceneNode {
  return resolveMasterVariant(master, variantId).root
}

export function resolveMasterDefinitionRootForInstance(
  master: SceneMaster,
  instance: {
    instanceVariantId?: string | null
    instanceVariantAxes?: Record<string, string> | null
  },
): SceneNode {
  return resolveMasterVariantForInstance(master, instance).root
}

export function variantNameTaken(
  master: SceneMaster,
  name: string,
  exceptVariantId?: string,
): boolean {
  const needle = name.trim().toLowerCase()
  if (!needle) return false
  return listMasterVariants(master).some(
    (v) => v.id !== exceptVariantId && v.name.trim().toLowerCase() === needle,
  )
}

export function cellNameFromCombination(
  master: SceneMaster,
  combination: Record<string, string>,
): string {
  const axes = master.axes ?? []
  if (!axes.length) return DEFAULT_VARIANT_NAME
  return axes
    .map((a) => combination[a.id] ?? a.values[0] ?? '')
    .filter(Boolean)
    .join(' / ')
}

/** Product of axis value counts (UI warn when ≥ 30). */
export function productOfAxisValueCounts(master: SceneMaster): number {
  return masterAxisValueProduct(master)
}

/**
 * Phase-2 named list without axes → single `Variant` axis + combinations.
 * Idempotent when axes already present.
 */
export function migrateMasterAxesFromPhase2(master: SceneMaster): SceneMaster {
  if (master.axes?.length) return master
  if (!master.variants?.length) return master
  const values: string[] = []
  const seen = new Set<string>()
  for (const v of master.variants) {
    const name = v.name.trim() || DEFAULT_VARIANT_NAME
    if (!seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase())
      values.push(name)
    }
  }
  if (!values.length) values.push(DEFAULT_VARIANT_NAME)
  const axes: SceneMasterAxis[] = [
    { id: PHASE2_MIGRATE_AXIS_ID, name: PHASE2_MIGRATE_AXIS_NAME, values },
  ]
  const variants = master.variants.map((v) => {
    if (v.combination && Object.keys(v.combination).length) return v
    const name = v.name.trim() || DEFAULT_VARIANT_NAME
    return { ...v, combination: { [PHASE2_MIGRATE_AXIS_ID]: name } }
  })
  return { ...master, axes, variants }
}

/** Ensure `variants` + `defaultVariantId` exist; sync `root` to default. */
export function materializeMasterVariants(master: SceneMaster): SceneMaster {
  if (master.variants?.length) {
    const defaultId =
      master.defaultVariantId && master.variants.some((v) => v.id === master.defaultVariantId)
        ? master.defaultVariantId
        : master.variants[0]!.id
    const def = master.variants.find((v) => v.id === defaultId)!
    const withVariants: SceneMaster = {
      ...master,
      defaultVariantId: defaultId,
      root: structuredClone(def.root),
      variants: master.variants.map((v) => ({
        ...v,
        root: structuredClone(v.root),
        ...(v.combination ? { combination: { ...v.combination } } : {}),
      })),
      ...(master.axes?.length
        ? { axes: master.axes.map((a) => ({ ...a, values: [...a.values] })) }
        : {}),
    }
    return migrateMasterAxesFromPhase2(withVariants)
  }
  const id = createMasterVariantId()
  const root = structuredClone(master.root)
  const seeded: SceneMaster = {
    ...master,
    defaultVariantId: id,
    root,
    variants: [{ id, name: DEFAULT_VARIANT_NAME, root: structuredClone(root) }],
  }
  return migrateMasterAxesFromPhase2(seeded)
}

function nodeInTree(root: SceneNode, id: SceneNodeId): boolean {
  if (root.id === id) return true
  return (root.children ?? []).some((c) => nodeInTree(c, id))
}

export type MasterBoardOptions = {
  /**
   * Picks for axes beyond the first two (axisId → value).
   * Defaults to each axis’s first value when omitted.
   */
  axisFilters?: Record<string, string>
}

function resolvedAxisFilters(
  master: SceneMaster,
  axisFilters?: Record<string, string>,
): Record<string, string> {
  const axes = master.axes ?? []
  const out: Record<string, string> = {}
  for (let i = 2; i < axes.length; i += 1) {
    const axis = axes[i]!
    const pick = axisFilters?.[axis.id]
    out[axis.id] =
      pick && axis.values.includes(pick) ? pick : (axis.values[0] ?? '')
  }
  return out
}

function combinationForMatrixCell(
  master: SceneMaster,
  colValue: string,
  rowValue: string | null,
  filters: Record<string, string>,
): Record<string, string> {
  const axes = master.axes ?? []
  const combination: Record<string, string> = { ...filters }
  if (axes[0]) combination[axes[0].id] = colValue
  if (axes[1] && rowValue != null) combination[axes[1].id] = rowValue
  return combination
}

function buildVariantTile(
  v: SceneMasterVariant,
  activeVariantId: string,
): SceneNode {
  const isActive = v.id === activeVariantId
  const body = isActive ? structuredClone(v.root) : cloneTreeFreshIds(v.root)
  const tileId = `${MASTER_BOARD_TILE_PREFIX}${v.id}`
  return {
    id: tileId,
    type: 'Stack',
    name: v.name,
    locked: !isActive,
    props: {
      direction: 'column',
      gap: 'sm',
      align: 'start',
      'data-master-variant': v.id,
      'data-master-variant-chrome': 'true',
      'data-master-variant-active': isActive ? 'true' : 'false',
    },
    style: { minWidth: 160 },
    children: [
      {
        id: `${tileId}:label`,
        type: 'Text',
        name: v.name,
        locked: true,
        props: {
          children: isActive ? `Editing · ${v.name}` : v.name,
          role: 'meta',
          'data-master-variant-label': 'true',
          'data-master-variant-active': isActive ? 'true' : 'false',
        },
      },
      {
        id: `${tileId}:body`,
        type: 'Stack',
        name: `${v.name} body`,
        locked: !isActive,
        props: {
          direction: 'column',
          align: 'start',
          'data-master-variant-body': 'true',
          ...(isActive ? { 'data-master-variant-body-active': 'true' } : {}),
        },
        children: [body],
      },
    ],
  }
}

function buildPlaceholderTile(
  combination: Record<string, string>,
  label: string,
): SceneNode {
  const id = placeholderTileId(combination)
  return {
    id,
    type: 'Stack',
    name: label,
    locked: true,
    props: {
      direction: 'column',
      gap: 'sm',
      align: 'center',
      'data-master-variant-chrome': 'true',
      'data-master-variant-placeholder': 'true',
      'data-master-combination': JSON.stringify(combination),
    },
    style: { minWidth: 160, minHeight: 96 },
    children: [
      {
        id: `${id}:label`,
        type: 'Text',
        name: label,
        locked: true,
        props: {
          children: label,
          role: 'meta',
          'data-master-variant-label': 'true',
        },
      },
      {
        id: `${id}:hint`,
        type: 'Text',
        name: '+',
        locked: true,
        props: {
          children: '+ Create cell',
          role: 'meta',
          'data-master-variant-add-hint': 'true',
        },
      },
    ],
  }
}

function buildAddVariantTile(): SceneNode {
  return {
    id: MASTER_BOARD_ADD_ID,
    type: 'Stack',
    name: 'Add variant',
    locked: true,
    props: {
      direction: 'column',
      gap: 'sm',
      align: 'center',
      'data-master-variant-chrome': 'true',
      'data-master-variant-add': 'true',
    },
    style: { minWidth: 140, minHeight: 96 },
    children: [
      {
        id: `${MASTER_BOARD_ADD_ID}:label`,
        type: 'Text',
        name: 'Add variant',
        locked: true,
        props: {
          children: 'Add variant',
          role: 'meta',
          'data-master-variant-label': 'true',
          'data-master-variant-add': 'true',
        },
      },
      {
        id: `${MASTER_BOARD_ADD_ID}:plus`,
        type: 'Text',
        name: '+',
        locked: true,
        props: {
          children: '+',
          role: 'meta',
          'data-master-variant-add-hint': 'true',
        },
      },
    ],
  }
}

/**
 * Paint tree for Master-Edit.
 * Phase 2 / no axes: row of variant tiles.
 * Phase 3 with axes: matrix for first two axes; extra axes via `axisFilters`.
 */
export function buildMasterVariantBoard(
  master: SceneMaster,
  activeVariantId: string,
  options?: MasterBoardOptions,
): SceneNode {
  const axes = master.axes ?? []
  if (!axes.length) {
    const variants = listMasterVariants(master)
    const tiles = [
      ...variants.map((v) => buildVariantTile(v, activeVariantId)),
      buildAddVariantTile(),
    ]
    return {
      id: MASTER_BOARD_ID,
      type: 'Stack',
      name: master.name,
      locked: true,
      props: {
        direction: 'row',
        gap: 'xl',
        align: 'start',
        wrap: 'wrap',
        'data-master-board': 'strip',
      },
      children: tiles,
    }
  }

  const filters = resolvedAxisFilters(master, options?.axisFilters)
  const colAxis = axes[0]!
  const rowAxis = axes[1]

  if (!rowAxis) {
    const tiles: SceneNode[] = colAxis.values.map((colValue) => {
      const combination = combinationForMatrixCell(master, colValue, null, filters)
      const cell = findVariantByCombination(master, combination)
      if (cell) return buildVariantTile(cell, activeVariantId)
      return buildPlaceholderTile(combination, colValue)
    })
    tiles.push(buildAddVariantTile())
    return {
      id: MASTER_BOARD_ID,
      type: 'Stack',
      name: master.name,
      locked: true,
      props: {
        direction: 'row',
        gap: 'xl',
        align: 'start',
        wrap: 'wrap',
        'data-master-axes': String(axes.length),
        'data-master-board': 'strip',
      },
      children: tiles,
    }
  }

  const rows: SceneNode[] = rowAxis.values.map((rowValue) => {
    const cells: SceneNode[] = colAxis.values.map((colValue) => {
      const combination = combinationForMatrixCell(master, colValue, rowValue, filters)
      const cell = findVariantByCombination(master, combination)
      if (cell) return buildVariantTile(cell, activeVariantId)
      return buildPlaceholderTile(combination, `${colValue} / ${rowValue}`)
    })
    return {
      id: `${MASTER_BOARD_ID}:row:${encodeURIComponent(rowValue)}`,
      type: 'Stack',
      name: rowValue,
      locked: true,
      props: {
        direction: 'row',
        gap: 'lg',
        align: 'start',
        'data-master-axis-row': rowValue,
      },
      children: [
        {
          id: `${MASTER_BOARD_ID}:row-label:${encodeURIComponent(rowValue)}`,
          type: 'Text',
          name: rowValue,
          locked: true,
          props: { children: rowValue, role: 'meta' },
        },
        ...cells,
      ],
    }
  })

  return {
    id: MASTER_BOARD_ID,
    type: 'Stack',
    name: master.name,
    locked: true,
    props: {
      direction: 'column',
      gap: 'xl',
      align: 'start',
      'data-master-axes': String(axes.length),
      'data-master-matrix': 'true',
    },
    children: rows,
  }
}

function variantIdFromBoardNodeId(id: SceneNodeId): string | null {
  return masterBoardTileVariantId(id)
}

function findPathToId(
  root: SceneNode,
  id: SceneNodeId,
  acc: SceneNode[],
): SceneNode[] | null {
  const next = [...acc, root]
  if (root.id === id) return next
  for (const child of root.children ?? []) {
    const hit = findPathToId(child, id, next)
    if (hit) return hit
  }
  return null
}

/** Map a Master-Edit board click to select-in-active, activate-variant, or upsert placeholder. */
export function resolveMasterBoardClick(
  board: SceneNode,
  activeRoot: SceneNode,
  activeVariantId: string,
  clickedId: SceneNodeId,
):
  | { type: 'select'; nodeId: SceneNodeId }
  | { type: 'activate'; variantId: string }
  | { type: 'upsert'; combination: Record<string, string> }
  | { type: 'add' }
  | { type: 'noop' } {
  if (clickedId === MASTER_BOARD_ID) return { type: 'noop' }
  if (isMasterBoardAddId(clickedId)) return { type: 'add' }
  if (nodeInTree(activeRoot, clickedId)) {
    return { type: 'select', nodeId: clickedId }
  }
  const placeholder = masterBoardPlaceholderCombination(clickedId)
  if (placeholder) return { type: 'upsert', combination: placeholder }
  const path = findPathToId(board, clickedId, [])
  if (!path) return { type: 'noop' }
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const node = path[i]!
    if (isMasterBoardAddId(node.id)) return { type: 'add' }
    const ph = masterBoardPlaceholderCombination(node.id)
    if (ph) return { type: 'upsert', combination: ph }
    const variantId = variantIdFromBoardNodeId(node.id)
    if (!variantId) continue
    if (variantId === activeVariantId) {
      return { type: 'select', nodeId: activeRoot.id }
    }
    return { type: 'activate', variantId }
  }
  return { type: 'noop' }
}

function cloneTreeFreshIds(node: SceneNode): SceneNode {
  const next: SceneNode = {
    id: `mvb-${createMasterVariantId()}`,
    type: node.type,
  }
  if (node.name != null) next.name = node.name
  if (node.props) next.props = { ...node.props }
  if (node.style) next.style = { ...node.style }
  if (node.tokenBindings) next.tokenBindings = { ...node.tokenBindings }
  if (node.breakpoints) next.breakpoints = structuredClone(node.breakpoints)
  if (node.hidden) next.hidden = true
  if (node.locked) next.locked = true
  if (node.children?.length) {
    next.children = node.children.map(cloneTreeFreshIds)
  }
  return next
}
