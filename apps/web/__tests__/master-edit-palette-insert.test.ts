import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  applyPaletteHydrateInsertIntoMaster,
  findMasterBySourceKey,
} from '../lib/scene/ops'
import {
  MASTER_BOARD_TILE_PREFIX,
  masterEditAllowsPaletteInsert,
  resolveMasterBoardDropTargetId,
} from '../lib/scene/master-variants'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'
import { zaolyLandingSectionSourceKey } from '../lib/scene/zaoly-default-landing-scene'
import { createZaolyDefaultLandingScene } from '../lib/scene/zaoly-default-landing-scene'

function atomMaster(type: string): SceneMaster {
  const root = defaultChildForType(type)
  return {
    id: `master-${type}`,
    name: type,
    sourceKey: type,
    root,
    defaultVariantId: 'v1',
    variants: [{ id: 'v1', name: 'Default', root }],
  }
}

describe('master-edit palette insert policy', () => {
  it('seals Site Kit atom Masters and allows Composition section Masters', () => {
    expect(masterEditAllowsPaletteInsert(atomMaster('SiteButton'))).toBe(false)
    expect(masterEditAllowsPaletteInsert(atomMaster('SiteStack'))).toBe(false)
    expect(
      masterEditAllowsPaletteInsert({
        id: 'm-hero',
        name: 'Hero',
        sourceKey: zaolyLandingSectionSourceKey('LandingHero'),
        root: defaultChildForType('SiteStack'),
      }),
    ).toBe(true)
    expect(
      masterEditAllowsPaletteInsert({
        id: 'm-free',
        name: 'Free',
        root: defaultChildForType('SiteStack'),
      }),
    ).toBe(true)
  })

  it('remaps active board chrome drops to the working root', () => {
    const root: SceneNode = { id: 'hero-root', type: 'SiteStack', children: [] }
    const active = 'v-active'
    expect(
      resolveMasterBoardDropTargetId(
        `${MASTER_BOARD_TILE_PREFIX}${active}:body`,
        root,
        active,
      ),
    ).toBe('hero-root')
    expect(
      resolveMasterBoardDropTargetId(
        `${MASTER_BOARD_TILE_PREFIX}other:body`,
        root,
        active,
      ),
    ).toBeNull()
    expect(resolveMasterBoardDropTargetId('hero-root', root, active)).toBe('hero-root')
  })

  it('inserts a nested Instance into a section Master working root', () => {
    const scene = createZaolyDefaultLandingScene() as CompositionScene
    const hero = findMasterBySourceKey(
      scene.masters,
      zaolyLandingSectionSourceKey('LandingHero'),
    )!
    const beforeCount = hero.root.children?.length ?? 0
    const button = defaultChildForType('SiteButton')
    const result = applyPaletteHydrateInsertIntoMaster(scene, hero.id, undefined, {
      sourceKey: 'SiteButton',
      root: button,
      name: 'Button',
      parentId: hero.root.id,
    })
    expect(result).toEqual(expect.objectContaining({ ok: true }))
    const nextHero = findMasterBySourceKey(
      result.scene!.masters,
      zaolyLandingSectionSourceKey('LandingHero'),
    )!
    expect((nextHero.root.children ?? []).length).toBe(beforeCount + 1)
    const added = nextHero.root.children?.[nextHero.root.children.length - 1]
    expect(added?.type).toBe('Instance')
  })

  it('rejects palette hydrate into a sealed atom Master', () => {
    const button = atomMaster('SiteButton')
    const scene: CompositionScene = {
      id: 's',
      name: 'S',
      version: 1,
      updatedAt: '2026-10-10T00:00:00.000Z',
      root: { id: 'page', type: 'SiteStack', children: [] },
      masters: [button],
    }
    const result = applyPaletteHydrateInsertIntoMaster(scene, button.id, 'v1', {
      sourceKey: 'SiteText',
      root: defaultChildForType('SiteText'),
      name: 'Text',
      parentId: button.root.id,
    })
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/sealed/i)
  })
})
