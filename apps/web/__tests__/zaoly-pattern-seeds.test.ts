import { describe, expect, it } from 'vitest'
import { demoMasterId } from '../lib/scene/demo-scene'
import {
  zaolyCardPatternBlock,
  zaolyCtaPatternBlock,
  zaolyNavPatternBlock,
  zaolySectionPatternBlock,
} from '../lib/scene/zaoly-pattern-seeds'

describe('zaoly canon pattern seeds', () => {
  it('nav seed mirrors ds-nav: brand + links + CTA', () => {
    const block = zaolyNavPatternBlock()
    expect(block.id).toBe('pattern-zaoly-nav')
    expect(block.type).toBe('SiteContainer')
    const brand = block.children?.find((c) => c.id === 'inst-zaoly-nav-brand')
    expect(brand?.instanceOf).toBe(demoMasterId('SiteText'))
    expect(brand?.instanceOverrides?.props?.children).toBe('Zaoly')
    expect(block.children?.some((c) => c.id === 'pattern-zaoly-nav-links')).toBe(true)
    expect(block.children?.some((c) => c.id === 'inst-zaoly-nav-start')).toBe(true)
  })

  it('cta seed mirrors ds-cta: message + action', () => {
    const block = zaolyCtaPatternBlock()
    expect(block.id).toBe('pattern-zaoly-cta')
    expect(block.style?.borderRadius).toBeUndefined()
    expect(block.children?.map((c) => c.id)).toEqual([
      'inst-zaoly-cta-message',
      'inst-zaoly-cta-action',
    ])
  })

  it('card + section seeds are sharp layout scaffolds', () => {
    const card = zaolyCardPatternBlock()
    const section = zaolySectionPatternBlock()
    expect(card.id).toBe('pattern-zaoly-card')
    expect(card.style?.borderColor).toBe('#c9bca1')
    expect(section.id).toBe('pattern-zaoly-section')
    expect(section.children?.[0]?.instanceOverrides?.props?.children).toBe('Studio')
  })
})
