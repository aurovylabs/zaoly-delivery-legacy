import { describe, expect, it } from 'vitest'
import {
  siteKitCompositionStoryHref,
  siteKitCompositionStorySlug,
  siteKitLiveCompositionHref,
  withSiteKitViewCredentials,
} from '../lib/site-kit/storybook-href'
import { paths } from '../lib/paths'

describe('siteKitLiveCompositionHref', () => {
  it('opens baked Live story with componentId arg', () => {
    expect(
      siteKitLiveCompositionHref('https://creation-site-kit.example', 'CompositionTest'),
    ).toBe(
      'https://creation-site-kit.example/?path=/story/compositions-live--default&args=componentId:CompositionTest',
    )
  })

  it('appends optional variantName', () => {
    expect(
      siteKitLiveCompositionHref(
        'https://creation-site-kit.example',
        'CompositionCardSet',
        'Hover',
      ),
    ).toBe(
      'https://creation-site-kit.example/?path=/story/compositions-live--default&args=componentId:CompositionCardSet;variantName:Hover',
    )
  })
})

describe('siteKitCompositionStoryHref', () => {
  it('slugifies PascalCase export names', () => {
    expect(siteKitCompositionStorySlug('MarketingHero')).toBe('marketing-hero')
    expect(siteKitCompositionStorySlug('Test')).toBe('test')
  })

  it('opens dedicated sidebar story after rebuild', () => {
    expect(
      siteKitCompositionStoryHref('https://creation-site-kit.example', 'MarketingHero'),
    ).toBe(
      'https://creation-site-kit.example/?path=/story/compositions-shared-marketing-hero--default',
    )
  })
})

describe('withSiteKitViewCredentials', () => {
  it('attaches zaolyViewToken and platformProjectId', () => {
    const href = withSiteKitViewCredentials(
      siteKitLiveCompositionHref('https://creation-site-kit.example', 'CompositionHero'),
      { viewToken: 'abc.sig', platformProjectId: 'plx-1' },
    )
    const u = new URL(href)
    expect(u.searchParams.get(paths.siteKitViewTokenQueryParam)).toBe('abc.sig')
    expect(u.searchParams.get('platformProjectId')).toBe('plx-1')
    expect(u.searchParams.get('path')).toContain('compositions-live')
  })
})
