import { describe, expect, it } from 'vitest'
import {
  asPackLeafInput,
  digitalCssForLeaf,
  printCssForLeaf,
  sizeLadderCss,
  tokenChannelForNode,
} from '../lib/inspect/digital-css'
import { previewForBinding, tokenByPath } from '../lib/inspect/token-catalog'
import { resolveTokenBindingsToStyle } from '../lib/inspect/resolve-bindings'
import { nearestSizeTokenPath } from '../lib/scene/resize'

const PENDING_SPACING = {
  path: 'spacing.fluid.medium',
  type: 'spacing',
  status: 'pending',
  value: { digital: 'clamp(1rem, 2vw, 1.5rem)', print: '6mm' },
}

describe('P40 Brandion digital CSS (CT-5, CT-13)', () => {
  it('resolves color hex from digital and ignores print', () => {
    expect(
      digitalCssForLeaf({
        type: 'color',
        value: JSON.stringify({
          digital: { hex: '#f256b6' },
          print: { pantone: 'PMS 226 C' },
        }),
      }),
    ).toBe('#f256b6')
  })

  it('prefers digital css (rgba / oklch) over companion hex', () => {
    expect(
      digitalCssForLeaf({
        type: 'color',
        value: {
          digital: { css: 'rgba(31, 68, 255, 0.5)', hex: '#1f44ff' },
        },
      }),
    ).toBe('rgba(31, 68, 255, 0.5)')
    expect(
      digitalCssForLeaf({
        type: 'color',
        value: { digital: { css: 'oklch(0.51 0.27 266)', hex: '#1f44ff' } },
      }),
    ).toBe('oklch(0.51 0.27 266)')
  })

  it('resolves spacing rem from digital, not print mm', () => {
    expect(
      digitalCssForLeaf({
        type: 'spacing',
        value: { digital: '1rem', print: '4mm' },
      }),
    ).toBe('1rem')
  })

  it('resolves typography facets from one leaf', () => {
    const leaf = {
      type: 'typography',
      value: {
        family: 'Geist',
        weight: '600',
        digital: { size: '2rem', lineHeight: '1.2', letterSpacing: '-0.02em' },
        print: { size: '28pt' },
      },
    }
    expect(digitalCssForLeaf(leaf, 'family')).toBe('Geist')
    expect(digitalCssForLeaf(leaf, 'size')).toBe('2rem')
    expect(digitalCssForLeaf(leaf, 'weight')).toBe('600')
    expect(digitalCssForLeaf(leaf, 'letterSpacing')).toBe('-0.02em')
    expect(digitalCssForLeaf(leaf, 'size')).not.toBe('28pt')
  })

  it('skips missing typography facets instead of guessing', () => {
    expect(
      digitalCssForLeaf(
        {
          type: 'typography',
          value: { family: 'Geist', weight: '400', digital: { size: '1rem' } },
        },
        'letterSpacing',
      ),
    ).toBeUndefined()
  })

  it('skips pending leaves (CT-13)', () => {
    expect(digitalCssForLeaf(PENDING_SPACING)).toBeUndefined()
    expect(tokenByPath('spacing.fluid.medium')).toBeUndefined()
  })

  it('composes shadow CSS from digital metrics', () => {
    expect(
      digitalCssForLeaf({
        type: 'shadow',
        value: {
          digital: {
            offsetX: '0',
            offsetY: '4px',
            blur: '12px',
            spread: '0',
            color: 'rgba(0, 0, 0, 0.15)',
          },
        },
      }),
    ).toBe('0 4px 12px 0 rgba(0, 0, 0, 0.15)')
  })

  it('composes glow halo and effect filter CSS', () => {
    expect(
      digitalCssForLeaf({
        type: 'glow',
        value: { digital: { color: 'rgba(31, 68, 255, 0.85)', blur: '24px', spread: '2px' } },
      }),
    ).toBe('0 0 24px 2px rgba(31, 68, 255, 0.85)')
    expect(
      digitalCssForLeaf({
        type: 'glow',
        value: {
          digital: {
            offsetX: '8px',
            offsetY: '-4px',
            color: 'rgba(31, 68, 255, 0.85)',
            blur: '24px',
            spread: '2px',
          },
        },
      }),
    ).toBe('8px -4px 24px 2px rgba(31, 68, 255, 0.85)')
    expect(
      digitalCssForLeaf({
        type: 'effect',
        value: { digital: { kind: 'blur', amount: '8px' } },
      }),
    ).toBe('blur(8px)')
    expect(
      digitalCssForLeaf({
        type: 'motion',
        value: { digital: { duration: '240ms', easing: 'ease-out' } },
      }),
    ).toBe('240ms ease-out')
  })

  it('emits clamp for size when min/preferred/max are set; ladder uses preferred', () => {
    const leaf = {
      type: 'size',
      value: { digital: { min: '44px', preferred: '48px', max: '64px' } },
    }
    expect(digitalCssForLeaf(leaf)).toBe('clamp(44px, 48px, 64px)')
    expect(sizeLadderCss(leaf)).toBe('48px')
  })

  it('catalog canvas resolve uses digital JSON (print ignored)', () => {
    const style = resolveTokenBindingsToStyle({
      color: 'color.action.primary',
      padding: 'spacing.static.medium',
      fontSize: 'typography.heading.h1',
      width: 'size.touch.target',
    })
    expect(style.color).toBe('#1f44ff')
    expect(style.padding).toBe('1rem')
    expect(style.fontSize).toBe('2rem')
    expect(style.width).toBe('clamp(44px, 48px, 64px)')
  })

  it('resize ladder still snaps on preferred px, not clamp', () => {
    expect(nearestSizeTokenPath(48)).toBe('size.touch.target')
    const tok = tokenByPath('size.touch.target')
    expect(tok).toBeDefined()
    expect(previewForBinding(tok!, 'width')).toBe('clamp(44px, 48px, 64px)')
  })
})

