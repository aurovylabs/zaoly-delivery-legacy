import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { familyDef, resolveFamilyId } from '../lib/inspect/hud-quick-slots'
import {
  buildHudSelectWriteOps,
  buildHudStructureOps,
  buildHudTokenWriteOps,
  fanOutHudOpsToSelection,
  intersectSlots,
  nextTokenInLadder,
  readHudMultiSlotValue,
  readSizeMode,
  resolveHudModel,
} from '../lib/inspect/resolve-hud-model'

function node(partial: Partial<SceneNode> & { id: string; type: string }): SceneNode {
  return {
    props: {},
    ...partial,
  }
}

describe('resolveFamilyId', () => {
  it('maps Site Kit and legacy aliases', () => {
    expect(resolveFamilyId('SiteText')).toBe('text')
    expect(resolveFamilyId('Heading')).toBe('text')
    expect(resolveFamilyId('SiteStack')).toBe('layoutStack')
    expect(resolveFamilyId('Stack')).toBe('layoutStack')
    expect(resolveFamilyId('SiteTable')).toBe('table')
    expect(resolveFamilyId('SiteLink')).toBe('textLink')
    expect(resolveFamilyId('PrintPage')).toBe('printPage')
    expect(resolveFamilyId('PrintCover')).toBe('printShell')
    expect(resolveFamilyId('PrintDonut')).toBe('printChart')
    expect(resolveFamilyId('PrintPullQuote')).toBe('printTextish')
    expect(resolveFamilyId('PrintCallout')).toBe('printTextish')
    expect(resolveFamilyId('PrintTable')).toBe('printTable')
  })

  it('covers every SITE_KIT_PALETTE_IDS type with a non-fallback family', async () => {
    const { SITE_KIT_PALETTE_IDS } = await import('../lib/scene/site-kit-palette')
    for (const id of SITE_KIT_PALETTE_IDS) {
      expect(resolveFamilyId(id), id).not.toBe('fallback')
    }
  })
})

