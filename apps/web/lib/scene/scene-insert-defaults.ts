/**
 * Palette / insert default node trees + SiteTable structure helpers (W5b).
 * Spec: specs/domain/scene-core-split-w5.md
 */
import type { SceneNode } from '@zaoly/contracts'
import { paths } from '../paths'
import {
  DEFAULT_BODY_TYPE_BINDINGS,
  DEFAULT_HEADLINE_TYPE_BINDINGS,
  defaultSiteKitInteractiveStates,
  defaultSiteKitTokenBindings,
} from '../inspect/token-catalog'
import {
  SITE_SVG_DEFAULT_MARK_ID,
  SITE_SVG_PLACEHOLDER_MARKUP,
  SITE_SHAPE_DEFAULT_D,
  SITE_SHAPE_DEFAULT_VIEWBOX,
  siteSvgMark,
} from '@zaoly/site-kit'
import { cloneSceneNodeWithNewIds } from './scene-clone'
import { createSceneNodeId } from './scene-tree'
import { applySiteKitResponsiveDefaults } from './site-kit-responsive'

function siteKitPaint(type: string): Pick<SceneNode, 'tokenBindings' | 'states'> {
  const tokenBindings = defaultSiteKitTokenBindings(type)
  const states = defaultSiteKitInteractiveStates(type)
  return {
    ...(Object.keys(tokenBindings).length ? { tokenBindings } : {}),
    ...(states ? { states } : {}),
  }
}

function siteTableCell(text: string, header = false): SceneNode {
  return {
    id: createSceneNodeId('sitetablecell'),
    type: 'SiteTableCell',
    props: { header, align: 'start' },
    children: [
      {
        id: createSceneNodeId('sitetext'),
        type: 'SiteText',
        props: { role: header ? 'label' : 'body', children: text },
        tokenBindings: defaultSiteKitTokenBindings('SiteText'),
      },
    ],
  }
}

function siteTableRow(cellTexts: string[], header = false): SceneNode {
  return {
    id: createSceneNodeId('sitetablerow'),
    type: 'SiteTableRow',
    props: { header },
    children: cellTexts.map((text) => siteTableCell(text, header)),
  }
}

function isSiteTableHeaderRow(row: SceneNode): boolean {
  return row.type === 'SiteTableRow' && (row.props?.header === true || row.props?.header === 'true')
}

function siteTableColumnCount(table: SceneNode): number {
  const rows = (table.children ?? []).filter((c) => c.type === 'SiteTableRow')
  if (rows.length === 0) return 3
  return Math.max(1, ...rows.map((r) => (r.children ?? []).filter((c) => c.type === 'SiteTableCell').length))
}

export function applySiteTableStructureOp(
  table: SceneNode,
  op:
    | 'table_add_row'
    | 'table_add_column'
    | 'table_remove_row'
    | 'table_remove_column',
): { ok: true } | { ok: false; reason: string } {
  const rows = [...(table.children ?? [])]
  const tableRows = rows.filter((c) => c.type === 'SiteTableRow')
  const cols = siteTableColumnCount(table)

  if (op === 'table_add_row') {
    const texts = Array.from({ length: cols }, () => 'Cell')
    table.children = [...rows, siteTableRow(texts, false)]
    return { ok: true }
  }

  if (op === 'table_add_column') {
    for (const row of tableRows) {
      const header = isSiteTableHeaderRow(row)
      row.children = [...(row.children ?? []), siteTableCell(header ? 'Header' : 'Cell', header)]
    }
    if (tableRows.length === 0) {
      table.children = [
        siteTableRow(['Header', 'Header', 'Header'], true),
        siteTableRow(['Cell', 'Cell', 'Cell'], false),
      ]
    }
    return { ok: true }
  }

  if (op === 'table_remove_row') {
    const bodyIndexes = rows
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.type === 'SiteTableRow' && !isSiteTableHeaderRow(c))
      .map(({ i }) => i)
    if (bodyIndexes.length <= 1) {
      return { ok: false, reason: 'SiteTable must keep at least one body row' }
    }
    const lastBody = bodyIndexes[bodyIndexes.length - 1]!
    rows.splice(lastBody, 1)
    table.children = rows
    return { ok: true }
  }

  // table_remove_column
  if (cols <= 1) {
    return { ok: false, reason: 'SiteTable must keep at least one column' }
  }
  for (const row of tableRows) {
    const cells = [...(row.children ?? [])]
    let lastCell = -1
    for (let i = cells.length - 1; i >= 0; i -= 1) {
      if (cells[i]?.type === 'SiteTableCell') {
        lastCell = i
        break
      }
    }
    if (lastCell >= 0) cells.splice(lastCell, 1)
    row.children = cells
  }
  return { ok: true }
}

