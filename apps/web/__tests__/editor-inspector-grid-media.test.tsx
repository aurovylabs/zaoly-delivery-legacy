import { describe, expect, it } from 'vitest'
import { resolveNodePaintStyle, resolveEnumPropsToStyle } from '../lib/inspect/resolve-bindings'
import { GRID_PRESETS } from '../components/inspect-grid-group'

describe('Modern CSS Grid Container & Tracks (P97)', () => {
  it('resolves responsive auto-fit and auto-fill minmax track sizing', () => {
    const autoFitStyle = resolveNodePaintStyle({
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    })
    expect(autoFitStyle.gridTemplateColumns).toBe('repeat(auto-fit, minmax(280px, 1fr))')

    const autoFillStyle = resolveNodePaintStyle({
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    })
    expect(autoFillStyle.gridTemplateColumns).toBe('repeat(auto-fill, minmax(200px, 1fr))')
  })

  it('resolves design system 12-column and asymmetric split layouts', () => {
    const twelveCol = resolveNodePaintStyle({
      gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
    })
    expect(twelveCol.gridTemplateColumns).toBe('repeat(12, minmax(0, 1fr))')

    const split = resolveNodePaintStyle({
      gridTemplateColumns: '1fr 2fr',
      gridTemplateRows: 'auto 1fr auto',
    })
    expect(split.gridTemplateColumns).toBe('1fr 2fr')
    expect(split.gridTemplateRows).toBe('auto 1fr auto')
  })

  it('resolves grid-auto-flow dense packing and implicit track sizing', () => {
    const denseFlow = resolveNodePaintStyle({
      gridAutoFlow: 'row dense',
      gridAutoRows: 'minmax(120px, auto)',
      gridAutoColumns: '1fr',
    })
    expect(denseFlow.gridAutoFlow).toBe('row dense')
    expect(denseFlow.gridAutoRows).toBe('minmax(120px, auto)')
    expect(denseFlow.gridAutoColumns).toBe('1fr')
  })

  it('resolves track item alignment (justifyItems, alignItems)', () => {
    const alignment = resolveNodePaintStyle({
      justifyItems: 'center',
      alignItems: 'stretch',
    })
    expect(alignment.justifyItems).toBe('center')
  })

  it('has comprehensive grid presets catalog', () => {
    const labels = GRID_PRESETS.map((p) => p.label)
    expect(labels).toContain('1 Col')
    expect(labels).toContain('2 Col')
    expect(labels).toContain('3 Col')
    expect(labels).toContain('4 Col')
    expect(labels).toContain('6 Col')
    expect(labels).toContain('12 Col')
    expect(labels).toContain('Auto-Fit')
    expect(labels).toContain('Auto-Fill')
    expect(labels).toContain('1 : 2')
    expect(labels).toContain('Sidebar')
  })
})

describe('Grid Item Child Placement & Spanning (P97)', () => {
  it('resolves column and row track spans', () => {
    const style = resolveNodePaintStyle({
      colSpan: '2',
      rowSpan: '3',
    })
    expect(style.gridColumn).toBe('span 2')
    expect(style.gridRow).toBe('span 3')
  })

  it('resolves 1 / -1 full bleed spanning across grid tracks', () => {
    const style = resolveNodePaintStyle({
      colSpan: '1 / -1',
      rowSpan: '1 / -1',
    })
    expect(style.gridColumn).toBe('1 / -1')
    expect(style.gridRow).toBe('1 / -1')
  })

  it('resolves explicit start and end track line numbers', () => {
    const style = resolveNodePaintStyle({
      colStart: '2',
      colEnd: '5',
      rowStart: '1',
      rowEnd: '4',
    })
    expect(style.gridColumn).toBe('2 / 5')
    expect(style.gridRow).toBe('1 / 4')
  })

  it('resolves justifySelf, alignSelf, and order on grid child items', () => {
    const style = resolveNodePaintStyle({
      justifySelf: 'start',
      alignSelf: 'end',
      order: 5,
    })
    expect(style.justifySelf).toBe('start')
    expect(style.alignSelf).toBe('end')
    expect(style.order).toBe(5)
  })
})

describe('Media & Image Controls (P96)', () => {
  it('resolves objectFit (cover, contain, fill, scale-down)', () => {
    const cover = resolveNodePaintStyle({ objectFit: 'cover' })
    expect(cover.objectFit).toBe('cover')

    const contain = resolveNodePaintStyle({ objectFit: 'contain' })
    expect(contain.objectFit).toBe('contain')

    const scaleDown = resolveNodePaintStyle({ objectFit: 'scale-down' })
    expect(scaleDown.objectFit).toBe('scale-down')
  })

  it('resolves objectPosition (9-point anchor presets and custom percentages)', () => {
    const center = resolveNodePaintStyle({ objectPosition: 'center' })
    expect(center.objectPosition).toBe('center')

    const topLeft = resolveNodePaintStyle({ objectPosition: 'top left' })
    expect(topLeft.objectPosition).toBe('top left')

    const percent = resolveNodePaintStyle({ objectPosition: '20% 80%' })
    expect(percent.objectPosition).toBe('20% 80%')
  })
})
