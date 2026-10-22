import { beforeEach, describe, expect, it, vi } from 'vitest'

const { store } = vi.hoisted(() => ({
  store: {} as Record<string, unknown>,
}))

vi.mock('../lib/site-kit/override-store', () => ({
  readSiteKitOverride: vi.fn(async (id: string) => store[id] ?? null),
  writeSiteKitOverride: vi.fn(async (body: { componentId: string }) => {
    store[body.componentId] = { ...body }
    return { ok: true as const, wrote: [`mock:${body.componentId}`] }
  }),
}))

import {
  PULL_PROBE_PROP,
  clearPullFixtureProbe,
  injectPullFixtureGap,
} from '../lib/site-kit/pull-fixture'
import { readSiteKitOverride } from '../lib/site-kit/override-store'

describe('pull-fixture', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key]
    vi.clearAllMocks()
  })

  it('injects pullProbe into SiteButton override without needing prior override', async () => {
    const result = await injectPullFixtureGap('SiteButton')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.probeKey).toBe(PULL_PROBE_PROP)
    const written = await readSiteKitOverride('SiteButton')
    expect(written?.composition).toMatchObject({
      type: 'SiteButton',
      props: expect.objectContaining({ [PULL_PROBE_PROP]: true }),
    })
  })

  it('clears pullProbe', async () => {
    await injectPullFixtureGap('SiteButton')
    const cleared = await clearPullFixtureProbe('SiteButton')
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    expect(cleared.cleared).toBe(true)
    const written = await readSiteKitOverride('SiteButton')
    const props = (written?.composition as { props?: Record<string, unknown> })?.props
    expect(props?.[PULL_PROBE_PROP]).toBeUndefined()
  })
})
