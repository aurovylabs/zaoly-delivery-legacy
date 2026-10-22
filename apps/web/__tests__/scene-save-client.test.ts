import { describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { fetchScene, putScene } from '../lib/scene/scene-save-client'

function minimalScene(id = 'scene-save'): CompositionScene {
  return {
    id,
    name: 'Save client test',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: '2026-08-23T20:00:00.000Z',
  }
}

describe('scene-save-client', () => {
  it('putScene returns stale on 409 stale-scene', async () => {
    const scene = minimalScene()
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'stale-scene' }), { status: 409 }),
    )
    const result = await putScene(scene, scene.updatedAt, '/api/scenes/scene-save', fetchFn)
    expect(result).toEqual({ ok: false, stale: true })
    expect(fetchFn).toHaveBeenCalledWith(
      '/api/scenes/scene-save',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ ...scene, baseUpdatedAt: scene.updatedAt }),
      }),
    )
  })

  it('putScene returns scene on success', async () => {
    const scene = minimalScene()
    const saved = { ...scene, name: 'Saved', updatedAt: '2026-08-23T20:01:00.000Z' }
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ scene: saved }), { status: 200 }),
    )
    const result = await putScene(scene, scene.updatedAt, '/api/scenes/scene-save', fetchFn)
    expect(result).toEqual({ ok: true, scene: saved })
  })

  it('fetchScene returns scene from GET body', async () => {
    const scene = minimalScene()
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ scene }), { status: 200 }),
    )
    const result = await fetchScene('/api/scenes/scene-save', fetchFn)
    expect(result).toEqual(scene)
  })
})
