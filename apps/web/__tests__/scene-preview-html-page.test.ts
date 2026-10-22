import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  normalizeImportPreviewHtml,
  resolveScenePreviewHtmlForPage,
} from '../lib/scene/scene-preview-html-page'

function seedScene(): CompositionScene {
  return {
    id: 'scene-html-preview',
    name: 'Preview fixture',
    version: 1,
    updatedAt: '2026-08-24T14:00:00.000Z',
    pages: [
      {
        id: 'page-1',
        name: 'Landing',
        importSourceHtml: '<style>.nav{display:flex}</style><nav class="nav"><a>A</a></nav>',
        importSourceHtmlAt: '2026-08-24T15:00:00.000Z',
        root: {
          id: 'root',
          type: 'SiteStack',
          children: [
            {
              id: 'title',
              type: 'SiteText',
              props: { role: 'title', children: 'Hello' },
            },
          ],
        },
      },
    ],
    activePageId: 'page-1',
    root: {
      id: 'root',
      type: 'SiteStack',
      children: [],
    },
  }
}

describe('normalizeImportPreviewHtml', () => {
  it('wraps fragments in a document shell', () => {
    const html = normalizeImportPreviewHtml('<div>Body</div>')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<div>Body</div>')
  })

  it('passes through full documents', () => {
    const doc = '<!doctype html><html><body>Full</body></html>'
    expect(normalizeImportPreviewHtml(doc)).toBe(doc)
  })
})

describe('resolveScenePreviewHtmlForPage', () => {
  it('returns stored import HTML for source=import', () => {
    const result = resolveScenePreviewHtmlForPage(seedScene(), {
      pageId: 'page-1',
      source: 'import',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.source).toBe('import')
    expect(result.html).toContain('class="nav"')
    expect(result.importSourceHtmlAt).toBe('2026-08-24T15:00:00.000Z')
  })

  it('builds scene HTML for source=scene', () => {
    const result = resolveScenePreviewHtmlForPage(seedScene(), {
      pageId: 'page-1',
      source: 'scene',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.html).toContain('Hello')
    expect(result.html).toContain('id="preview-root"')
  })

  it('injects Google Font links when scene uses literal fontFamily', () => {
    const scene = structuredClone(seedScene())
    scene.pages![0]!.root!.children![0] = {
      id: 'title',
      type: 'SiteText',
      props: { role: 'title', children: 'Hello', fontFamily: 'Roboto' },
    }
    const result = resolveScenePreviewHtmlForPage(scene, {
      pageId: 'page-1',
      source: 'scene',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.html).toContain('data-creation-google-font')
    expect(result.html).toContain('family=Roboto')
  })

  it('errors when import source missing', () => {
    const scene = structuredClone(seedScene())
    scene.pages![0]!.importSourceHtml = undefined
    const result = resolveScenePreviewHtmlForPage(scene, {
      pageId: 'page-1',
      source: 'import',
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('import-source-missing')
  })
})
