/**
 * SK-S1 fail-closed Site Kit reads.
 * Spec: specs/domain/site-kit-collection-scope.md · specs/api/site-kit-write.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import {
  __resetProjectStoreForTests,
  createProject,
} from '../lib/fixtures/project-store'
import {
  mintSiteKitViewToken,
  verifySiteKitViewToken,
} from '../lib/site-kit/storybook-view-token'
import {
  authorizeSiteKitCompositionList,
  authorizeSiteKitPatternOverrideRead,
  viewerMayAccessCollection,
} from '../lib/site-kit/site-kit-read-auth'
import { filterCompositionCatalog } from '../lib/site-kit/composition-write'
import { withSiteKitViewCredentials } from '../lib/site-kit/storybook-href'
import { paths } from '../lib/paths'
import { writeSiteKitOverride } from '../lib/site-kit/override-store'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

vi.mock('../auth', () => ({
  auth: vi.fn(async () => null),
}))

vi.mock('../lib/runtime-config', async () => {
  const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
    '../lib/runtime-config',
  )
  return {
    ...actual,
    getFederationMode: vi.fn(() => 'dummy'),
    isFederationConfigured: vi.fn(() => false),
    getServiceSecret: vi.fn(() => 'test-service-secret-at-least-32-chars!!'),
    plexonBaseUrl: vi.fn(() => 'http://localhost:3000'),
    isServiceAuthConfigured: vi.fn(() => false),
    isAuthBypassEnabled: vi.fn(() => true),
  }
})

vi.mock('../lib/require-scene-api-access', () => ({
  isSceneApiAccess: (v: unknown) =>
    Boolean(v && typeof v === 'object' && 'ok' in v && (v as { ok: boolean }).ok),
  requireSceneApiAccess: vi.fn(async () => ({
    ok: true as const,
    mode: 'session' as const,
    userId: 'dev-local',
  })),
}))

describe('site-kit view token', () => {
  it('mints and verifies Collection-scoped token', () => {
    const { viewToken, claims } = mintSiteKitViewToken({
      platformProjectId: 'plx-a',
      userId: 'u1',
    })
    expect(claims.platformProjectId).toBe('plx-a')
    const verified = verifySiteKitViewToken(viewToken)
    expect(verified?.platformProjectId).toBe('plx-a')
    expect(verifySiteKitViewToken('garbage')).toBeNull()
  })

  it('withSiteKitViewCredentials attaches query params', () => {
    const href = withSiteKitViewCredentials(
      'https://creation-site-kit.example/?path=/story/compositions-live--default',
      { viewToken: 'tok.sig', platformProjectId: 'plx-a' },
    )
    const u = new URL(href)
    expect(u.searchParams.get(paths.siteKitViewTokenQueryParam)).toBe('tok.sig')
    expect(u.searchParams.get('platformProjectId')).toBe('plx-a')
  })
})

describe('filterCompositionCatalog empty accessible set', () => {
  it('returns empty when platformProjectIds is []', () => {
    const entries = [
      {
        name: 'Hero',
        exportName: 'Hero',
        storyTitle: 'Compositions/Shared/Hero',
        componentId: 'CompositionHero',
        platformProjectId: 'plx-a',
        updatedAt: null,
      },
    ]
    expect(filterCompositionCatalog(entries, { platformProjectIds: [] })).toEqual([])
  })
})

describe('authorizeSiteKitCompositionList', () => {
  beforeEach(async () => {
    __resetProjectStoreForTests()
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isServiceAuthConfigured).mockReturnValue(false)
    vi.mocked(runtime.isAuthBypassEnabled).mockReturnValue(true)
    const sceneApi = await import('../lib/require-scene-api-access')
    vi.mocked(sceneApi.requireSceneApiAccess).mockResolvedValue({
      ok: true,
      mode: 'session',
      userId: 'dev-local',
    })
  })

  it('rejects anonymous unfiltered list', async () => {
    const sceneApi = await import('../lib/require-scene-api-access')
    vi.mocked(sceneApi.requireSceneApiAccess).mockResolvedValue(
      NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    )
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isAuthBypassEnabled).mockReturnValue(false)
    vi.mocked(runtime.isServiceAuthConfigured).mockReturnValue(true)
    vi.mocked(runtime.getServiceSecret).mockReturnValue('')

    const result = await authorizeSiteKitCompositionList(
      new Request('http://localhost/api/site-kit/compositions'),
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.response.status).toBe(401)
    expect(await result.response.json()).toMatchObject({
      code: 'site-kit-scope-required',
    })
  })

  it('scopes view token to its Collection', async () => {
    const { viewToken } = mintSiteKitViewToken({ platformProjectId: 'plx-view' })
    const result = await authorizeSiteKitCompositionList(
      new Request('http://localhost/api/site-kit/compositions', {
        headers: { [paths.siteKitViewTokenHeader]: viewToken },
      }),
    )
    expect(result).toEqual({
      ok: true,
      filter: { platformProjectId: 'plx-view' },
    })
  })

  it('session with platformProjectId soft-allows when auth unset', async () => {
    const result = await authorizeSiteKitCompositionList(
      new Request(
        'http://localhost/api/site-kit/compositions?platformProjectId=plx-local',
      ),
    )
    expect(result).toEqual({
      ok: true,
      filter: { platformProjectId: 'plx-local' },
    })
  })

  it('session without filter returns unscoped-only when auth unset', async () => {
    const result = await authorizeSiteKitCompositionList(
      new Request('http://localhost/api/site-kit/compositions'),
    )
    expect(result).toEqual({ ok: true, filter: { unscoped: true } })
  })
})

describe('authorizeSiteKitPatternOverrideRead', () => {
  it('allows matching view token', async () => {
    const { viewToken } = mintSiteKitViewToken({ platformProjectId: 'plx-a' })
    const ok = await authorizeSiteKitPatternOverrideRead(
      new Request('http://localhost/api/site-kit/overrides/CompositionHero', {
        headers: { [paths.siteKitViewTokenHeader]: viewToken },
      }),
      'plx-a',
    )
    expect(ok).toBe(true)
  })

  it('denies cross-Collection view token', async () => {
    const { viewToken } = mintSiteKitViewToken({ platformProjectId: 'plx-a' })
    const ok = await authorizeSiteKitPatternOverrideRead(
      new Request('http://localhost/api/site-kit/overrides/CompositionHero', {
        headers: { [paths.siteKitViewTokenHeader]: viewToken },
      }),
      'plx-b',
    )
    expect(ok).toBe(false)
  })

  it('denies anonymous Pattern read', async () => {
    const sceneApi = await import('../lib/require-scene-api-access')
    vi.mocked(sceneApi.requireSceneApiAccess).mockResolvedValue(
      NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    )
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isAuthBypassEnabled).mockReturnValue(false)
    vi.mocked(runtime.isServiceAuthConfigured).mockReturnValue(true)
    vi.mocked(runtime.getServiceSecret).mockReturnValue('')

    const ok = await authorizeSiteKitPatternOverrideRead(
      new Request('http://localhost/api/site-kit/overrides/CompositionHero'),
      'plx-a',
    )
    expect(ok).toBe(false)
  })
})

describe('viewerMayAccessCollection', () => {
  beforeEach(async () => {
    __resetProjectStoreForTests()
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isServiceAuthConfigured).mockReturnValue(false)
  })

  afterEach(async () => {
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isServiceAuthConfigured).mockReturnValue(false)
  })

  it('soft-allows when plexon auth unset', async () => {
    expect(await viewerMayAccessCollection('u1', 'plx-any')).toBe(true)
  })

  it('checks owner when plexon auth configured', async () => {
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isServiceAuthConfigured).mockReturnValue(true)
    await createProject({
      name: 'Owned',
      platformProjectId: 'plx-owned',
      ownerUserId: 'owner',
    })
    expect(await viewerMayAccessCollection('owner', 'plx-owned')).toBe(true)
    expect(await viewerMayAccessCollection('stranger', 'plx-owned')).toBe(false)
  })
})

describe('overrides route Pattern gate', () => {
  let cwd: string

  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'sk-s1-'))
  })

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('writes override with platformProjectId for ACL tests', async () => {
    await writeSiteKitOverride(
      {
        componentId: 'CompositionHero',
        args: {},
        composition: { type: 'SiteStack', props: {} },
        platformProjectId: 'plx-a',
        updatedAt: new Date().toISOString(),
      },
      { cwd },
    )
    const { readSiteKitOverride } = await import('../lib/site-kit/override-store')
    const body = await readSiteKitOverride('CompositionHero', { cwd })
    expect(body?.platformProjectId).toBe('plx-a')
  })
})