describe('resolveHudModel', () => {
  const root = node({ id: 'root', type: 'SiteStack', name: 'Root' })
  const text = node({
    id: 't1',
    type: 'SiteText',
    name: 'Headline',
    props: { role: 'body', children: 'Hi' },
  })
  const table = node({
    id: 'tbl',
    type: 'SiteTable',
    props: { density: 'default', borders: 'row' },
    children: [
      node({
        id: 'r0',
        type: 'SiteTableRow',
        props: { header: true },
        children: [
          node({ id: 'c0', type: 'SiteTableCell', props: { header: true } }),
          node({ id: 'c1', type: 'SiteTableCell', props: { header: true } }),
        ],
      }),
      node({
        id: 'r1',
        type: 'SiteTableRow',
        props: { header: false },
        children: [
          node({ id: 'c2', type: 'SiteTableCell' }),
          node({ id: 'c3', type: 'SiteTableCell' }),
        ],
      }),
      node({
        id: 'r2',
        type: 'SiteTableRow',
        props: { header: false },
        children: [
          node({ id: 'c4', type: 'SiteTableCell' }),
          node({ id: 'c5', type: 'SiteTableCell' }),
        ],
      }),
    ],
  })

  it('shows insert when empty', () => {
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [],
      selectedNodes: [],
      workingRootId: root.id,
      primary: null,
    })
    expect(m.mode).toBe('empty')
    expect(m.showInsert).toBe(true)
    expect(m.showSmart).toBe(false)
  })

  it('keeps insert on working root and exposes artboard slots', () => {
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [root.id],
      selectedNodes: [root],
      workingRootId: root.id,
      primary: root,
    })
    expect(m.mode).toBe('root')
    expect(m.showInsert).toBe(true)
    expect(m.showArtboard).toBe(true)
    expect(m.familyId).toBe('artboard')
  })

  it('collapses insert for SiteText and ranks typography slots', () => {
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [text.id],
      selectedNodes: [text],
      workingRootId: root.id,
      primary: text,
    })
    expect(m.mode).toBe('single')
    expect(m.showInsert).toBe(false)
    expect(m.showSmart).toBe(true)
    expect(m.familyId).toBe('text')
    expect(m.slots.map((s) => s.key)).toEqual([
      'fontFamily',
      'fontSize',
      'fontWeight',
      'color',
      'padding',
      'margin',
    ])
    expect(m.slots.length).toBeLessThanOrEqual(6)
  })

  it('writes literal fontSize as prop and clears token binding', () => {
    const n = node({
      id: 't2',
      type: 'SiteText',
      props: {},
      tokenBindings: { fontSize: 'typography.body.family' },
    })
    const ops = buildHudTokenWriteOps(n, 'fontSize', { kind: 'literal', value: '18px' })
    expect(ops).toEqual([
      { op: 'set_prop', nodeId: 't2', key: 'fontSize', value: '18px' },
      { op: 'clear_token_binding', nodeId: 't2', key: 'fontSize' },
    ])
  })

  it('writes fontFamily token paths as bindings', () => {
    const n = node({ id: 't3', type: 'SiteText', props: { fontFamily: 'Inter' } })
    const ops = buildHudTokenWriteOps(n, 'fontFamily', {
      kind: 'token',
      path: 'typography.body.family',
    })
    expect(ops[0]).toMatchObject({ op: 'set_prop', key: 'fontFamily', value: '' })
    expect(ops[1]).toMatchObject({
      op: 'set_token_binding',
      key: 'fontFamily',
      tokenPath: 'typography.body.family',
    })
  })

  it('exposes table structure actions', () => {
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [table.id],
      selectedNodes: [table],
      workingRootId: root.id,
      primary: table,
    })
    expect(m.familyId).toBe('table')
    expect(m.slots.some((s) => s.op === 'table_add_row')).toBe(true)
    expect(m.slots.some((s) => s.op === 'table_add_column')).toBe(true)
  })

  it('hides table structure actions on sealed Master Instances', () => {
    const instanceSubject = node({
      id: 'instance-tbl',
      type: 'SiteTable',
      instanceOf: 'master-SiteTable',
      props: { density: 'comfortable', borders: 'all' },
      children: table.children,
    })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [instanceSubject.id],
      selectedNodes: [instanceSubject],
      workingRootId: root.id,
      primary: instanceSubject,
    })
    expect(m.familyId).toBe('table')
    expect(m.slots.some((s) => s.source === 'structureOp')).toBe(false)
    expect(m.slots.map((s) => s.key)).toEqual([
      'density',
      'borders',
      'padding',
      'margin',
      'striped',
      'width',
    ])
  })

  it('buildHudStructureOps emits typed table SceneOps', () => {
    expect(buildHudStructureOps('t1', 'table_add_row')).toEqual([
      { op: 'table_add_row', nodeId: 't1' },
    ])
    expect(buildHudStructureOps('t1', 'table_add_column')).toEqual([
      { op: 'table_add_column', nodeId: 't1' },
    ])
  })

  it('ranks Image… hostAction first for SiteImage', () => {
    const image = node({ id: 'img1', type: 'SiteImage', props: { src: 'https://example.com/a.png' } })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [image.id],
      selectedNodes: [image],
      workingRootId: root.id,
      primary: image,
    })
    expect(m.familyId).toBe('media')
    expect(m.slots[0]?.hostAction).toBe('openAssetLibrary')
    expect(m.slots.map((s) => s.key)).toEqual([
      'openAssetLibrary',
      'width',
      'height',
      'radius',
      'padding',
      'margin',
    ])
    expect(m.slots.map((s) => s.key)).not.toContain('objectFit')
  })

  it('biases form textarea toward typography then size', () => {
    const ta = node({ id: 'ta1', type: 'SiteTextarea', props: {} })
    const cb = node({ id: 'cb1', type: 'SiteCheckbox', props: {} })
    const mTa = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [ta.id],
      selectedNodes: [ta],
      workingRootId: root.id,
      primary: ta,
    })
    const mCb = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [cb.id],
      selectedNodes: [cb],
      workingRootId: root.id,
      primary: cb,
    })
    expect(mTa.familyId).toBe('form')
    expect(mTa.slots.map((s) => s.key)).toEqual([
      'fontFamily',
      'fontSize',
      'fontWeight',
      'color',
      'padding',
      'margin',
    ])
    expect(mCb.slots.map((s) => s.key)).not.toContain('radius')
    expect(mCb.slots.map((s) => s.key)).toContain('color')
    expect(mCb.slots.map((s) => s.key)).not.toContain('fontFamily')
    expect(mCb.slots.map((s) => s.key)).not.toContain('padding')
  })

  it('injects Pad + Margin icon boxes on every family (incl. layout)', () => {
    const stack = node({ id: 's1', type: 'SiteStack', props: {} })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [stack.id],
      selectedNodes: [stack],
      workingRootId: root.id,
      primary: stack,
    })
    expect(m.slots.map((s) => s.key)).toEqual([
      'gap',
      'width',
      'padding',
      'margin',
    ])
    const pad = m.slots.find((s) => s.key === 'padding')
    const margin = m.slots.find((s) => s.key === 'margin')
    expect(pad?.control).toBe('tokenLength')
    expect(margin?.control).toBe('tokenLength')
  })

  it('disables mutate when locked or soft-locked or inline editing', () => {
    const locked = node({ id: 't1', type: 'SiteText', locked: true })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [locked.id],
      selectedNodes: [locked],
      workingRootId: root.id,
      primary: locked,
      softLocked: false,
    })
    expect(m.mutateEnabled).toBe(false)

    const m2 = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [text.id],
      selectedNodes: [text],
      workingRootId: root.id,
      primary: text,
      inlineEditing: true,
    })
    expect(m2.mutateEnabled).toBe(false)
  })

  it('multi-select shows intersection Smart and overflow Insert', () => {
    const stackA = node({ id: 's1', type: 'SiteStack', props: { direction: 'row' } })
    const stackB = node({ id: 's2', type: 'SiteStack', props: { direction: 'row' } })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [stackA.id, stackB.id],
      selectedNodes: [stackA, stackB],
      workingRootId: root.id,
      primary: stackB,
    })
    expect(m.mode).toBe('multi')
    expect(m.showInsert).toBe(false)
    expect(m.showInsertOverflow).toBe(true)
    expect(m.showSmart).toBe(true)
    expect(m.familyId).toBe('layoutStack')
    const keys = m.slots.map((s) => s.key)
    expect(keys).toEqual(expect.arrayContaining(['width', 'padding', 'gap']))
    expect(keys).not.toContain('direction')
    expect(keys).not.toContain('justify')
    expect(keys).not.toContain('align')
    expect(m.slots.every((s) => s.source !== 'structureOp')).toBe(true)
    expect(m.showAlignGroup).toBe(true)
  })

  it('multi mixed families intersects allowlisted shared keys only', () => {
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [text.id, table.id],
      selectedNodes: [text, table],
      workingRootId: root.id,
      primary: table,
    })
    expect(m.mode).toBe('multi')
    expect(m.familyId).toBeNull()
    expect(m.slots.map((s) => s.key)).toEqual(['padding'])
    expect(m.showSmart).toBe(true)
  })

  it('legacy mode keeps insert always', () => {
    const m = resolveHudModel({
      smartHudEnabled: false,
      selectedIds: [text.id],
      selectedNodes: [text],
      workingRootId: root.id,
      primary: text,
    })
    expect(m.mode).toBe('legacy')
    expect(m.showInsert).toBe(true)
  })

  it('cycles token ladder and size modes', () => {
    expect(nextTokenInLadder('spacing.static.small', ['spacing.static.small', 'spacing.static.medium'])).toBe(
      'spacing.static.medium',
    )
    expect(readSizeMode(node({ id: 'x', type: 'SiteStack', style: { width: '100%' } }), 'width')).toBe(
      'fill',
    )
  })
})

