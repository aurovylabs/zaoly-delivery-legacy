import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { __setSurfaceScreenshotForTests } from '../lib/scene/surface-export'

vi.mock('../auth', () => ({
  auth: vi.fn(async () => null),
}))

import { POST } from '../app/api/scenes/[id]/export/route'

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function scene(partial?: Partial<CompositionScene>): CompositionScene {
  return {
    id: 'scene-export-api',
    name: 'API Export',
    version: 1,
    updatedAt: '2026-09-17T12:00:00.000Z',
    pages: [
      {
        id: 'page-1',
        name: 'One',
        frame: { width: 640, height: 480 },
        root: {
          id: 'root-1',
          type: 'SiteStack',
          children: [{ id: 't1', type: 'SiteText', props: { children: 'One' } }],
        },
      },
      {
        id: 'page-2',
        name: 'Two',
        frame: { width: 640, height: 480 },
        root: {
          id: 'root-2',
          type: 'SiteStack',
          children: [{ id: 't2', type: 'SiteText', props: { children: 'Two' } }],
        },
      },
    ],
    activePageId: 'page-1',
    root: { id: 'legacy', type: 'SiteStack', children: [] },
    ...partial,
  }
}

describe('POST /api/scenes/:id/export', () => {
  afterEach(() => {
    __setSurfaceScreenshotForTests(null)
  })

  it('returns image/png for single-page PNG export', async () => {
    __setSurfaceScreenshotForTests(async () => TINY_PNG)
    const s = scene()
    const res = await POST(
      new Request('http://localhost/api/scenes/scene-export-api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scene: s, format: 'png', scope: 'active' }),
      }),
      { params: Promise.resolve({ id: 'scene-export-api' }) },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Content-Disposition')).toContain('.png')
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.equals(TINY_PNG)).toBe(true)
  })

  it('returns application/pdf for multi-page PDF export', async () => {
    __setSurfaceScreenshotForTests(async () => TINY_PNG)
    const s = scene()
    const res = await POST(
      new Request('http://localhost/api/scenes/scene-export-api/export', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scene: s, format: 'pdf', scope: 'all' }),
      }),
      { params: Promise.resolve({ id: 'scene-export-api' }) },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.subarray(0, 4).toString('utf8')).toBe('%PDF')
  })

  it('rejects id mismatch with 400', async () => {
    const res = await POST(
      new Request('http://localhost/api/scenes/other/export', {
        method: 'POST',
        body: JSON.stringify({ scene: scene(), format: 'png' }),
      }),
      { params: Promise.resolve({ id: 'other' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 422 when no pages', async () => {
    const empty = scene({ pages: [] })
    const res = await POST(
      new Request('http://localhost/api/scenes/scene-export-api/export', {
        method: 'POST',
        body: JSON.stringify({ scene: empty, format: 'png' }),
      }),
      { params: Promise.resolve({ id: 'scene-export-api' }) },
    )
    expect(res.status).toBe(422)
  })

  it('returns 422 when PNG requests multiple pages', async () => {
    __setSurfaceScreenshotForTests(async () => TINY_PNG)
    const res = await POST(
      new Request('http://localhost/api/scenes/scene-export-api/export', {
        method: 'POST',
        body: JSON.stringify({ scene: scene(), format: 'png', scope: 'all' }),
      }),
      { params: Promise.resolve({ id: 'scene-export-api' }) },
    )
    expect(res.status).toBe(422)
  })
})