describe('P42 Brandion print CSS (CT-6, CT-13)', () => {
  const colorLeaf = {
    type: 'color',
    value: {
      digital: { hex: '#f256b6' },
      print: { pantone: 'PMS 226 C', cmyk: '0 80 0 0' },
    },
  }
  const spacingLeaf = {
    type: 'spacing',
    value: { digital: '1rem', print: '4mm' },
  }
  const typeLeaf = {
    type: 'typography',
    value: {
      family: 'Geist',
      weight: '600',
      digital: { size: '2rem', lineHeight: '1.2', letterSpacing: '-0.02em' },
      print: { size: '28pt', lineHeight: '32pt', letterSpacing: '0' },
    },
  }

  it('uses print mm/pt for spacing and type; never paints Pantone as CSS', () => {
    expect(printCssForLeaf(spacingLeaf)).toBe('4mm')
    expect(printCssForLeaf(typeLeaf, 'size')).toBe('28pt')
    expect(printCssForLeaf(typeLeaf, 'lineHeight')).toBe('32pt')
    expect(printCssForLeaf(typeLeaf, 'family')).toBe('Geist')
    expect(printCssForLeaf(colorLeaf)).toBe('#f256b6')
    expect(printCssForLeaf(colorLeaf)).not.toBe('PMS 226 C')
  })

  it('skips missing print facets and does not guess digital rem', () => {
    expect(
      printCssForLeaf({
        type: 'spacing',
        value: { digital: '1rem' },
      }),
    ).toBeUndefined()
    expect(
      printCssForLeaf(
        {
          type: 'typography',
          value: { family: 'Geist', weight: '400', digital: { size: '1rem' } },
        },
        'size',
      ),
    ).toBeUndefined()
  })

  it('skips pending leaves (CT-13)', () => {
    expect(printCssForLeaf(PENDING_SPACING)).toBeUndefined()
  })

  it('skips print shadow when color is an ink note, not CSS', () => {
    expect(
      printCssForLeaf({
        type: 'shadow',
        value: {
          digital: { offsetY: '4px', blur: '12px', color: 'rgba(0, 0, 0, 0.15)' },
          print: { offsetY: '1mm', blur: '2mm', color: 'K 20' },
        },
      }),
    ).toBeUndefined()
  })

  it('PrintPage surface uses print channel; screen nodes stay digital', () => {
    expect(tokenChannelForNode(false, 'Text')).toBe('digital')
    expect(tokenChannelForNode(true, 'Text')).toBe('print')
    expect(tokenChannelForNode(false, 'PrintPage')).toBe('print')
    expect(tokenChannelForNode(false, 'PrintChapter')).toBe('print')

    const printStyle = resolveTokenBindingsToStyle(
      {
        color: 'color.action.primary',
        padding: 'spacing.static.medium',
        fontSize: 'typography.heading.h1',
      },
      undefined,
      undefined,
      'print',
    )
    expect(printStyle.color).toBe('#1f44ff')
    expect(printStyle.padding).toBe('4mm')
    expect(printStyle.fontSize).toBe('28pt')

    const screenStyle = resolveTokenBindingsToStyle({
      color: 'color.action.primary',
      padding: 'spacing.static.medium',
      fontSize: 'typography.heading.h1',
    })
    expect(screenStyle.color).toBe('#1f44ff')
    expect(screenStyle.padding).toBe('1rem')
    expect(screenStyle.fontSize).toBe('2rem')
  })
})

describe('asPackLeafInput', () => {
  it('only builds a leaf when type is a string and value is present', () => {
    expect(asPackLeafInput({ path: 'size.md' })).toBeNull()
    expect(asPackLeafInput({ path: 'size.md', type: 'size' })).toBeNull()
    expect(asPackLeafInput({ path: 'size.md', type: 'size', value: { digital: '1rem' } })).toEqual(
      { path: 'size.md', type: 'size', value: { digital: '1rem' }, status: undefined },
    )
  })
})
