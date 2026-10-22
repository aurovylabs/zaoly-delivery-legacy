import { afterEach, describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  __setSurfaceScreenshotForTests,
  clampExportScale,
  renderSurfaceExport,
  resolveExportBreakpoint,
  resolveExportPageIds,
  safeExportFilename,
  SurfaceExportError,
} from '../lib/scene/surface-export'

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function multiPageScene(): CompositionScene {
  return {
    id: 'scene-export',
    name: 'Export Fixture',
    version: 1,
    updatedAt: '2026-09-17T12:00:00.000Z',
    pages: [
      {
        id: 'page-a',
        name: 'A',
        frame: { width: 800, height: 600 },
        root: {
          id: 'root-a',
          type: 'SiteStack',
          children: [{ id: 't-a', type: 'SiteText', props: { children: 'Page A' } }],
        },
      },
      {
        id: 'page-b',
        name: 'B',
        frame: { width: 1024, height: 768 },
        root: {
          id: 'root-b',
          type: 'SiteStack',
          children: [{ id: 't-b', type: 'SiteText', props: { children: 'Page B' } }],
        },
      },
    ],
    activePageId: 'page-b',
    root: { id: 'legacy-root', type: 'SiteStack', children: [] },
  }
}

describe('surface-export helpers', () => {
  it('resolves active / all / pageIds scope', () => {
    const scene = multiPageScene()
    expect(resolveExportPageIds(scene, { scope: 'active' })).toEqual(['page-b'])
    expect(resolveExportPageIds(scene, { scope: 'all' })).toEqual(['page-a', 'page-b'])
    expect(resolveExportPageIds(scene, { pageIds: ['page-b', 'page-a'] })).toEqual([
      'page-a',
      'page-b',
    ])
  })

  it('throws page_not_found for unknown pageIds', () => {
    expect(() =>
      resolveExportPageIds(multiPageScene(), { pageIds: ['missing'] }),
    ).toThrow(SurfaceExportError)
  })

  it('returns empty when scene has no pages', () => {
    const empty: CompositionScene = {
      id: 'empty',
      name: 'Empty',
      version: 1,
      updatedAt: '2026-09-17T12:00:00.000Z',
      root: { id: 'r', type: 'SiteStack', children: [] },
      pages: [],
    }
    expect(resolveExportPageIds(empty, { scope: 'all' })).toEqual([])
  })

  it('sanitizes filenames', () => {
    const scene = multiPageScene()
    expect(safeExportFilename(scene, 'png', 1)).toBe('Export_Fixture.png')
    expect(safeExportFilename(scene, 'pdf', 1)).toBe('Export_Fixture.pdf')
    expect(safeExportFilename(scene, 'pdf', 2)).toBe('Export_Fixture-2p.pdf')
  })

  it('clamps scale and resolves breakpoint', () => {
    expect(clampExportScale(undefined)).toBe(2)
    expect(clampExportScale(0)).toBe(1)
    expect(clampExportScale(9)).toBe(3)
    expect(resolveExportBreakpoint(multiPageScene(), 'tablet')).toBe('tablet')
    expect(resolveExportBreakpoint({ ...multiPageScene(), activeBreakpoint: 'mobile' })).toBe(
      'mobile',
    )
  })
})

describe('renderSurfaceExport', () => {
  afterEach(() => {
    __setSurfaceScreenshotForTests(null)
  })

  it('returns PNG for a single active page', async () => {
    __setSurfaceScreenshotForTests(async () => TINY_PNG)
    const result = await renderSurfaceExport(multiPageScene(), {
      format: 'png',
      scope: 'active',
    })
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('Export_Fixture.png')
    expect(result.bytes.equals(TINY_PNG)).toBe(true)
  })

  it('returns multi-page PDF when scope=all', async () => {
    let calls = 0
    __setSurfaceScreenshotForTests(async () => {
      calls += 1
      return TINY_PNG
    })
    const result = await renderSurfaceExport(multiPageScene(), {
      format: 'pdf',
      scope: 'all',
    })
    expect(calls).toBe(2)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('Export_Fixture-2p.pdf')
    expect(result.bytes.subarray(0, 4).toString('utf8')).toBe('%PDF')
  })

  it('rejects PNG when multiple pages selected', async () => {
    __setSurfaceScreenshotForTests(async () => TINY_PNG)
    await expect(
      renderSurfaceExport(multiPageScene(), { format: 'png', scope: 'all' }),
    ).rejects.toMatchObject({ code: 'png_requires_single_page' })
  })

  it('rejects empty pages with no_pages', async () => {
    const empty: CompositionScene = {
      id: 'empty',
      name: 'Empty',
      version: 1,
      updatedAt: '2026-09-17T12:00:00.000Z',
      root: { id: 'r', type: 'SiteStack', children: [] },
      pages: [],
    }
    await expect(renderSurfaceExport(empty, { format: 'png' })).rejects.toMatchObject({
      code: 'no_pages',
    })
  })
})
