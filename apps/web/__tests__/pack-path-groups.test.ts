import { describe, expect, it } from 'vitest'
import {
  createCardKey,
  formatPathGroupLabel,
  groupLeavesByPathFamily,
  normalizeFamilySlug,
  suggestGroupTokenPath,
  tokenPathCardLabel,
  tokenPathCluster,
  tokenPathFamily,
  withEmptyPathFamilies,
} from '../lib/tokens/pack-path-groups'

describe('pack-path-groups', () => {
  it('derives family and cluster without renaming paths', () => {
    expect(tokenPathFamily('color.action.linkHover')).toBe('action')
    expect(tokenPathCluster('color.action.linkHover')).toBe('link')
    expect(tokenPathCluster('color.action.link')).toBe('link')
    expect(tokenPathCluster('color.action.linkVisited')).toBe('link')
    expect(tokenPathCluster('color.action.primaryDisabledForeground')).toBe('primary')
    expect(tokenPathFamily('color.palette.cobalt.500')).toBe('palette.cobalt')
    expect(tokenPathCluster('color.palette.cobalt.500')).toBe('ladder')
    expect(tokenPathFamily('color.inkMuted')).toBe('ink')
    expect(tokenPathCluster('color.inkMuted')).toBe('ink')
    expect(tokenPathFamily('color.lineStrong')).toBe('line')
    expect(tokenPathCluster('color.lineFocus')).toBe('line')
    expect(tokenPathCardLabel('color.action.linkHover')).toBe('linkHover')
    expect(formatPathGroupLabel('action')).toBe('Action')
    expect(createCardKey('color', 'action')).toBe('create:color:action')
    expect(suggestGroupTokenPath('color', 'action')).toBe('color.action.')
    expect(normalizeFamilySlug(' palette.cobalt ')).toBe('palette.cobalt')
    expect(normalizeFamilySlug('bad name!')).toBeNull()
  })

  it('nests type → family → cluster for action roles', () => {
    const leaves = [
      { path: 'color.action.primary', type: 'color' },
      { path: 'color.action.primaryHover', type: 'color' },
      { path: 'color.action.link', type: 'color' },
      { path: 'color.action.linkHover', type: 'color' },
      { path: 'color.surface.elevated', type: 'color' },
      { path: 'spacing.gap.modules', type: 'spacing' },
    ]
    const groups = groupLeavesByPathFamily(leaves, ['color', 'spacing'])
    expect(groups.map((g) => g.type)).toEqual(['color', 'spacing'])
    const color = groups[0]!
    expect(color.families.map((f) => f.family)).toEqual(['action', 'surface'])
    const action = color.families[0]!
    expect(action.clusters.map((c) => c.cluster)).toEqual(['link', 'primary'])
    expect(action.clusters.find((c) => c.cluster === 'link')?.leaves.map((l) => l.path)).toEqual([
      'color.action.link',
      'color.action.linkHover',
    ])
    expect(action.clusters.find((c) => c.cluster === 'primary')?.leaves.map((l) => l.path)).toEqual([
      'color.action.primary',
      'color.action.primaryHover',
    ])
  })

  it('merges empty family shells without duplicating existing families', () => {
    const groups = groupLeavesByPathFamily(
      [{ path: 'color.action.primary', type: 'color' }],
      ['color'],
    )
    const merged = withEmptyPathFamilies(
      groups,
      [
        { type: 'color', family: 'brand' },
        { type: 'color', family: 'action' },
        { type: 'spacing', family: 'gap' },
      ],
      ['color', 'spacing'],
    )
    expect(merged.map((g) => g.type)).toEqual(['color', 'spacing'])
    expect(merged[0]!.families.map((f) => f.family)).toEqual(['action', 'brand'])
    expect(merged[0]!.families.find((f) => f.family === 'brand')?.clusters).toEqual([])
    expect(merged[1]!.families.map((f) => f.family)).toEqual(['gap'])
  })
})
