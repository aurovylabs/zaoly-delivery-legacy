import { describe, expect, it } from 'vitest'
import {
  gapGroupMode,
  gapSiblingKeysToClear,
  isGapGroupedField,
  partitionInspectGapFields,
  shouldAutoExpandGapGroup,
} from '../lib/inspect/gap-groups'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'
import {
  clampOpacityPercent,
  opacityToPercent,
  percentToOpacityLiteral,
} from '../lib/inspect/opacity-format'

describe('gap groups (P85)', () => {
  it('detects uniform / axis / mixed modes', () => {
    expect(gapGroupMode({ props: { gap: '12px' } })).toBe('uniform')
    expect(gapGroupMode({ props: { rowGap: '8px', columnGap: '8px' } })).toBe('axis')
    expect(gapGroupMode({ props: { rowGap: '8px', columnGap: '16px' } })).toBe('mixed')
    expect(gapGroupMode({ props: { gap: '8px', rowGap: '8px' } })).toBe('mixed')
  })

  it('auto-expands for axis and mixed', () => {
    expect(shouldAutoExpandGapGroup('axis')).toBe(true)
    expect(shouldAutoExpandGapGroup('mixed')).toBe(true)
    expect(shouldAutoExpandGapGroup('uniform')).toBe(false)
  })

  it('clears siblings for uniform and axis writes', () => {
    expect(gapSiblingKeysToClear('uniform', 'gap')).toEqual(['rowGap', 'columnGap'])
    expect(gapSiblingKeysToClear('axis', 'rowGap')).toEqual(['gap'])
  })

  it('partitions Stack gap fields', () => {
    const fields = inspectFieldsForType('Stack')
    const { gap, rest } = partitionInspectGapFields(fields)
    expect(gap.map((f) => f.name).sort()).toEqual(['columnGap', 'gap', 'rowGap'])
    expect(rest.some((f) => f.name === 'gap')).toBe(false)
    expect(isGapGroupedField('rowGap')).toBe(true)
  })
})

describe('opacity format (P85)', () => {
  it('maps 0–1 literals and percents', () => {
    expect(opacityToPercent(0.4)).toBe(40)
    expect(opacityToPercent('0.8')).toBe(80)
    expect(opacityToPercent('50%')).toBe(50)
    expect(percentToOpacityLiteral(40)).toBe(0.4)
    expect(clampOpacityPercent(140)).toBe(100)
  })
})
