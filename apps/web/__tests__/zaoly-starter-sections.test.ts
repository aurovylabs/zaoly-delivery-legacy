import { describe, expect, it } from 'vitest'
import { kitPlaygroundKind } from '../lib/site-kit/kit-playground-kind'
import { isAllowedOverrideId } from '../lib/site-kit/override-ids'
import { paths } from '../lib/paths'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import {
  buildStarterSectionPlaygroundSeed,
  isZaolyStarterSectionComponentId,
  starterSectionPreviewNode,
  zaolyStarterSectionNavEntries,
} from '../lib/site-kit/zaoly-starter-sections'

describe('Zaoly starter sections (Kit Playground SK-V22)', () => {
  it('lists all landing section nav entries', () => {
    const entries = zaolyStarterSectionNavEntries()
    expect(entries.length).toBeGreaterThanOrEqual(8)
    expect(entries.some((e) => e.componentId === 'Composition:LandingNav')).toBe(true)
    expect(entries.some((e) => e.exportName === 'LandingHero')).toBe(true)
  })

  it('classifies sourceKey as section kind', () => {
    expect(isZaolyStarterSectionComponentId('Composition:LandingNav')).toBe(true)
    expect(kitPlaygroundKind('Composition:LandingNav')).toBe('section')
    expect(kitPlaygroundKind('SiteButton')).toBe('atom')
    expect(kitPlaygroundKind('Composition~aaaaaaaaaaaaaaaa~Hero')).toBe('pattern')
    expect(isAllowedOverrideId('Composition:LandingFooter')).toBe(true)
  })

  it('builds a playground seed for LandingNav', () => {
    const seed = buildStarterSectionPlaygroundSeed('Composition:LandingNav')
    expect(seed).not.toBeNull()
    expect(seed!.ok).toBe(true)
    expect(seed!.kind).toBe('section')
    expect(seed!.exportName).toBe('LandingNav')
    expect(seed!.kitRevision).toBe('starter:Composition:LandingNav')
    expect(seed!.source).toContain('LandingNav')
    expect(seed!.source).toContain('starter section')
    expect(seed!.composition?.type).toBeTruthy()
    expect(seed!.usageImport).toMatch(/Save as Site Kit component/i)
  })

  it('builds seeds for card + features (nested Instances)', () => {
    const card = buildStarterSectionPlaygroundSeed('Composition:LandingCard')
    expect(card?.kind).toBe('section')
    expect(card?.variantCount).toBeGreaterThanOrEqual(2)

    const features = buildStarterSectionPlaygroundSeed('Composition:LandingFeatures')
    expect(features?.kind).toBe('section')
    expect(features?.composition).toBeTruthy()
    expect(features?.source.length).toBeGreaterThan(40)
  })

  it('starterSectionPreviewNode is assignable to CompositionPreview node type', () => {
    const node: SiteKitCompositionNode | null = starterSectionPreviewNode(
      'Composition:LandingNav',
    )
    expect(node?.type).toBeTruthy()
  })


  it('GET /api/site-kit/playground-source seeds starter sections', async () => {
    const { GET } = await import('../app/api/site-kit/playground-source/route')
    const res = await GET(
      new Request(
        `http://localhost${paths.routes.apiSiteKitPlaygroundSource}?${paths.kitComponentQueryParam}=Composition%3ALandingNav`,
      ),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      ok: boolean
      kind: string
      exportName: string
      kitRevision: string
    }
    expect(body.ok).toBe(true)
    expect(body.kind).toBe('section')
    expect(body.exportName).toBe('LandingNav')
    expect(body.kitRevision).toBe('starter:Composition:LandingNav')
  })
})
