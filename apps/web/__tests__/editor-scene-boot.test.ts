import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  createDepositLandingScene,
  DEPOSIT_LANDING_SCENE_ID,
} from '../lib/scene/deposit-landing-scene'
import { createDemoScene } from '../lib/scene/demo-scene'
import {
  createVaillantLandingScene,
  VAILLANT_LANDING_SCENE_ID,
} from '../lib/scene/vaillant-landing-scene'
import { resolveEditorInitialScene } from '../lib/scene/editor-scene-boot'
import {
  __resetSceneStoreForTests,
  getScene,
  upsertScene,
} from '../lib/scene/scene-store'
import { paths } from '../lib/paths'

describe('resolveEditorInitialScene', () => {
  const prev = process.env[paths.envSceneStorePath]
  const prevDb = process.env[paths.envDatabaseUrl]

  afterEach(() => {
    if (prev == null) delete process.env[paths.envSceneStorePath]
    else process.env[paths.envSceneStorePath] = prev
    if (prevDb == null) delete process.env[paths.envDatabaseUrl]
    else process.env[paths.envDatabaseUrl] = prevDb
    __resetSceneStoreForTests({ durable: false })
  })

  it('loads persisted default scene without sceneId query param', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const saved = createDemoScene(null)
    saved.name = 'My saved canvas'
    await upsertScene(saved)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({})
    expect(booted.id).toBe('scene-demo')
    expect(booted.name).toBe('My saved canvas')
  })

  it('does not regenerate in-code demo when store has scene-demo', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const freshDemo = createDemoScene(null)
    const emptiedRoot = {
      ...freshDemo.root,
      children: [],
    }
    const saved = {
      ...freshDemo,
      name: 'Edited',
      root: emptiedRoot,
      pages: freshDemo.pages?.map((page, index) =>
        index === 0 ? { ...page, root: emptiedRoot } : page,
      ),
    }
    await upsertScene(saved)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({})
    expect(booted.root.children).toHaveLength(0)
    expect(booted.name).toBe('Edited')
  })

  it('loads explicit sceneId when provided', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const custom = { ...createDemoScene(null), id: 'scene-custom', name: 'Custom' }
    await upsertScene(custom)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({ sceneId: 'scene-custom' })
    expect(booted.name).toBe('Custom')
  })

  it('loads personal starter for viewerUserId instead of shared scene-demo', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const shared = createDemoScene(null)
    shared.ownerUserId = 'someone-else'
    await upsertScene(shared)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({ viewerUserId: 'viewer-1' })
    expect(booted.ownerUserId).toBe('viewer-1')
    expect(booted.id).not.toBe('scene-demo')
    expect(booted.name).toBe('Zaoly Landing')
  })

  it('preserves ownerUserId when soft-reseeding Zaoly default landing', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const { createZaolyDefaultLandingScene } = await import(
      '../lib/scene/zaoly-default-landing-scene'
    )
    const legacy = createZaolyDefaultLandingScene(null)
    legacy.ownerUserId = 'owner-keep-me'
    legacy.root = {
      ...legacy.root,
      children: legacy.root.children?.map((child) =>
        child.id === 'pattern-zaoly-landing-nav'
          ? { id: child.id, type: 'SiteContainer', name: 'Nav' }
          : child,
      ),
    }
    await upsertScene(legacy)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({})
    expect(booted.name).toBe('Zaoly Landing')
    expect(booted.ownerUserId).toBe('owner-keep-me')
  })

  it('seeds Zaoly default landing on first visit when store is empty', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const booted = await resolveEditorInitialScene({})
    expect(booted.id).toBe('scene-demo')
    expect(booted.name).toBe('Zaoly Landing')
    expect(booted.pages).toHaveLength(1)
    expect(booted.pages?.[0]?.name).toBe('Landing')
    expect(booted.root.children ?? []).not.toHaveLength(0)
    expect((booted.masters ?? []).length).toBeGreaterThan(0)
    expect(await getScene('scene-demo')).not.toBeNull()
  })

  it('seeds Zaoly default landing for a new Collection with no scenes', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const collectionId = '550e8400-e29b-41d4-a716-446655440000'
    const booted = await resolveEditorInitialScene({
      platformProjectId: collectionId,
    })
    expect(booted.platformProjectId).toBe(collectionId)
    expect(booted.name).toBe('Zaoly Landing')
    expect(booted.pages).toHaveLength(1)
    expect(booted.pages?.[0]?.name).toBe('Landing')
    expect(booted.root.children ?? []).not.toHaveLength(0)
    expect((booted.masters ?? []).length).toBeGreaterThan(0)
    expect(booted.id).not.toBe('scene-demo')
  })

  it('upgrades an empty Untitled blank to the Zaoly default landing', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const { createEmptyArtboardScene } = await import('../lib/scene/demo-scene')
    await upsertScene(createEmptyArtboardScene(null))

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({})
    expect(booted.name).toBe('Zaoly Landing')
    expect(booted.root.children ?? []).not.toHaveLength(0)
  })

  it('seeds deposit landing for Zaoly Collection', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const booted = await resolveEditorInitialScene({
      platformProjectId: paths.zaolyDepositPlatformProjectId,
    })
    expect(booted.id).toBe(DEPOSIT_LANDING_SCENE_ID)
    expect(booted.name).toBe('Zaoly Deposit Landing')
    expect(await getScene(DEPOSIT_LANDING_SCENE_ID)).not.toBeNull()
  })

  it('reuses persisted deposit landing for Zaoly Collection', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const saved = createDepositLandingScene()
    saved.name = 'Edited deposit landing'
    await upsertScene(saved)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({
      platformProjectId: paths.zaolyDepositPlatformProjectId,
    })
    expect(booted.name).toBe('Edited deposit landing')
  })

  it('auto-reseeds legacy single-page deposit landing to three artboards', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const legacy = createDepositLandingScene()
    legacy.pages = [legacy.pages![0]!]
    await upsertScene(legacy)

    __resetSceneStoreForTests({ durable: true })
    const booted = await resolveEditorInitialScene({
      platformProjectId: paths.zaolyDepositPlatformProjectId,
    })
    expect(booted.pages).toHaveLength(3)
  })

  it('seeds Vaillant landing for Vaillant Group Collection', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'creation-editor-boot-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const booted = await resolveEditorInitialScene({
      platformProjectId: paths.vaillantPlatformProjectId,
    })
    expect(booted.id).toBe(VAILLANT_LANDING_SCENE_ID)
    expect(booted.name).toMatch(/^Vaillant Group Landing/)
    expect(await getScene(VAILLANT_LANDING_SCENE_ID)).not.toBeNull()
  })
})
