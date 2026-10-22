import { describe, expect, it, afterEach } from 'vitest'
import { paths } from '../lib/paths'
import {
  siteKitCdnCssHref,
  siteKitCdnModuleHref,
  siteKitCdnUrl,
} from '../lib/runtime-config'

describe('siteKitCdnUrl (SK-V14)', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_KIT_CDN
  })

  it('defaults to canonical Storybook /cdn prefix', () => {
    expect(siteKitCdnUrl()).toBe(paths.siteKitCdnDefault.replace(/\/$/, ''))
    expect(siteKitCdnModuleHref()).toContain('/cdn/site-kit.js')
    expect(siteKitCdnCssHref()).toContain('/cdn/site-kit.css')
  })

  it('honors NEXT_PUBLIC_SITE_KIT_CDN without trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_KIT_CDN = 'https://cdn.example.test/cdn/'
    expect(siteKitCdnUrl()).toBe('https://cdn.example.test/cdn')
    expect(siteKitCdnModuleHref()).toBe('https://cdn.example.test/cdn/site-kit.js')
  })
})
