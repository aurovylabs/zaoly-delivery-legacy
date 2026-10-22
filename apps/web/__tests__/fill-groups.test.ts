import { describe, expect, it } from 'vitest'
import {
  compactFillLabel,
  partitionInspectFillFields,
  shouldAutoExpandFillGroup,
} from '../lib/inspect/fill-groups'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

function field(name: string, section: InspectFieldDef['section'] = 'fill'): InspectFieldDef {
  return {
    name,
    label: name,
    kind: 'token',
    section,
    appliesTo: '*',
    tokenGroup: name === 'borderWidth' ? 'space' : name === 'gradient' ? 'gradient' : 'color',
  }
}

describe('fill-groups (P87)', () => {
  it('partitions fill keys from other fields', () => {
    const fields = [
      field('background'),
      field('color'),
      field('borderColor'),
      field('opacity', 'appearance'),
    ]
    const { fill, rest } = partitionInspectFillFields(fields)
    expect(fill.map((f) => f.name)).toEqual(['background', 'color', 'borderColor'])
    expect(rest.map((f) => f.name)).toEqual(['opacity'])
  })

  it('compactFillLabel maps Fill / Color / Stroke abbreviations', () => {
    expect(compactFillLabel('background')).toBe('Fill')
    expect(compactFillLabel('color')).toBe('Color')
    expect(compactFillLabel('borderColor')).toBe('Stroke')
    expect(compactFillLabel('borderWidth')).toBe('Width')
    expect(compactFillLabel('gradient')).toBe('Grad')
  })

  it('auto-expands when border width/style or gradient is set', () => {
    expect(shouldAutoExpandFillGroup({})).toBe(false)
    expect(
      shouldAutoExpandFillGroup({
        tokenBindings: { background: 'color.surface.default' },
      }),
    ).toBe(false)
    expect(
      shouldAutoExpandFillGroup({
        tokenBindings: { borderWidth: 'spacing.static.xs' },
      }),
    ).toBe(true)
    expect(
      shouldAutoExpandFillGroup({
        props: { borderStyle: 'dashed' },
      }),
    ).toBe(true)
  })
})
