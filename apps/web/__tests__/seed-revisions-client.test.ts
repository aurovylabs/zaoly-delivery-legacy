import { describe, expect, it, vi, afterEach } from 'vitest'
import { paths } from '../lib/paths'
import { requestSiteKitSeedRevisions } from '../lib/site-kit/seed-revisions-client'

describe('requestSiteKitSeedRevisions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns revision rows from a successful probe', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          revisions: [{ componentId: 'SiteButton', kitRevision: 'catalog:SiteButton' }],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const rows = await requestSiteKitSeedRevisions(['SiteButton'])
    expect(fetchMock).toHaveBeenCalledWith(
      paths.routes.apiSiteKitSeedRevisions,
      expect.objectContaining({ method: 'POST' }),
    )
    expect(rows).toEqual([{ componentId: 'SiteButton', kitRevision: 'catalog:SiteButton' }])
  })

  it('returns [] when fetch throws (relative URL / offline)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to parse URL from /api/site-kit/seed-revisions')
      }),
    )
    await expect(requestSiteKitSeedRevisions(['SiteButton'])).resolves.toEqual([])
  })

  it('skips network when componentIds is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(requestSiteKitSeedRevisions([])).resolves.toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
