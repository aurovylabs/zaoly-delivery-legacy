/**
 * WYSIWYG Phase 1 — Mag must not silently drop inspector values.
 * Spec: knowledge/print-mag-capability-matrix.md · composition-magazine-pdf.md 1g/1h
 */
import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'
import {
  CSS_PX_TO_PDF_PT,
  normalizeTextAlign,
  resolveMagInstancePaint,
} from '../lib/magazine-pdf/resolve-mag-instance-paint'
import { printSurfaceGrainPaint } from '../lib/scene/print-surface-grain'
import { planNudgeOps, planResizeOps } from '../lib/scene/resize'
import { applySceneOp } from '../lib/scene/ops'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'

function printTableNode(overrides: Partial<SceneNode> = {}): SceneNode {
  return {
    id: 'tbl-1',
    type: 'PrintTable',
    name: 'Metrics',
    props: {
      headers: ['Metric', 'Now'],
      rows: [['GEO', '72']],
      ...(overrides.props as Record<string, unknown> | undefined),
    },
    style: overrides.style,
    tokenBindings: overrides.tokenBindings,
    breakpoints: overrides.breakpoints,
    children: overrides.children,
  }
}

describe('WYSIWYG-P1 textAlign vocabulary', () => {
  it('contracts expose left|center|right|justify — not start|end', () => {
    const fields = inspectFieldsForType('PrintTable')
    const align = fields.find((f) => f.name === 'textAlign')
    expect(align?.kind).toBe('enum')
    const values = (align?.options ?? []).map((o) => o.value)
    expect(values).toEqual(expect.arrayContaining(['left', 'center', 'right', 'justify']))
    expect(values).not.toContain('start')
    expect(values).not.toContain('end')
  })

  it('normalizeTextAlign maps legacy start/end and canonical values', () => {
    expect(normalizeTextAlign('start')).toBe('left')
    expect(normalizeTextAlign('end')).toBe('right')
    expect(normalizeTextAlign('flex-start')).toBe('left')
    expect(normalizeTextAlign('flex-end')).toBe('right')
    expect(normalizeTextAlign('left')).toBe('left')
    expect(normalizeTextAlign('center')).toBe('center')
    expect(normalizeTextAlign('right')).toBe('right')
    expect(normalizeTextAlign('justify')).toBe('justify')
    expect(normalizeTextAlign('bogus')).toBeUndefined()
  })

  it('Mag paint keeps textAlign from start/end (no silent drop)', () => {
    for (const [raw, expected] of [
      ['start', 'left'],
      ['end', 'right'],
      ['right', 'right'],
      ['center', 'center'],
    ] as const) {
      const paint = resolveMagInstancePaint(
        printTableNode({ props: { textAlign: raw, headers: ['A'], rows: [['1']] } }),
      )
      expect(paint.textStyle?.textAlign, `raw=${raw}`).toBe(expected)
    }
  })
})

describe('WYSIWYG-P1 PrintTable inspect → grain → Mag', () => {
  it('forwards width, textAlign, fontSize, textDecoration to Mag paint', () => {
    const node = printTableNode({
      props: {
        headers: ['Metric', 'Now'],
        rows: [['GEO', '72']],
        width: '240px',
        textAlign: 'right',
        fontSize: '14px',
        fontWeight: '700',
        textDecoration: 'underline',
        textTransform: 'uppercase',
        alignSelf: 'flex-end',
      },
    })
    const paint = resolveMagInstancePaint(node)
    expect(paint.wrapStyle?.width).toBe(Math.round(240 * CSS_PX_TO_PDF_PT * 100) / 100)
    expect(paint.wrapStyle?.alignSelf).toBe('flex-end')
    expect(paint.textStyle?.textAlign).toBe('right')
    expect(paint.textStyle?.fontSize).toBe(Math.round(14 * CSS_PX_TO_PDF_PT * 100) / 100)
    expect(paint.textStyle?.fontWeight).toBe(700)
    expect(paint.textStyle?.textDecoration).toBe('underline')
    expect(paint.textStyle?.textTransform).toBe('uppercase')
  })

  it('canvas grain exposes textAlign CSS var for PrintTable cells', () => {
    const grain = printSurfaceGrainPaint({
      textAlign: 'right',
      alignSelf: 'flex-end',
      fontSize: '14px',
    })
    expect(grain.wrapStyle['--creation-print-text-align' as keyof typeof grain.wrapStyle]).toBe(
      'right',
    )
    expect(grain.blockAlign).toBe(true)
    expect(grain.textAlign).toBe(true)
  })

  it('alignSelf does not invent textAlign (P91)', () => {
    const paint = resolveMagInstancePaint(
      printTableNode({
        props: {
          headers: ['A'],
          rows: [['1']],
          alignSelf: 'flex-end',
        },
      }),
    )
    expect(paint.wrapStyle?.alignSelf).toBe('flex-end')
    expect(paint.textStyle?.textAlign).toBeUndefined()
  })
})

describe('WYSIWYG-P1 print-lane resize', () => {
  it('planResizeOps on print emits set_breakpoint_override width', () => {
    const scene = createLegacyFixtureScene()
    const node: SceneNode = {
      id: 'resize-me',
      type: 'PrintTable',
      props: { headers: ['A'], rows: [['1']] },
    }
    const ops = planResizeOps(node, { width: 200, height: 80 }, { width: 120, height: 40 }, 'print')
    expect(ops.some((op) => op.op === 'set_breakpoint_override' && op.breakpoint === 'print')).toBe(
      true,
    )
    expect(ops.some((op) => op.op === 'set_style')).toBe(false)

    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: node,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    let next = inserted.scene
    for (const op of ops) {
      const step = applySceneOp(next, op)
      expect(step.ok).toBe(true)
      if (!step.ok) return
      next = step.scene
    }
    const hit = next.root.children?.find((c) => c.id === 'resize-me')
    expect(hit?.breakpoints?.print?.props?.width).toBe('200px')
    expect(cascadeNodeForBreakpoint(hit!, 'print').props.width).toBe('200px')
    expect(cascadeNodeForBreakpoint(hit!, 'desktop').props.width).toBeUndefined()
  })

  it('planNudgeOps on print writes print override', () => {
    const node: SceneNode = {
      id: 'nudge-me',
      type: 'PrintChip',
      props: { width: '100px' },
      breakpoints: { print: { props: { width: '100px' } } },
    }
    const ops = planNudgeOps(node, 'width', 1, 100, 'print')
    expect(ops[0]?.op).toBe('set_breakpoint_override')
    if (ops[0]?.op === 'set_breakpoint_override') {
      expect(ops[0].breakpoint).toBe('print')
      expect(ops[0].props?.width).toBe('108px')
    }
  })

  it('desktop resize still uses set_style', () => {
    const node: SceneNode = { id: 'd', type: 'Card', props: {} }
    const ops = planResizeOps(node, { width: 180, height: 60 }, { width: 100, height: 40 }, 'desktop')
    expect(ops.some((op) => op.op === 'set_style')).toBe(true)
    expect(ops.some((op) => op.op === 'set_breakpoint_override')).toBe(false)
  })
})
