import type { SceneNode } from '@zaoly/contracts'

export const SCENE_SLOT_KEYS = [
  'meta',
  'label',
  'title',
  'primary',
  'secondary',
  'value',
  'unit',
  'badge',
  'hint',
  'error',
  'summary',
  'toolbar',
  'headActions',
  'actions',
  'footer',
] as const

export type SceneSlotKey = (typeof SCENE_SLOT_KEYS)[number]

const SLOT_SET = new Set<string>(SCENE_SLOT_KEYS)

const SLOT_ORDER: Array<SceneSlotKey | 'body'> = [
  'meta',
  'label',
  'title',
  'primary',
  'secondary',
  'value',
  'unit',
  'badge',
  'hint',
  'error',
  'summary',
  'toolbar',
  'headActions',
  'actions',
  'body',
  'footer',
]

type LiftSpec = {
  slot: SceneSlotKey
  prop: string
  role: 'title' | 'meta' | 'body'
  kind?: 'text' | 'badge'
}

/** Shells whose DS chrome is ReactNode (or string extracted for SectionChrome title). */
const SHELL_LIFTS: Record<string, LiftSpec[]> = {
  EntityCard: [
    { slot: 'meta', prop: 'meta', role: 'meta' },
    { slot: 'title', prop: 'title', role: 'title' },
    { slot: 'badge', prop: 'badge', role: 'title', kind: 'badge' },
    { slot: 'footer', prop: 'footer', role: 'meta' },
  ],
  Field: [
    { slot: 'label', prop: 'label', role: 'title' },
    { slot: 'hint', prop: 'hint', role: 'meta' },
    { slot: 'error', prop: 'error', role: 'meta' },
  ],
  FormSection: [{ slot: 'title', prop: 'title', role: 'title' }],
  FilterRow: [{ slot: 'label', prop: 'label', role: 'meta' }],
  EventFooter: [{ slot: 'summary', prop: 'summary', role: 'title' }],
  TopStatus: [
    { slot: 'primary', prop: 'primary', role: 'title' },
    { slot: 'secondary', prop: 'secondary', role: 'meta' },
  ],
  Lede: [
    { slot: 'value', prop: 'value', role: 'title' },
    { slot: 'label', prop: 'label', role: 'meta' },
    { slot: 'unit', prop: 'unit', role: 'meta' },
  ],
  MetricChip: [
    { slot: 'label', prop: 'label', role: 'meta' },
    { slot: 'value', prop: 'children', role: 'title' },
  ],
  ChannelLane: [{ slot: 'label', prop: 'label', role: 'title' }],
  SectionChrome: [
    { slot: 'title', prop: 'title', role: 'title' },
    { slot: 'meta', prop: 'meta', role: 'meta' },
  ],
  RankedRow: [
    { slot: 'label', prop: 'label', role: 'title' },
    { slot: 'value', prop: 'value', role: 'body' },
    { slot: 'secondary', prop: 'secondary', role: 'meta' },
  ],
  PrintPullQuote: [
    { slot: 'label', prop: 'label', role: 'meta' },
    { slot: 'value', prop: 'body', role: 'body' },
  ],
  PrintCallout: [
    { slot: 'label', prop: 'label', role: 'meta' },
    { slot: 'value', prop: 'body', role: 'body' },
  ],
  PrintChip: [{ slot: 'label', prop: 'label', role: 'title' }],
  PrintScoreRing: [
    { slot: 'value', prop: 'value', role: 'title' },
    { slot: 'label', prop: 'label', role: 'meta' },
  ],
  PrintCover: [
    { slot: 'label', prop: 'eyebrow', role: 'meta' },
    { slot: 'title', prop: 'title', role: 'title' },
    { slot: 'meta', prop: 'meta', role: 'meta' },
    { slot: 'footer', prop: 'fazit', role: 'body' },
  ],
  PrintChapter: [
    { slot: 'label', prop: 'eyebrow', role: 'meta' },
    { slot: 'title', prop: 'title', role: 'title' },
    { slot: 'summary', prop: 'lede', role: 'body' },
  ],
  PrintPersonaCard: [
    { slot: 'title', prop: 'name', role: 'title' },
    { slot: 'meta', prop: 'segment', role: 'meta' },
    { slot: 'summary', prop: 'bio', role: 'body' },
  ],
  Alert: [{ slot: 'value', prop: 'children', role: 'body' }],
  Hint: [{ slot: 'value', prop: 'children', role: 'meta' }],
  EmptyState: [{ slot: 'value', prop: 'children', role: 'body' }],
  LoadingText: [{ slot: 'value', prop: 'children', role: 'meta' }],
  PageTitle: [{ slot: 'title', prop: 'children', role: 'title' }],
  AddTile: [{ slot: 'label', prop: 'label', role: 'title' }],
  PrintDonut: [
    { slot: 'value', prop: 'centerValue', role: 'title' },
    { slot: 'label', prop: 'centerLabel', role: 'meta' },
  ],
  PrintPage: [
    { slot: 'label', prop: 'folioTitle', role: 'meta' },
    { slot: 'footer', prop: 'folioPage', role: 'meta' },
  ],
  Chip: [{ slot: 'label', prop: 'children', role: 'title' }],
  Button: [{ slot: 'label', prop: 'children', role: 'title' }],
  Badge: [{ slot: 'label', prop: 'children', role: 'title' }],
}

