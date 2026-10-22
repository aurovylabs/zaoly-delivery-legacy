import { describe, expect, it } from 'vitest'
import {
  compactBottomSlantAmount,
  isBottomSlantMirrored,
  partitionInspectClipSlantFields,
  shouldAutoExpandClipSlant,
} from '../lib/inspect/clip-slant-groups'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

function field(name: string): InspectFieldDef {
  return {
    name,
    label: name,
    kind: 'token',
    section: 'appearance',
    appliesTo: '*',
    tokenGroup: 'space',
  }
}

describe('clip-slant-groups (W16-6 / CL9–CL10)', () => {
  it('partitions clipInset* fields from the rest', () => {
    const { clip, rest } = partitionInspectClipSlantFields([
      field('opacity'),
      field('clipInsetBottomLeftY'),
      field('clipInsetTopLeftX'),
      field('radius'),
    ])
    expect(clip.map((f) => f.name)).toEqual([
      'clipInsetBottomLeftY',
      'clipInsetTopLeftX',
    ])
    expect(rest.map((f) => f.name)).toEqual(['opacity', 'radius'])
  })

  it('reads compact bottom slant from BL Y', () => {
    expect(
      compactBottomSlantAmount({ props: { clipInsetBottomLeftY: '12%' } }),
    ).toBe('12%')
    expect(compactBottomSlantAmount({ props: {} })).toBe('')
  })

  it('detects mirror when BL and BR Y match', () => {
    expect(
      isBottomSlantMirrored({
        props: { clipInsetBottomLeftY: '10%', clipInsetBottomRightY: '10%' },
      }),
    ).toBe(true)
    expect(
      isBottomSlantMirrored({
        props: { clipInsetBottomLeftY: '10%', clipInsetBottomRightY: '8%' },
      }),
    ).toBe(false)
  })

  it('auto-expands only for custom insets, not Phase B presets', () => {
    expect(
      shouldAutoExpandClipSlant({ props: { clipInsetBottomLeftY: '12%' } }),
    ).toBe(false)
    expect(
      shouldAutoExpandClipSlant({
        props: { clipInsetBottomLeftX: '12%', clipInsetBottomRightX: '12%' },
      }),
    ).toBe(false)
    expect(
      shouldAutoExpandClipSlant({ props: { clipInsetTopLeftX: '8px' } }),
    ).toBe(true)
  })
})
