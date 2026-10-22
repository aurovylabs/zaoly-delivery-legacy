/**
 * Resolve Smart HUD lane model from selection + editor context.
 * Spec: `specs/domain/canvas-smart-hud.md` · Knowledge: `knowledge/canvas-smart-hud.md`
 */
import type { SceneNode, SceneOp } from '@zaoly/contracts'
import {
  familyDef,
  HUD_SLOT_BUDGET,
  resolveFamilyId,
  type HudFamilyId,
  type HudGuardId,
  type HudQuickSlot,
} from './hud-quick-slots'

export type HudLaneKind =
  | 'insert'
  | 'smart'
  | 'artboard'
  | 'structure'
  | 'align'
  | 'zoom'

export type HudModel = {
  showInsert: boolean
  /** W3: Insert primitives inside Structure `⋯` when peer Insert lane is collapsed. */
  showInsertOverflow: boolean
  showSmart: boolean
  showArtboard: boolean
  showStructureOverflow: boolean
  showAlignGroup: boolean
  showZoom: boolean
  familyId: HudFamilyId | null
  slots: HudQuickSlot[]
  mutateEnabled: boolean
  emptySmartFallback: boolean
  /** W4: active interactive state for HUD writes / pill. */
  pseudoState: string
  mode: 'legacy' | 'empty' | 'root' | 'single' | 'multi'
}

export type HudResolveContext = {
  smartHudEnabled: boolean
  selectedIds: string[]
  selectedNodes: SceneNode[]
  workingRootId: string
  /** Primary = last selected id's node */
  primary: SceneNode | null
  inlineEditing?: boolean
  pseudoState?: string
  readOnly?: boolean
  softLocked?: boolean
  marqueeActive?: boolean
  /** Previous model when marquee freezes lanes */
  previous?: HudModel | null
}

function siteTableTruthy(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') return value === 'true' || value === '1'
  return false
}

function isSiteTableHeaderRow(row: SceneNode): boolean {
  return row.type === 'SiteTableRow' && siteTableTruthy(row.props?.header)
}

function tableHasRemovableBodyRow(table: SceneNode): boolean {
  const body = (table.children ?? []).filter(
    (c) => c.type === 'SiteTableRow' && !isSiteTableHeaderRow(c),
  )
  return body.length > 1
}

function tableHasRemovableColumn(table: SceneNode): boolean {
  const rows = (table.children ?? []).filter((c) => c.type === 'SiteTableRow')
  if (rows.length === 0) return false
  const cols = Math.max(
    ...rows.map((r) => (r.children ?? []).filter((c) => c.type === 'SiteTableCell').length),
    0,
  )
  return cols > 1
}

export function evalHudGuard(
  guard: HudGuardId,
  node: SceneNode | null,
  ctx: Pick<
    HudResolveContext,
    'inlineEditing' | 'pseudoState' | 'readOnly' | 'softLocked' | 'workingRootId'
  >,
): boolean {
  switch (guard) {
    case 'headingLevel': {
      if (!node) return false
      if (node.type === 'Heading') return true
      const role = node.props?.role
      return role === 'title' || role === 'display' || node.props?.level != null
    }
    case 'canUnwrap':
      return Boolean(
        node &&
          ((node.children && node.children.length > 0) ||
            ['Stack', 'Grid', 'Container', 'Card', 'SiteStack', 'SiteGrid', 'SiteContainer'].includes(
              node.type,
            )),
      )
    case 'tableHasRemovableBodyRow':
      return Boolean(node && tableHasRemovableBodyRow(node))
    case 'tableHasRemovableColumn':
      return Boolean(node && tableHasRemovableColumn(node))
    case 'notLocked':
      return !(node?.locked || ctx.softLocked)
    case 'isWorkingRoot':
      return Boolean(node && node.id === ctx.workingRootId)
    case 'notInlineEditing':
      return !ctx.inlineEditing
    case 'pseudoStateDefault':
      return !ctx.pseudoState || ctx.pseudoState === 'default'
    case 'canMutate':
      // W4: allow mutations while editing :hover/:focus/:active (state-override path).
      return (
        !ctx.readOnly &&
        !(node?.locked || ctx.softLocked) &&
        !ctx.inlineEditing
      )
    case 'isFormInput':
      return Boolean(node && (node.type === 'SiteInput' || node.type === 'Input'))
    case 'isFormTextarea':
      return Boolean(node && (node.type === 'SiteTextarea' || node.type === 'Textarea'))
    case 'isFormSelect':
      return Boolean(node && (node.type === 'SiteSelect' || node.type === 'Select'))
    case 'isFormCheckbox':
      return Boolean(node && (node.type === 'SiteCheckbox' || node.type === 'Checkbox'))
    case 'notFormCheckbox':
      return Boolean(node && node.type !== 'SiteCheckbox' && node.type !== 'Checkbox')
    case 'notInstance':
      // Expanded Instance subjects keep instanceOf on the inspect/HUD node.
      return Boolean(node && !node.instanceOf && node.type !== 'Instance')
    default:
      return true
  }
}

