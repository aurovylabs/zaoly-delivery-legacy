import { describe, expect, it } from 'vitest'
import {
  filterAlignContentUnlessWrap,
  isLayoutAlignGroupedField,
  isLayoutFlowGroupedField,
  partitionInspectLayoutFlowFields,
  pickAlignField,
  pickJustifyField,
  shouldShowAlignContent,
} from '../lib/inspect/layout-flow-groups'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'

describe('layout flow groups (P84)', () => {
  it('partitions Stack layout fields into flow / align / rest', () => {
    const layout = inspectFieldsForType('Stack').filter((f) => f.section === 'layout')
    const { flow, align, rest } = partitionInspectLayoutFlowFields(layout)
    expect(flow.map((f) => f.name).sort()).toEqual(['direction', 'wrap'])
    expect(align.map((f) => f.name).sort()).toEqual(['align', 'justify'])
    expect(rest.some((f) => f.name === 'gap')).toBe(true)
    expect(rest.some((f) => f.name === 'alignContent')).toBe(true)
    expect(rest.every((f) => !isLayoutFlowGroupedField(f.name))).toBe(true)
    expect(rest.every((f) => !isLayoutAlignGroupedField(f.name))).toBe(true)
  })

  it('prefers justify/align over justifyContent/alignItems', () => {
    const fields = [
      { name: 'justifyContent', label: 'JC', kind: 'enum' as const },
      { name: 'justify', label: 'J', kind: 'enum' as const },
      { name: 'alignItems', label: 'AI', kind: 'enum' as const },
      { name: 'align', label: 'A', kind: 'enum' as const },
    ]
    expect(pickJustifyField(fields)?.name).toBe('justify')
    expect(pickAlignField(fields)?.name).toBe('align')
  })

  it('shows alignContent only when wrap is on', () => {
    expect(shouldShowAlignContent({ wrap: false })).toBe(false)
    expect(shouldShowAlignContent({ wrap: true })).toBe(true)
    expect(shouldShowAlignContent({ wrap: 'true' })).toBe(true)
    const fields = [
      { name: 'gap', label: 'Gap', kind: 'token' as const },
      { name: 'alignContent', label: 'Align content', kind: 'enum' as const },
    ]
    expect(filterAlignContentUnlessWrap(fields, { wrap: false }).map((f) => f.name)).toEqual([
      'gap',
    ])
    expect(filterAlignContentUnlessWrap(fields, { wrap: true }).map((f) => f.name)).toEqual([
      'gap',
      'alignContent',
    ])
  })
})
