import { describe, expect, it } from 'vitest'
import {
  contractPropsForType,
  getComponentContract,
  listComponentContractTypes,
} from '@zaoly/contracts'
import {
  hasComponentContract,
  inspectFieldsForType,
  variantAxisFieldsForType,
} from '../lib/inspect/field-catalog'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'
import { applySceneOp } from '../lib/scene/ops'
import {
  boundsIntersect,
  primarySelectedId,
  selectIdsInMarquee,
  toggleSelectedId,
  unionBounds,
} from '../lib/scene/selection'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('component-contracts registry (P16)', () => {
  it('registers Top-N + palette types', () => {
    const types = listComponentContractTypes()
    expect(types).toContain('Button')
    expect(types).toContain('Heading')
    expect(types).toContain('Spacer')
    expect(types).toContain('Checkbox')
    expect(types).toContain('Select')
    expect(types).toContain('Textarea')
    expect(types).toContain('Chip')
    expect(types).toContain('Panel')
    expect(types).toContain('Field')
    expect(types).toContain('Lede')
    expect(types).toContain('FilterRow')
    expect(types).toContain('RankedList')
    expect(types).toContain('SectionChrome')
    expect(getComponentContract('Button')).toBeTruthy()
    expect(getComponentContract('Textarea')).toBeTruthy()
    expect(getComponentContract('Accordion')).toBeTruthy()
    expect(getComponentContract('Meter')).toBeTruthy()
    expect(getComponentContract('Chart')).toBeTruthy()
    expect(getComponentContract('Gauge')).toBeTruthy()
    expect(types).toContain('Chart')
    expect(types).toContain('Gauge')
    expect(getComponentContract('KpiStrip')).toBeTruthy()
    expect(getComponentContract('PrintPullQuote')).toBeTruthy()
    expect(getComponentContract('PrintCallout')).toBeTruthy()
    expect(getComponentContract('PrintSteps')).toBeTruthy()
    expect(getComponentContract('PrintPage')).toBeTruthy()
    expect(getComponentContract('PrintPersonaCard')).toBeTruthy()
    expect(getComponentContract('PrintPersonaGrid')).toBeTruthy()
    expect(getComponentContract('EntityCard')).toBeTruthy()
    expect(types).toContain('EntityCard')
    const entityProps = contractPropsForType('EntityCard')
    expect(entityProps.some((p) => p.name === 'size')).toBe(true)
    expect(entityProps.some((p) => p.name === 'gap')).toBe(true)
    expect(entityProps.some((p) => p.name === 'title' || p.name === 'meta' || p.name === 'badge')).toBe(
      false,
    )
    const fieldProps = contractPropsForType('Field')
    expect(fieldProps.some((p) => p.name === 'label')).toBe(false)
    expect(fieldProps.some((p) => p.name === 'size')).toBe(true)
    expect(contractPropsForType('Lede').some((p) => p.name === 'label')).toBe(false)
    expect(contractPropsForType('Lede').some((p) => p.name === 'tone')).toBe(true)
    expect(contractPropsForType('PrintPullQuote').some((p) => p.name === 'body' || p.name === 'label')).toBe(
      false,
    )
    expect(contractPropsForType('PrintCallout').some((p) => p.name === 'variant')).toBe(true)
    expect(contractPropsForType('PrintCallout').some((p) => p.name === 'body' || p.name === 'label')).toBe(
      false,
    )
    expect(contractPropsForType('PrintSteps').some((p) => p.name === 'orientation')).toBe(true)
    expect(contractPropsForType('PrintSteps').some((p) => p.name === 'emphasisIndex')).toBe(true)
    expect(contractPropsForType('PrintPersonaCard').some((p) => p.name === 'bio' || p.name === 'segment')).toBe(
      false,
    )
    expect(contractPropsForType('PrintPersonaCard').some((p) => p.name === 'confidence')).toBe(true)
    expect(contractPropsForType('PrintPersonaCard').some((p) => p.name === 'spread')).toBe(true)
    expect(
      contractPropsForType('PrintPersonaCard').some(
        (p) => p.name === 'traits' || p.name === 'goals' || p.name === 'painPoints',
      ),
    ).toBe(false)
    expect(contractPropsForType('PrintCover').some((p) => p.name === 'url')).toBe(true)
    expect(contractPropsForType('PrintCover').some((p) => p.name === 'fazit' || p.name === 'eyebrow')).toBe(
      false,
    )
    expect(contractPropsForType('Alert').some((p) => p.name === 'children')).toBe(false)
    expect(contractPropsForType('Alert').some((p) => p.name === 'tone')).toBe(true)
    expect(contractPropsForType('Hint').some((p) => p.name === 'panel')).toBe(true)
    expect(contractPropsForType('Chip').some((p) => p.name === 'children')).toBe(true)
    expect(contractPropsForType('PrintChip').some((p) => p.name === 'children')).toBe(true)
    expect(contractPropsForType('PrintChip').some((p) => p.name === 'borderWidth')).toBe(true)
    expect(contractPropsForType('PrintChip').some((p) => p.name === 'tone')).toBe(true)
    expect(contractPropsForType('PrintChip').some((p) => p.name === 'variant' || p.name === 'selected')).toBe(
      false,
    )
    expect(contractPropsForType('PrintCover').some((p) => p.name === 'borderWidth')).toBe(true)
    expect(contractPropsForType('PrintChip').some((p) => p.name === 'textAlign')).toBe(true)
    expect(contractPropsForType('PrintChipRow').some((p) => p.name === 'justifyContent')).toBe(true)
    expect(contractPropsForType('PrintTwoColumn').some((p) => p.name === 'alignItems')).toBe(true)
    expect(contractPropsForType('PageTitle').some((p) => p.name === 'children')).toBe(false)
    expect(contractPropsForType('PrintDonut').some((p) => p.name === 'centerValue' || p.name === 'centerLabel')).toBe(
      false,
    )
    expect(contractPropsForType('PrintPage').some((p) => p.name === 'folioTitle' || p.name === 'folioPage')).toBe(
      false,
    )
    expect(contractPropsForType('PrintRankedList').some((p) => p.name === 'items')).toBe(false)
    expect(contractPropsForType('PrintRankedList').some((p) => p.name === 'columns')).toBe(true)
    expect(contractPropsForType('PrintLedger').some((p) => p.name === 'items')).toBe(false)
    expect(contractPropsForType('PrintLedger').some((p) => p.name === 'max')).toBe(true)
    expect(contractPropsForType('PrintTraitBars').some((p) => p.name === 'traits')).toBe(false)
    expect(contractPropsForType('DivergingBar').some((p) => p.name === 'items')).toBe(false)
    expect(contractPropsForType('PrintPersonaGrid').some((p) => p.name === 'personas')).toBe(false)
    expect(contractPropsForType('PrintCover').some((p) => p.name === 'kpis')).toBe(false)
    expect(contractPropsForType('PrintTable').some((p) => p.name === 'rows')).toBe(false)
    expect(contractPropsForType('PrintTable').some((p) => p.name === 'columns')).toBe(false)
    expect(contractPropsForType('PrintTable').some((p) => p.name === 'columnAlign')).toBe(true)
    expect(contractPropsForType('PrintTable').some((p) => p.name === 'personas' || p.name === 'kpis')).toBe(false)
  })

  it('field catalog derives from registry', () => {
    expect(hasComponentContract('Text')).toBe(true)
    const fields = inspectFieldsForType('Text')
    expect(fields.some((f) => f.name === 'role' && f.kind === 'enum')).toBe(true)
    expect(fields.some((f) => f.name === 'radius' && f.kind === 'token')).toBe(true)
    expect(contractPropsForType('Button').some((p) => p.name === 'variant')).toBe(true)
    const buttonVariant = contractPropsForType('Button').find((p) => p.name === 'variant')
    expect(buttonVariant?.options?.map((o) => o.value)).toEqual(
      expect.arrayContaining(['primary', 'ghost', 'subtle', 'danger', 'link']),
    )
    expect(buttonVariant?.options?.some((o) => o.value === 'secondary')).toBe(false)
    expect(contractPropsForType('Button').some((p) => p.name === 'shape')).toBe(true)
    expect(contractPropsForType('PrintScoreRing').some((p) => p.name === 'value')).toBe(false)
    expect(contractPropsForType('PrintScoreRing').some((p) => p.name === 'max')).toBe(true)
  })

  it('P23 Stack keep-props include padding sides and token gap', () => {
    const stack = contractPropsForType('Stack')
    expect(stack.some((p) => p.name === 'paddingTop' && p.kind === 'token')).toBe(true)
    expect(stack.some((p) => p.name === 'gap' && p.kind === 'token')).toBe(true)
    expect(stack.some((p) => p.name === 'direction' && p.control === 'segmented')).toBe(true)
    expect(stack.length).toBeGreaterThan(30)
    expect(contractPropsForType('Card').some((p) => p.name === 'gap')).toBe(true)
    expect(contractPropsForType('Text').some((p) => p.name === 'fontFamily')).toBe(true)
  })
})