function filterSlots(
  slots: HudQuickSlot[],
  node: SceneNode,
  ctx: HudResolveContext,
): HudQuickSlot[] {
  const pseudoActive = Boolean(ctx.pseudoState && ctx.pseudoState !== 'default')
  return slots
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .filter((slot) => {
      if (slot.when && !evalHudGuard(slot.when, node, ctx)) return false
      if (slot.source === 'structureOp') {
        // W4: structureOps are not state-scoped — hide while editing :hover/:focus/:active.
        if (pseudoActive) return false
        // Sealed Instances: never offer structure rewrites (composition-masters.md).
        if (!evalHudGuard('notInstance', node, ctx)) return false
        if (slot.op === 'table_remove_row' && !evalHudGuard('tableHasRemovableBodyRow', node, ctx)) {
          return false
        }
        if (
          slot.op === 'table_remove_column' &&
          !evalHudGuard('tableHasRemovableColumn', node, ctx)
        ) {
          return false
        }
      }
      return true
    })
    .slice(0, HUD_SLOT_BUDGET)
}

const emptyModel = (partial: Partial<HudModel> & { mode: HudModel['mode'] }): HudModel => ({
  showInsert: false,
  showInsertOverflow: false,
  showSmart: false,
  showArtboard: false,
  showStructureOverflow: false,
  showAlignGroup: false,
  showZoom: true,
  familyId: null,
  slots: [],
  mutateEnabled: true,
  emptySmartFallback: false,
  pseudoState: 'default',
  ...partial,
})

/** Keys eligible for multi-select intersection Smart (knowledge § intersectSlots). */
const MULTI_INTERSECT_ALLOWLIST: {
  key: string
  rank: number
  /** Extra family predicate beyond “every family matrix includes key”. */
  familiesOk?: (families: HudFamilyId[]) => boolean
}[] = [
  { key: 'width', rank: 1 },
  { key: 'height', rank: 2 },
  { key: 'padding', rank: 3 },
  { key: 'opacity', rank: 4 },
  { key: 'background', rank: 5 },
  { key: 'radius', rank: 6 },
  {
    key: 'gap',
    rank: 7,
    familiesOk: (fs) => fs.every((f) => f === 'layoutStack' || f === 'layoutGrid'),
  },
  {
    key: 'direction',
    rank: 8,
    familiesOk: (fs) => fs.every((f) => f === 'layoutStack'),
  },
  {
    key: 'fontSize',
    rank: 9,
    familiesOk: (fs) => fs.every((f) => f === 'text' || f === 'textLink'),
  },
  {
    key: 'color',
    rank: 10,
    familiesOk: (fs) => fs.every((f) => f === 'text' || f === 'textLink' || f === 'form'),
  },
  {
    key: 'density',
    rank: 11,
    familiesOk: (fs) => fs.every((f) => f === 'table'),
  },
  {
    key: 'borders',
    rank: 12,
    familiesOk: (fs) => fs.every((f) => f === 'table'),
  },
]

function slotForKey(familyId: HudFamilyId, key: string): HudQuickSlot | undefined {
  return familyDef(familyId).slots.find(
    (s) => s.key === key && s.source !== 'structureOp' && s.source !== 'hostAction',
  )
}

/**
 * W3 multi-select intersection Smart slots.
 * Cap ≤6; structureOps / hostActions never included.
 */
