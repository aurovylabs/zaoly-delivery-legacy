import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { normalizeScene } from '../lib/scene/scene-normalize'
import { isPostgresSceneStore, pgCountFromResult, sceneFromPgRow } from '../lib/scene/pg-store'
import { paths } from '../lib/paths'
import { sceneStoreBackend, __resetSceneStoreForTests } from '../lib/scene/scene-store'

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  }
})

describe('scene normalize + pg row mapping (P18)', () => {
  it('strips unknown top-level keys and keeps contract fields', () => {
    const demo = createLegacyFixtureScene()
    const scene = normalizeScene({ ...demo, viewport: 'ultrawide' })
    expect(scene?.id).toBe(demo.id)
    expect(scene && 'viewport' in scene).toBe(false)
    expect(normalizeScene({ id: 'x' })).toBeNull()
  })

  it('maps a postgres row onto CompositionScene', () => {
    const demo = createLegacyFixtureScene()
    demo.activeBreakpoint = 'tablet'
    const mapped = sceneFromPgRow({
      id: demo.id,
      name: demo.name,
      version: 1,
      platform_project_id: 'plx-1',
      owner_user_id: 'user-42',
      active_breakpoint: 'tablet',
      active_print_preset: 'a4-portrait',
      root: demo.root,
      masters: null,
      comments: null,
      pages: demo.pages ?? null,
      active_page_id: demo.activePageId ?? null,
      cover_page_id: demo.coverPageId ?? demo.pages?.[0]?.id ?? null,
      updated_at: new Date('2026-08-12T10:00:00.000Z'),
    })
    expect(mapped?.id).toBe(demo.id)
    expect(mapped?.platformProjectId).toBe('plx-1')
    expect(mapped?.ownerUserId).toBe('user-42')
    expect(mapped?.activeBreakpoint).toBe('tablet')
    expect(mapped?.activePrintPreset).toBe('a4-portrait')
    expect(mapped?.root.type).toBe(demo.root.type)
    if (mapped?.coverPageId) {
      expect(mapped.pages?.some((p) => p.id === mapped.coverPageId)).toBe(true)
    }
    expect(pgCountFromResult('3')).toBe(3)
    expect(pgCountFromResult(undefined)).toBe(0)
  })

  it('drops invalid breakpoint ids from a postgres row', () => {
    const demo = createLegacyFixtureScene()
    const mapped = sceneFromPgRow({
      id: demo.id,
      name: demo.name,
      version: 1,
      platform_project_id: null,
      owner_user_id: null,
      active_breakpoint: 'ultrawide',
      active_print_preset: 'letter',
      root: demo.root,
      masters: null,
      comments: null,
      pages: null,
      active_page_id: null,
      cover_page_id: null,
      updated_at: '2026-08-12T10:00:00.000Z',
    })
    expect(mapped?.id).toBe(demo.id)
    expect(mapped?.activeBreakpoint).toBeUndefined()
    expect(mapped?.activePrintPreset).toBeUndefined()
  })

  it('preserves ownerUserId and coverPageId through normalize', () => {
    const demo = createLegacyFixtureScene()
    const pageId = demo.pages?.[0]?.id ?? 'page-default'
    const scene = normalizeScene({
      ...demo,
      ownerUserId: 'dev-local',
      coverPageId: pageId,
      pages: demo.pages ?? [
        { id: pageId, name: 'Home', root: demo.root },
      ],
      activePageId: pageId,
    })
    expect(scene?.ownerUserId).toBe('dev-local')
    expect(scene?.coverPageId).toBe(pageId)
  })

  it('selects postgres backend only when ZAOLY_DATABASE_URL is set', () => {
    const prev = process.env[paths.envDatabaseUrl]
    delete process.env[paths.envDatabaseUrl]
    __resetSceneStoreForTests({ durable: false })
    expect(isPostgresSceneStore()).toBe(false)
    expect(sceneStoreBackend()).toBe('json')
    process.env[paths.envDatabaseUrl] = 'postgres://creation:x@127.0.0.1:5432/creation'
    expect(isPostgresSceneStore()).toBe(true)
    expect(sceneStoreBackend()).toBe('postgres')
    if (prev == null) delete process.env[paths.envDatabaseUrl]
    else process.env[paths.envDatabaseUrl] = prev
    __resetSceneStoreForTests({ durable: false })
  })
})

describe('health sceneStore (P18)', () => {
  afterEach(() => {
    delete process.env[paths.envDatabaseUrl]
    __resetSceneStoreForTests({ durable: false })
  })

  it('reports json without a database url and does not leak secrets', async () => {
    delete process.env[paths.envDatabaseUrl]
    const { GET: healthGet } = await import('../app/api/health/route')
    const res = await healthGet()
    const body = (await res.json()) as Record<string, unknown>
    expect(body.ok).toBe(true)
    expect(body.sceneStore).toBe('json')
    expect(body.versionStore).toBe('fs')
    expect(JSON.stringify(body)).not.toContain('postgres://')
    expect(JSON.stringify(body)).not.toContain('password')
  })

  it('reports postgres when ZAOLY_DATABASE_URL is set at request time', async () => {
    process.env[paths.envDatabaseUrl] = 'postgresql://zaoly:zaoly@localhost:5434/zaoly'
    __resetSceneStoreForTests({ durable: false })
    const { GET: healthGet } = await import('../app/api/health/route')
    const res = await healthGet()
    const body = (await res.json()) as Record<string, unknown>
    expect(body.sceneStore).toBe('postgres')
    expect(body.versionStore).toBe('postgres')
  })

  it('awaits connection() so host env is not frozen at image build', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(
      path.join(__dirname, '../app/api/health/route.ts'),
      'utf8',
    )
    expect(src).toContain('await connection()')
  })
})
