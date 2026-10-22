import { describe, expect, it } from 'vitest'
import type { SceneMaster } from '@zaoly/contracts'
import { validateKitComponentSetPayload } from '@zaoly/site-kit/master-variants'
import { serializeMasterNamedVariantsForKit } from '../lib/site-kit/master-kit-export'
import { generateAtomStorySource } from '../lib/site-kit/write'
import { findSiteKitEntry } from '../lib/site-kit/site-kit-catalog'

function buttonMasterWithAxes(): SceneMaster {
  const defaultRoot = {
    id: 'btn',
    type: 'SiteButton' as const,
    props: { children: 'Primary' },
  }
  const secondaryRoot = {
    id: 'btn',
    type: 'SiteButton' as const,
    props: { children: 'Secondary' },
  }
  return {
    id: 'm-btn',
    name: 'Button',
    sourceKey: 'SiteButton',
    root: defaultRoot,
    defaultVariantId: 'v-default',
    axes: [{ id: 'axis-variant', name: 'Variant', values: ['Default', 'Secondary'] }],
    variants: [
      {
        id: 'v-default',
        name: 'Default',
        root: defaultRoot,
        combination: { 'axis-variant': 'Default' },
      },
      {
        id: 'v-secondary',
        name: 'Secondary',
        root: secondaryRoot,
        combination: { 'axis-variant': 'Secondary' },
      },
    ],
  }
}

describe('site-kit write Component Set axes', () => {
  it('serialize → CSF includes axes controls and combinations', () => {
    const named = serializeMasterNamedVariantsForKit(buttonMasterWithAxes())
    expect(named?.axes?.[0]?.id).toBe('axis-variant')
    expect(named?.variants[1]?.combination).toEqual({ 'axis-variant': 'Secondary' })

    const entry = findSiteKitEntry('SiteButton')
    expect(entry).toBeTruthy()
    const src = generateAtomStorySource(entry!, {
      args: { children: 'Go' },
      variants: named!.variants.map((v) => ({
        id: v.id,
        name: v.name,
        composition: v.composition as unknown as Record<string, unknown>,
        combination: v.combination,
      })),
      axes: named!.axes,
    })
    expect(src).toContain('component-set')
    expect(src).toContain('"axis-variant"')
    expect(src).toContain('Secondary')
  })

  it('rejects reserved axis ids and incomplete combinations before write', () => {
    const named = serializeMasterNamedVariantsForKit(buttonMasterWithAxes())!
    const bad = validateKitComponentSetPayload(named.variants, [
      { id: 'componentId', name: 'Hack', values: ['Default', 'Secondary'] },
    ])
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.code).toBe('invalid-axes')

    const incomplete = validateKitComponentSetPayload(
      [
        { id: 'v1', name: 'Default', composition: { type: 'SiteButton' } },
        named.variants[1]!,
      ],
      named.axes,
    )
    expect(incomplete.ok).toBe(false)
    if (!incomplete.ok) expect(incomplete.code).toBe('invalid-variants')
  })
})