function slotText(slot: string, text: string, role: 'title' | 'meta' | 'body'): SceneNode {
  return {
    id: createSceneNodeId('text'),
    type: 'Text',
    props: { children: text, role, slot },
    tokenBindings: role === 'title' ? { ...DEFAULT_HEADLINE_TYPE_BINDINGS } : { ...DEFAULT_BODY_TYPE_BINDINGS },
  }
}

function patchSlotText(node: SceneNode, slot: string, text: string): void {
  for (const child of node.children ?? []) {
    if (child.props?.slot === slot) {
      child.props = { ...child.props, children: text }
    }
  }
}

function compactRankedList(
  labels: string[],
  eyebrow?: { id: string; text: string },
): SceneNode {
  const list = defaultChildForType('PrintRankedList')
  list.props = { ...list.props, compact: true }
  const rows = labels.map((label) => ({
    id: createSceneNodeId('rankedrow'),
    type: 'RankedRow',
    children: [slotText('label', label, 'title')],
  }))
  list.children = eyebrow
    ? [
        {
          id: eyebrow.id,
          type: 'Text',
          props: { children: eyebrow.text, role: 'meta', slot: 'label' },
          tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
        },
        ...rows,
      ]
    : rows
  return list
}

function patchPersonaCardCopy(
  card: SceneNode,
  patch: {
    name: string
    segment: string
    confidence: number
    bio: string
    traits: Array<{ label: string; value: string }>
    goals: string[]
    pains: string[]
  },
): void {
  patchSlotText(card, 'title', patch.name)
  patchSlotText(card, 'summary', patch.bio)
  card.props = { ...card.props, confidence: patch.confidence }
  const chips = card.children?.find((child) => child.type === 'PrintChipRow')
  if (chips?.children?.[0]) patchSlotText(chips.children[0], 'label', patch.segment)
  if (chips?.children?.[1]) patchSlotText(chips.children[1], 'label', `${patch.confidence}% Konfidenz`)
  const traits = card.children?.find((child) => child.type === 'PrintTraitBars')
  if (traits) {
    for (const [index, row] of patch.traits.entries()) {
      const child = traits.children?.[index]
      if (!child) continue
      patchSlotText(child, 'label', row.label)
      patchSlotText(child, 'value', row.value)
    }
  }
  const two = card.children?.find((child) => child.type === 'PrintTwoColumn')
  if (two?.children?.[0]) {
    two.children[0] = compactRankedList(patch.goals, {
      id: `${card.id}__eyebrow_goals`,
      text: 'Ziele',
    })
  }
  if (two?.children?.[1]) {
    two.children[1] = compactRankedList(patch.pains, {
      id: `${card.id}__eyebrow_pains`,
      text: 'Pain Points',
    })
  }
}

/**
 * Merge palette defaults into an insert_child payload (editor drag parity).
 * Keeps caller `id`; overrides props/style/tokenBindings; recursive on children.
 * Spec: `specs/api/scene-ops.md` · `specs/domain/scene-agent-editing.md`
 */
