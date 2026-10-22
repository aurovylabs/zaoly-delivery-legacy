import { describe, expect, it } from 'vitest'
import {
  boxModelGroupMode,
  isBoxModelGroupedField,
  partitionInspectBoxModelFields,
  siblingKeysToClear,
  shouldAutoExpandBoxGroup,
} from '../lib/inspect/box-model-groups'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'

describe('box model groups (P83)', () => {
  it('detects padding axis mode', () => {
    expect(
      boxModelGroupMode(
        { props: { paddingBlock: '8px', paddingInline: '16px' } },
        'padding',
      ),
    ).toBe('axis')
  })

  it('detects padding uniform mode', () => {
    expect(boxModelGroupMode({ props: { padding: '12px' } }, 'padding')).toBe('uniform')
  })

  it('detects divergent padding sides as mixed', () => {
    expect(
      boxModelGroupMode(
        {
          props: { paddingTop: '8px', paddingBottom: '12px' },
        },
        'padding',
      ),
    ).toBe('mixed')
  })

  it('detects radius corners mode', () => {
    expect(
      boxModelGroupMode(
        {
          props: {
            radiusTopLeft: '4px',
            radiusTopRight: '4px',
            radiusBottomRight: '4px',
            radiusBottomLeft: '4px',
          },
        },
        'radius',
      ),
    ).toBe('uniform')
  })

  it('auto-expands for sides/corners/mixed', () => {
    expect(shouldAutoExpandBoxGroup('sides')).toBe(true)
    expect(shouldAutoExpandBoxGroup('corners')).toBe(true)
    expect(shouldAutoExpandBoxGroup('mixed')).toBe(true)
    expect(shouldAutoExpandBoxGroup('axis')).toBe(false)
  })

  it('clears sibling keys for uniform padding write', () => {
    expect(siblingKeysToClear('padding', 'uniform', 'padding')).toEqual([
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'paddingBlock',
      'paddingInline',
    ])
  })

  it('partitions stack fields into box groups and rest', () => {
    const fields = inspectFieldsForType('Stack')
    const { padding, margin, radius, rest } = partitionInspectBoxModelFields(fields)
    expect(padding.map((f) => f.name)).toEqual(
      expect.arrayContaining(['padding', 'paddingBlock', 'paddingTop']),
    )
    expect(margin.length).toBeGreaterThan(0)
    expect(radius.length).toBe(5)
    expect(rest.some((f) => f.name === 'gap')).toBe(true)
    expect(rest.some((f) => f.name === 'paddingTop')).toBe(false)
    expect(isBoxModelGroupedField('paddingTop')).toBe(true)
  })
})