export function slotOf(node: SceneNode): SceneSlotKey | 'body' {
  const raw = node.props?.slot
  if (typeof raw === 'string' && SLOT_SET.has(raw)) return raw as SceneSlotKey
  return 'body'
}

export function partitionSlottedChildren(children: SceneNode[] | undefined): {
  slots: Partial<Record<SceneSlotKey, SceneNode[]>>
  body: SceneNode[]
} {
  const slots: Partial<Record<SceneSlotKey, SceneNode[]>> = {}
  const body: SceneNode[] = []
  for (const child of children ?? []) {
    const slot = slotOf(child)
    if (slot === 'body') {
      body.push(child)
      continue
    }
    const list = slots[slot] ?? []
    list.push(child)
    slots[slot] = list
  }
  return { slots, body }
}

export function slotPlainText(
  children: SceneNode[] | undefined,
  slot: SceneSlotKey,
): string | undefined {
  const hit = (children ?? []).find((child) => slotOf(child) === slot)
  const raw = hit?.props?.children
  return typeof raw === 'string' && raw.trim() ? raw : undefined
}

/** P54/P59: shell inspect copy proxy — parent `children` ↔ slot=label Text. */
export const SHELL_COPY_PROXY: Record<
  string,
  { field: string; slot: SceneSlotKey; role: 'title' | 'meta' | 'body' }
> = {
  PrintChip: { field: 'children', slot: 'label', role: 'title' },
  Chip: { field: 'children', slot: 'label', role: 'title' },
  Button: { field: 'children', slot: 'label', role: 'title' },
  Badge: { field: 'children', slot: 'label', role: 'title' },
}

export function shellCopyProxyValue(node: SceneNode, field: string): string | null {
  const spec = SHELL_COPY_PROXY[node.type]
  if (!spec || spec.field !== field) return null
  const hit = (node.children ?? []).find((child) => slotOf(child) === spec.slot)
  const raw = hit?.props?.children
  return typeof raw === 'string' ? raw : ''
}

/** Write shell inspect copy onto the slotted Text child; create/lift if missing. */
export function applyShellCopyProxy(node: SceneNode, field: string, value: unknown): boolean {
  const spec = SHELL_COPY_PROXY[node.type]
  if (!spec || spec.field !== field) return false
  const text = value == null ? '' : String(value)
  const kids = [...(node.children ?? [])]
  const index = kids.findIndex((child) => slotOf(child) === spec.slot)
  if (index >= 0) {
    const child = kids[index]
    kids[index] = { ...child, props: { ...child.props, children: text } }
  } else {
    kids.unshift({
      id: `${node.id}__${spec.slot}`,
      type: 'Text',
      props: { children: text, role: spec.role, slot: spec.slot },
    })
  }
  node.children = kids
  return true
}

function hasSlot(children: SceneNode[], slot: SceneSlotKey): boolean {
  return children.some((child) => slotOf(child) === slot)
}

