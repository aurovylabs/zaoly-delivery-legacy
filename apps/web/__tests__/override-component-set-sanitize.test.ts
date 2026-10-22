import { describe, expect, it } from 'vitest'
import { sanitizeOverrideComponentSetFields } from '../lib/site-kit/override-store'

describe('sanitizeOverrideComponentSetFields', () => {
  it('strips reserved axes and keeps flat variants for Storybook read', () => {
    const body = sanitizeOverrideComponentSetFields({
      componentId: 'SiteButton',
      composition: { type: 'SiteButton' },
      axes: [{ id: 'variant', name: 'Variant', values: ['Default', 'Alt'] }],
      variants: [
        {
          id: 'v1',
          name: 'Default',
          combination: { variant: 'Default' },
          composition: { type: 'SiteButton', props: { children: 'A' } },
        },
        {
          id: 'v2',
          name: 'Alt',
          combination: { variant: 'Alt' },
          composition: { type: 'SiteButton', props: { children: 'B' } },
        },
      ],
      defaultVariantId: 'v2',
    })
    expect(body.axes).toBeUndefined()
    expect(body.variants).toHaveLength(2)
    expect(body.variants?.[0]?.combination).toBeUndefined()
    expect(body.defaultVariantId).toBe('v2')
  })

  it('keeps valid Component Set axes + combinations', () => {
    const body = sanitizeOverrideComponentSetFields({
      componentId: 'SiteButton',
      axes: [{ id: 'axis-variant', name: 'Variant', values: ['Default', 'Alt'] }],
      variants: [
        {
          id: 'v1',
          name: 'Default',
          combination: { 'axis-variant': 'Default' },
          composition: { type: 'SiteButton' },
        },
        {
          id: 'v2',
          name: 'Alt',
          combination: { 'axis-variant': 'Alt' },
          composition: { type: 'SiteButton' },
        },
      ],
      defaultVariantId: 'v1',
    })
    expect(body.axes?.[0]?.id).toBe('axis-variant')
    expect(body.variants?.[1]?.combination).toEqual({ 'axis-variant': 'Alt' })
  })
})
