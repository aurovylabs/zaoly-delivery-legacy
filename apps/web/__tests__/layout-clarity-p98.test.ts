import { describe, expect, it } from 'vitest'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  isGridLayoutType,
  readAlignAxisValues,
  resolveAlignAxisKeys,
} from '../lib/inspect/layout-flow-groups'
import { layoutInspectSectionLabel } from '../lib/inspect/sections'
import { GRID_PRESETS, GRID_PRESET_GROUPS } from '../components/inspect-grid-group'
import {
  columnGlyphForPresetLabel,
  spanGlyphForPresetLabel,
} from '../components/inspect-grid-glyphs'
import {
  mediaFitGlyphId,
  mediaFitLabel,
  sizeModeGlyphId,
} from '../components/inspect-mode-glyphs'

function field(name: string): InspectFieldDef {
  return {
    name,
    label: name,
    kind: 'enum',
    section: 'layout',
    appliesTo: ['*'],
  }
}

describe('P98 layout clarity helpers', () => {
  it('detects grid layout types', () => {
    expect(isGridLayoutType('Grid')).toBe(true)
    expect(isGridLayoutType('SiteGrid')).toBe(true)
    expect(isGridLayoutType('PrintPersonaGrid')).toBe(true)
    expect(isGridLayoutType('Stack')).toBe(false)
  })

  it('labels Flex vs Grid sections', () => {
    expect(layoutInspectSectionLabel('Stack')).toBe('Flex layout')
    expect(layoutInspectSectionLabel('Grid')).toBe('Grid layout')
    expect(layoutInspectSectionLabel('Card')).toBe('Flex layout')
  })

  it('resolves Stack align/justify keys for matrix writes', () => {
    const keys = resolveAlignAxisKeys([field('justify'), field('align')])
    expect(keys).toEqual({ justifyKey: 'justify', alignKey: 'align' })
  })

  it('resolves flex-shell CSS keys when only shared props exist', () => {
    const keys = resolveAlignAxisKeys([field('justifyContent'), field('alignItems')])
    expect(keys).toEqual({ justifyKey: 'justifyContent', alignKey: 'alignItems' })
  })

  it('reads Stack matrix state from align/justify with CSS fallback', () => {
    expect(
      readAlignAxisValues({ align: 'center', justify: 'flex-end' }, [
        field('align'),
        field('justify'),
      ]),
    ).toEqual({ justify: 'flex-end', align: 'center' })

    expect(
      readAlignAxisValues(
        { justifyContent: 'center', alignItems: 'flex-end' },
        [field('align'), field('justify')],
      ),
    ).toEqual({ justify: 'center', align: 'flex-end' })
  })

  it('groups grid presets into equal / responsive / splits', () => {
    expect(GRID_PRESET_GROUPS.map((g) => g.id)).toEqual([
      'equal',
      'responsive',
      'splits',
    ])
    expect(GRID_PRESETS.every((p) => Boolean(p.group))).toBe(true)
    expect(GRID_PRESETS.filter((p) => p.group === 'equal')).toHaveLength(6)
    expect(GRID_PRESETS.filter((p) => p.group === 'responsive')).toHaveLength(2)
    expect(GRID_PRESETS.filter((p) => p.group === 'splits')).toHaveLength(4)
  })
})

describe('P98 grid glyphs', () => {
  it('maps every GRID_PRESETS label to a column glyph id', () => {
    for (const preset of GRID_PRESETS) {
      expect(columnGlyphForPresetLabel(preset.label)).toBeTruthy()
    }
    expect(columnGlyphForPresetLabel('1 Col')).toBe('cols-1')
    expect(columnGlyphForPresetLabel('12 Col')).toBe('cols-12')
    expect(columnGlyphForPresetLabel('Auto-Fit')).toBe('auto-fit')
    expect(columnGlyphForPresetLabel('Sidebar')).toBe('sidebar')
    expect(columnGlyphForPresetLabel('3-Pane')).toBe('three-pane')
  })

  it('maps span chip labels to span glyph ids', () => {
    expect(spanGlyphForPresetLabel('Auto')).toBe('span-auto')
    expect(spanGlyphForPresetLabel('3')).toBe('span-3')
    expect(spanGlyphForPresetLabel('Full')).toBe('span-full')
  })
})

describe('P86/P91 size + fit glyphs', () => {
  it('maps hug/fill/fixed modes', () => {
    expect(sizeModeGlyphId('hug')).toBe('hug')
    expect(sizeModeGlyphId('fill')).toBe('fill')
    expect(sizeModeGlyphId('fixed')).toBe('fixed')
  })

  it('maps backgroundSize and objectFit values', () => {
    expect(mediaFitGlyphId('cover')).toBe('cover')
    expect(mediaFitGlyphId('contain')).toBe('contain')
    expect(mediaFitGlyphId('auto')).toBe('auto')
    expect(mediaFitGlyphId('scale-down')).toBe('scale-down')
    expect(mediaFitLabel('scale-down')).toBe('Scale')
  })
})
