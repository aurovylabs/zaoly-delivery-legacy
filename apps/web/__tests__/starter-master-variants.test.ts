import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { findMasterBySourceKey, seedSiteKitPaletteMasters } from '../lib/scene/ops'
import { listMasterVariants } from '../lib/scene/master-variants'
import {
  softFillStarterMasterVariants,
  starterMasterVariantSeeds,
} from '../lib/scene/starter-master-variants'
import { ZAOLY_STARTER_PACK_PATHS } from '../lib/tokens/zaoly-starter-pack'

function emptyishScene(): CompositionScene {
  return {
    id: 'scene',
    name: 'Test',
    updatedAt: '2026-10-05T00:00:00.000Z',
    root: { id: 'root', type: 'Frame', children: [] },
    masters: [],
  }
}

describe('starter named Master variants', () => {
  it('documents Secondary/Accent/Destructive for Button and status for Badge', () => {
    expect(starterMasterVariantSeeds('SiteButton').map((s) => s.name)).toEqual([
      'Secondary',
      'Accent',
      'Destructive',
    ])
    expect(starterMasterVariantSeeds('SiteBadge').map((s) => s.name)).toEqual([
      'Ok',
      'Warn',
      'Danger',
    ])
    expect(starterMasterVariantSeeds('SiteText')).toEqual([])
  })

  it('seedSiteKitPaletteMasters soft-seeds Button + Badge variants with starter paths', () => {
    const seeded = seedSiteKitPaletteMasters(emptyishScene())
    const button = findMasterBySourceKey(seeded.masters, 'SiteButton')
    const badge = findMasterBySourceKey(seeded.masters, 'SiteBadge')
    expect(button?.variants?.map((v) => v.name)).toEqual([
      'Default',
      'Secondary',
      'Accent',
      'Destructive',
    ])
    expect(button?.defaultVariantId).toBe('mvar-SiteButton-default')
    expect(button?.variants?.find((v) => v.name === 'Secondary')?.id).toBe(
      'mvar-SiteButton-secondary',
    )
    expect(
      button?.variants?.find((v) => v.name === 'Secondary')?.root.tokenBindings?.background,
    ).toBe('color.action.secondary')
    expect(
      button?.variants?.find((v) => v.name === 'Destructive')?.root.tokenBindings?.background,
    ).toBe('color.action.destructive')

    expect(badge?.variants?.map((v) => v.name)).toEqual(['Default', 'Ok', 'Warn', 'Danger'])
    expect(badge?.variants?.find((v) => v.name === 'Ok')?.root.tokenBindings?.background).toBe(
      'color.status.ok',
    )

    const starterPaths = new Set(ZAOLY_STARTER_PACK_PATHS)
    for (const variant of button?.variants ?? []) {
      for (const path of Object.values(variant.root.tokenBindings ?? {})) {
        expect(starterPaths.has(path)).toBe(true)
      }
    }
  })

  it('is deterministic across SSR double-seed', () => {
    const a = seedSiteKitPaletteMasters(emptyishScene())
    const b = seedSiteKitPaletteMasters(emptyishScene())
    const aBtn = findMasterBySourceKey(a.masters, 'SiteButton')
    const bBtn = findMasterBySourceKey(b.masters, 'SiteButton')
    expect(aBtn?.variants?.map((v) => v.id)).toEqual(bBtn?.variants?.map((v) => v.id))
    expect(aBtn?.variants?.[1]?.root.id).toBe(bBtn?.variants?.[1]?.root.id)
  })

  it('does not overwrite an existing Secondary name or Phase-3 axes Masters', () => {
    const scene = emptyishScene()
    scene.masters = [
      {
        id: 'm-btn',
        name: 'Button',
        sourceKey: 'SiteButton',
        root: {
          id: 'b1',
          type: 'SiteButton',
          tokenBindings: { background: 'color.action.primary' },
        },
        variants: [
          {
            id: 'custom-default',
            name: 'Default',
            root: {
              id: 'b1',
              type: 'SiteButton',
              tokenBindings: { background: 'color.action.primary' },
            },
          },
          {
            id: 'custom-secondary',
            name: 'Secondary',
            root: {
              id: 'b2',
              type: 'SiteButton',
              tokenBindings: { background: 'color.action.accent' },
            },
          },
        ],
        defaultVariantId: 'custom-default',
      },
    ]
    const seeded = seedSiteKitPaletteMasters(scene)
    const button = findMasterBySourceKey(seeded.masters, 'SiteButton')
    expect(button?.variants?.find((v) => v.name === 'Secondary')?.id).toBe('custom-secondary')
    expect(
      button?.variants?.find((v) => v.name === 'Secondary')?.root.tokenBindings?.background,
    ).toBe('color.action.accent')
    expect(button?.variants?.map((v) => v.name)).toEqual([
      'Default',
      'Secondary',
      'Accent',
      'Destructive',
    ])

    const withAxes = softFillStarterMasterVariants({
      id: 'm-axes',
      name: 'Button',
      sourceKey: 'SiteButton',
      root: { id: 'x', type: 'SiteButton' },
      axes: [{ id: 'axis-variant', name: 'Variant', values: ['A', 'B'] }],
      variants: [
        {
          id: 'a',
          name: 'A',
          root: { id: 'x', type: 'SiteButton' },
          combination: { 'axis-variant': 'A' },
        },
      ],
      defaultVariantId: 'a',
    })
    expect(listMasterVariants(withAxes)).toHaveLength(1)
  })
})