describe('variant UX lite (P22)', () => {
  it('exposes registry enum axes for Button / Badge', () => {
    const buttonAxes = variantAxisFieldsForType('Button')
    expect(buttonAxes.some((f) => f.name === 'variant')).toBe(true)
    expect(buttonAxes.every((f) => f.kind === 'enum' && Array.isArray(f.options))).toBe(true)
    const badgeAxes = variantAxisFieldsForType('Badge')
    expect(badgeAxes.some((f) => f.name === 'tone')).toBe(true)
    expect(variantAxisFieldsForType('PrintChip').some((f) => f.name === 'tone')).toBe(true)
    expect(variantAxisFieldsForType('PrintChip').some((f) => f.name === 'variant')).toBe(false)
    expect(variantAxisFieldsForType('Chip').some((f) => f.name === 'size')).toBe(true)
  })
})

describe('OP-9 cascade (P17)', () => {
  it('merges breakpoint override over base props/bindings', () => {
    const scene = createLegacyFixtureScene()
    const withBp = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'title',
      breakpoint: 'mobile',
      props: { role: 'title' },
      tokenBindings: { radius: 'radius.lg' },
    })
    expect(withBp.ok).toBe(true)
    if (!withBp.ok) return
    const title = withBp.scene.root.children?.find((c) => c.id === 'title')
    expect(title).toBeTruthy()
    const cascaded = cascadeNodeForBreakpoint(title!, 'mobile')
    expect(cascaded.props.role).toBe('title')
    expect(cascaded.tokenBindings.radius).toBe('radius.lg')
    expect(cascaded.overrideKeys.has('role')).toBe(true)
    const desktop = cascadeNodeForBreakpoint(title!, 'desktop')
    expect(desktop.props.role).toBe(title!.props?.role)
  })

  it('rejects invalid breakpoint id', () => {
    const scene = createLegacyFixtureScene()
    const bad = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'title',
      breakpoint: 'xl' as 'mobile',
      props: { role: 'meta' },
    })
    expect(bad.ok).toBe(false)
  })
})

