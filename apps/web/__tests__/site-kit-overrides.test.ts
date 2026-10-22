import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  exportNameFromCompositionId,
  isAllowedOverrideId,
} from '../lib/site-kit/override-ids'
import {
  parseOverrideUpdatedAt,
  pickNewerOverrideBody,
  readSiteKitOverride,
  writeSiteKitOverride,
  type SiteKitOverrideBody,
} from '../lib/site-kit/override-store'

const pgStore = vi.hoisted(() => ({
  isPostgresSceneStore: vi.fn(() => false),
  creationDatabaseUrl: vi.fn(() => null as string | null),
  getScenePool: vi.fn(() => ({
    query: vi.fn(),
  })),
}))

vi.mock('../lib/scene/pg-store', () => pgStore)

describe('site-kit override ids', () => {
  it('allows atoms and Composition{Name}', () => {
    expect(isAllowedOverrideId('SiteButton')).toBe(true)
    expect(isAllowedOverrideId('CompositionTest')).toBe(true)
    expect(isAllowedOverrideId('CompositionMyHero')).toBe(true)
    expect(isAllowedOverrideId('Nope')).toBe(false)
    expect(isAllowedOverrideId('compositionTest')).toBe(false)
  })

  it('parses export name from composition id', () => {
    expect(exportNameFromCompositionId('CompositionTest')).toBe('Test')
    expect(exportNameFromCompositionId('SiteButton')).toBeNull()
  })
})

describe('override reconciliation', () => {
  it('prefers newer updatedAt when merging bodies', () => {
    const older: SiteKitOverrideBody = {
      componentId: 'CompositionTest',
      composition: { type: 'SiteText', props: { children: 'old' } },
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const newer: SiteKitOverrideBody = {
      componentId: 'CompositionTest',
      composition: { type: 'SiteText', props: { children: 'new' } },
      updatedAt: '2026-08-20T12:00:00.000Z',
    }
    expect(pickNewerOverrideBody(older, newer)?.composition).toEqual(newer.composition)
    expect(pickNewerOverrideBody(newer, older)?.composition).toEqual(newer.composition)
    expect(parseOverrideUpdatedAt(undefined)).toBe(0)
  })
})

describe('site-kit override store', () => {
  beforeEach(() => {
    pgStore.isPostgresSceneStore.mockReturnValue(false)
    pgStore.creationDatabaseUrl.mockReturnValue(null)
    pgStore.getScenePool.mockReturnValue({ query: vi.fn() })
  })

  it('round-trips composition override on disk', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'site-kit-ov-'))
    await mkdir(path.join(cwd, '.data/site-kit/overrides'), { recursive: true })

    const write = await writeSiteKitOverride(
      {
        componentId: 'CompositionTest',
        exportName: 'Test',
        storyTitle: 'Compositions/Test',
        args: {},
        composition: {
          type: 'SiteButton',
          props: { children: 'Hi' },
        },
        updatedAt: '2026-08-20T12:00:00.000Z',
      },
      { cwd },
    )
    expect(write.ok).toBe(true)

    const read = await readSiteKitOverride('CompositionTest', { cwd })
    expect(read?.composition).toEqual({
      type: 'SiteButton',
      props: { children: 'Hi' },
    })
    expect(read?.exportName).toBe('Test')
  })

  it('rejects unknown ids', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'site-kit-ov-bad-'))
    const write = await writeSiteKitOverride(
      { componentId: 'NotReal', args: {} },
      { cwd },
    )
    expect(write.ok).toBe(false)
  })

  it('reads preexisting disk override for Composition*', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'site-kit-ov-pre-'))
    const dir = path.join(cwd, '.data/site-kit/overrides')
    await mkdir(dir, { recursive: true })
    await writeFile(
      path.join(dir, 'CompositionHero.json'),
      JSON.stringify({
        componentId: 'CompositionHero',
        composition: { type: 'SiteText', props: { children: 'H' } },
      }),
      'utf8',
    )
    const read = await readSiteKitOverride('CompositionHero', { cwd })
    expect(read?.composition?.type).toBe('SiteText')
  })

  it('fails visibly when Postgres is required but unavailable', async () => {
    pgStore.isPostgresSceneStore.mockReturnValue(true)
    pgStore.creationDatabaseUrl.mockReturnValue('postgres://example')
    pgStore.getScenePool.mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error('connection refused')),
    })

    const cwd = await mkdtemp(path.join(tmpdir(), 'site-kit-ov-pg-'))
    const write = await writeSiteKitOverride(
      {
        componentId: 'SiteButton',
        args: { children: 'Go' },
      },
      { cwd },
    )
    expect(write.ok).toBe(false)
    if (write.ok) return
    expect(write.code).toBe('pg-unavailable')
  })

  it('reads newer disk copy when Postgres row is older', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'site-kit-ov-merge-'))
    const dir = path.join(cwd, '.data/site-kit/overrides')
    await mkdir(dir, { recursive: true })
    await writeFile(
      path.join(dir, 'CompositionHero.json'),
      JSON.stringify({
        componentId: 'CompositionHero',
        composition: { type: 'SiteText', props: { children: 'disk-new' } },
        updatedAt: '2026-08-21T00:00:00.000Z',
      }),
      'utf8',
    )

    pgStore.isPostgresSceneStore.mockReturnValue(true)
    pgStore.creationDatabaseUrl.mockReturnValue('postgres://example')
    pgStore.getScenePool.mockReturnValue({
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            body: {
              componentId: 'CompositionHero',
              composition: { type: 'SiteText', props: { children: 'pg-old' } },
              updatedAt: '2026-08-20T00:00:00.000Z',
            },
          },
        ],
      }),
    })

    const read = await readSiteKitOverride('CompositionHero', { cwd })
    expect(read?.composition).toEqual({
      type: 'SiteText',
      props: { children: 'disk-new' },
    })
  })
})
