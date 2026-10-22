import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  applyVariantRemapsToSceneRoot,
  softFillSchemaFromSeed,
  pullMasterSchema,
  resetMasterFromSeed,
  type KitSeedPayload,
} from '../lib/site-kit/pull-merge'
import { mergeSiteKitPullIntoScene } from '../lib/site-kit/pull-merge'

const button = (props: Record<string, unknown>, style?: SceneNode['style']): SceneNode => ({
  id: 'n1',
  type: 'SiteButton',
  props,
  ...(style ? { style } : {}),
})

describe('softFillSchemaFromSeed', () => {
  it('adds missing props without wiping style', () => {
    const target = button({ children: 'Mine' }, { color: '#f00' })
    const seed = button({ children: 'Seed', size: 'lg' }, { color: '#0f0', padding: '8px' })
    const { node, addedProps } = softFillSchemaFromSeed(target, seed)
    expect(node.props?.children).toBe('Mine')
    expect(node.props?.size).toBe('lg')
    expect(node.style?.color).toBe('#f00')
    expect(node.style?.padding).toBe('8px')
    expect(addedProps).toContain('size')
    expect(addedProps).toContain('style.padding')
  })
})

describe('pullMasterSchema', () => {
  it('stamps pulledAt/kitRevision and keeps variants', () => {
    const master: SceneMaster = {
      id: 'm1',
      name: 'Btn',
      sourceKey: 'SiteButton',
      root: button({ children: 'A' }),
      variants: [
        { id: 'v1', name: 'Default', root: button({ children: 'A' }) },
        { id: 'v2', name: 'Hover', root: button({ children: 'B' }) },
      ],
      defaultVariantId: 'v1',
    }
    const seed: KitSeedPayload = {
      componentId: 'SiteButton',
      kitRevision: 'catalog:SiteButton',
      root: button({ children: 'X', newProp: true }),
    }
    const result = pullMasterSchema(master, seed)
    expect(result.changed).toBe(true)
    expect(result.master.pulledAt).toBeTruthy()
    expect(result.master.kitRevision).toBe('catalog:SiteButton')
    expect(result.master.variants).toHaveLength(2)
    expect(result.master.root.props?.children).toBe('A')
    expect(result.master.root.props?.newProp).toBe(true)
  })
})

describe('resetMasterFromSeed', () => {
  it('remaps variants by name', () => {
    const master: SceneMaster = {
      id: 'm1',
      name: 'Btn',
      sourceKey: 'SiteButton',
      root: button({ children: 'Old' }),
      variants: [
        { id: 'old-a', name: 'Default', root: button({ children: 'Old' }) },
        { id: 'old-b', name: 'Hover', root: button({ children: 'H' }) },
      ],
      defaultVariantId: 'old-a',
    }
    const seed: KitSeedPayload = {
      componentId: 'SiteButton',
      kitRevision: 'override:t1',
      root: button({ children: 'New' }),
      defaultVariantId: 'seed-a',
      variants: [
        { id: 'seed-a', name: 'Default', root: button({ children: 'New' }) },
        { id: 'seed-b', name: 'Hover', root: button({ children: 'NH' }) },
      ],
    }
    const result = resetMasterFromSeed(master, seed)
    expect(result.master.variants).toHaveLength(2)
    expect(result.master.root.props?.children).toBe('New')
    const byName = result.remaps.filter((r) => r.byName)
    expect(byName).toHaveLength(2)
    expect(result.remaps.find((r) => r.fromVariantId === 'old-b')?.byName).toBe(true)

    const sceneRoot: SceneNode = {
      id: 'root',
      type: 'Frame',
      props: {},
      children: [
        {
          id: 'inst',
          type: 'Instance',
          props: {},
          instanceOf: 'm1',
          instanceVariantId: 'old-b',
        },
      ],
    }
    const patchedRoot = applyVariantRemapsToSceneRoot(sceneRoot, result.remaps)
    const inst = patchedRoot.children![0]!
    expect(inst.instanceVariantId).not.toBe('old-b')
    expect(inst.instanceVariantId).toBe(
      result.remaps.find((r) => r.fromVariantId === 'old-b')!.toVariantId,
    )
  })
})

describe('mergeSiteKitPullIntoScene', () => {
  it('persists remapped sceneRoot onto the active page', () => {
    const pageARoot: SceneNode = { id: 'page-a-root', type: 'Stack', children: [] }
    const pageBRoot: SceneNode = { id: 'page-b-root', type: 'Stack', children: [] }
    const remapped: SceneNode = {
      id: 'page-a-root',
      type: 'Stack',
      children: [{ id: 'inst', type: 'Instance', instanceOf: 'm1' }],
    }
    const scene: CompositionScene = {
      id: 's1',
      name: 'Multi',
      version: 1,
      updatedAt: '2026-09-12T00:00:00.000Z',
      root: pageARoot,
      activePageId: 'page-a',
      pages: [
        { id: 'page-a', name: 'A', root: pageARoot },
        { id: 'page-b', name: 'B', root: pageBRoot },
      ],
      masters: [{ id: 'm1', name: 'M', root: button({ children: 'x' }) }],
    }
    const next = mergeSiteKitPullIntoScene(scene, {
      masters: scene.masters!,
      sceneRoot: remapped,
    })
    expect(next.root).toBe(remapped)
    expect(next.pages?.find((p) => p.id === 'page-a')?.root).toBe(remapped)
    expect(next.pages?.find((p) => p.id === 'page-b')?.root).toBe(pageBRoot)
  })

  it('leaves pages untouched when only masters update', () => {
    const root: SceneNode = { id: 'root', type: 'Stack', children: [] }
    const scene: CompositionScene = {
      id: 's1',
      name: 'One',
      version: 1,
      updatedAt: '2026-09-12T00:00:00.000Z',
      root,
      pages: [{ id: 'page-default', name: 'Page', root }],
      activePageId: 'page-default',
      masters: [{ id: 'm1', name: 'M', root: button({ children: 'old' }) }],
    }
    const nextMasters = [{ id: 'm1', name: 'M', root: button({ children: 'new' }) }]
    const next = mergeSiteKitPullIntoScene(scene, { masters: nextMasters })
    expect(next.masters?.[0]?.root.props?.children).toBe('new')
    expect(next.pages?.[0]?.root).toBe(root)
    expect(next.root).toBe(root)
  })
})
