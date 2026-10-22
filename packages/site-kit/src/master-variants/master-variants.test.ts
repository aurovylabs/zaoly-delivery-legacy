import { describe, expect, it } from 'vitest'
import {
  generateAtomNamedVariantCsf,
  parseKitAxesWire,
  parseKitVariantsWire,
  resolveMasterOverrideVariant,
  sanitizeKitOverrideComponentSet,
  validateKitComponentSetPayload,
} from './index'

describe('kit master-variants resolve + CSF', () => {
  const axes = [
    { id: 'axis-variant', name: 'Variant', values: ['Default', 'Secondary'] },
  ]
  const variants = [
    {
      id: 'v1',
      name: 'Default',
      combination: { 'axis-variant': 'Default' },
      composition: { type: 'SiteButton' },
    },
    {
      id: 'v2',
      name: 'Secondary',
      combination: { 'axis-variant': 'Secondary' },
      composition: { type: 'SiteButton' },
    },
  ]

  it('resolves cell from axis picks', () => {
    const hit = resolveMasterOverrideVariant({
      variants,
      axes,
      defaultVariantId: 'v1',
      args: { 'axis-variant': 'Secondary' },
    })
    expect(hit?.id).toBe('v2')
  })

  it('falls back to flat variant name when axes missing', () => {
    const hit = resolveMasterOverrideVariant({
      variants,
      defaultVariantId: 'v1',
      args: { variant: 'Secondary' },
    })
    expect(hit?.id).toBe('v2')
  })

  it('parses wire axes + combination', () => {
    expect(
      parseKitAxesWire([{ id: 'a', name: 'Size', values: ['sm', 'lg'] }]),
    ).toEqual([{ id: 'a', name: 'Size', values: ['sm', 'lg'] }])
    const cells = parseKitVariantsWire([
      {
        id: 'v1',
        name: 'Default',
        combination: { a: 'sm' },
        composition: { type: 'SiteStack' },
      },
      {
        id: 'v2',
        name: 'Large',
        combination: { a: 'lg' },
        composition: { type: 'SiteStack' },
      },
    ])
    expect(cells?.[1]?.combination).toEqual({ a: 'lg' })
  })

  it('emits CSF axis controls for Component Sets', () => {
    const src = generateAtomNamedVariantCsf({
      exportName: 'Button',
      title: 'Site/Button',
      variants,
      axes,
    })
    expect(src).toContain("'component-set'")
    expect(src).toContain('"axis-variant"')
    expect(src).toContain('Master Component Set axis')
    expect(src).toContain('Secondary')
    expect(src).not.toMatch(/variant:\s*\{\s*name:\s*'variant'/)
  })

  it('emits flat variant select without axes', () => {
    const src = generateAtomNamedVariantCsf({
      exportName: 'Button',
      title: 'Site/Button',
      variants: variants.map(({ id, name, composition }) => ({ id, name, composition })),
    })
    expect(src).toContain("name: 'variant'")
    expect(src).not.toContain('component-set')
  })

  it('rejects reserved / malformed axes and incomplete combinations', () => {
    expect(
      validateKitComponentSetPayload(variants, [
        { id: 'variant', name: 'Bad', values: ['Default', 'Secondary'] },
      ]).ok,
    ).toBe(false)
    expect(
      validateKitComponentSetPayload(
        [{ id: 'v1', name: 'Default', composition: { type: 'SiteButton' } }, variants[1]!],
        axes,
      ).ok,
    ).toBe(false)
    expect(validateKitComponentSetPayload(variants, axes).ok).toBe(true)
  })

  it('escapes CSF title and drops orphan combinations without axes', () => {
    const evilTitle = 'Site/Button' + String.fromCharCode(34) + '; evil'
    const src = generateAtomNamedVariantCsf({
      exportName: 'Button',
      title: evilTitle,
      variants: variants.map(({ id, name, composition }) => ({ id, name, composition })),
    })
    expect(src).toContain(`title: ${JSON.stringify(evilTitle)}`)
    const stripped = validateKitComponentSetPayload(variants, undefined)
    expect(stripped.ok).toBe(true)
    if (stripped.ok) {
      expect(stripped.variants[0]?.combination).toBeUndefined()
      expect(stripped.axes).toBeUndefined()
    }
  })

  it('soft-sanitizes poisoned override Component Sets on read', () => {
    const poisoned = sanitizeKitOverrideComponentSet({
      axes: [{ id: 'variant', name: 'Bad', values: ['A', 'B'] }],
      variants: [
        {
          id: 'v1',
          name: 'Default',
          combination: { variant: 'A' },
          composition: { type: 'SiteButton' },
        },
        {
          id: 'v2',
          name: 'Alt',
          combination: { variant: 'B' },
          composition: { type: 'SiteButton' },
        },
      ],
      defaultVariantId: 'v2',
    })
    expect(poisoned.axes).toBeUndefined()
    expect(poisoned.variants).toHaveLength(2)
    expect(poisoned.variants?.[0]?.combination).toBeUndefined()
    expect(poisoned.defaultVariantId).toBe('v2')

    const incomplete = sanitizeKitOverrideComponentSet({
      axes,
      variants: [
        { id: 'v1', name: 'Default', composition: { type: 'SiteButton' } },
        variants[1]!,
      ],
      defaultVariantId: 'v1',
    })
    expect(incomplete.axes).toBeUndefined()
    expect(incomplete.variants).toHaveLength(2)
  })
})