export function intersectSlots(nodes: SceneNode[]): HudQuickSlot[] {
  if (nodes.length < 2) return []
  const families = nodes.map((n) => resolveFamilyId(n.type))
  const out: HudQuickSlot[] = []
  for (const entry of MULTI_INTERSECT_ALLOWLIST) {
    if (entry.familiesOk && !entry.familiesOk(families)) continue
    const defs = families.map((f) => slotForKey(f, entry.key))
    if (defs.some((d) => !d)) continue
    const template = defs[0]!
    out.push({ ...template, rank: entry.rank })
    if (out.length >= HUD_SLOT_BUDGET) break
  }
  return out
}

/** Display value for multi Smart — equal values show the value, else mixed dash. */
export function readHudMultiSlotValue(nodes: SceneNode[], slot: HudQuickSlot): string {
  if (nodes.length === 0) return ''
  const values = nodes.map((n) => readHudSlotValue(n, slot))
  const first = values[0] ?? ''
  return values.every((v) => v === first) ? first : '—'
}

/**
 * Fan property writes across a multi selection (single undo batch upstream).
 * Fail closed if any target is locked — no partial writes (L07).
 * Never fans structureOps / host-only shapes.
 */
export function fanOutHudOpsToSelection(ops: SceneOp[], nodes: SceneNode[]): SceneOp[] {
  if (nodes.length <= 1) return ops
  if (nodes.some((n) => n.locked)) return []
  const out: SceneOp[] = []
  for (const op of ops) {
    if (!('nodeId' in op) || typeof (op as { nodeId?: string }).nodeId !== 'string') {
      out.push(op)
      continue
    }
    if (
      op.op === 'table_add_row' ||
      op.op === 'table_add_column' ||
      op.op === 'table_remove_row' ||
      op.op === 'table_remove_column'
    ) {
      continue
    }
    for (const node of nodes) {
      out.push({ ...op, nodeId: node.id } as SceneOp)
    }
  }
  return out
}
export function resolveHudModel(ctx: HudResolveContext): HudModel {
  const pseudoState = ctx.pseudoState && ctx.pseudoState !== '' ? ctx.pseudoState : 'default'

  if (!ctx.smartHudEnabled) {
    return emptyModel({
      mode: 'legacy',
      showInsert: true,
      showStructureOverflow: Boolean(ctx.primary) || ctx.selectedIds.length > 1,
      showAlignGroup: ctx.selectedIds.length > 1,
      showSmart: false,
      pseudoState,
    })
  }

  if (ctx.marqueeActive && ctx.previous) {
    return ctx.previous
  }

  const ids = ctx.selectedIds.filter(Boolean)
  // Drop stale ids not found in selectedNodes map
  const byId = new Map(ctx.selectedNodes.map((n) => [n.id, n]))
  const liveIds = ids.filter((id) => byId.has(id) || id === ctx.workingRootId)

  const mutateBase = {
    inlineEditing: ctx.inlineEditing,
    pseudoState,
    readOnly: ctx.readOnly,
    softLocked: ctx.softLocked,
    workingRootId: ctx.workingRootId,
  }

  // Multi-select uses the raw selection count (stale peers still count until cleaned upstream).
  if (ids.length > 1) {
    const liveNodes = liveIds
      .map((id) => byId.get(id))
      .filter((n): n is SceneNode => Boolean(n))
    const intersection = intersectSlots(liveNodes.length >= 2 ? liveNodes : ctx.selectedNodes).filter(
      (s) => !(pseudoState !== 'default' && s.source === 'structureOp'),
    )
    const sameFamily =
      liveNodes.length >= 2 &&
      liveNodes.every((n) => resolveFamilyId(n.type) === resolveFamilyId(liveNodes[0]!.type))
    const multiMutate =
      !ctx.readOnly &&
      !ctx.inlineEditing &&
      !ctx.softLocked &&
      liveNodes.every((n) => !n.locked)
    return emptyModel({
      mode: 'multi',
      showInsert: false,
      showInsertOverflow: true,
      showSmart: intersection.length > 0,
      showAlignGroup: true,
      showStructureOverflow: true,
      familyId: sameFamily ? resolveFamilyId(liveNodes[0]!.type) : null,
      slots: intersection,
      mutateEnabled: multiMutate,
      pseudoState,
    })
  }

  // If primary missing entirely, treat as empty
  if (liveIds.length === 0) {
    return emptyModel({ mode: 'empty', showInsert: true, pseudoState })
  }

  const primaryId = liveIds[liveIds.length - 1]!
  const primary = byId.get(primaryId) ?? ctx.primary
  if (!primary) {
    return emptyModel({ mode: 'empty', showInsert: true, pseudoState })
  }

  const mutateEnabled = evalHudGuard('canMutate', primary, mutateBase)

  if (primaryId === ctx.workingRootId) {
    const artboard = filterSlots(familyDef('artboard').slots, primary, ctx)
    return emptyModel({
      mode: 'root',
      showInsert: true,
      showArtboard: artboard.length > 0,
      showStructureOverflow: true,
      familyId: 'artboard',
      slots: artboard,
      mutateEnabled,
      pseudoState,
    })
  }

  const familyId = resolveFamilyId(primary.type)
  let slots = filterSlots(familyDef(familyId).slots, primary, ctx)
  let emptySmartFallback = false
  if (slots.length === 0) {
    emptySmartFallback = true
    slots = filterSlots(familyDef('fallback').slots, primary, ctx)
  }

  return emptyModel({
    mode: 'single',
    showInsert: false,
    showInsertOverflow: true,
    showSmart: true,
    showStructureOverflow: true,
    familyId: emptySmartFallback ? 'fallback' : familyId,
    slots,
    mutateEnabled,
    emptySmartFallback,
    pseudoState,
  })
}

