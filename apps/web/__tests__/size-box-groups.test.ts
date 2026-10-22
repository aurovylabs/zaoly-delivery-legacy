import { describe, expect, it } from 'vitest'
import {
  compactSizeLabel,
  constraintsSummaryBadge,
  partitionInspectSizeBoxFields,
  shouldAutoExpandSizeBox,
} from '../lib/inspect/size-box-groups'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

function field(name: string): InspectFieldDef {
  return {
    name,
    label: name,
    kind: 'token',
    section: 'constraints',
    appliesTo: '*',
    tokenGroup: 'size',
  }
}

describe('size-box-groups (P86)', () => {
  it('partitions size keys from constraints fields', () => {
    const fields = [
      field('width'),
      field('height'),
      field('minWidth'),
      field('alignSelf'),
    ]
    const { sizeBox, rest } = partitionInspectSizeBoxFields(fields)
    expect(sizeBox.map((f) => f.name)).toEqual(['width', 'height', 'minWidth'])
    expect(rest.map((f) => f.name)).toEqual(['alignSelf'])
  })

  it('compactSizeLabel maps W/H and min/max abbreviations', () => {
    expect(compactSizeLabel('width')).toBe('W')
    expect(compactSizeLabel('height')).toBe('H')
    expect(compactSizeLabel('minWidth')).toBe('minW')
    expect(compactSizeLabel('maxHeight')).toBe('maxH')
  })

  it('constraintsSummaryBadge reports Hug vs Fixed', () => {
    expect(constraintsSummaryBadge({})).toBe('W Hug · H Hug')
    expect(
      constraintsSummaryBadge({
        tokenBindings: { width: 'size.width.md' },
      }),
    ).toBe('W Fixed · H Hug')
    expect(
      constraintsSummaryBadge({
        props: { height: '120px' },
      }),
    ).toBe('W Hug · H Fixed')
  })

  it('auto-expands when min/max keys are set', () => {
    expect(shouldAutoExpandSizeBox({})).toBe(false)
    expect(
      shouldAutoExpandSizeBox({
        tokenBindings: { maxWidth: 'size.width.lg' },
      }),
    ).toBe(true)
    expect(
      shouldAutoExpandSizeBox({
        props: { minHeight: '4rem' },
      }),
    ).toBe(true)
  })
})
