import { describe, expect, it } from 'vitest'
import {
  contactPageRoot,
  createDemoScene,
  createEmptyArtboardScene,
  DEMO_PAGE_CONTACT_ID,
  DEMO_PAGE_HOME_ID,
  demoMasterId,
  editorialSplitPatternBlock,
  featuresPatternBlock,
  footerPatternBlock,
  formPatternBlock,
  heroPatternBlock,
  homePageRoot,
} from '../lib/scene/demo-scene'
import { expandCompositionScene, resolveInspectSubject } from '../lib/scene/expand-instances'
import { applySceneOp } from '../lib/scene/ops'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'
import { SITE_KIT_PALETTE_IDS } from '../lib/scene/site-kit-palette'

describe('demo pattern scene', () => {
  it('createEmptyArtboardScene has no masters and empty root with Untitled page', () => {
    const scene = createEmptyArtboardScene()
    expect(scene.root.type).toBe('SiteStack')
    expect(scene.root.children ?? []).toHaveLength(0)
    expect(scene.masters ?? []).toHaveLength(0)
    expect(scene.pages).toHaveLength(1)
    expect(scene.pages?.[0]?.name).toBe('Page 1')
    expect(scene.pages?.[0]?.id).toBe(DEFAULT_SCENE_PAGE_ID)
    expect(scene.activePageId).toBe(DEFAULT_SCENE_PAGE_ID)
  })

  it('heroPatternBlock is a layout scaffold with editable atom Instances on the page tree', () => {
    const block = heroPatternBlock()
    expect(block.id).toBe('pattern-hero')
    expect(block.type).toBe('SiteStack')
    expect(block.style?.width).toBe('100vw')
    expect(block.style?.height).toBe('60vh')

    const headline = block.children
      ?.find((c) => c.id === 'pattern-hero-align')
      ?.children?.find((c) => c.id === 'pattern-hero-teaser')
      ?.children?.find((c) => c.id === 'inst-hero-headline')
    expect(headline?.type).toBe('Instance')
    expect(headline?.instanceOf).toBe(demoMasterId('SiteText'))
    expect(headline?.instanceOverrides?.props?.children).toBe('Compose faster with Zaoly')
  })

  it('hero SiteText Instance is inspectable and writable via set_prop', () => {
    const scene = createDemoScene()
    const subject = resolveInspectSubject(scene, 'inst-hero-headline')
    expect(subject?.props?.children).toBe('Compose faster with Zaoly')

    const result = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'inst-hero-headline',
      key: 'children',
      value: 'Updated hero headline',
    })
    expect(result.ok).toBe(true)
    const updated = resolveInspectSubject(result.scene!, 'inst-hero-headline')
    expect(updated?.props?.children).toBe('Updated hero headline')
  })

  it('editorialSplitPatternBlock is a two-column layout scaffold', () => {
    const block = editorialSplitPatternBlock()
    expect(block.id).toBe('pattern-editorial-split')
    expect(block.type).toBe('SiteGrid')
    expect(block.props.columns).toBe('2')
  })

  it('featuresPatternBlock is a three-column Grid scaffold', () => {
    const grid = featuresPatternBlock().children?.find((c) => c.id === 'pattern-features-grid')
    expect(grid?.type).toBe('SiteGrid')
    expect(grid?.props.columns).toBe('3')
    expect(grid?.children).toHaveLength(3)
  })

  it('formPatternBlock includes form atom Instances on the page tree', () => {
    const walkInstances = (node: ReturnType<typeof formPatternBlock>): string[] => {
      const ids = node.type === 'Instance' && node.instanceOf ? [node.instanceOf] : []
      for (const child of node.children ?? []) ids.push(...walkInstances(child))
      return ids
    }
    const masterIds = walkInstances(formPatternBlock())
    expect(masterIds).toContain(demoMasterId('SiteInput'))
    expect(masterIds).toContain(demoMasterId('SiteCheckbox'))
  })

  it('createDemoScene ships palette masters and Home + Contact pages (P80)', () => {
    const scene = createDemoScene()
    expect(scene.name).toBe('Pattern demo')
    expect(scene.masters).toHaveLength(SITE_KIT_PALETTE_IDS.length)
    expect(scene.pages).toHaveLength(2)
    expect(scene.pages?.map((p) => p.id)).toEqual([DEMO_PAGE_HOME_ID, DEMO_PAGE_CONTACT_ID])
    expect(scene.activePageId).toBe(DEMO_PAGE_HOME_ID)
    expect(scene.root).toEqual(homePageRoot())

    for (const type of SITE_KIT_PALETTE_IDS) {
      const master = scene.masters?.find((m) => m.sourceKey === type)
      expect(master, `master for ${type}`).toBeTruthy()
      expect(master!.id).toBe(demoMasterId(type))
    }

    const homeIds = (scene.pages?.[0]?.root.children ?? []).map((c) => c.id)
    expect(homeIds).toContain('pattern-zaoly-nav')
    expect(homeIds).toContain('pattern-hero')
    expect(homeIds).toContain('pattern-zaoly-section')
    expect(homeIds).toContain('pattern-editorial-split')
    expect(homeIds).toContain('pattern-features')
    expect(homeIds).toContain('pattern-zaoly-card-row')
    expect(homeIds).toContain('pattern-footer')
    expect(homeIds).not.toContain('pattern-form')

    const contactIds = (scene.pages?.[1]?.root.children ?? []).map((c) => c.id)
    expect(contactIds).toEqual(['pattern-form'])
    expect(contactPageRoot().children?.[0]?.id).toBe('pattern-form')

    const expanded = expandCompositionScene(scene)
    const hero = expanded.children?.find((c) => c.id === 'pattern-hero')
    expect(hero?.style?.width).toBe('100vw')
    expect(hero?.style?.height).toBe('60vh')
  })
})
