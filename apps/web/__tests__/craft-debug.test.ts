import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  buildCraftDebugBundle,
  computeSceneCraftStats,
  evaluateCraftThinFlags,
} from '../lib/scene/craft-debug'
import { auditSceneContent } from '../lib/scene/scene-content-audit'
import type { CompositionScene } from '@zaoly/contracts'

function thinStackRoot(): SceneNode {
  const kids: SceneNode[] = []
  for (let i = 0; i < 12; i += 1) {
    kids.push({
      id: `t${i}`,
      type: 'SiteText',
      props: {
        role: 'body',
        children: `Line ${i}`,
        fontSize: '16px',
        background: '#ffffff',
      },
    })
  }
  return {
    id: 'root',
    type: 'SiteStack',
    props: { background: '#ffffff' },
    children: kids,
  }
}

function denseLandingRoot(): SceneNode {
  return {
    id: 'root',
    type: 'SiteStack',
    props: { background: '#0b1020', gap: '48px' },
    children: [
      {
        id: 'hero',
        type: 'SiteText',
        props: {
          role: 'display',
          children: 'Urban Glide',
          fontSize: '72px',
          lineHeight: '1.08',
          letterSpacing: '-0.02em',
          color: '#f5f0e8',
          background: '#0b1020',
        },
      },
      {
        id: 'media',
        type: 'SiteImage',
        props: { alt: 'Bike', src: 'https://example.com/bike.png' },
        style: { width: 960, height: 540 },
      },
      {
        id: 'grid',
        type: 'SiteGrid',
        props: { background: '#161b2e', gap: '24px' },
        children: [
          {
            id: 'c1',
            type: 'SiteStack',
            props: { background: '#1e2538', padding: '24px' },
            children: [
              {
                id: 'c1t',
                type: 'SiteText',
                props: { children: 'Range', color: '#f5f0e8', fontSize: '18px' },
              },
            ],
          },
          {
            id: 'c2',
            type: 'SiteStack',
            props: { background: '#243049', padding: '24px' },
            children: [
              {
                id: 'c2t',
                type: 'SiteText',
                props: { children: 'Torque', color: '#f5f0e8', fontSize: '18px' },
              },
            ],
          },
        ],
      },
    ],
  }
}

describe('craft-debug', () => {
  it('flags thin column stacks', () => {
    const stats = computeSceneCraftStats(thinStackRoot())
    expect(stats.siteGridCount).toBe(0)
    expect(stats.hasLargeDisplay).toBe(false)
    const flags = evaluateCraftThinFlags(stats)
    expect(flags.some((f) => f.code === 'craft-thin')).toBe(true)
    expect(flags.some((f) => f.code === 'craft-no-grid')).toBe(true)
    expect(flags.some((f) => f.code === 'craft-small-type')).toBe(true)
  })

  it('passes dense landings without craft-thin', () => {
    const stats = computeSceneCraftStats(denseLandingRoot())
    expect(stats.hasLargeDisplay).toBe(true)
    expect(stats.siteGridCount).toBe(1)
    expect(stats.hasHeroMedia).toBe(true)
    const flags = evaluateCraftThinFlags(stats)
    expect(flags.some((f) => f.code === 'craft-thin')).toBe(false)
  })

  it('treats stack backgroundImage url as hero media mass', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'SiteStack',
      props: {
        backgroundImage:
          'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1")',
        minHeight: '100vh',
      },
      children: [
        {
          id: 'h',
          type: 'SiteText',
          props: {
            role: 'display',
            children: 'Hero',
            fontSize: '64px',
            lineHeight: '1.08',
          },
        },
      ],
    }
    const stats = computeSceneCraftStats(root)
    expect(stats.hasHeroMedia).toBe(true)
    expect(stats.hasLargeDisplay).toBe(true)
    expect(stats.hasLooseDisplayLeading).toBe(false)
  })

  it('flags loose display leading when body line-height sticks on large type', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'SiteStack',
      props: { background: '#0f0f0f' },
      children: [
        {
          id: 'h',
          type: 'SiteText',
          props: {
            role: 'display',
            children: 'Intelligenz. Für jede digitale Entscheidung.',
            fontSize: '64px',
            lineHeight: '1.6',
          },
        },
      ],
    }
    const stats = computeSceneCraftStats(root)
    expect(stats.hasLooseDisplayLeading).toBe(true)
    const flags = evaluateCraftThinFlags(stats)
    expect(flags.some((f) => f.code === 'craft-loose-display-leading')).toBe(true)
  })

  it('treats bare https backgroundImage as hero media', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'SiteStack',
      props: { backgroundImage: 'https://images.unsplash.com/photo-hero.jpg' },
      children: [],
    }
    expect(computeSceneCraftStats(root).hasHeroMedia).toBe(true)
  })

  it('flags craft-no-hero-media on text-only dense pages', () => {
    const kids: SceneNode[] = []
    for (let i = 0; i < 10; i += 1) {
      kids.push({
        id: `t${i}`,
        type: 'SiteText',
        props: {
          role: i === 0 ? 'display' : 'body',
          children: `Line ${i}`,
          fontSize: i === 0 ? '64px' : '16px',
          background: i % 2 === 0 ? '#0b1020' : '#161b2e',
        },
      })
    }
    const root: SceneNode = {
      id: 'root',
      type: 'SiteStack',
      props: { background: '#0b1020', gap: '24px' },
      children: kids,
    }
    const stats = computeSceneCraftStats(root)
    expect(stats.hasLargeDisplay).toBe(true)
    expect(stats.hasHeroMedia).toBe(false)
    const flags = evaluateCraftThinFlags(stats)
    expect(flags.some((f) => f.code === 'craft-no-hero-media')).toBe(true)
  })

  it('builds bundle with spirion meta and html bytes', () => {
    const html = '<html><body><h1 style="font-size:72px">Hi</h1></body></html>'
    const bundle = buildCraftDebugBundle({
      pageId: 'page-1',
      root: denseLandingRoot(),
      html,
      spirion: { captureIds: ['cap_abc'], avoid: ['equal three-up'] },
      importWarnings: [{ code: 'x', message: 'warn' }],
    })
    expect(bundle.schemaVersion).toBe('1')
    expect(bundle.pageId).toBe('page-1')
    expect(bundle.spirion?.captureIds).toEqual(['cap_abc'])
    expect(bundle.hasImportSourceHtml).toBe(true)
    expect(bundle.importHtmlBytes).toBeGreaterThan(20)
    expect(bundle.importWarnings?.[0]?.code).toBe('x')
    expect(bundle.sceneStats.maxFontSizePx).toBe(72)
  })

  it('audit surfaces craft-thin as warning only', () => {
    const scene: CompositionScene = {
      id: 'scene-thin',
      name: 'Thin',
      version: 1,
      updatedAt: '2026-08-25T12:00:00.000Z',
      root: thinStackRoot(),
    }
    const result = auditSceneContent(scene)
    const craft = result.findings.filter((f) => f.code === 'craft-thin')
    expect(craft.length).toBeGreaterThanOrEqual(1)
    expect(craft.every((f) => f.severity === 'warning')).toBe(true)
  })
})
