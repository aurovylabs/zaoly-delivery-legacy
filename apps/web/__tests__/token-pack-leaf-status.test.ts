import { describe, expect, it } from 'vitest'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import {
  catalogLeafStatus,
  catalogOriginKind,
  countCatalogStatuses,
  fixtureBaselineForPath,
  fixturePathSet,
  isUnresolvedComposeLeaf,
  matchesCatalogStatusFilter,
} from '../lib/tokens/pack-leaf-status'
import { catalogToPackLeaves } from '../lib/tokens/pack-merge'
import { readDigitalScalar } from '../lib/inspect/digital-edit'

const pack: ZaolyPackLeaf[] = [
  {
    path: 'color.action.primary',
    type: 'color',
    value: JSON.stringify({ digital: { hex: '#1f44ff' } }),
    status: 'active',
  },
  {
    path: 'spacing.static.medium',
    type: 'spacing',
    value: JSON.stringify({ digital: '1rem' }),
    status: 'active',
  },
  {
    path: 'spacing.static.broken',
    type: 'spacing',
    value: JSON.stringify({ digital: 'calc({spacing.missing.token} * 2)' }),
    status: 'active',
  },
]

describe('token pack leaf status', () => {
  const fixturePaths = fixturePathSet(catalogToPackLeaves())
  const resolveCss = (tokenPath: string) => {
    const leaf = pack.find((row) => row.path === tokenPath)
    return leaf ? readDigitalScalar(leaf.type, leaf.value) : null
  }

  it('classifies fixture / override / custom', () => {
    expect(catalogOriginKind('fixture', 'color.action.primary', fixturePaths)).toBe('fixture')
    expect(catalogOriginKind('local', 'color.action.primary', fixturePaths)).toBe('override')
    expect(catalogOriginKind('local', 'color.custom.brand', fixturePaths)).toBe('custom')
  })

  it('detects unresolved compose refs', () => {
    expect(isUnresolvedComposeLeaf(pack[1]!, resolveCss)).toBe(false)
    expect(isUnresolvedComposeLeaf(pack[2]!, resolveCss)).toBe(true)
    const status = catalogLeafStatus(pack[2]!, 'local', fixturePaths, resolveCss)
    expect(status.kind).toBe('custom')
    expect(status.unresolved).toBe(true)
  })

  it('fixture path set includes catalog leaves', () => {
    expect(fixturePaths.has('color.action.primary')).toBe(true)
    expect(fixturePaths.has('color.custom.brand')).toBe(false)
  })

  it('returns fixture baseline leaf for override paths', () => {
    const baseline = fixtureBaselineForPath('color.action.primary', catalogToPackLeaves())
    expect(baseline?.path).toBe('color.action.primary')
    expect(fixtureBaselineForPath('color.custom.brand', catalogToPackLeaves())).toBeNull()
  })

  it('counts and matches status filters', () => {
    const origins = {
      'color.action.primary': 'local' as const,
      'spacing.static.medium': 'fixture' as const,
      'spacing.static.broken': 'local' as const,
    }
    const counts = countCatalogStatuses(pack, origins, fixturePaths, resolveCss)
    expect(counts.unresolved).toBe(1)
    expect(counts.override).toBe(1)
    expect(counts.custom).toBe(1)
    const broken = catalogLeafStatus(pack[2]!, 'local', fixturePaths, resolveCss)
    expect(matchesCatalogStatusFilter(broken, 'unresolved')).toBe(true)
    expect(matchesCatalogStatusFilter(broken, 'custom')).toBe(true)
    expect(matchesCatalogStatusFilter(broken, 'override')).toBe(false)
  })
})