function coerceLiftString(text: unknown): string | null {
  if (typeof text === 'number' && Number.isFinite(text)) return String(text)
  if (typeof text === 'string' && text.trim()) return text
  return null
}

function liftText(
  parentId: string,
  slot: SceneSlotKey,
  text: unknown,
  role: 'title' | 'meta' | 'body',
): SceneNode | null {
  const children = coerceLiftString(text)
  if (children == null) return null
  return {
    id: `${parentId}__${slot}`,
    type: 'Text',
    props: { children, role, slot },
  }
}

function liftBadge(parentId: string, text: unknown): SceneNode | null {
  if (typeof text !== 'string' || !text.trim()) return null
  return {
    id: `${parentId}__badge`,
    type: 'Badge',
    props: { children: text, tone: 'neutral', slot: 'badge' },
  }
}

function liftChrome(node: SceneNode, specs: LiftSpec[]): SceneNode {
  const props = { ...(node.props ?? {}) }
  const children = [...(node.children ?? [])]
  const lifted: SceneNode[] = []
  for (const spec of specs) {
    if (!hasSlot(children, spec.slot)) {
      const next =
        spec.kind === 'badge'
          ? liftBadge(node.id, props[spec.prop])
          : liftText(node.id, spec.slot, props[spec.prop], spec.role)
      if (next) lifted.push(next)
    }
    delete props[spec.prop]
  }
  const nextChildren = [...lifted, ...children].sort(
    (a, b) => SLOT_ORDER.indexOf(slotOf(a)) - SLOT_ORDER.indexOf(slotOf(b)),
  )
  return { ...node, props, children: nextChildren }
}

/** P43 string chrome → slotted children. Idempotent. */
export function hydrateEntityCardChrome(node: SceneNode): SceneNode {
  const specs = SHELL_LIFTS.EntityCard
  if (!specs || node.type !== 'EntityCard') return node
  return liftChrome(node, specs)
}

function slotTextNode(
  parentId: string,
  slot: SceneSlotKey,
  text: string,
  role: 'title' | 'meta' | 'body',
): SceneNode {
  return {
    id: `${parentId}__${slot}`,
    type: 'Text',
    props: { children: text, role, slot },
  }
}

function rowKey(raw: { id?: unknown }, index: number): string {
  return typeof raw.id === 'string' && raw.id.trim() ? raw.id : String(index)
}

function sortBySlot(children: SceneNode[]): SceneNode[] {
  return [...children].sort(
    (a, b) => SLOT_ORDER.indexOf(slotOf(a)) - SLOT_ORDER.indexOf(slotOf(b)),
  )
}

function liftArrayToRows(
  node: SceneNode,
  type: string,
  prop: string,
  kind: string,
  rowType: string,
  mapRow: (raw: Record<string, unknown>, rowId: string) => SceneNode[] | null,
): SceneNode {
  if (node.type !== type) return node
  const props = { ...(node.props ?? {}) }
  const rows = props[prop]
  delete props[prop]
  const children = [...(node.children ?? [])]
  const { body } = partitionSlottedChildren(children)
  if (body.length) return { ...node, props, children }
  if (!Array.isArray(rows)) return { ...node, props, children }
  const lifted: SceneNode[] = []
  for (const [index, raw] of rows.entries()) {
    if (!raw || typeof raw !== 'object') continue
    const key = rowKey(raw as { id?: unknown }, index)
    const id = `${node.id}__${kind}_${key}`
    const kids = mapRow(raw as Record<string, unknown>, id)
    if (!kids?.length) continue
    lifted.push({ id, type: rowType, children: kids })
  }
  return { ...node, props, children: [...lifted, ...children] }
}

function liftKpiStrip(node: SceneNode): SceneNode {
  return liftArrayToRows(node, 'KpiStrip', 'items', 'kpi', 'Lede', (row, id) => {
    const label = typeof row.label === 'string' && row.label.trim() ? row.label : 'KPI'
    const value = row.value == null ? '' : String(row.value)
    const meta = typeof row.meta === 'string' && row.meta.trim() ? row.meta : undefined
    const kids: SceneNode[] = [
      slotTextNode(id, 'value', value, 'title'),
      slotTextNode(id, 'label', label, 'meta'),
    ]
    if (meta) kids.push(slotTextNode(id, 'unit', meta, 'meta'))
    return kids
  })
}