describe('W3 intersectSlots + fanOut', () => {
  it('intersectSlots caps and omits structureOps', () => {
    const a = node({
      id: 't1',
      type: 'SiteTable',
      props: { density: 'default', borders: 'row' },
    })
    const b = node({
      id: 't2',
      type: 'SiteTable',
      props: { density: 'comfortable', borders: 'row' },
    })
    const slots = intersectSlots([a, b])
    expect(slots.map((s) => s.key)).toEqual(
      expect.arrayContaining(['padding', 'density', 'borders']),
    )
    expect(slots.every((s) => s.source !== 'structureOp')).toBe(true)
    expect(slots.length).toBeLessThanOrEqual(6)
  })

  it('readHudMultiSlotValue shows dash when mixed', () => {
    const a = node({ id: 'a', type: 'SiteTable', props: { density: 'default' } })
    const b = node({ id: 'b', type: 'SiteTable', props: { density: 'comfortable' } })
    const slot = intersectSlots([a, b]).find((s) => s.key === 'density')!
    expect(readHudMultiSlotValue([a, b], slot)).toBe('—')
    expect(readHudMultiSlotValue([a, a], slot)).toBe('default')
  })

  it('fanOutHudOpsToSelection fans props and fail-closes on locked', () => {
    const a = node({ id: 'a', type: 'SiteStack' })
    const b = node({ id: 'b', type: 'SiteStack' })
    const ops = fanOutHudOpsToSelection(
      [{ op: 'set_prop', nodeId: 'a', key: 'direction', value: 'column' }],
      [a, b],
    )
    expect(ops).toEqual([
      { op: 'set_prop', nodeId: 'a', key: 'direction', value: 'column' },
      { op: 'set_prop', nodeId: 'b', key: 'direction', value: 'column' },
    ])
    expect(
      fanOutHudOpsToSelection(
        [{ op: 'set_prop', nodeId: 'a', key: 'direction', value: 'column' }],
        [a, { ...b, locked: true }],
      ),
    ).toEqual([])
  })
})

