import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fluidGridTemplateFromColumns } from '@zaoly/site-kit'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'
import { ensureSiteKitLayoutPaint } from '../lib/site-kit/sync-tree'
import {
  createZaolyDefaultLandingScene,
  shouldReseedZaolyDefaultLanding,
  zaolyLandingSectionSourceKey,
} from '../lib/scene/zaoly-default-landing-scene'
import { findMasterBySourceKey } from '../lib/scene/ops'

describe('site-kit fluid layout (Wave C)', () => {
  it('palette SiteStack / SiteContainer seed wrap:true', () => {
    expect(defaultChildForType('SiteStack').props?.wrap).toBe(true)
    expect(defaultChildForType('SiteContainer').props?.wrap).toBe(true)
  })

  it('paints fluid grid templates from columns', () => {
    const paint = ensureSiteKitLayoutPaint('SiteGrid', { columns: '3' }, {})
    expect(paint.gridTemplateColumns).toBe(fluidGridTemplateFromColumns(3))
    expect(String(paint.gridTemplateColumns)).toContain('auto-fit')
  })

  it('landing nav ships wrap + mobile direction; soft-reseed detects missing', () => {
    const scene = createZaolyDefaultLandingScene()
    const nav = findMasterBySourceKey(
      scene.masters,
      zaolyLandingSectionSourceKey('LandingNav'),
    )
    expect(nav?.root.props?.wrap).toBe(true)
    expect(nav?.root.breakpoints?.mobile?.props?.direction).toBe('column')
    expect(shouldReseedZaolyDefaultLanding(scene)).toBe(false)

    const stale = structuredClone(scene)
    const staleNav = findMasterBySourceKey(
      stale.masters,
      zaolyLandingSectionSourceKey('LandingNav'),
    )!
    delete staleNav.root.props!.wrap
    delete staleNav.root.breakpoints
    expect(shouldReseedZaolyDefaultLanding(stale)).toBe(true)
  })

  it('documents the Wave C spec', () => {
    const root = path.resolve(__dirname, '../../..')
    const spec = readFileSync(
      path.join(root, 'specs/domain/site-kit-fluid-layout.md'),
      'utf8',
    )
    expect(spec).toContain('fluidGridTemplateFromColumns')
    expect(spec).toContain('wrap: true')
  })
})