/** Token-ish path (e.g. typography.body.family) vs CSS literal (Inter / 16px). */
export function looksLikeTokenPath(value: string): boolean {
  return /^[a-z][a-z0-9]*(\.[a-z0-9_-]+)+$/i.test(value.trim())
}

/** Read current prop/style/token value for HUD display. */
export function readHudSlotValue(node: SceneNode, slot: HudQuickSlot): string {
  if (slot.source === 'structureOp') return ''

  const fromProps = () => {
    const v = node.props?.[slot.key]
    if (v != null && v !== '') return String(v)
    return ''
  }
  const fromStyle = () => {
    const v = node.style?.[slot.key]
    if (v != null && v !== '') return String(v)
    return ''
  }
  const fromToken = () => node.tokenBindings?.[slot.key] ?? ''

  // Literal-first selects (size/weight) prefer props over leftover bindings.
  if (slot.writeAs === 'prop') {
    return fromProps() || fromStyle() || fromToken()
  }

  // Token / auto (fontFamily, color): binding wins, then literal.
  if (slot.writeAs === 'token' || slot.writeAs === 'auto' || slot.source === 'tokenBinding') {
    return fromToken() || fromProps() || fromStyle()
  }

  const prop = fromProps()
  if (prop) return prop
  const style = fromStyle()
  if (style) return style
  // SiteStack may use justify vs justifyContent
  if (slot.key === 'justify') {
    const v = node.props?.justifyContent ?? node.style?.justifyContent
    if (v != null) return String(v)
  }
  if (slot.key === 'align') {
    const v = node.props?.alignItems ?? node.style?.alignItems
    if (v != null) return String(v)
  }
  return fromToken()
}

/**
 * Build write ops for a Smart HUD select / option pick.
 * Mirrors Inspect: token writes clear the prop; literal prop writes clear the binding.
 */
export function buildHudSelectWriteOps(
  node: SceneNode,
  slot: HudQuickSlot,
  rawValue: string,
): SceneOp[] {
  const value = rawValue.trim()
  if (!value) return []

  const mode =
    slot.writeAs ??
    (slot.source === 'tokenBinding' ? 'token' : slot.control === 'select' ? 'auto' : 'prop')

  const asToken = mode === 'token' || (mode === 'auto' && looksLikeTokenPath(value))
  if (asToken) {
    const ops: SceneOp[] = [
      { op: 'set_prop', nodeId: node.id, key: slot.key, value: '' },
      { op: 'set_token_binding', nodeId: node.id, key: slot.key, tokenPath: value },
    ]
    return ops
  }

  const ops: SceneOp[] = [{ op: 'set_prop', nodeId: node.id, key: slot.key, value }]
  if (node.tokenBindings?.[slot.key]) {
    ops.push({ op: 'clear_token_binding', nodeId: node.id, key: slot.key })
  }
  return ops
}

/**
 * Build SceneOps for Smart HUD structure actions (SiteTable add/remove row/column).
 * Explicit switch keeps the SceneOp discriminant narrow for runOps.
 */
