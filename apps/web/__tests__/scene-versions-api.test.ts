import { beforeEach, describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  __resetVersionStoreForTests,
  createSceneVersion,
  getSceneVersion,
  listSceneVersions,
  restoreSceneVersion,
} from '../lib/scene/version-store'
import {
  __resetSceneStoreForTests,
  getScene,
  upsertScene,
} from '../lib/scene/scene-store'

function createTestScene(id = 'scene-version-test'): CompositionScene {
  return {
    id,
    name: 'Initial Scene',
    version: 1,
    root: {
      id: 'root',
      type: 'Stack',
      children: [
        { id: 'btn_1', type: 'Button', props: { label: 'Click me' } },
      ],
    },
    updatedAt: '2026-09-08T08:00:00.000Z',
  }
}

describe('Scene Version Store & Checkpoints (P116)', () => {
  beforeEach(() => {
    __resetSceneStoreForTests()
    __resetVersionStoreForTests()
  })

  it('creates and lists version checkpoints in descending order', async () => {
    const scene = createTestScene()
    await upsertScene(scene)

    const v1 = await createSceneVersion(
      scene.id,
      { name: 'Initial Release', description: 'First baseline' },
      { id: 'usr_1', name: 'Alice' },
    )

    expect(v1.versionNumber).toBe(1)
    expect(v1.name).toBe('Initial Release')
    expect(v1.nodeCount).toBe(2) // root + btn_1

    // Modify scene
    const modified = {
      ...scene,
      root: {
        ...scene.root,
        children: [
          ...(scene.root.children || []),
          { id: 'btn_2', type: 'Button', props: { label: 'Second' } },
        ],
      },
    }
    await upsertScene(modified)

    const v2 = await createSceneVersion(
      scene.id,
      { name: 'Added Second Button' },
      { id: 'usr_2', name: 'Bob' },
    )

    expect(v2.versionNumber).toBe(2)
    expect(v2.nodeCount).toBe(3)

    const list = await listSceneVersions(scene.id)
    expect(list.length).toBe(2)
    expect(list[0].id).toBe(v2.id)
    expect(list[1].id).toBe(v1.id)
  })

  it('retrieves specific checkpoint snapshot', async () => {
    const scene = createTestScene()
    await upsertScene(scene)

    const created = await createSceneVersion(scene.id, { name: 'Snapshot A' })
    const fetched = await getSceneVersion(scene.id, created.id)

    expect(fetched).not.toBeNull()
    expect(fetched?.snapshot.name).toBe('Initial Scene')
  })

  it('restores historical version with automatic safety backup', async () => {
    const scene = createTestScene()
    await upsertScene(scene)

    // Checkpoint 1
    const v1 = await createSceneVersion(scene.id, { name: 'V1 Original' })

    // Destructive change
    const mutated: CompositionScene = {
      ...scene,
      name: 'Corrupted Scene',
      root: { id: 'root', type: 'Stack', children: [] },
    }
    await upsertScene(mutated)

    // Restore V1
    const result = await restoreSceneVersion(scene.id, v1.id, { id: 'usr_admin', name: 'Admin' })

    expect(result.restored.name).toBe('Initial Scene')
    expect(result.restored.root.children?.length).toBe(1)
    expect(result.safetyBackup.name).toContain('Pre-restore Safety Snapshot')

    // Current scene in store should now match restored
    const live = await getScene(scene.id)
    expect(live?.name).toBe('Initial Scene')
    expect(live?.root.children?.length).toBe(1)

    // Checkpoints count should now include V1, V2 (safety backup)
    const list = await listSceneVersions(scene.id)
    expect(list.length).toBe(2)
  })

  it('computes visual version diff between checkpoint and current scene', async () => {
    const scene = createTestScene()
    await upsertScene(scene)

    const v1 = await createSceneVersion(scene.id, { name: 'Baseline' })

    // Add a new node to current scene
    const modified: CompositionScene = {
      ...scene,
      root: {
        ...scene.root,
        children: [
          ...(scene.root.children || []),
          { id: 'btn_new', type: 'Button', props: { label: 'New Action' } },
        ],
      },
    }
    await upsertScene(modified)

    const checkpoint = await getSceneVersion(scene.id, v1.id)
    expect(checkpoint).not.toBeNull()

    const { compareScenes } = await import('../lib/scene/scene-diff')
    const diff = compareScenes(checkpoint!.snapshot, modified)

    expect(diff.totalAdded).toBe(1)
    expect(diff.totalRemoved).toBe(0)
    expect(diff.pages[0].nodeDiffs.some((n) => n.nodeId === 'btn_new' && n.kind === 'added')).toBe(true)
  })
})
