import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { expandCompositionScene } from '../lib/scene/expand-instances'
import {
  applyMasterEditOp,
  applyPaletteHydrateInsert,
  applySceneOp,
  defaultChildForType,
  findMasterBySourceKey,
  findSceneNode,
  seedSiteKitPaletteMasters,
} from '../lib/scene/ops'
import { SITE_KIT_PALETTE_IDS } from '../lib/scene/site-kit-palette'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

function emptyishScene(): CompositionScene {
  const scene = createLegacyFixtureScene()
  return {
    ...scene,
    masters: undefined,
    root: {
      id: 'root',
      type: 'Stack',
      props: { direction: 'column', gap: 'md' },
      children: [],
    },
  }
}

describe('palette hydrate masters', () => {
  it('seedSiteKitPaletteMasters fills Site Kit atoms without canvas Instances', () => {
    const scene = emptyishScene()
    const seeded = seedSiteKitPaletteMasters(scene)
    expect(seeded.masters).toHaveLength(SITE_KIT_PALETTE_IDS.length)
    for (const type of SITE_KIT_PALETTE_IDS) {
      expect(findMasterBySourceKey(seeded.masters, type)?.root.type).toBe(type)
    }
    expect(seeded.root.children ?? []).toHaveLength(0)
    expect(seeded.updatedAt).toBe(scene.updatedAt)
  })

  it('seedSiteKitPaletteMasters is deterministic across calls (SSR hydration)', () => {
    const a = seedSiteKitPaletteMasters(emptyishScene())
    const b = seedSiteKitPaletteMasters(emptyishScene())
    expect(a.masters?.map((m) => m.id)).toEqual(b.masters?.map((m) => m.id))
    expect(a.masters?.map((m) => m.root.id)).toEqual(b.masters?.map((m) => m.root.id))
    expect(a.masters?.[0]?.id).toBe('master-SiteButton')
    expect(a.masters?.[0]?.root.id).toBe('mroot-SiteButton-1')
  })

  it('seed does not overwrite existing master root (scene wins)', () => {
    const scene = emptyishScene()
    const first = applyPaletteHydrateInsert(scene, {
      sourceKey: 'SiteButton',
      root: { id: 'b1', type: 'SiteButton', props: { children: 'Edited' } },
      name: 'Button',
      parentId: 'root',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error(first.reason)
    const seeded = seedSiteKitPaletteMasters(first.scene)
    expect(findMasterBySourceKey(seeded.masters, 'SiteButton')?.root.props?.children).toBe('Edited')
    expect(seeded.masters).toHaveLength(SITE_KIT_PALETTE_IDS.length)
  })

  it('defaultChildForType SiteButton includes tokenBindings', () => {
    const node = defaultChildForType('SiteButton')
    expect(node.tokenBindings?.background).toBe('color.action.primary')
    expect(node.tokenBindings?.radius).toBe('radius.control.md')
  })

  it('seed soft-fills missing tokenBindings without overwriting existing keys', () => {
    const scene = emptyishScene()
    scene.masters = [
      {
        id: 'm-btn',
        name: 'Button',
        sourceKey: 'SiteButton',
        root: {
          id: 'b1',
          type: 'SiteButton',
          props: { children: 'Custom' },
          tokenBindings: { background: 'color.action.accent' },
        },
      },
    ]
    const seeded = seedSiteKitPaletteMasters(scene)
    const master = findMasterBySourceKey(seeded.masters, 'SiteButton')
    expect(master?.root.props?.children).toBe('Custom')
    expect(master?.root.tokenBindings?.background).toBe('color.action.accent')
    expect(master?.root.tokenBindings?.radius).toBe('radius.control.md')
    expect(master?.root.tokenBindings?.color).toBe('color.action.primaryForeground')
    expect(master?.root.states?.hover?.tokenBindings?.background).toBe('color.action.primaryHover')
  })

  it('seeded SiteButton masters start with tokenBindings', () => {
    const seeded = seedSiteKitPaletteMasters(emptyishScene())
    const master = findMasterBySourceKey(seeded.masters, 'SiteButton')
    expect(master?.root.tokenBindings?.background).toBe('color.action.primary')
  })

  it('two SiteButton inserts → one Master, two Instances; edit propagates', () => {
    const scene = emptyishScene()
    const root = defaultChildForType('SiteButton')
    const first = applyPaletteHydrateInsert(scene, {
      sourceKey: 'SiteButton',
      root,
      name: 'Button',
      parentId: 'root',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error(first.reason)

    const second = applyPaletteHydrateInsert(first.scene, {
      sourceKey: 'SiteButton',
      root: defaultChildForType('SiteButton'),
      name: 'Button',
      parentId: 'root',
    })
    expect(second.ok).toBe(true)
    if (!second.ok) throw new Error(second.reason)

    expect(second.scene.masters).toHaveLength(1)
    expect(second.scene.masters![0].sourceKey).toBe('SiteButton')
    const refs = (second.scene.root.children ?? []).filter((c) => c.type === 'Instance')
    expect(refs).toHaveLength(2)
    expect(refs[0].instanceOf).toBe(refs[1].instanceOf)

    const master = second.scene.masters![0]
    const edited = applyMasterEditOp(second.scene, master.id, {
      op: 'set_prop',
      nodeId: master.root.id,
      key: 'children',
      value: 'Synced label',
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) throw new Error(edited.reason)

    const expanded = expandCompositionScene(edited.scene)
    const instances = (expanded.children ?? []).filter((c) => c.instanceOf === master.id)
    expect(instances).toHaveLength(2)
    for (const inst of instances) {
      expect(inst.props?.children).toBe('Synced label')
    }
  })

  it('pattern sourceKey dedups and detach frees one instance', () => {
    const scene = emptyishScene()
    const patternRoot: SceneNode = {
      id: 'pat-root',
      type: 'SiteStack',
      name: 'HeroCard',
      children: [{ id: 'pat-text', type: 'SiteText', props: { children: 'Hello' } }],
    }
    const sourceKey = 'Composition:HeroCard'
    const a = applyPaletteHydrateInsert(scene, {
      sourceKey,
      root: patternRoot,
      name: 'HeroCard',
      parentId: 'root',
    })
    expect(a.ok).toBe(true)
    if (!a.ok) throw new Error(a.reason)
    const b = applyPaletteHydrateInsert(a.scene, {
      sourceKey,
      root: { ...patternRoot, id: 'other' },
      name: 'HeroCard',
      parentId: 'root',
    })
    expect(b.ok).toBe(true)
    if (!b.ok) throw new Error(b.reason)
    expect(b.scene.masters).toHaveLength(1)
    expect(findMasterBySourceKey(b.scene.masters, sourceKey)?.root.children?.[0]?.props?.children).toBe(
      'Hello',
    )

    const instanceId = b.scene.root.children![0].id
    const detached = applySceneOp(b.scene, { op: 'detach_instance', nodeId: instanceId })
    expect(detached.ok).toBe(true)
    if (!detached.ok) throw new Error(detached.reason)
    expect(findSceneNode(detached.scene, instanceId)).toBeNull()
    expect((detached.scene.root.children ?? []).some((c) => c.type === 'Instance')).toBe(true)
    expect((detached.scene.root.children ?? []).some((c) => c.type === 'SiteStack')).toBe(true)
  })

  it('ensure does not overwrite existing master root (scene wins)', () => {
    const scene = emptyishScene()
    const first = applyPaletteHydrateInsert(scene, {
      sourceKey: 'SiteText',
      root: { id: 't1', type: 'SiteText', props: { children: 'Original' } },
      name: 'Text',
      parentId: 'root',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error(first.reason)
    const masterId = first.scene.masters![0].id
    const mutated = applyMasterEditOp(first.scene, masterId, {
      op: 'set_prop',
      nodeId: first.scene.masters![0].root.id,
      key: 'children',
      value: 'Scene edit',
    })
    expect(mutated.ok).toBe(true)
    if (!mutated.ok) throw new Error(mutated.reason)

    const again = applySceneOp(mutated.scene, {
      op: 'ensure_palette_master',
      sourceKey: 'SiteText',
      root: { id: 't2', type: 'SiteText', props: { children: 'Kit seed' } },
      name: 'Text',
    })
    expect(again.ok).toBe(true)
    if (!again.ok) throw new Error(again.reason)
    expect(again.scene.masters).toHaveLength(1)
    expect(again.scene.masters![0].root.props?.children).toBe('Scene edit')
  })

  it('persist round-trip keeps sourceKey + instance refs', () => {
    const scene = emptyishScene()
    const inserted = applyPaletteHydrateInsert(scene, {
      sourceKey: 'SiteBadge',
      root: defaultChildForType('SiteBadge'),
      name: 'Badge',
      parentId: 'root',
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) throw new Error(inserted.reason)
    const round = JSON.parse(JSON.stringify(inserted.scene)) as CompositionScene
    expect(round.masters?.[0].sourceKey).toBe('SiteBadge')
    expect(round.root.children?.[0].type).toBe('Instance')
    expect(round.root.children?.[0].instanceOf).toBe(round.masters![0].id)
  })

  it('print hydrate wraps Instance in PrintPage (not master root)', () => {
    const scene = emptyishScene()
    const inserted = applyPaletteHydrateInsert(scene, {
      sourceKey: 'PrintChip',
      root: defaultChildForType('PrintChip'),
      name: 'Chip',
      parentId: 'root',
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) throw new Error(inserted.reason)
    expect(inserted.scene.masters![0].root.type).toBe('PrintChip')
    const page = inserted.scene.root.children?.[0]
    expect(page?.type).toBe('PrintPage')
    const instance = page?.children?.find((c) => c.type === 'Instance')
    expect(instance?.instanceOf).toBe(inserted.scene.masters![0].id)
    expect(inserted.selectId).toBe(instance?.id)
  })
})
