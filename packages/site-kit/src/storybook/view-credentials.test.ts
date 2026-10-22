import { describe, expect, it } from 'vitest'
import {
  SITE_KIT_PLATFORM_PROJECT_QUERY,
  SITE_KIT_VIEW_TOKEN_QUERY,
  hasSiteKitViewCredentials,
  readSiteKitPlatformProjectIdFromLocation,
  siteKitCompositionsListUrl,
} from './view-credentials'

describe('site-kit view credentials SK-S3', () => {
  it('hasSiteKitViewCredentials requires token', () => {
    expect(hasSiteKitViewCredentials('')).toBe(false)
    expect(hasSiteKitViewCredentials(`?${SITE_KIT_VIEW_TOKEN_QUERY}=abc`)).toBe(true)
  })

  it('reads platformProjectId from search', () => {
    expect(
      readSiteKitPlatformProjectIdFromLocation(
        `?${SITE_KIT_PLATFORM_PROJECT_QUERY}=plx-1&x=1`,
      ),
    ).toBe('plx-1')
  })

  it('compositions list URL includes Collection when known', () => {
    const url = siteKitCompositionsListUrl(
      'https://creation.example',
      `?${SITE_KIT_VIEW_TOKEN_QUERY}=tok&${SITE_KIT_PLATFORM_PROJECT_QUERY}=plx-9`,
    )
    const u = new URL(url)
    expect(u.searchParams.get(SITE_KIT_PLATFORM_PROJECT_QUERY)).toBe('plx-9')
    expect(u.searchParams.get(SITE_KIT_VIEW_TOKEN_QUERY)).toBe('tok')
    expect(u.pathname).toContain('/api/site-kit/compositions')
  })
})