/** P49: PrintRankedList items → RankedRow body children (label + secondary/meta). */
function liftPrintRankedList(node: SceneNode): SceneNode {
  return liftArrayToRows(node, 'PrintRankedList', 'items', 'row', 'RankedRow', (row, id) => {
    if (typeof row.label !== 'string' || !row.label.trim()) return null
    const kids: SceneNode[] = [slotTextNode(id, 'label', row.label, 'title')]
    if (typeof row.meta === 'string' && row.meta.trim()) {
      kids.push(slotTextNode(id, 'secondary', row.meta, 'meta'))
    }
    return kids
  })
}

/** P49: PrintLedger items → row children (label / value=score / summary=detail). */
function liftPrintLedger(node: SceneNode): SceneNode {
  return liftArrayToRows(node, 'PrintLedger', 'items', 'ledger', 'RankedRow', (row, id) => {
    if (typeof row.label !== 'string' || !row.label.trim()) return null
    const kids: SceneNode[] = [
      slotTextNode(id, 'label', row.label, 'title'),
      slotTextNode(id, 'value', row.score == null ? '' : String(row.score), 'body'),
    ]
    if (typeof row.detail === 'string' && row.detail.trim()) {
      kids.push(slotTextNode(id, 'summary', row.detail, 'meta'))
    }
    return kids
  })
}

/** P49: PrintTraitBars traits → row children (label=displayName / value=score). */
function liftPrintTraitBars(node: SceneNode): SceneNode {
  return liftArrayToRows(node, 'PrintTraitBars', 'traits', 'trait', 'RankedRow', (row, id) => {
    if (typeof row.displayName !== 'string' || !row.displayName.trim()) return null
    return [
      slotTextNode(id, 'label', row.displayName, 'title'),
      slotTextNode(id, 'value', row.score == null ? '' : String(row.score), 'body'),
    ]
  })
}

/** P49: DivergingBar items → row children (label / value). */
function liftDivergingBar(node: SceneNode): SceneNode {
  return liftArrayToRows(node, 'DivergingBar', 'items', 'bar', 'RankedRow', (row, id) => {
    const label = typeof row.label === 'string' && row.label.trim() ? row.label : 'Item'
    return [
      slotTextNode(id, 'label', label, 'title'),
      slotTextNode(id, 'value', row.value == null ? '' : String(row.value), 'body'),
    ]
  })
}

function personaCardFromFixture(parentId: string, row: Record<string, unknown>, key: string): SceneNode {
  const id = `${parentId}__persona_${key}`
  const props: Record<string, unknown> = {}
  if (typeof row.name === 'string') props.name = row.name
  if (typeof row.segment === 'string') props.segment = row.segment
  if (typeof row.bio === 'string') props.bio = row.bio
  if (row.confidence != null) props.confidence = row.confidence
  if (row.spread != null) props.spread = row.spread
  if (row.traits != null) props.traits = row.traits
  if (row.goals != null) props.goals = row.goals
  if (row.painPoints != null) props.painPoints = row.painPoints
  return { id, type: 'PrintPersonaCard', props }
}

const PERSONA_SHELL_BODY_TYPES = new Set([
  'PrintChipRow',
  'PrintTraitBars',
  'PrintRankedList',
  'PrintTwoColumn',
])

function hasPersonaShellBody(body: SceneNode[]): boolean {
  return body.some((child) => PERSONA_SHELL_BODY_TYPES.has(child.type))
}

function stringListFromUnknown(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
}

function confidenceChipLabel(raw: unknown): string | null {
  if (raw == null || raw === '') return null
  const n = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(n)) return null
  const pct = Math.round(n <= 1 ? n * 100 : n)
  return `${pct}% Konfidenz`
}

function printChipNode(id: string, label: string): SceneNode {
  return {
    id,
    type: 'PrintChip',
    children: [slotTextNode(id, 'label', label, 'title')],
  }
}

