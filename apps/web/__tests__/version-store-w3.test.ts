import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  }
})

import type { CompositionScene, SceneVersionCheckpoint } from '@zaoly/contracts'
import { paths } from '../lib/paths'
import { checkpointFromPgRow, versionStoreBackend } from '../lib/scene/pg-version-store'
import { __resetVersionStoreForTests } from '../lib/scene/version-store'
import { __resetSceneStoreForTests } from '../lib/scene/scene-store'
import { GET as healthGet } from '../app/api/health/route'

describe('version store backend (W3)', () => {
  afterEach(() => {
    delete process.env[paths.envDatabaseUrl]
    __resetSceneStoreForTests({ durable: false })
    __resetVersionStoreForTests()
  })

  it('selects fs without ZAOLY_DATABASE_URL and postgres when set', () => {
    delete process.env[paths.envDatabaseUrl]
    expect(versionStoreBackend()).toBe('fs')
    process.env[paths.envDatabaseUrl] = 'postgres://creation:x@127.0.0.1:5432/creation'
    expect(versionStoreBackend()).toBe('postgres')
  })

  it('maps a postgres row onto SceneVersionCheckpoint', () => {
    const snapshot: CompositionScene = {
      id: 'scene-1',
      name: 'Demo',
      version: 1,
      root: { id: 'root', type: 'Stack', children: [] },
      updatedAt: '2026-09-12T08:00:00.000Z',
    }
    const mapped = checkpointFromPgRow({
      id: 'ver_1',
      scene_id: 'scene-1',
      version_number: 3,
      name: 'Milestone',
      description: 'Ship it',
      is_auto_save: false,
      author_json: { id: 'usr_1', name: 'Ada' },
      page_count: 2,
      node_count: 10,
      snapshot,
      created_at: new Date('2026-09-12T08:01:00.000Z'),
    })
    expect(mapped?.id).toBe('ver_1')
    expect(mapped?.versionNumber).toBe(3)
    expect(mapped?.author.name).toBe('Ada')
    expect(mapped?.snapshot.name).toBe('Demo')
    expect(mapped?.description).toBe('Ship it')
  })

  it('health reports versionStore without leaking secrets', async () => {
    delete process.env[paths.envDatabaseUrl]
    const res = await healthGet()
    const body = (await res.json()) as Record<string, unknown>
    expect(body.versionStore).toBe('fs')
    expect(JSON.stringify(body)).not.toContain('postgres://')
  })
})

describe('version store postgres path (mocked pool)', () => {
  const rows: Array<Record<string, unknown>> = []
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX') || sql.includes('ALTER TABLE')) {
      return { rows: [] }
    }
    if (sql.includes('COALESCE(MAX(version_number)')) {
      const max = rows.reduce((acc, r) => Math.max(acc, Number(r.version_number) || 0), 0)
      return { rows: [{ n: String(max) }] }
    }
    if (sql.trimStart().startsWith('INSERT INTO scene_versions')) {
      const [
        id,
        sceneId,
        versionNumber,
        name,
        description,
        isAutoSave,
        authorJson,
        pageCount,
        nodeCount,
        snapshot,
        createdAt,
      ] = params as unknown[]
      rows.unshift({
        id,
        scene_id: sceneId,
        version_number: versionNumber,
        name,
        description,
        is_auto_save: isAutoSave,
        author_json: JSON.parse(String(authorJson)),
        page_count: pageCount,
        node_count: nodeCount,
        snapshot: JSON.parse(String(snapshot)),
        created_at: createdAt,
      })
      return { rows: [] }
    }
    if (sql.includes('FROM scene_versions') && sql.includes('AND id =')) {
      const [sceneId, versionId] = params as string[]
      const row = rows.find((r) => r.scene_id === sceneId && r.id === versionId)
      return { rows: row ? [row] : [] }
    }
    if (sql.includes('FROM scene_versions')) {
      const [sceneId] = params as string[]
      return {
        rows: rows
          .filter((r) => r.scene_id === sceneId)
          .sort((a, b) => Number(b.version_number) - Number(a.version_number)),
      }
    }
    return { rows: [] }
  })

  beforeEach(() => {
    rows.length = 0
    query.mockClear()
    vi.resetModules()
    process.env[paths.envDatabaseUrl] = 'postgres://creation:x@127.0.0.1:5432/creation'
    vi.doMock('../lib/scene/pg-store', async () => {
      const actual = await vi.importActual<typeof import('../lib/scene/pg-store')>(
        '../lib/scene/pg-store',
      )
      return {
        ...actual,
        isPostgresSceneStore: () => true,
        ensureScenesSchema: async () => undefined,
        getScenePool: () => ({ query }),
      }
    })
  })

  afterEach(() => {
    delete process.env[paths.envDatabaseUrl]
    vi.doUnmock('../lib/scene/pg-store')
    vi.resetModules()
  })

  it('creates and lists checkpoints via scene_versions', async () => {
    const {
      createSceneVersion,
      listSceneVersions,
      getSceneVersion,
      __resetVersionStoreForTests,
    } = await import('../lib/scene/version-store')

    __resetVersionStoreForTests()

    const scene: CompositionScene = {
      id: 'scene-pg-ver',
      name: 'PG Version',
      version: 1,
      root: { id: 'root', type: 'Stack', children: [] },
      updatedAt: '2026-09-12T09:00:00.000Z',
    }

    const created = await createSceneVersion(
      scene.id,
      { name: 'PG Milestone' },
      { id: 'usr_pg', name: 'Pat' },
      scene,
    )
    expect(created.versionNumber).toBe(1)
    expect(query.mock.calls.some((c) => String(c[0]).includes('INSERT INTO scene_versions'))).toBe(
      true,
    )

    const list = await listSceneVersions(scene.id)
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('PG Milestone')

    const fetched = await getSceneVersion(scene.id, created.id)
    expect((fetched as SceneVersionCheckpoint | null)?.snapshot.name).toBe('PG Version')
  })
})