export function buildHudStructureOps(
  nodeId: string,
  op: NonNullable<HudQuickSlot['op']>,
): SceneOp[] {
  switch (op) {
    case 'table_add_row':
      return [{ op: 'table_add_row', nodeId }]
    case 'table_add_column':
      return [{ op: 'table_add_column', nodeId }]
    case 'table_remove_row':
      return [{ op: 'table_remove_row', nodeId }]
    case 'table_remove_column':
      return [{ op: 'table_remove_column', nodeId }]
    default: {
      const _exhaustive: never = op
      return _exhaustive
    }
  }
}

/**
 * Color / fill / type Smart HUD writes — same base-path ops as Inspect TokenPicker.
 */
export function buildHudTokenWriteOps(
  node: SceneNode,
  key: string,
  next: { kind: 'token'; path: string } | { kind: 'literal'; value: string },
): SceneOp[] {
  if (node.locked) return []
  if (next.kind === 'token') {
    const path = next.path.trim()
    if (!path) return []
    return [
      { op: 'set_prop', nodeId: node.id, key, value: '' },
      { op: 'set_token_binding', nodeId: node.id, key, tokenPath: path },
    ]
  }
  const value = String(next.value)
  const ops: SceneOp[] = [{ op: 'set_prop', nodeId: node.id, key, value }]
  // Expanded Instance subjects carry Master bindings but clears must target override
  // bindings only. Inherited Master bindings are masked by props at paint time — skip
  // clear so HUD literal batches never abort mid-runOps.
  const instanceSubject = Boolean(node.instanceOf) || node.type === 'Instance'
  if (!instanceSubject && node.tokenBindings?.[key]) {
    ops.push({ op: 'clear_token_binding', nodeId: node.id, key })
  } else if (
    instanceSubject &&
    node.instanceOverrides?.tokenBindings?.[key]
  ) {
    ops.push({ op: 'clear_token_binding', nodeId: node.id, key })
  }
  return ops
}

/** @deprecated Use buildHudTokenWriteOps */
export const buildHudColorWriteOps = buildHudTokenWriteOps

export function nextTokenInLadder(current: string, ladder: string[]): string {
  if (ladder.length === 0) return current
  const idx = ladder.indexOf(current)
  if (idx < 0) return ladder[0]!
  return ladder[(idx + 1) % ladder.length]!
}

export type SizeMode = 'hug' | 'fill' | 'fixed'

export function readSizeMode(node: SceneNode, key: 'width' | 'height'): SizeMode {
  const raw = String(node.style?.[key] ?? node.props?.[key] ?? '').trim()
  if (!raw || raw === 'hug' || raw === 'auto' || raw === 'max-content') return 'hug'
  if (raw === '100%' || raw === 'fill') return 'fill'
  return 'fixed'
}

export function nextSizeMode(current: SizeMode): SizeMode {
  if (current === 'hug') return 'fill'
  if (current === 'fill') return 'fixed'
  return 'hug'
}

export function sizeModeToValue(mode: SizeMode): string {
  if (mode === 'hug') return ''
  if (mode === 'fill') return '100%'
  return '320px'
}

/** Nudge a CSS length literal (px/rem/em). Empty → start at 16px. */
export function nudgeCssLengthLiteral(current: string, delta: number): string {
  const raw = current.trim()
  const m = raw.match(/^(-?\d+(?:\.\d+)?)(px|rem|em)?$/i)
  if (!m) {
    const start = 16 + delta
    return `${Math.max(1, start)}px`
  }
  const unit = (m[2] || 'px').toLowerCase()
  const next = Number(m[1]) + delta
  const rounded = unit === 'px' ? Math.round(next) : Math.round(next * 100) / 100
  return `${Math.max(unit === 'px' ? 1 : 0.01, rounded)}${unit}`
}

/** Nudge a numeric font-weight literal (100–900, step 100). */
export function nudgeFontWeightLiteral(current: string, deltaSteps: number): string {
  const parsed = parseInt(current.trim(), 10)
  const base = Number.isFinite(parsed) ? parsed : 400
  const step = deltaSteps >= 0 ? 100 : -100
  const next = base + step * Math.max(1, Math.abs(deltaSteps))
  const clamped = Math.min(900, Math.max(100, Math.round(next / 100) * 100))
  return String(clamped)
}
