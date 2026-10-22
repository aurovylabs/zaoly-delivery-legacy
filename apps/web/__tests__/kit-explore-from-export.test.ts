import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { resolveKitExploreFromExport } from '../lib/site-kit/kit-explore-from-export'
import { atomForkComponentId } from '../lib/site-kit/override-ids'
import { paths } from '../lib/paths'

const COLLECTION = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function sceneWith(
  root: SceneNode,
  extras?: Partial<CompositionScene>,
): CompositionScene {
  return {
    schemaVersion: '2026-05-plexon-federation-v3',
    id: 'scene-1',
    projectId: 'proj-1',
    name: 'Export Scene',
    root,
    ...extras,
  }
}

describe('resolveKitExploreFromExport', () => {
  it('maps editor alias types to Site Kit atoms and Collection forks', () => {
    const button: SceneNode = {
      id: 'btn-1',
      type: 'Button',
      name: 'CTA',
      props: { text: 'Go' },
    }
    const unbound = resolveKitExploreFromExport(sceneWith(button), button)
    expect(unbound.componentId).toBe('SiteButton')
    expect(unbound.href).toBe(`${paths.routes.kit}?componentId=SiteButton`)

    const bound = resolveKitExploreFromExport(
      sceneWith(button, { platformProjectId: COLLECTION }),
      button,
    )
    const fork = atomForkComponentId('SiteButton', COLLECTION)
    expect(bound.componentId).toBe(fork)
    const params = new URL(bound.href, 'http://zaoly.local').searchParams
    expect(params.get('componentId')).toBe(fork)
    expect(params.get(paths.activePackQueryKey)).toBe(COLLECTION)
  })

  it('resolves Instance masters to Composition / atom kit ids', () => {
    const instance: SceneNode = {
      id: 'inst-1',
      type: 'Instance',
      instanceOf: 'master-hero',
      name: 'Hero',
    }
    const result = resolveKitExploreFromExport(
      sceneWith(instance, {
        platformProjectId: COLLECTION,
        masters: [
          {
            id: 'master-hero',
            name: 'Hero',
            root: { id: 'm-root', type: 'SiteStack', children: [] },
            sourceKey: 'Composition:Hero',
          },
        ],
      }),
      instance,
    )
    expect(result.componentId).toMatch(/^Composition~/)
    expect(result.componentId).toContain('Hero')
    expect(result.href).toContain('componentId=')
  })

  it('falls back to Kit with Collection only when target is not Site Kit', () => {
    const unknown: SceneNode = { id: 'x', type: 'UnknownChrome', name: 'X' }
    const result = resolveKitExploreFromExport(
      sceneWith(unknown, { platformProjectId: COLLECTION }),
      unknown,
    )
    expect(result.componentId).toBeNull()
    expect(result.href).toBe(
      `${paths.routes.kit}?${paths.activePackQueryKey}=${COLLECTION}`,
    )
  })
})
