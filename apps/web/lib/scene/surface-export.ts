/**
 * Designer WYSIWYG artboard export (PNG / multi-page PDF).
 * Spec: specs/domain/scene-surface-export.md
 */
import { createElement } from 'react'
import { Document, Image, Page, renderToBuffer } from '@react-pdf/renderer'
import type { CompositionScene, SceneBreakpointId, ScenePage } from '@zaoly/contracts'
import { expandSceneTree } from './expand-instances'
import { materializeNodeForBreakpoint } from './materialize-for-magazine'
import { resolvePrimaryBreakpoint } from './primary-breakpoint'
import {
  resolvePageArtboardHeight,
  resolvePageArtboardWidth,
} from './scene-board'
import {
  materializeScenePages,
  pageRootForPage,
  resolveActivePageId,
} from './scene-pages'
import { buildScenePreviewHtml } from './scene-preview-html'
import { injectShareWatermark } from '../client-page-share/watermark'

export type SurfaceExportFormat = 'png' | 'pdf'
export type SurfaceExportScope = 'active' | 'all'

export class SurfaceExportError extends Error {
  constructor(
    message: string,
    readonly code: 'no_pages' | 'png_requires_single_page' | 'page_not_found' | 'render_failed',
  ) {
    super(message)
    this.name = 'SurfaceExportError'
  }
}

export type SurfaceExportRequest = {
  format: SurfaceExportFormat
  scope?: SurfaceExportScope
  pageIds?: string[]
  breakpoint?: SceneBreakpointId
  /** PNG deviceScaleFactor — default 2, clamped 1–3 */
  scale?: number
  /** Optional fixed watermark strip (Client Page Share P3). */
  watermark?: string
}

export type SurfaceExportResult = {
  bytes: Buffer
  mimeType: 'image/png' | 'application/pdf'
  filename: string
}

export type SurfaceScreenshotFn = (
  html: string,
  viewport: { width: number; height: number },
  scale: number,
) => Promise<Buffer>

let screenshotImpl: SurfaceScreenshotFn | null = null

export function __setSurfaceScreenshotForTests(fn: SurfaceScreenshotFn | null): void {
  screenshotImpl = fn
}

function isBreakpoint(raw: unknown): raw is SceneBreakpointId {
  return raw === 'mobile' || raw === 'tablet' || raw === 'desktop' || raw === 'print'
}

export function resolveExportBreakpoint(
  scene: CompositionScene,
  requested?: unknown,
): SceneBreakpointId {
  if (isBreakpoint(requested)) return requested
  if (isBreakpoint(scene.activeBreakpoint)) return scene.activeBreakpoint
  return 'desktop'
}

export function resolveExportPageIds(
  scene: CompositionScene,
  options: Pick<SurfaceExportRequest, 'scope' | 'pageIds'>,
): string[] {
  // Explicit empty `pages: []` — do not synthesize a default page for export.
  if (Array.isArray(scene.pages) && scene.pages.length === 0) {
    return []
  }

  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  if (!pages.length) return []

  const requested = (options.pageIds ?? []).map((id) => id.trim()).filter(Boolean)
  if (requested.length) {
    const order = new Map(pages.map((p, i) => [p.id, i]))
    const missing = requested.filter((id) => !order.has(id))
    if (missing.length) {
      throw new SurfaceExportError(`page-not-found:${missing[0]}`, 'page_not_found')
    }
    return [...requested].sort((a, b) => (order.get(a)! - order.get(b)!))
  }

  const scope = options.scope === 'all' ? 'all' : 'active'
  if (scope === 'all') return pages.map((p) => p.id)
  return [resolveActivePageId(pages, materialized.activePageId)]
}

export function resolveExportViewport(
  page: ScenePage,
  scene: CompositionScene,
): { width: number; height: number } {
  const width = Math.max(1, Math.round(resolvePageArtboardWidth(page, scene)))
  const height = Math.max(1, Math.round(resolvePageArtboardHeight(page, scene, 640)))
  return { width, height }
}

export function clampExportScale(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : 2
  if (!Number.isFinite(n)) return 2
  return Math.min(3, Math.max(1, Math.round(n)))
}

export function safeExportFilename(
  scene: CompositionScene,
  format: SurfaceExportFormat,
  pageCount: number,
): string {
  const base = (scene.name || scene.id || 'export')
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80)
  const stem = base || 'export'
  if (format === 'png') return `${stem}.png`
  if (pageCount > 1) return `${stem}-${pageCount}p.pdf`
  return `${stem}.pdf`
}

