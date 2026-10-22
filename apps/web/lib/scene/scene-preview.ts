/**
 * Scene → HTML → Playwright WebP (compact for Vision). Spec: specs/domain/scene-preview.md
 */
import type { CompositionScene, SceneBreakpointId } from '@zaoly/contracts'
import { expandCompositionScene, expandSceneTree } from './expand-instances'
import {
  materializeScenePages,
  pageRootForPage,
  resolveActivePageId,
} from './scene-pages'
import { buildScenePreviewHtml } from './scene-preview-html'
import {
  normalizePreviewBreakpoint,
  SCENE_PREVIEW_VIEWPORTS,
  type ScenePreviewBreakpoint,
} from './scene-preview-breakpoints'

export type { ScenePreviewBreakpoint } from './scene-preview-breakpoints'
export { normalizePreviewBreakpoint } from './scene-preview-breakpoints'

export type ScenePreviewMime = 'image/webp' | 'image/jpeg' | 'image/png'

export type ScenePreviewResult = {
  sceneId: string
  updatedAt: string
  pageId: string
  breakpoint: ScenePreviewBreakpoint
  /** Production: image/webp. Tests may inject png/jpeg. */
  mimeType: ScenePreviewMime
  /** Image base64 (field name kept for MCP/orchestrator compat). */
  pngBase64: string
  width: number
  height: number
  error?: string
}

/** Smaller viewports keep Vision payloads under proxy/SSE limits. */
const VIEWPORTS = SCENE_PREVIEW_VIEWPORTS

/** Injected in tests; production uses Playwright Chromium. */
export type ScreenshotHtmlFn = (
  html: string,
  viewport: { width: number; height: number },
) => Promise<{ bytes: Buffer; width: number; height: number; mimeType: ScenePreviewMime }>

let screenshotImpl: ScreenshotHtmlFn | null = null

export function __setScreenshotHtmlForTests(fn: ScreenshotHtmlFn | null): void {
  screenshotImpl = fn
}

async function screenshotHtmlWithPlaywright(
  html: string,
  viewport: { width: number; height: number },
): Promise<{ bytes: Buffer; width: number; height: number; mimeType: 'image/webp' }> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: 1,
    })
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const bytes = await page.screenshot({
      type: 'webp',
      quality: 50,
      fullPage: false,
    })
    return { bytes, width: viewport.width, height: viewport.height, mimeType: 'image/webp' }
  } finally {
    await browser.close()
  }
}

export async function renderScenePreview(
  scene: CompositionScene,
  options?: {
    breakpoint?: ScenePreviewBreakpoint
    pageId?: string
    screenshot?: ScreenshotHtmlFn
  },
): Promise<ScenePreviewResult> {
  const breakpoint = normalizePreviewBreakpoint(options?.breakpoint)
  const viewport = VIEWPORTS[breakpoint]
  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const pageId =
    options?.pageId?.trim() ||
    (pages.length ? resolveActivePageId(pages, materialized.activePageId) : 'page-default')

  let root = expandCompositionScene(materialized)
  if (options?.pageId?.trim()) {
    const pageRoot = pageRootForPage(materialized, pageId)
    if (!pageRoot) {
      return {
        sceneId: scene.id,
        updatedAt: scene.updatedAt,
        pageId,
        breakpoint,
        mimeType: 'image/webp',
        pngBase64: '',
        width: viewport.width,
        height: viewport.height,
        error: `page-not-found:${pageId}`,
      }
    }
    root = expandSceneTree(pageRoot, materialized.masters)
  }

  const html = buildScenePreviewHtml(root, {
    breakpoint: breakpoint as SceneBreakpointId,
    title: scene.name ?? scene.id,
  })

  const shot = options?.screenshot ?? screenshotImpl ?? screenshotHtmlWithPlaywright

  try {
    const { bytes, width, height, mimeType } = await shot(html, viewport)
    const b64 = bytes.toString('base64')
    // Soft-cap: if still huge, return text error instead of blowing Anthropic/SSE.
    if (b64.length > 450_000) {
      return {
        sceneId: scene.id,
        updatedAt: scene.updatedAt,
        pageId,
        breakpoint,
        mimeType: 'image/webp',
        pngBase64: '',
        width,
        height,
        error: 'preview-too-large:omit-vision-use-content-audit',
      }
    }
    return {
      sceneId: scene.id,
      updatedAt: scene.updatedAt,
      pageId,
      breakpoint,
      mimeType,
      pngBase64: b64,
      width,
      height,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      sceneId: scene.id,
      updatedAt: scene.updatedAt,
      pageId,
      breakpoint,
      mimeType: 'image/webp',
      pngBase64: '',
      width: viewport.width,
      height: viewport.height,
      error: `preview-failed:${message.slice(0, 240)}`,
    }
  }
}