function rankedListFromStrings(
  id: string,
  labels: string[],
  compact: boolean,
  eyebrow?: { id: string; text: string },
): SceneNode | null {
  if (!labels.length && !eyebrow) return null
  const rows: SceneNode[] = []
  if (eyebrow) {
    rows.push({
      id: eyebrow.id,
      type: 'Text',
      props: { children: eyebrow.text, role: 'meta', slot: 'label' },
    })
  }
  for (const [index, label] of labels.entries()) {
    const rowId = `${id}__row_${index}`
    rows.push({
      id: rowId,
      type: 'RankedRow',
      children: [slotTextNode(rowId, 'label', label, 'title')],
    })
  }
  return {
    id,
    type: 'PrintRankedList',
    props: { compact, columns: 1, startIndex: 1 },
    children: rows,
  }
}

function traitBarsFromFixture(id: string, traits: unknown): SceneNode | null {
  if (!Array.isArray(traits) || !traits.length) return null
  const rows: SceneNode[] = []
  for (const [index, raw] of traits.entries()) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    if (typeof row.displayName !== 'string' || !row.displayName.trim()) continue
    const rowId = `${id}__trait_${rowKey(row, index)}`
    rows.push({
      id: rowId,
      type: 'RankedRow',
      children: [
        slotTextNode(rowId, 'label', row.displayName, 'title'),
        slotTextNode(rowId, 'value', row.score == null ? '' : String(row.score), 'body'),
      ],
    })
  }
  if (!rows.length) return null
  return { id, type: 'PrintTraitBars', children: rows }
}

/** P51: PrintPersonaCard arrays + segment meta → existing print primitive children. */
function liftPrintPersonaCard(node: SceneNode): SceneNode {
  if (node.type !== 'PrintPersonaCard') return node
  const props = { ...(node.props ?? {}) }
  const traits = props.traits
  const goals = props.goals
  const painPoints = props.painPoints
  delete props.traits
  delete props.goals
  delete props.painPoints
  const children = [...(node.children ?? [])]
  const { body } = partitionSlottedChildren(children)
  if (hasPersonaShellBody(body)) return ensurePersonaEyebrows({ ...node, props, children })

  const lifted: SceneNode[] = []
  const segment =
    slotPlainText(children, 'meta') ??
    (typeof props.segment === 'string' && props.segment.trim() ? props.segment : undefined)
  delete props.segment
  const confidenceLabel = confidenceChipLabel(props.confidence)
  const chips: SceneNode[] = []
  if (segment) chips.push(printChipNode(`${node.id}__chip_segment`, segment))
  if (confidenceLabel) chips.push(printChipNode(`${node.id}__chip_confidence`, confidenceLabel))
  if (chips.length) {
    lifted.push({ id: `${node.id}__chips`, type: 'PrintChipRow', children: chips })
  }

  const traitBars = traitBarsFromFixture(`${node.id}__traits`, traits)
  if (traitBars) lifted.push(traitBars)

  const spread = props.spread !== false && props.spread !== 'false'
  const goalLabels = stringListFromUnknown(goals)
  const painLabels = stringListFromUnknown(painPoints)
  if (spread) {
    const goalsList = rankedListFromStrings(`${node.id}__goals`, goalLabels, true, {
      id: `${node.id}__eyebrow_goals`,
      text: 'Ziele',
    })
    const painsList = rankedListFromStrings(`${node.id}__pains`, painLabels, true, {
      id: `${node.id}__eyebrow_pains`,
      text: 'Pain Points',
    })
    if (goalsList || painsList) {
      lifted.push({
        id: `${node.id}__spread`,
        type: 'PrintTwoColumn',
        children: [goalsList, painsList].filter((child): child is SceneNode => child != null),
      })
    }
  } else {
    const goalsList = rankedListFromStrings(`${node.id}__goals`, goalLabels.slice(0, 3), true, {
      id: `${node.id}__eyebrow_goals`,
      text: 'Ziele',
    })
    if (goalsList) lifted.push(goalsList)
  }

  const kept = children.filter((child) => slotOf(child) !== 'meta')
  return ensurePersonaEyebrows({ ...node, props, children: sortBySlot([...lifted, ...kept]) })
}

