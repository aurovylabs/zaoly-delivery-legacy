import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { applyPaletteHydrateInsertIntoMaster, findMasterBySourceKey } from '../lib/scene/ops'
import {
  planExpandAwarePaletteDrop,
  resolveTokenDropTarget,
} from '../lib/scene/expand-drop'
import { expandSceneTree } from '../lib/scene/expand-instances'
import { planTokenDrop } from '../lib/inspect/token-drop'
import { activePageRoot } from '../lib/scene/scene-pages'
import {
  createZaolyDefaultLandingScene,
  ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID,
  zaolyLandingSectionSourceKey,
} from '../lib/scene/zaoly-default-landing-scene'
import { isSceneContainerType } from '../lib/scene/scene-drop-plan'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'

function findFirst(
  node: SceneNode,
  pred: (n: SceneNode) => boolean,
): SceneNode | null {
  if (pred(node)) return node
  for (const child of node.children ?? []) {
    const hit = findFirst(child, pred)
    if (hit) return hit
  }
  return null
}

describe('expand-aware drops (section Instances)', () => {
  it('resolveTokenDropTarget uses painted type on Instance shell', () => {
    const scene = createZaolyDefaultLandingScene()
    const root = activePageRoot(scene)
    const target = resolveTokenDropTarget(scene, root, ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID)
    expect(target).not.toBeNull()
    expect(target!.nodeType).not.toBe('Instance')
    expect(isSceneContainerType(target!.nodeType)).toBe(true)
    expect(planTokenDrop('color', target!.nodeType).ok).toBe(true)
  })

  it('resolveTokenDropTarget resolves expand ids inside the hero', () => {
    const scene = createZaolyDefaultLandingScene()
    const root = activePageRoot(scene)
    const painted = expandSceneTree(root, scene.masters)
    const hero = painted.children?.find((c) => c.id === ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID)
    expect(hero).toBeTruthy()
    const leaf = findFirst(
      hero!,
      (n) => n.id.includes('::') && /Text/i.test(n.type),
    )
    expect(leaf).toBeTruthy()
    const target = resolveTokenDropTarget(scene, root, leaf!.id)
    expect(target).not.toBeNull()
    expect(target!.nodeType).toMatch(/Text/i)
    expect(planTokenDrop('color', target!.nodeType).ok).toBe(true)
  })

  it('planExpandAwarePaletteDrop routes into hero Instance to Composition Master', () => {
    const scene = createZaolyDefaultLandingScene()
    const root = activePageRoot(scene)
    const plan = planExpandAwarePaletteDrop(scene, ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID, 'into', root)
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.mode).toBe('master')
    if (plan.mode !== 'master') return
    const hero = findMasterBySourceKey(scene.masters, zaolyLandingSectionSourceKey('LandingHero'))!
    expect(plan.masterId).toBe(hero.id)
    expect(plan.parentId).toBe(hero.root.id)

    const before = hero.root.children?.length ?? 0
    const button = defaultChildForType('SiteButton')
    const result = applyPaletteHydrateInsertIntoMaster(scene, plan.masterId, plan.variantId, {
      sourceKey: 'SiteButton',
      root: button,
      name: 'Button',
      parentId: plan.parentId,
      index: plan.index,
    })
    expect(result.ok).toBe(true)
    const nextHero = findMasterBySourceKey(
      result.scene!.masters,
      zaolyLandingSectionSourceKey('LandingHero'),
    )!
    expect((nextHero.root.children ?? []).length).toBe(before + 1)
  })

  it('planExpandAwarePaletteDrop keeps page sibling before/after on section Instance', () => {
    const scene = createZaolyDefaultLandingScene()
    const root = activePageRoot(scene)
    const plan = planExpandAwarePaletteDrop(scene, ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID, 'after', root)
    expect(plan).toEqual(
      expect.objectContaining({ ok: true, mode: 'page', parentId: root.id }),
    )
  })

  it('planExpandAwarePaletteDrop routes into expand container under hero', () => {
    const scene = createZaolyDefaultLandingScene()
    const root = activePageRoot(scene)
    const painted = expandSceneTree(root, scene.masters)
    const hero = painted.children?.find((c) => c.id === ZAOLY_DEFAULT_LANDING_HERO_STAGE_ID)
    expect(hero).toBeTruthy()
    const container = findFirst(
      hero!,
      (n) => n.id.includes('::') && isSceneContainerType(n.type),
    )
    expect(container).toBeTruthy()
    const plan = planExpandAwarePaletteDrop(scene, container!.id, 'into', root)
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.mode).toBe('master')
  })
})
