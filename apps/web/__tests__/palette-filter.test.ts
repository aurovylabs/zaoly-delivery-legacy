import { describe, expect, it } from 'vitest'
import {
  EDITOR_PALETTE_GROUP_IDS,
  EDITOR_PALETTE_GROUP_TYPES,
  EDITOR_PALETTE_TYPES,
} from '@zaoly/contracts'
import { filterPaletteItems, groupPaletteItems } from '../lib/scene/palette-filter'

describe('filterPaletteItems', () => {
  const items = [
    { id: 'Chip', label: 'Chip' },
    { id: 'MetricChip', label: 'MetricChip' },
    { id: 'Lede', label: 'Lede' },
  ]

  it('returns all items when query is empty', () => {
    expect(filterPaletteItems(items, '  ')).toEqual(items)
  })

  it('matches substring on id or label', () => {
    expect(filterPaletteItems(items, 'chip').map((item) => item.id)).toEqual(['Chip', 'MetricChip'])
    expect(filterPaletteItems(items, 'lede').map((item) => item.id)).toEqual(['Lede'])
  })
})

describe('groupPaletteItems', () => {
  it('partitions every palette type into exactly one group', () => {
    const seen = new Map<string, string>()
    for (const id of EDITOR_PALETTE_GROUP_IDS) {
      for (const type of EDITOR_PALETTE_GROUP_TYPES[id]) {
        expect(seen.has(type), `${type} listed in more than one group`).toBe(false)
        seen.set(type, id)
      }
    }
    expect([...seen.keys()].sort()).toEqual([...EDITOR_PALETTE_TYPES].sort())
  })

  it('keeps group order and drops empty groups', () => {
    const items = [
      { id: 'Lede' },
      { id: 'Chip' },
      { id: 'RankedList' },
      { id: 'Stack' },
    ]
    expect(groupPaletteItems(items).map((group) => group.id)).toEqual([
      'layout',
      'forms',
      'feedback',
      'lists',
    ])
    expect(groupPaletteItems([{ id: 'Lede' }]).map((group) => group.id)).toEqual(['feedback'])
  })
})