async function screenshotPngWithPlaywright(
  html: string,
  viewport: { width: number; height: number },
  scale: number,
): Promise<Buffer> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: scale,
    })
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    const bytes = await page.screenshot({
      type: 'png',
      fullPage: false,
    })
    return Buffer.from(bytes)
  } finally {
    await browser.close()
  }
}

function pageById(scene: CompositionScene, pageId: string): ScenePage | null {
  const materialized = materializeScenePages(scene)
  return materialized.pages?.find((p) => p.id === pageId) ?? null
}

async function renderPagePng(
  scene: CompositionScene,
  pageId: string,
  breakpoint: SceneBreakpointId,
  scale: number,
  screenshot: SurfaceScreenshotFn,
  watermark?: string,
): Promise<{ bytes: Buffer; width: number; height: number }> {
  const page = pageById(scene, pageId)
  if (!page) throw new SurfaceExportError(`page-not-found:${pageId}`, 'page_not_found')
  const materialized = materializeScenePages(scene)
  const root = pageRootForPage(materialized, pageId)
  if (!root) throw new SurfaceExportError(`page-not-found:${pageId}`, 'page_not_found')

  const primary = resolvePrimaryBreakpoint(scene)
  const cascaded = materializeNodeForBreakpoint(root, breakpoint, primary)
  const expanded = expandSceneTree(cascaded, materialized.masters)
  const viewport = resolveExportViewport(page, materialized)
  let html = buildScenePreviewHtml(expanded, {
    breakpoint,
    primaryBreakpoint: primary,
    title: `${scene.name ?? scene.id} · ${page.name ?? pageId}`,
  })
  if (watermark?.trim()) {
    html = injectShareWatermark(html, watermark.trim())
  }
  const bytes = await screenshot(html, viewport, scale)
  return { bytes, width: viewport.width, height: viewport.height }
}

async function pngPagesToPdf(
  pages: Array<{ bytes: Buffer; width: number; height: number }>,
): Promise<Buffer> {
  const doc = createElement(
    Document,
    null,
    ...pages.map((p, i) =>
      createElement(
        Page,
        {
          key: `p-${i}`,
          size: [p.width, p.height],
          style: { padding: 0, margin: 0 },
        },
        createElement(Image, {
          // Runtime needs a real Uint8Array (pdfkit `instanceof`); TS Image src types Buffer.
          src: {
            data: new Uint8Array(p.bytes) as unknown as Buffer,
            format: 'png' as const,
          },
          style: { width: p.width, height: p.height },
        }),
      ),
    ),
  )
  const buffer = await renderToBuffer(doc)
  return Buffer.from(buffer)
}

export async function renderSurfaceExport(
  scene: CompositionScene,
  options: SurfaceExportRequest & { screenshot?: SurfaceScreenshotFn },
): Promise<SurfaceExportResult> {
  const format = options.format
  if (format !== 'png' && format !== 'pdf') {
    throw new SurfaceExportError('format must be png or pdf', 'render_failed')
  }

  const pageIds = resolveExportPageIds(scene, options)
  if (!pageIds.length) {
    throw new SurfaceExportError('No pages to export', 'no_pages')
  }
  if (format === 'png' && pageIds.length > 1) {
    throw new SurfaceExportError(
      'png_requires_single_page',
      'png_requires_single_page',
    )
  }

  const breakpoint = resolveExportBreakpoint(scene, options.breakpoint)
  const scale = clampExportScale(options.scale)
  const screenshot = options.screenshot ?? screenshotImpl ?? screenshotPngWithPlaywright

  try {
    const shots: Array<{ bytes: Buffer; width: number; height: number }> = []
    for (const pageId of pageIds) {
      shots.push(
        await renderPagePng(
          scene,
          pageId,
          breakpoint,
          scale,
          screenshot,
          options.watermark,
        ),
      )
    }

    if (format === 'png') {
      const shot = shots[0]!
      return {
        bytes: shot.bytes,
        mimeType: 'image/png',
        filename: safeExportFilename(scene, 'png', 1),
      }
    }

    const pdf = await pngPagesToPdf(shots)
    return {
      bytes: pdf,
      mimeType: 'application/pdf',
      filename: safeExportFilename(scene, 'pdf', shots.length),
    }
  } catch (e) {
    if (e instanceof SurfaceExportError) throw e
    const message = e instanceof Error ? e.message : String(e)
    throw new SurfaceExportError(`render_failed:${message.slice(0, 240)}`, 'render_failed')
  }
}
