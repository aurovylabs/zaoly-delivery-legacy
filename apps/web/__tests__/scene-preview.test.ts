import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { buildScenePreviewHtml } from '../lib/scene/scene-preview-html'
import { expandCompositionScene } from '../lib/scene/expand-instances'
import { renderScenePreview, __setScreenshotHtmlForTests } from '../lib/scene/scene-preview'
import { afterEach } from 'vitest'

function seedScene(): CompositionScene {
  return {
    id: 'scene-preview',
    name: 'Preview fixture',
    version: 1,
    updatedAt: '2026-08-24T14:00:00.000Z',
    root: {
      id: 'root',
      type: 'SiteStack',
      children: [
        {
          id: 'title',
          type: 'SiteText',
          props: { role: 'title', children: 'Urban Glide E-Bike' },
        },
        {
          id: 'cta',
          type: 'SiteButton',
          props: { children: 'In den Warenkorb' },
        },
        {
          id: 'seed',
          type: 'SiteButton',
          props: { children: 'Get started' },
        },
      ],
    },
  }
}

describe('buildScenePreviewHtml', () => {
  it('embeds product copy and seed labels as visible text', () => {
    const html = buildScenePreviewHtml(expandCompositionScene(seedScene()))
    expect(html).toContain('Urban Glide E-Bike')
    expect(html).toContain('In den Warenkorb')
    expect(html).toContain('Get started')
    expect(html).toContain('id="preview-root"')
  })

  it('emits inline svg for SiteSvg leaves', () => {
    const scene: CompositionScene = {
      id: 'scene-svg',
      name: 'Svg preview',
      version: 1,
      updatedAt: '2026-08-26T12:00:00.000Z',
      root: {
        id: 'root',
        type: 'SiteStack',
        children: [
          {
            id: 'seal',
            type: 'SiteSvg',
            props: {
              markup:
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="#111"/></svg>',
              alt: 'Brand seal',
            },
          },
        ],
      },
    }
    const html = buildScenePreviewHtml(expandCompositionScene(scene))
    expect(html).toContain('data-type="SiteSvg"')
    expect(html).toContain('aria-label="Brand seal"')
    expect(html).toMatch(/<svg[\s\S]*circle/i)
    expect(html).not.toContain('<script')
  })

  it('honors clipInset* as CSS clip-path on SiteStack (W16-6)', () => {
    const scene: CompositionScene = {
      id: 'scene-clip',
      name: 'Clip preview',
      version: 1,
      updatedAt: '2026-08-26T12:00:00.000Z',
      root: {
        id: 'root',
        type: 'SiteStack',
        props: {
          clipInsetBottomLeftY: '12%',
        },
        children: [],
      },
    }
    const html = buildScenePreviewHtml(expandCompositionScene(scene))
    expect(html).toMatch(/clip-path:\s*polygon\(/)
    expect(html).toContain('calc(100% - 12%)')
  })
})

describe('renderScenePreview', () => {
  afterEach(() => {
    __setScreenshotHtmlForTests(null)
  })

  it('returns base64 image via injected screenshot', async () => {
    __setScreenshotHtmlForTests(async (_html, viewport) => {
      const bytes = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      )
      return { bytes, width: viewport.width, height: viewport.height, mimeType: 'image/png' }
    })
    const result = await renderScenePreview(seedScene(), { breakpoint: 'desktop' })
    expect(result.error).toBeUndefined()
    expect(result.mimeType).toBe('image/png')
    expect(result.pngBase64.length).toBeGreaterThan(20)
    expect(result.width).toBe(1440)
    expect(result.height).toBe(900)
  })

  it('surfaces structured error when screenshot throws', async () => {
    __setScreenshotHtmlForTests(async () => {
      throw new Error('browser missing')
    })
    const result = await renderScenePreview(seedScene())
    expect(result.pngBase64).toBe('')
    expect(result.error).toMatch(/^preview-failed:/)
  })
})
