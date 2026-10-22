import { afterEach, describe, expect, it } from 'vitest'
import { ensureStarterLandingForUser } from '../lib/scene/user-starter-scene'
import {
  __resetSceneStoreForTests,
  listScenes,
  upsertScene,
} from '../lib/scene/scene-store'
import { createBlankScene } from '../lib/scene/blank-scene'
import { paths } from '../lib/paths'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

describe('ensureStarterLandingForUser', () => {
  const prev = process.env[paths.envSceneStorePath]
  const prevDb = process.env[paths.envDatabaseUrl]

  afterEach(() => {
    if (prev == null) delete process.env[paths.envSceneStorePath]
    else process.env[paths.envSceneStorePath] = prev
    if (prevDb == null) delete process.env[paths.envDatabaseUrl]
    else process.env[paths.envDatabaseUrl] = prevDb
    __resetSceneStoreForTests({ durable: false })
  })

  it('creates a personal Zaoly landing owned by the user', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zaoly-starter-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const scene = await ensureStarterLandingForUser('user-ada')
    expect(scene).not.toBeNull()
    expect(scene!.ownerUserId).toBe('user-ada')
    expect(scene!.name).toBe('Zaoly Landing')
    expect(scene!.id).not.toBe('scene-demo')
    expect(scene!.platformProjectId ?? null).toBeNull()
  })

  it('is idempotent — does not create a second owned scene', async () => {
    delete process.env[paths.envDatabaseUrl]
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zaoly-starter-'))
    process.env[paths.envSceneStorePath] = path.join(dir, 'scenes.json')
    __resetSceneStoreForTests({ durable: true, wipeDisk: true })

    const first = await ensureStarterLandingForUser('user-bob')
    const second = await ensureStarterLandingForUser('user-bob')
    expect(second!.id).toBe(first!.id)

    await upsertScene(
      createBlankScene({ name: 'Extra', ownerUserId: 'user-bob' }),
    )
    const again = await ensureStarterLandingForUser('user-bob')
    const owned = (await listScenes()).filter((s) => s.ownerUserId === 'user-bob')
    expect(owned.length).toBe(2)
    expect(owned.map((s) => s.id)).toContain(again!.id)
  })

  it('returns null for empty owner id', async () => {
    expect(await ensureStarterLandingForUser('')).toBeNull()
    expect(await ensureStarterLandingForUser('   ')).toBeNull()
  })
})
