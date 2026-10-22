import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { SceneNode } from '@zaoly/contracts'
import {
  applySiteKitResponsiveDefaults,
  siteKitNodeNeedsResponsiveDefaults,
} from '../lib/scene/site-kit-responsive'
import { createZaolyDefaultLandingScene, zaolyLandingSectionSourceKey } from '../lib/scene/zaoly-default-landing-scene'
import { findMasterBySourceKey } from '../lib/scene/ops'
import { zaolyNavPatternBlock, zaolyCtaPatternBlock } from '../lib/scene/zaoly-pattern-seeds'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'

describe('site-kit responsive defaults', () => {
  it('adds wrap + mobile column to row shells without clobbering designer gap', () => {
    const row: SceneNode = {
      id: 'row',
      type: 'SiteStack',
      props: { direction: 'row', gap: 'lg' },
      children: [],
    }
    const next = applySiteKitResponsiveDefaults(row)
    expect(next.props?.wrap).toBe(true)
    expect(next.breakpoints?.mobile?.props?.direction).toBe('column')
    expect(next.breakpoints?.mobile?.props?.gap).toBe('sm')

    const custom: SceneNode = {
      ...row,
      breakpoints: { mobile: { props: { gap: 'xl' } } },
    }
    const merged = applySiteKitResponsiveDefaults(custom)
    expect(merged.breakpoints?.mobile?.props?.gap).toBe('xl')
    expect(merged.breakpoints?.mobile?.props?.direction).toBe('column')
  })

  it('is idempotent (same reference when already applied)', () => {
    const once = applySiteKitResponsiveDefaults({
      id: 'g',
      type: 'SiteGrid',
      props: { columns: '3', gap: 'lg' },
      children: [],
    })
    expect(applySiteKitResponsiveDefaults(once)).toBe(once)
  })

  it('covers landing section Masters and canon pattern seeds', () => {
    const scene = createZaolyDefaultLandingScene()
    for (const name of ['LandingNav', 'LandingHero', 'LandingFeatures', 'LandingFooter'] as const) {
      const master = findMasterBySourceKey(
        scene.masters,
        zaolyLandingSectionSourceKey(name),
      )
      expect(master).toBeTruthy()
      expect(siteKitNodeNeedsResponsiveDefaults(master!.root)).toBe(false)
    }
    const nav = zaolyNavPatternBlock()
    expect(nav.props?.wrap).toBe(true)
    expect(nav.breakpoints?.mobile?.props?.direction).toBe('column')
    expect(zaolyCtaPatternBlock().breakpoints?.mobile?.props?.direction).toBe('column')
  })

  it('seeds grid insert with tablet/mobile gap lanes', () => {
    const grid = defaultChildForType('SiteGrid')
    expect(grid.breakpoints?.mobile?.props?.gap).toBe('md')
    expect(grid.breakpoints?.tablet?.props?.gap).toBe('md')
  })

  it('documents the spec', () => {
    const spec = readFileSync(
      path.join(__dirname, '../../../specs/domain/site-kit-responsive-defaults.md'),
      'utf8',
    )
    expect(spec).toContain('applySiteKitResponsiveDefaults')
    expect(spec.toLowerCase()).toContain('merge-only')
  })
})
