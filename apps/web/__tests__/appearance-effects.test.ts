import { describe, expect, it } from 'vitest'
import {
  compactEffectLabel,
  partitionInspectAppearanceEffectFields,
} from '../lib/inspect/appearance-effects'
import {
  compactRotateLabel,
  partitionInspectRotateFields,
} from '../lib/inspect/rotate-field'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

function field(
  name: string,
  section: InspectFieldDef['section'],
  kind: InspectFieldDef['kind'] = 'token',
): InspectFieldDef {
  return { name, label: name, kind, section, appliesTo: '*' }
}

describe('rotate-field + appearance-effects (P90)', () => {
  it('partitions rotate from constraints fields', () => {
    const { rotate, rest } = partitionInspectRotateFields([
      field('width', 'constraints'),
      field('rotate', 'constraints'),
      field('alignSelf', 'constraints', 'enum'),
    ])
    expect(rotate?.name).toBe('rotate')
    expect(compactRotateLabel()).toBe('°')
    expect(rest.map((f) => f.name)).toEqual(['width', 'alignSelf'])
  })

  it('partitions shadow/blur/overflow effects from appearance', () => {
    const { effects, rest } = partitionInspectAppearanceEffectFields([
      field('radius', 'appearance'),
      field('shadow', 'appearance'),
      field('opacity', 'appearance'),
      field('blur', 'appearance'),
      field('overflow', 'appearance', 'enum'),
    ])
    expect(effects.map((f) => f.name)).toEqual(['shadow', 'blur', 'overflow'])
    expect(rest.map((f) => f.name)).toEqual(['radius', 'opacity'])
    expect(compactEffectLabel('blur')).toBe('Blur')
  })
})