describe('W4 print families + pseudo-state HUD', () => {
  const root = node({ id: 'root', type: 'SiteStack', name: 'Root' })

  it('maps Print* types to dedicated families', () => {
    const page = node({ id: 'p', type: 'PrintPage' })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [page.id],
      selectedNodes: [page],
      workingRootId: root.id,
      primary: page,
    })
    expect(m.familyId).toBe('printPage')
    expect(m.slots.some((s) => s.key === 'background' || s.key === 'padding')).toBe(true)
  })

  it('keeps mutate enabled on :hover and hides structureOps', () => {
    const table = node({
      id: 'tbl',
      type: 'SiteTable',
      props: { density: 'default', borders: 'row' },
      children: [
        node({
          id: 'r1',
          type: 'SiteTableRow',
          children: [node({ id: 'c1', type: 'SiteTableCell' }), node({ id: 'c2', type: 'SiteTableCell' })],
        }),
        node({
          id: 'r2',
          type: 'SiteTableRow',
          children: [node({ id: 'c3', type: 'SiteTableCell' }), node({ id: 'c4', type: 'SiteTableCell' })],
        }),
      ],
    })
    const m = resolveHudModel({
      smartHudEnabled: true,
      selectedIds: [table.id],
      selectedNodes: [table],
      workingRootId: root.id,
      primary: table,
      pseudoState: 'hover',
    })
    expect(m.mutateEnabled).toBe(true)
    expect(m.pseudoState).toBe('hover')
    expect(m.slots.every((s) => s.source !== 'structureOp')).toBe(true)
  })
})