export function seedInsertChildTree(child: SceneNode): SceneNode {
  const seeded = cloneSceneNodeWithNewIds(defaultChildForType(child.type))
  seeded.id = child.id
  if (child.name != null) seeded.name = child.name
  if (child.props) seeded.props = { ...(seeded.props ?? {}), ...child.props }
  if (child.style) seeded.style = { ...(seeded.style ?? {}), ...child.style }
  if (child.tokenBindings) {
    seeded.tokenBindings = { ...(seeded.tokenBindings ?? {}), ...child.tokenBindings }
  }
  if (child.breakpoints) seeded.breakpoints = structuredClone(child.breakpoints)
  if (child.hidden) seeded.hidden = true
  if (child.locked) seeded.locked = true
  if (child.instanceOf) seeded.instanceOf = child.instanceOf
  if (child.instanceVariantId) seeded.instanceVariantId = child.instanceVariantId
  if (child.instanceVariantAxes) {
    seeded.instanceVariantAxes = { ...child.instanceVariantAxes }
  }
  if (child.instanceOverrides) {
    seeded.instanceOverrides = structuredClone(child.instanceOverrides)
  }
  if (child.children !== undefined) {
    seeded.children = child.children.map(seedInsertChildTree)
  }
  return seeded
}

export function defaultChildForType(type: string): SceneNode {
  const id = createSceneNodeId(type.toLowerCase())
  switch (type) {
    case 'Button':
      return {
        id,
        type,
        props: { variant: 'primary' },
        children: [slotText('label', 'Button', 'title')],
      }
    case 'Text':
      return {
        id,
        type,
        props: { children: 'Text', role: 'body' },
        tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
      }
    case 'Input':
      return { id, type, props: { placeholder: 'Input' } }
    case 'Image':
      return {
        id,
        type,
        props: { src: paths.imagePlaceholderUrl, alt: 'Image' },
      }
    case 'Card':
      return {
        id,
        type,
        children: [
          {
            id: createSceneNodeId('heading'),
            type: 'Text',
            props: { children: 'Card', role: 'title' },
            tokenBindings: { ...DEFAULT_HEADLINE_TYPE_BINDINGS },
          },
        ],
      }
    case 'Stack':
      return { id, type, props: { direction: 'column', gap: 'md' }, children: [] }
    case 'Heading':
      return {
        id,
        type,
        props: { children: 'Heading', level: 2 },
        tokenBindings: { ...DEFAULT_HEADLINE_TYPE_BINDINGS },
      }
    case 'Grid':
      return { id, type, props: { columns: 2, gap: 'md' }, children: [] }
    case 'Link':
      return {
        id,
        type,
        props: { children: 'Link', href: paths.routes.home },
      }
    case 'Badge':
      return {
        id,
        type,
        props: { tone: 'neutral' },
        children: [slotText('label', 'Badge', 'title')],
      }
    case 'Spacer':
      return { id, type, props: { size: 'md', axis: 'y' } }
    case 'Checkbox':
      return { id, type, props: { label: 'Checkbox', checked: false } }
    case 'Switch':
      return { id, type, props: { label: 'Switch', checked: false } }
    case 'Select':
      return {
        id,
        type,
        props: {
          placeholder: 'Select',
          size: 'sm',
          value: 'a',
          options: [
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ],
        },
      }
    case 'Textarea':
      return { id, type, props: { placeholder: 'Textarea', size: 'sm' } }
    case 'Chip':
      return {
        id,
        type,
        name: 'Chip',
        props: { size: 'sm', selected: false },
        children: [slotText('label', 'Chip', 'title')],
      }
    case 'Divider':
      return { id, type, props: { orientation: 'horizontal' } }
    case 'Avatar':
      return { id, type, props: { displayName: 'Ada Lovelace', size: 'sm', shape: 'square' } }
    case 'Alert':
      return {
        id,
        type,
        props: { tone: 'info' },
        children: [slotText('value', 'Alert', 'body')],
      }
    case 'Hint':
      return {
        id,
        type,
        props: { panel: false },
        children: [slotText('value', 'Hint', 'meta')],
      }
    case 'Spinner':
      return { id, type, props: { size: 'sm', label: 'Loading' } }
    case 'StatusDot':
      return { id, type, props: { level: 'ok' } }
    case 'EmptyState':
      return { id, type, children: [slotText('value', 'Nothing here yet', 'body')] }
    case 'Slider':
      return { id, type, props: { value: 50, min: 0, max: 100, step: 1 } }
    case 'Field':
      return {
        id,
        type,
        props: { size: 'sm', layout: 'stack' },
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [slotText('label', 'Field', 'title'), defaultChildForType('Input')],
      }
    case 'Panel':
      return {
        id,
        type,
        props: { variant: 'editorial' },
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [
          {
            id: createSceneNodeId('text'),
            type: 'Text',
            props: { children: 'Panel', role: 'body' },
            tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
          },
        ],
      }
    case 'Tabs':
      return {
        id,
        type,
        props: {
          value: 'a',
          items: [
            { id: 'a', label: 'Tab A', panel: 'Panel A' },
            { id: 'b', label: 'Tab B', panel: 'Panel B' },
          ],
        },
      }
    case 'Accordion':
      return {
        id,
        type,
        props: {
          value: 'a',
          items: [
            { id: 'a', title: 'Section A', preview: 'Preview A', panel: 'Body A' },
            { id: 'b', title: 'Section B', preview: 'Preview B', panel: 'Body B' },
          ],
        },
      }
    case 'LoadingText':
      return { id, type, children: [slotText('value', 'Loading…', 'meta')] }
    case 'PageTitle':
      return { id, type, children: [slotText('title', 'Page title', 'title')] }
    case 'AddTile':
      return { id, type, children: [slotText('label', 'Add', 'title')] }
    case 'TagInput':
      return {
        id,
        type,
        props: {
          placeholder: 'Add…',
          size: 'sm',
          tags: ['alpha', 'beta'],
        },
      }
    case 'ToggleGroup':
      return {
        id,
        type,
        props: {
          value: 'a',
          size: 'sm',
          variant: 'chip',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      }
    case 'MetricChip':
      return {
        id,
        type,
        children: [slotText('label', 'Metric', 'meta'), slotText('value', '42', 'title')],
      }
    case 'Meter':
      return {
        id,
        type,
        props: { label: 'Meter', valueLabel: '50%', value: 50, min: 0, max: 100, step: 1 },
      }
    case 'Chart':
      return {
        id,
        type,
        props: {
          variant: 'bar',
          title: 'Sample chart',
          height: 220,
          data: [
            { label: 'A', value: 42 },
            { label: 'B', value: 28 },
            { label: 'C', value: 65 },
            { label: 'D', value: 18 },
          ],
        },
      }
    case 'Gauge':
      return {
        id,
        type,
        props: {
          label: 'Score',
          unit: '%',
          value: 72,
          min: 0,
          max: 100,
          tone: 'ok',
        },
      }
    case 'Lede':
      return {
        id,
        type,
        props: { tone: 'default', kind: 'number' },
        children: [
          slotText('value', '42', 'title'),
          slotText('label', 'Lede', 'meta'),
          slotText('unit', '%', 'meta'),
        ],
      }
    case 'ScrollArea':
      return {
        id,
        type,
        props: { orientation: 'vertical' },
        children: [
          {
            id: createSceneNodeId('text'),
            type: 'Text',
            props: { children: 'Scroll', role: 'body' },
            tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
          },
        ],
      }
    case 'FormSection':
      return {
        id,
        type,
        props: { columns: 1, tone: 'default' },
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [slotText('title', 'Section', 'title'), defaultChildForType('Field')],
      }
    case 'CardActions': {
      const primary = defaultChildForType('Button')
      const ghost = defaultChildForType('Button')
      ghost.props = { ...(ghost.props ?? {}), variant: 'ghost' }
      patchSlotText(ghost, 'label', 'More')
      return {
        id,
        type,
        props: { hairline: true },
        children: [primary, ghost],
      }
    }
    case 'FilterRow': {
      const a = defaultChildForType('Chip')
      const b = defaultChildForType('Chip')
      b.props = { ...(b.props ?? {}), selected: true }
      patchSlotText(b, 'label', 'Filter B')
      return {
        id,
        type,
        props: { variant: 'magazine' },
        children: [slotText('label', 'Filters', 'meta'), a, b],
      }
    }
    case 'SectionChrome':
      return {
        id,
        type,
        props: { metaTone: 'muted', role: 'research', as: 'h2', quiet: false },
        children: [slotText('title', 'Section', 'title'), slotText('meta', 'n=12', 'meta')],
      }
    case 'RankedRow':
      return {
        id,
        type,
        props: { index: 1, barPct: 64, active: false },
        children: [
          slotText('label', 'Row', 'title'),
          slotText('value', '42', 'body'),
          slotText('secondary', 'meta', 'meta'),
        ],
      }
    case 'RankedList': {
      const a = defaultChildForType('RankedRow')
      const b = defaultChildForType('RankedRow')
      b.props = { ...(b.props ?? {}), index: 2, barPct: 32 }
      patchSlotText(b, 'label', 'Row B')
      patchSlotText(b, 'value', '18')
      return {
        id,
        type,
        props: { hint: 'Ranked' },
        children: [a, b],
      }
    }
    case 'TopStatus':
      return {
        id,
        type,
        props: { level: 'ok', live: false },
        children: [slotText('primary', 'Live', 'title'), slotText('secondary', 'Ready', 'meta')],
      }
    case 'EventFooter':
      return {
        id,
        type,
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [
          slotText('summary', 'Done', 'title'),
          {
            id: createSceneNodeId('text'),
            type: 'Text',
            props: { children: 'Event', role: 'meta' },
            tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
          },
        ],
      }
    case 'EntityCard': {
      const meta = defaultChildForType('Text')
      meta.props = { children: 'Catalog', role: 'meta', slot: 'meta' }
      const title = defaultChildForType('Text')
      title.props = { children: 'Entity', role: 'title', slot: 'title' }
      title.tokenBindings = { ...DEFAULT_HEADLINE_TYPE_BINDINGS }
      const badge = defaultChildForType('Badge')
      badge.props = { ...(badge.props ?? {}), slot: 'badge' }
      patchSlotText(badge, 'label', 'Live')
      const slider = defaultChildForType('Slider')
      const footer = defaultChildForType('Text')
      footer.props = { children: 'Updated just now', role: 'meta', slot: 'footer' }
      return {
        id,
        type,
        props: { size: 'default' },
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [meta, title, badge, slider, footer],
      }
    }
    case 'ChannelLane':
      return {
        id,
        type,
        props: { compact: false, defaultOpen: true },
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [
          slotText('label', 'Lane', 'title'),
          {
            id: createSceneNodeId('text'),
            type: 'Text',
            props: { children: 'Lane body', role: 'body' },
            tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
          },
        ],
      }
    case 'ChannelStack': {
      const a = defaultChildForType('ChannelLane')
      const b = defaultChildForType('ChannelLane')
      patchSlotText(b, 'label', 'Lane B')
      return { id, type, children: [a, b] }
    }
    case 'StepStrip': {
      const a = defaultChildForType('Text')
      a.props = { ...(a.props ?? {}), children: 'Step A' }
      const b = defaultChildForType('Text')
      b.props = { ...(b.props ?? {}), children: 'Step B' }
      return {
        id,
        type,
        props: { hint: 'Steps' },
        children: [a, b],
      }
    }
    case 'KpiStrip': {
      const a = defaultChildForType('Lede')
      patchSlotText(a, 'label', 'KPI A')
      patchSlotText(a, 'value', '12')
      a.children = (a.children ?? []).filter((child) => child.props?.slot !== 'unit')
      const b = defaultChildForType('Lede')
      patchSlotText(b, 'label', 'KPI B')
      patchSlotText(b, 'value', '8')
      b.children = (b.children ?? []).filter((child) => child.props?.slot !== 'unit')
      return { id, type, children: [a, b] }
    }
    case 'DivergingBar': {
      const a = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'A', 'title'), slotText('value', '40', 'body')],
      }
      const b = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'B', 'title'), slotText('value', '-20', 'body')],
      }
      return { id, type, children: [a, b] }
    }
    case 'PrintPullQuote':
      return {
        id,
        type,
        children: [slotText('label', 'Fazit', 'meta'), slotText('value', 'Print pull quote.', 'body')],
      }
    case 'PrintCallout':
      return {
        id,
        type,
        props: { variant: 'wash' },
        children: [
          slotText('label', 'Hinweis', 'meta'),
          slotText('value', 'Report callout body.', 'body'),
        ],
      }
    case 'PrintSteps': {
      const mk = (label: string, detail: string) => ({
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow' as const,
        children: [slotText('label', label, 'title'), slotText('secondary', detail, 'meta')],
      })
      return {
        id,
        type,
        props: { orientation: 'horizontal', emphasisIndex: '2' },
        children: [
          mk('Audit', 'Capture signals'),
          mk('Cluster', 'Group themes'),
          mk('Prioritize', 'Rank actions'),
          mk('Ship', 'Publish fixes'),
        ],
      }
    }
    case 'PrintChip':
      return { id, type, children: [slotText('label', 'Print chip', 'title')] }
    case 'PrintScoreRing':
      return {
        id,
        type,
        props: { max: 100 },
        children: [slotText('value', '72', 'title'), slotText('label', 'Score', 'meta')],
      }
    case 'PrintCover': {
      const a = defaultChildForType('Lede')
      patchSlotText(a, 'label', 'GEO')
      patchSlotText(a, 'value', '72')
      a.props = { ...a.props, ringPct: 72 }
      a.children = (a.children ?? []).filter((child) => child.props?.slot !== 'unit')
      const b = defaultChildForType('Lede')
      patchSlotText(b, 'label', 'Pages')
      patchSlotText(b, 'value', '8')
      b.children = (b.children ?? []).filter((child) => child.props?.slot !== 'unit')
      return {
        id,
        type,
        props: { url: 'beispiel.de' },
        children: [
          slotText('label', 'Quick Check', 'meta'),
          slotText('title', 'Print cover', 'title'),
          slotText('meta', 'Stand 2026', 'meta'),
          slotText('footer', 'GEO ausbaufähig.', 'body'),
          a,
          b,
        ],
      }
    }
    case 'PrintDonut': {
      const sliceA = {
        id: `${id}__slice_a`,
        type: 'RankedRow',
        children: [slotText('label', 'A', 'title'), slotText('value', '40', 'body')],
      }
      const sliceB = {
        id: `${id}__slice_b`,
        type: 'RankedRow',
        children: [slotText('label', 'B', 'title'), slotText('value', '32', 'body')],
      }
      return {
        id,
        type,
        children: [slotText('value', '72', 'title'), slotText('label', 'GEO', 'meta'), sliceA, sliceB],
      }
    }
    case 'PrintRankedList': {
      const a = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'Item A', 'title'), slotText('secondary', 'Lead', 'meta')],
      }
      const b = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'Item B', 'title'), slotText('secondary', 'Follow', 'meta')],
      }
      return {
        id,
        type,
        props: { columns: 1, compact: false, startIndex: 1 },
        children: [a, b],
      }
    }
    case 'PrintLedger': {
      const a = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [
          slotText('label', 'A', 'title'),
          slotText('value', '72', 'body'),
          slotText('summary', 'Strong', 'meta'),
        ],
      }
      const b = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [
          slotText('label', 'B', 'title'),
          slotText('value', '41', 'body'),
          slotText('summary', 'Gap', 'meta'),
        ],
      }
      return { id, type, props: { max: 100 }, children: [a, b] }
    }
    case 'PrintTraitBars': {
      const a = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'Trust', 'title'), slotText('value', '0.72', 'body')],
      }
      const b = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'Reach', 'title'), slotText('value', '0.41', 'body')],
      }
      return { id, type, children: [a, b] }
    }
    case 'PrintTable': {
      const a = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'GEO', 'title'), slotText('value', '72', 'body')],
      }
      const b = {
        id: createSceneNodeId('rankedrow'),
        type: 'RankedRow',
        children: [slotText('label', 'Pages', 'title'), slotText('value', '8', 'body')],
      }
      return {
        id,
        type,
        children: [
          {
            id: `${id}__col_0`,
            type: 'Text',
            props: { children: 'Metric', role: 'meta', slot: 'label' },
            tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
          },
          {
            id: `${id}__col_1`,
            type: 'Text',
            props: { children: 'Now', role: 'meta', slot: 'label' },
            tokenBindings: { ...DEFAULT_BODY_TYPE_BINDINGS },
          },
          a,
          b,
        ],
      }
    }
    case 'PrintPersonaCard': {
      const chips = defaultChildForType('PrintChipRow')
      if (chips.children?.[0]) patchSlotText(chips.children[0], 'label', 'Decision maker')
      if (chips.children?.[1]) patchSlotText(chips.children[1], 'label', '72% Konfidenz')
      const traits = defaultChildForType('PrintTraitBars')
      const two: SceneNode = {
        id: createSceneNodeId('printtwocolumn'),
        type: 'PrintTwoColumn',
        children: [
          compactRankedList(['Find reliable answers', 'Compare vendors'], {
            id: `${id}__eyebrow_goals`,
            text: 'Ziele',
          }),
          compactRankedList(['Inconsistent citations'], {
            id: `${id}__eyebrow_pains`,
            text: 'Pain Points',
          }),
        ],
      }
      return {
        id,
        type,
        props: { confidence: 72, spread: true },
        children: [
          slotText('title', 'Alex Rivera', 'title'),
          chips,
          slotText('summary', 'Evaluates GEO coverage before buying.', 'body'),
          traits,
          two,
        ],
      }
    }
    case 'PrintPersonaGrid': {
      const a = defaultChildForType('PrintPersonaCard')
      const b = defaultChildForType('PrintPersonaCard')
      patchPersonaCardCopy(b, {
        name: 'Sam Chen',
        segment: 'Researcher',
        confidence: 61,
        bio: 'Maps citation gaps across pages.',
        traits: [
          { label: 'Trust', value: '0.61' },
          { label: 'Reach', value: '0.55' },
        ],
        goals: ['Audit GEO sources'],
        pains: ['Sparse page coverage'],
      })
      return { id, type, children: [a, b] }
    }
    case 'PrintChipRow': {
      const a = defaultChildForType('PrintChip')
      const b = defaultChildForType('PrintChip')
      patchSlotText(b, 'label', 'Chip B')
      return { id, type, children: [a, b] }
    }
    case 'PrintTwoColumn': {
      const left = defaultChildForType('PrintPullQuote')
      const right = defaultChildForType('PrintPullQuote')
      patchSlotText(right, 'label', 'Note')
      patchSlotText(right, 'value', 'Right column.')
      return { id, type, children: [left, right] }
    }
    case 'PrintChapter':
      return {
        id,
        type,
        props: { index: '01' },
        children: [
          slotText('label', 'Chapter', 'meta'),
          slotText('title', 'Print chapter', 'title'),
          slotText('summary', 'Lede copy.', 'body'),
          defaultChildForType('PrintPullQuote'),
        ],
      }
    case 'PrintPage':
      return {
        id,
        type,
        children: [
          slotText('label', 'beispiel.de', 'meta'),
          slotText('footer', '1 — 8', 'meta'),
          defaultChildForType('PrintChapter'),
        ],
      }
    case 'SiteButton':
      return {
        id,
        type,
        props: { variant: 'primary', children: 'Get started' },
        ...siteKitPaint(type),
      }
    case 'SiteText':
      return {
        id,
        type,
        props: { role: 'body', children: 'Text' },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    case 'SiteLink':
      return {
        id,
        type,
        props: { children: 'Link', href: '#' },
        ...siteKitPaint(type),
      }
    case 'SiteInput':
      return {
        id,
        type,
        props: { placeholder: 'Email' },
        ...siteKitPaint(type),
      }
    case 'SiteTextarea':
      return {
        id,
        type,
        props: { placeholder: 'Message' },
        ...siteKitPaint(type),
      }
    case 'SiteCheckbox':
      return {
        id,
        type,
        props: { children: 'Subscribe' },
        ...siteKitPaint(type),
      }
    case 'SiteBadge':
      return {
        id,
        type,
        props: { children: 'New' },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    case 'SiteChart':
      return {
        id,
        type,
        props: {
          chartType: 'bar',
          // Legacy alias — paint still reads variant when chartType is absent.
          variant: 'bar',
          title: 'Sample chart',
          height: 220,
          // Multiline text — Inspect edits this; paint parses Label: value lines.
          data: 'A: 42\nB: 28\nC: 65\nD: 18',
        },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    case 'SiteGauge':
      return {
        id,
        type,
        props: {
          label: 'Score',
          unit: '%',
          value: 72,
          min: 0,
          max: 100,
          tone: 'ok',
        },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    case 'SiteImage':
      return {
        id,
        type,
        props: { src: paths.imagePlaceholderUrl, alt: 'Image' },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    case 'SiteSvg': {
      const defaultMark = siteSvgMark(SITE_SVG_DEFAULT_MARK_ID)
      return {
        id,
        type,
        props: {
          mark: SITE_SVG_DEFAULT_MARK_ID,
          markup: defaultMark?.markup ?? SITE_SVG_PLACEHOLDER_MARKUP,
          alt: defaultMark?.alt ?? 'Graphic',
          viewBox: defaultMark?.viewBox ?? '0 0 48 48',
        },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    }
    case 'SiteShape':
      return {
        id,
        type,
        props: {
          d: SITE_SHAPE_DEFAULT_D,
          viewBox: SITE_SHAPE_DEFAULT_VIEWBOX,
          alt: 'Shape',
        },
        style: { width: '48px', height: '48px' },
        tokenBindings: defaultSiteKitTokenBindings(type),
      }
    case 'SiteContainer':
      return applySiteKitResponsiveDefaults({
        id,
        type,
        // wrap ready when designers flip direction → row (Wave C fluid default)
        props: { direction: 'column', wrap: true },
        tokenBindings: defaultSiteKitTokenBindings(type),
        children: [],
      })
    case 'SiteGrid':
      return applySiteKitResponsiveDefaults({
        id,
        type,
        // columns → fluid auto-fit template (site-kit layout-fluid)
        props: { columns: '2' },
        tokenBindings: defaultSiteKitTokenBindings(type),
        children: [],
      })
    case 'SiteStack':
      return applySiteKitResponsiveDefaults({
        id,
        type,
        props: { direction: 'column', wrap: true },
        tokenBindings: defaultSiteKitTokenBindings(type),
        children: [],
      })
    case 'SiteDivider':
      return { id, type, props: {}, tokenBindings: defaultSiteKitTokenBindings(type) }
    case 'SiteTable':
      return {
        id,
        type,
        props: {
          density: 'default',
          borders: 'row',
          striped: false,
          caption: '',
        },
        tokenBindings: defaultSiteKitTokenBindings(type),
        children: [
          siteTableRow(['Header', 'Header', 'Header'], true),
          siteTableRow(['Cell', 'Cell', 'Cell'], false),
          siteTableRow(['Cell', 'Cell', 'Cell'], false),
        ],
      }
    case 'SiteTableRow':
      return siteTableRow(['Cell', 'Cell', 'Cell'], false)
    case 'SiteTableCell':
      return siteTableCell('Cell', false)
    case 'SiteSelect':
      return {
        id,
        type,
        props: {
          placeholder: 'Select',
          options: 'Option A\nOption B',
        },
        ...siteKitPaint(type),
      }
    default:
      return { id, type, props: {} }
  }
}
