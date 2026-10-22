import { describe, expect, it } from 'vitest'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import { INSTANCE_TYPE } from '../lib/scene/expand-instances'
import {
  editorialSplitPatternBlock,
  heroPatternBlock,
} from '../lib/scene/demo-scene'
import {
  isPaletteKitMaster,
  shouldShowSiteKitSaveComposition,
} from '../lib/site-kit/save-composition-visibility'

const paletteTextMaster: SceneMaster = {
  id: 'master-SiteText',
  name: 'Text',
  sourceKey: 'SiteText',
  root: { id: 't0', type: 'SiteText', props: { role: 'body', children: 'Text' } },
}

const compositionMaster: SceneMaster = {
  id: 'master-hero',
  name: 'Hero',
  sourceKey: 'Composition:Hero',
  root: heroPatternBlock(),
}

const customMaster: SceneMaster = {
  id: 'master-custom-hero',
  name: 'Hero block',
  root: heroPatternBlock(),
}

describe('save composition visibility', () => {
  it('isPaletteKitMaster recognizes palette sourceKeys only', () => {
    expect(isPaletteKitMaster(paletteTextMaster)).toBe(true)
    expect(isPaletteKitMaster(compositionMaster)).toBe(false)
    expect(isPaletteKitMaster(customMaster)).toBe(false)
  })

  it('hides Save for palette atom Instances (e.g. default SiteText selection)', () => {
    const persisted: SceneNode = {
      id: 'inst-hero-headline',
      type: INSTANCE_TYPE,
      instanceOf: paletteTextMaster.id,
    }
    const selected: SceneNode = {
      id: 'inst-hero-headline',
      type: 'SiteText',
      instanceOf: paletteTextMaster.id,
      props: { role: 'title', children: 'Headline' },
    }
    expect(
      shouldShowSiteKitSaveComposition({
        selected,
        persisted,
        multi: false,
        sceneMasters: [paletteTextMaster],
      }),
    ).toBe(false)
  })

  it('hides Save for free pattern layout on page tree (e.g. editorial SiteGrid)', () => {
    const block = heroPatternBlock()
    expect(
      shouldShowSiteKitSaveComposition({
        selected: block,
        persisted: block,
        multi: false,
        sceneMasters: [paletteTextMaster],
      }),
    ).toBe(false)
  })

  it('hides Save for editorial split SiteGrid without Create Master', () => {
    const grid = editorialSplitPatternBlock()
    expect(
      shouldShowSiteKitSaveComposition({
        selected: grid,
        persisted: grid,
        multi: false,
        sceneMasters: [paletteTextMaster],
      }),
    ).toBe(false)
  })

  it('hides Save for synced Composition masters in master edit', () => {
    expect(
      shouldShowSiteKitSaveComposition({
        selected: compositionMaster.root,
        persisted: compositionMaster.root,
        multi: false,
        sceneMasters: [compositionMaster],
        masterEditId: compositionMaster.id,
      }),
    ).toBe(false)
  })

  it('shows Save for custom master root in master edit', () => {
    expect(
      shouldShowSiteKitSaveComposition({
        selected: customMaster.root,
        persisted: customMaster.root,
        multi: false,
        sceneMasters: [customMaster],
        masterEditId: customMaster.id,
      }),
    ).toBe(true)
  })

  it('hides Save for custom master child in master edit', () => {
    const child = customMaster.root.children?.[0]
    expect(child).toBeTruthy()
    expect(
      shouldShowSiteKitSaveComposition({
        selected: child!,
        persisted: child!,
        multi: false,
        sceneMasters: [customMaster],
        masterEditId: customMaster.id,
      }),
    ).toBe(false)
  })

  it('shows Save for Instance of unsynced custom master at Instance root', () => {
    const persisted: SceneNode = {
      id: 'inst-custom-hero',
      type: INSTANCE_TYPE,
      instanceOf: customMaster.id,
    }
    expect(
      shouldShowSiteKitSaveComposition({
        selected: customMaster.root,
        persisted,
        multi: false,
        sceneMasters: [customMaster],
      }),
    ).toBe(true)
  })
})
