import { describe, expect, it } from 'vitest'
import {
  ALIGN_SELF_PIN_CELLS,
  alignSelfPinRow,
  nextAlignSelfValue,
  normalizeAlignSelfValue,
  partitionInspectAlignSelfFields,
} from '../lib/inspect/align-self-grid'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

function field(name: string): InspectFieldDef {
  return {
    name,
    label: name,
    kind: name === 'alignSelf' ? 'enum' : 'token',
    section: 'constraints',
    appliesTo: '*',
  }
}

describe('align-self-grid (P88)', () => {
  it('partitions alignSelf from constraints fields', () => {
    const { alignSelf, rest } = partitionInspectAlignSelfFields([
      field('width'),
      field('alignSelf'),
      field('height'),
    ])
    expect(alignSelf?.name).toBe('alignSelf')
    expect(rest.map((f) => f.name)).toEqual(['width', 'height'])
  })

  it('maps 9 pin cells onto three alignSelf rows', () => {
    expect(ALIGN_SELF_PIN_CELLS).toHaveLength(9)
    expect(ALIGN_SELF_PIN_CELLS.filter((c) => c.value === 'flex-start')).toHaveLength(3)
    expect(ALIGN_SELF_PIN_CELLS.filter((c) => c.value === 'center')).toHaveLength(3)
    expect(ALIGN_SELF_PIN_CELLS.filter((c) => c.value === 'flex-end')).toHaveLength(3)
  })

  it('normalizes aliases and pin rows', () => {
    expect(normalizeAlignSelfValue('start')).toBe('flex-start')
    expect(normalizeAlignSelfValue('end')).toBe('flex-end')
    expect(alignSelfPinRow('flex-start')).toBe('start')
    expect(alignSelfPinRow('stretch')).toBeNull()
  })

  it('toggles active value back to auto', () => {
    expect(nextAlignSelfValue('center', 'center')).toBe('auto')
    expect(nextAlignSelfValue('auto', 'stretch')).toBe('stretch')
    expect(nextAlignSelfValue('', 'flex-end')).toBe('flex-end')
  })
})