function withListEyebrow(list: SceneNode, eyebrowId: string, text: string): SceneNode {
  if (hasSlot(list.children ?? [], 'label')) return list
  return {
    ...list,
    children: [
      {
        id: eyebrowId,
        type: 'Text',
        props: { children: text, role: 'meta', slot: 'label' },
      },
      ...(list.children ?? []),
    ],
  }
}

/** P59: magazine Ziele / Pain Points eyebrows on persona lists (idempotent). */
function ensurePersonaEyebrows(node: SceneNode): SceneNode {
  if (node.type !== 'PrintPersonaCard') return node
  const children = [...(node.children ?? [])]
  const twoIndex = children.findIndex((child) => child.type === 'PrintTwoColumn')
  if (twoIndex >= 0) {
    const two = children[twoIndex]
    const lists = [...(two.children ?? [])]
    const ranked = lists.filter((child) => child.type === 'PrintRankedList')
    const goals = ranked[0]
    const pains = ranked[1]
    let changed = false
    const nextLists = lists.map((child) => {
      if (child.type !== 'PrintRankedList') return child
      if (child === goals) {
        const next = withListEyebrow(child, `${node.id}__eyebrow_goals`, 'Ziele')
        if (next !== child) changed = true
        return next
      }
      if (child === pains) {
        const next = withListEyebrow(child, `${node.id}__eyebrow_pains`, 'Pain Points')
        if (next !== child) changed = true
        return next
      }
      return child
    })
    if (!changed) return node
    children[twoIndex] = { ...two, children: nextLists }
    return { ...node, children }
  }
  const listIndex = children.findIndex((child) => child.type === 'PrintRankedList')
  if (listIndex < 0) return node
  const next = withListEyebrow(children[listIndex], `${node.id}__eyebrow_goals`, 'Ziele')
  if (next === children[listIndex]) return node
  children[listIndex] = next
  return { ...node, children }
}

/** P50: PrintPersonaGrid personas → existing PrintPersonaCard body children. */
function liftPrintPersonaGrid(node: SceneNode): SceneNode {
  if (node.type !== 'PrintPersonaGrid') return node
  const props = { ...(node.props ?? {}) }
  const personas = props.personas
  delete props.personas
  const children = [...(node.children ?? [])]
  const { body } = partitionSlottedChildren(children)
  if (body.length) return { ...node, props, children }
  if (!Array.isArray(personas)) return { ...node, props, children }
  const lifted: SceneNode[] = []
  for (const [index, raw] of personas.entries()) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    if (typeof row.name !== 'string' || !row.name.trim()) continue
    lifted.push(personaCardFromFixture(node.id, row, rowKey(row, index)))
  }
  return { ...node, props, children: [...lifted, ...children] }
}

/** P50: PrintCover kpis → Lede body children (ringPct leftover on the Lede). */
function liftPrintCoverKpis(node: SceneNode): SceneNode {
  if (node.type !== 'PrintCover') return node
  const props = { ...(node.props ?? {}) }
  const kpis = props.kpis
  delete props.kpis
  const children = [...(node.children ?? [])]
  const { body } = partitionSlottedChildren(children)
  if (body.length) return { ...node, props, children }
  if (!Array.isArray(kpis)) return { ...node, props, children }
  const lifted: SceneNode[] = []
  for (const [index, raw] of kpis.entries()) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const key = rowKey(row, index)
    const id = `${node.id}__kpi_${key}`
    const label = typeof row.label === 'string' && row.label.trim() ? row.label : 'KPI'
    const value = row.value == null ? '' : String(row.value)
    const kids: SceneNode[] = [
      slotTextNode(id, 'value', value, 'title'),
      slotTextNode(id, 'label', label, 'meta'),
    ]
    const extra =
      typeof row.unit === 'string' && row.unit.trim()
        ? row.unit
        : typeof row.meta === 'string' && row.meta.trim()
          ? row.meta
          : undefined
    if (extra) kids.push(slotTextNode(id, 'unit', extra, 'meta'))
    const lede: SceneNode = { id, type: 'Lede', children: kids }
    if (row.ringPct != null && row.ringPct !== '') {
      lede.props = { ringPct: row.ringPct }
    }
    lifted.push(lede)
  }
  return { ...node, props, children: sortBySlot([...children, ...lifted]) }
}

