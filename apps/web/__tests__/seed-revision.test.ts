import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolveSiteKitSeedRevision } from '../lib/site-kit/seed'

vi.mock('../lib/site-kit/override-store', () => ({
  readSiteKitOverride: vi.fn(async (id: string) => {
    if (id === 'CompositionDemo') {
      return {
        composition: { type: 'SiteStack', props: {} },
        updatedAt: '2026-09-14T10:00:00.000Z',
      }
    }
    return null
  }),
}))

describe('resolveSiteKitSeedRevision', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns override stamp without expanding the tree', async () => {
    const result = await resolveSiteKitSeedRevision('CompositionDemo')
    expect(result).toEqual({
      componentId: 'CompositionDemo',
      kitRevision: 'override:2026-09-14T10:00:00.000Z',
    })
  })

  it('returns catalog stamp for Site Kit atoms', async () => {
    const result = await resolveSiteKitSeedRevision('SiteButton')
    expect(result).toEqual({
      componentId: 'SiteButton',
      kitRevision: 'catalog:SiteButton',
    })
  })
})
