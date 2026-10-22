import { describe, expect, it } from 'vitest'
import type { SceneMaster } from '@zaoly/contracts'
import {
  masterForKitSave,
  serializeMasterComponentSetForKit,
  serializeMasterNamedVariantsForKit,
} from '../lib/site-kit/master-kit-export'

function masterWithTwoVariants(): SceneMaster {
  return {
    id: 'm1',
    name: 'Hero',
    defaultVariantId: 'v1',
    root: { id: 'r1', type: 'SiteStack', props: {}, children: [] },
    variants: [
      {
        id: 'v1',
        name: 'Default',
        root: {
          id: 'r1',
          type: 'SiteStack',
          props: {},
          children: [{ id: 't1', type: 'SiteText', props: { children: 'A' } }],
        },
      },
      {
        id: 'v2',
        name: 'Hover',
        root: {
          id: 'r2',
          type: 'SiteStack',
          props: {},
          children: [{ id: 't2', type: 'SiteText', props: { children: 'B' } }],
        },
      },
    ],
  }
}

describe('master kit named-variant export', () => {
  it('serializes ≥2 variants for Kit save', () => {
    const payload = serializeMasterNamedVariantsForKit(masterWithTwoVariants())
    expect(payload).toBeTruthy()
    expect(payload!.variants).toHaveLength(2)
    expect(payload!.defaultVariantId).toBe('v1')
    expect(payload!.variants[1]!.name).toBe('Hover')
    expect(payload!.variants[1]!.composition.type).toBe('SiteStack')
  })

  it('returns null for single-variant Master', () => {
    const master: SceneMaster = {
      id: 'm1',
      name: 'Solo',
      root: { id: 'r1', type: 'SiteButton', props: { children: 'Go' } },
    }
    expect(serializeMasterNamedVariantsForKit(master)).toBeNull()
  })

  it('includes axes + combination on Component Set export', () => {
    const master: SceneMaster = {
      ...masterWithTwoVariants(),
      axes: [{ id: 'axis-variant', name: 'Variant', values: ['Default', 'Hover'] }],
      variants: masterWithTwoVariants().variants!.map((v) => ({
        ...v,
        combination: { 'axis-variant': v.name },
      })),
    }
    const payload = serializeMasterNamedVariantsForKit(master)
    expect(payload?.axes).toHaveLength(1)
    expect(payload?.variants[0]?.combination).toEqual({ 'axis-variant': 'Default' })
    const set = serializeMasterComponentSetForKit(master)
    expect(set?.axes[0]?.id).toBe('axis-variant')
    expect(set?.variants).toHaveLength(2)
  })

  it('resolves Master from Instance or Master-Edit id', () => {
    const masters = [masterWithTwoVariants()]
    expect(
      masterForKitSave(masters, { id: 'i1', type: 'Instance', instanceOf: 'm1' }, null)?.id,
    ).toBe('m1')
    expect(masterForKitSave(masters, { id: 'n1', type: 'SiteStack' }, 'm1')?.id).toBe('m1')
    expect(masterForKitSave(masters, { id: 'n1', type: 'SiteStack' }, null)).toBeNull()
  })
})
