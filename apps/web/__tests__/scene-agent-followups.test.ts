import { describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { prepareCompositionFromScene } from '../lib/site-kit/prepare-composition-from-scene'
import { logSceneOpAudit } from '../lib/scene/scene-op-audit'

function sceneWithMaster(): CompositionScene {
  return {
    id: 'scene-kit',
    name: 'Kit scene',
    version: 1,
    updatedAt: '2026-08-23T20:00:00.000Z',
    root: {
      id: 'root',
      type: 'Stack',
      children: [
        {
          id: 'inst-hero',
          type: 'Instance',
          instanceOf: 'master-hero',
        },
      ],
    },
    masters: [
      {
        id: 'master-hero',
        name: 'Hero',
        sourceKey: 'Composition:Hero',
        root: {
          id: 'hero-root',
          type: 'SiteStack',
          props: { direction: 'column' },
          children: [{ id: 'hero-text', type: 'SiteText', props: { children: 'Hi' } }],
        },
      },
    ],
  }
}

describe('prepareCompositionFromScene', () => {
  it('expands master instance and validates export name', () => {
    const prepared = prepareCompositionFromScene({
      scene: sceneWithMaster(),
      masterId: 'master-hero',
      name: 'LandingHero',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.exportName).toBe('LandingHero')
    expect(prepared.root.type).toBe('SiteStack')
  })

  it('returns missing-instance when master has no instance on page', () => {
    const scene = sceneWithMaster()
    scene.root = { id: 'root', type: 'Stack', children: [] }
    const prepared = prepareCompositionFromScene({
      scene,
      masterId: 'master-hero',
      name: 'LandingHero',
    })
    expect(prepared.ok).toBe(false)
    if (prepared.ok) return
    expect(prepared.code).toBe('missing-instance')
  })
})

describe('logSceneOpAudit', () => {
  it('writes structured stdout entry', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    logSceneOpAudit({
      sceneId: 'scene-1',
      actorUserId: 'user-1',
      mode: 'session',
      appliedCount: 2,
      source: 'scene_ops',
    })
    expect(spy).toHaveBeenCalledWith(
      '[scene-ops-audit]',
      expect.objectContaining({ sceneId: 'scene-1', appliedCount: 2, source: 'scene_ops' }),
    )
    spy.mockRestore()
  })
})
