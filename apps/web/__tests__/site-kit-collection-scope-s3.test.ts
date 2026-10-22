/**
 * SK-S3 Storybook tenancy helpers.
 * Spec: specs/domain/site-kit-collection-scope.md
 */
import { describe, expect, it } from 'vitest'
import {
  siteKitCatalogHref,
  withSiteKitViewCredentials,
} from '../lib/site-kit/storybook-href'
import { paths } from '../lib/paths'

describe('siteKitCatalogHref SK-S3', () => {
  it('opens compositions-catalog story', () => {
    expect(siteKitCatalogHref('https://creation-site-kit.example')).toBe(
      'https://creation-site-kit.example/?path=/story/compositions-catalog--default',
    )
  })

  it('attaches view credentials for Collection-scoped Catalog', () => {
    const href = withSiteKitViewCredentials(
      siteKitCatalogHref('https://creation-site-kit.example'),
      { viewToken: 'tok.sig', platformProjectId: 'plx-a' },
    )
    const u = new URL(href)
    expect(u.searchParams.get(paths.siteKitViewTokenQueryParam)).toBe('tok.sig')
    expect(u.searchParams.get('platformProjectId')).toBe('plx-a')
    expect(u.searchParams.get('path')).toContain('compositions-catalog')
  })
})
