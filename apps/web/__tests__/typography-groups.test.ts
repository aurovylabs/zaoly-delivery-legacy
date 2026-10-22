import { describe, expect, it } from 'vitest'
import {
  compactTypeLabel,
  partitionInspectTypographyFields,
  TYPE_CHROME_KEYS,
  TYPE_STACK_KEYS,
} from '../lib/inspect/typography-groups'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

function field(name: string, kind: InspectFieldDef['kind'] = 'token'): InspectFieldDef {
  return {
    name,
    label: name,
    kind,
    section: 'typography',
    appliesTo: '*',
  }
}

describe('typography-groups (P89)', () => {
  it('partitions stack and chrome from typography fields', () => {
    const { typeStack, typeChrome, rest } = partitionInspectTypographyFields([
      field('fontFamily'),
      field('opacity', 'token'),
      field('fontSize'),
      field('textAlign', 'enum'),
      field('textDecoration', 'enum'),
      field('fontWeight'),
      field('textTransform', 'enum'),
      field('lineHeight'),
      field('letterSpacing'),
    ])
    expect(typeStack.map((f) => f.name)).toEqual([...TYPE_STACK_KEYS])
    expect(typeChrome.map((f) => f.name)).toEqual([...TYPE_CHROME_KEYS])
    expect(rest.map((f) => f.name)).toEqual(['opacity'])
  })

  it('uses compact stack labels', () => {
    expect(compactTypeLabel('fontSize')).toBe('Size')
    expect(compactTypeLabel('fontWeight')).toBe('Wt')
    expect(compactTypeLabel('lineHeight')).toBe('LH')
    expect(compactTypeLabel('letterSpacing')).toBe('Track')
  })
})
