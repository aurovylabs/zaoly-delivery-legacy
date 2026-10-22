import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import {
  __resetSceneStoreForTests,
  deleteScene,
  getScene,
  getSceneStorePath,
  renameScene,
  upsertScene,
} from '../lib/scene/scene-store'
import { paths } from '../lib/paths'

describe('durable scene store', () => {
  const prev = process.env[paths.envSceneStorePath]
  const prevDb = process.env[paths.envDatabaseUrl]

  afterEach(() => {
    if (prev == null) delete process.env[paths.envSceneStorePath]
    else process.env[paths.envSceneStorePath] = prev
    if (prevDb == null) delete process.env[paths.envDatabaseUrl]
    else process.env[paths.envDatabaseUrl] = prevDb
    __resetSceneStoreForTests({ durable: false })
  })

  it('renames and deletes scenes in the JSON store', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-scenes-'))
    const file = path.join(dir, 'scenes.json')
    process.env[paths.envSceneStorePath] = file
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const scene = createLegacyFixtureScene()
    scene.id = 'scene-durable-delete'
    scene.name = 'Before'
    await upsertScene(scene)
    const renamed = await renameScene(scene.id, 'After')
    expect(renamed?.name).toBe('After')
    __resetSceneStoreForTests({ durable: true })
    expect((await getScene(scene.id))?.name).toBe('After')
    expect(await deleteScene(scene.id)).toBe(true)
    __resetSceneStoreForTests({ durable: true })
    // Empty store may re-seed the default demo id — our custom id must stay gone.
    expect(await getScene(scene.id)).toBeNull()
  })

  it('persists upsert to JSON and reloads', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-scenes-'))
    const file = path.join(dir, 'scenes.json')
    process.env[paths.envSceneStorePath] = file
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const scene = createLegacyFixtureScene()
    scene.name = 'Persisted demo'
    await upsertScene(scene)
    expect(fs.existsSync(getSceneStorePath())).toBe(true)

    // Clear memory only — keep disk so next seed rehydrates.
    __resetSceneStoreForTests({ durable: true })
    const reloaded = await getScene(scene.id)
    expect(reloaded?.name).toBe('Persisted demo')
  })

  it('ignores stale viewport key on load without failing', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-scenes-'))
    const file = path.join(dir, 'scenes.json')
    process.env[paths.envSceneStorePath] = file
    const scene = createLegacyFixtureScene()
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        scenes: [{ ...scene, viewport: 'ultrawide' }],
      }),
      'utf8',
    )
    __resetSceneStoreForTests({ durable: true })
    const loaded = await getScene(scene.id)
    expect(loaded?.id).toBe(scene.id)
    expect(loaded && 'viewport' in loaded).toBe(false)
  })

  it('round-trips activeBreakpoint and keeps older saves without it', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-scenes-'))
    const file = path.join(dir, 'scenes.json')
    process.env[paths.envSceneStorePath] = file
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const withBp = createLegacyFixtureScene()
    withBp.activeBreakpoint = 'tablet'
    await upsertScene(withBp)
    __resetSceneStoreForTests({ durable: true })
    expect((await getScene(withBp.id))?.activeBreakpoint).toBe('tablet')

    const legacyFile = path.join(dir, 'legacy.json')
    process.env[paths.envSceneStorePath] = legacyFile
    const legacy = createLegacyFixtureScene()
    delete legacy.activeBreakpoint
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(legacyFile, JSON.stringify({ version: 1, scenes: [legacy] }), 'utf8')
    __resetSceneStoreForTests({ durable: true })
    expect((await getScene(legacy.id))?.activeBreakpoint).toBeUndefined()
  })

  it('round-trips activePrintPreset (P85)', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-scenes-preset-'))
    const file = path.join(dir, 'scenes.json')
    process.env[paths.envSceneStorePath] = file
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const withPreset = createLegacyFixtureScene()
    withPreset.activeBreakpoint = 'print'
    withPreset.activePrintPreset = 'a5-landscape'
    await upsertScene(withPreset)
    __resetSceneStoreForTests({ durable: true })
    const loaded = await getScene(withPreset.id)
    expect(loaded?.activeBreakpoint).toBe('print')
    expect(loaded?.activePrintPreset).toBe('a5-landscape')
  })

  it('round-trips masters and comments', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-scenes-masters-'))
    const file = path.join(dir, 'scenes.json')
    process.env[paths.envSceneStorePath] = file
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const scene = createLegacyFixtureScene()
    scene.masters = [
      {
        id: 'master-button',
        name: 'Button',
        sourceKey: 'SiteButton',
        root: {
          id: 'master-button-root',
          type: 'SiteButton',
          name: 'Button',
          props: { children: 'Click' },
        },
      },
    ]
    scene.comments = [
      {
        id: 'c1',
        nodeId: scene.root.id,
        body: 'note',
        author: 'tester',
        createdAt: '2026-01-01T00:00:00.000Z',
        resolved: false,
      },
    ]
    scene.root = {
      ...scene.root,
      children: [
        ...(scene.root.children ?? []),
        { id: 'inst-1', type: 'Instance', instanceOf: 'master-button', name: 'Button instance' },
      ],
    }
    await upsertScene(scene)
    __resetSceneStoreForTests({ durable: true })
    const loaded = await getScene(scene.id)
    expect(loaded?.masters).toHaveLength(1)
    expect(loaded?.masters?.[0]?.sourceKey).toBe('SiteButton')
    expect(loaded?.comments?.[0]?.body).toBe('note')
    expect(loaded?.root.children?.some((n) => n.type === 'Instance' && n.instanceOf === 'master-button')).toBe(
      true,
    )
  })
})
