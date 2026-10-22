import { describe, expect, it } from 'vitest'
import { resolveNodePaintStyle } from '../lib/inspect/resolve-bindings'
import { partitionInspectPositionFields } from '../lib/inspect/position-groups'
import { partitionInspectAppearanceEffectFields } from '../lib/inspect/appearance-effects'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'

describe('Modern CSS Filters & Blend Modes (P94)', () => {
  it('resolves mixBlendMode to standard CSS mixBlendMode', () => {
    const style = resolveNodePaintStyle({ mixBlendMode: 'multiply' })
    expect(style.mixBlendMode).toBe('multiply')
  })

  it('omits mixBlendMode when set to normal or empty', () => {
    const style = resolveNodePaintStyle({ mixBlendMode: 'normal' })
    expect(style.mixBlendMode).toBeUndefined()
  })

  it('composes atomic filter properties into standard CSS filter rule', () => {
    const style = resolveNodePaintStyle({
      blur: '8px',
      filterBrightness: '120%',
      filterContrast: '110%',
      filterSaturate: '150%',
      filterGrayscale: '50%',
      filterInvert: '20%',
      filterHueRotate: '45deg',
    })
    expect(style.filter).toBe(
      'blur(8px) brightness(120%) contrast(110%) saturate(150%) grayscale(50%) invert(20%) hue-rotate(45deg)',
    )
  })

  it('omits identity filters to preserve hardware-accelerated rendering', () => {
    const style = resolveNodePaintStyle({
      filterBrightness: '100%',
      filterGrayscale: '0%',
      filterInvert: '0%',
    })
    expect(style.filter).toBeUndefined()
  })

  it('partitions filter and blend mode fields in appearance section', () => {
    const fields = [
      { name: 'mixBlendMode', label: 'Blend', kind: 'enum', section: 'appearance', appliesTo: ['*'] },
      { name: 'filterBrightness', label: 'Brightness', kind: 'string', section: 'appearance', appliesTo: ['*'] },
      { name: 'radius', label: 'Radius', kind: 'token', section: 'appearance', appliesTo: ['*'] },
    ] as InspectFieldDef[]

    const partitioned = partitionInspectAppearanceEffectFields(fields)
    expect(partitioned.effects.map((f) => f.name)).toEqual(['mixBlendMode', 'filterBrightness'])
    expect(partitioned.rest.map((f) => f.name)).toEqual(['radius'])
  })
})

describe('Advanced Modern Transforms (P95)', () => {
  it('resolves scale as an independent standard CSS property', () => {
    const style = resolveNodePaintStyle({ scale: '1.05' })
    expect(style.scale).toBe('1.05')
  })

  it('resolves 2D scaleX and scaleY into scale property', () => {
    const style = resolveNodePaintStyle({ scaleX: '1.05', scaleY: '0.95' })
    expect(style.scale).toBe('1.05 0.95')
  })

  it('resolves transformOrigin standard CSS property', () => {
    const style = resolveNodePaintStyle({ transformOrigin: 'top left' })
    expect(style.transformOrigin).toBe('top left')
  })

  it('resolves skew into transform: skew(...)', () => {
    const style = resolveNodePaintStyle({ skewX: '10deg', skewY: '-5deg' })
    expect(style.transform).toBe('skew(10deg, -5deg)')
  })

  it('partitions scale, transformOrigin, and skew in constraints section', () => {
    const fields = [
      { name: 'position', label: 'Position', kind: 'enum', section: 'constraints', appliesTo: ['*'] },
      { name: 'scale', label: 'Scale', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'transformOrigin', label: 'Origin', kind: 'enum', section: 'constraints', appliesTo: ['*'] },
      { name: 'skewX', label: 'Skew X', kind: 'string', section: 'constraints', appliesTo: ['*'] },
      { name: 'width', label: 'Width', kind: 'string', section: 'constraints', appliesTo: ['*'] },
    ] as InspectFieldDef[]

    const partitioned = partitionInspectPositionFields(fields)
    expect(partitioned.scaleField?.name).toBe('scale')
    expect(partitioned.transformOriginField?.name).toBe('transformOrigin')
    expect(partitioned.skewFields.map((f) => f.name)).toEqual(['skewX'])
    expect(partitioned.rest.map((f) => f.name)).toEqual(['width'])
  })
})