describe('hide / lock flags (P21)', () => {
  it('set_flags persists hidden/locked and lock rejects mutations', () => {
    let scene = createLegacyFixtureScene()
    const locked = applySceneOp(scene, {
      op: 'set_flags',
      nodeId: 'title',
      locked: true,
    })
    expect(locked.ok).toBe(true)
    if (!locked.ok) return
    scene = locked.scene
    const rejected = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'Nope',
    })
    expect(rejected.ok).toBe(false)
    const unlock = applySceneOp(scene, {
      op: 'set_flags',
      nodeId: 'title',
      locked: false,
    })
    expect(unlock.ok).toBe(true)
  })

  it('hides node via set_flags', () => {
    const scene = createLegacyFixtureScene()
    const hidden = applySceneOp(scene, {
      op: 'set_flags',
      nodeId: 'title',
      hidden: true,
    })
    expect(hidden.ok).toBe(true)
    if (!hidden.ok) return
    const title = hidden.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.hidden).toBe(true)
  })
})

describe('multi-select helpers (P19)', () => {
  it('toggles membership and reports primary as last id', () => {
    expect(toggleSelectedId(['a'], 'b')).toEqual(['a', 'b'])
    expect(primarySelectedId(['a', 'b'])).toBe('b')
    expect(toggleSelectedId(['a', 'b'], 'a')).toEqual(['b'])
  })

  it('marquee hit-test selects intersecting bounds', () => {
    const scene = createLegacyFixtureScene()
    const measures: Record<string, { left: number; top: number; width: number; height: number }> = {
      title: { left: 10, top: 10, width: 40, height: 20 },
      email: { left: 100, top: 100, width: 40, height: 20 },
    }
    const hits = selectIdsInMarquee(
      scene,
      { left: 0, top: 0, width: 60, height: 60 },
      (id) => measures[id] ?? null,
    )
    expect(hits).toContain('title')
    expect(hits).not.toContain('email')
    expect(boundsIntersect({ left: 0, top: 0, width: 10, height: 10 }, { left: 5, top: 5, width: 10, height: 10 })).toBe(
      true,
    )
    expect(unionBounds([{ left: 0, top: 0, width: 10, height: 10 }, { left: 20, top: 20, width: 10, height: 10 }])).toEqual({
      left: 0,
      top: 0,
      width: 30,
      height: 30,
    })
  })
})