function tableCellText(cell: unknown): string {
  if (cell == null) return ''
  return String(cell)
}

/** P50/P59: PrintTable rows → RankedRow; columns → slotted Text. */
function liftPrintTable(node: SceneNode): SceneNode {
  if (node.type !== 'PrintTable') return node
  const props = { ...(node.props ?? {}) }
  const rows = props.rows
  const columns = props.columns
  delete props.rows
  delete props.columns
  const children = [...(node.children ?? [])]
  const { body, slots } = partitionSlottedChildren(children)
  const hasRows = body.some((child) => child.type === 'RankedRow')
  const hasCols = (slots.label?.length ?? 0) > 0
  const lifted: SceneNode[] = []
  if (!hasCols && Array.isArray(columns)) {
    for (const [index, raw] of columns.entries()) {
      if (typeof raw !== 'string' || !raw.trim()) continue
      lifted.push({
        id: `${node.id}__col_${index}`,
        type: 'Text',
        props: { children: raw, role: 'meta', slot: 'label' },
      })
    }
  }
  if (!hasRows && Array.isArray(rows)) {
    for (const [index, raw] of rows.entries()) {
      if (!Array.isArray(raw)) continue
      const key = String(index)
      const id = `${node.id}__row_${key}`
      const kids: SceneNode[] = []
      if (raw.length > 0) kids.push(slotTextNode(id, 'label', tableCellText(raw[0]), 'title'))
      if (raw.length > 1) kids.push(slotTextNode(id, 'value', tableCellText(raw[1]), 'body'))
      for (let i = 2; i < raw.length; i += 1) {
        kids.push({
          id: `${id}__cell_${i}`,
          type: 'Text',
          props: { children: tableCellText(raw[i]), role: 'body' },
        })
      }
      if (!kids.length) continue
      lifted.push({ id, type: 'RankedRow', children: kids })
    }
  }
  return { ...node, props, children: sortBySlot([...lifted, ...children]) }
}

/** P59: PrintDonut slices → RankedRow body children. */
function liftPrintDonutSlices(node: SceneNode): SceneNode {
  if (node.type !== 'PrintDonut') return node
  const props = { ...(node.props ?? {}) }
  const slices = props.slices
  delete props.slices
  const children = [...(node.children ?? [])]
  const { body } = partitionSlottedChildren(children)
  if (body.some((child) => child.type === 'RankedRow')) return { ...node, props, children }
  if (!Array.isArray(slices)) return { ...node, props, children }
  const lifted: SceneNode[] = []
  for (const [index, raw] of slices.entries()) {
    if (!raw || typeof raw !== 'object') continue
    const row = raw as Record<string, unknown>
    const key = rowKey(row, index)
    const id = `${node.id}__slice_${key}`
    const label = typeof row.label === 'string' && row.label.trim() ? row.label : key
    lifted.push({
      id,
      type: 'RankedRow',
      children: [
        slotTextNode(id, 'label', label, 'title'),
        slotTextNode(id, 'value', row.value == null ? '' : String(row.value), 'body'),
      ],
    })
  }
  return { ...node, props, children: sortBySlot([...children, ...lifted]) }
}

export function hydrateAtomicSlots(node: SceneNode): SceneNode {
  const specs = SHELL_LIFTS[node.type]
  const chrome = specs ? liftChrome(node, specs) : node
  const current = liftPrintPersonaCard(
    liftPrintTable(
      liftPrintCoverKpis(
        liftPrintPersonaGrid(
          liftDivergingBar(
            liftPrintTraitBars(
              liftPrintLedger(liftPrintRankedList(liftKpiStrip(liftPrintDonutSlices(chrome)))),
            ),
          ),
        ),
      ),
    ),
  )
  if (!current.children?.length) return current
  return { ...current, children: current.children.map(hydrateAtomicSlots) }
}
