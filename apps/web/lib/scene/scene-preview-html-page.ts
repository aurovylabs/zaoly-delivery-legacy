/**
 * Resolve preview HTML for one scene page (import source or Site-Kit render).
 * Spec: specs/domain/scene-preview.md · html-scene-import.md
 */
import type { CompositionScene, SceneBreakpointId } from '@zaoly/contracts'
import { cachedExpandCompositionScene, cachedExpandSceneTree } from './expand-cache'
import { sceneDocumentFingerprint } from './scene-document-fingerprint'
import {
  materializeScenePages,
  pageRootForPage,
  resolveActivePageId,
} from './scene-pages'
import { buildScenePreviewHtml } from './scene-preview-html'
import { collectSceneFontFamilies } from '../fonts/collect-scene-font-families'
import {
  normalizePreviewBreakpoint,
  type ScenePreviewBreakpoint,
} from './scene-preview-breakpoints'
import {
  normalizeImportPreviewHtml,
  type ScenePreviewHtmlSource,
} from './scene-preview-html-shared'

export type { ScenePreviewHtmlSource } from './scene-preview-html-shared'
export { normalizeImportPreviewHtml } from './scene-preview-html-shared'

export type ScenePreviewHtmlResult =
  | {
      ok: true
      pageId: string
      source: ScenePreviewHtmlSource
      html: string
      importSourceHtmlAt?: string
    }
  | {
      ok: false
      code: 'page-not-found' | 'import-source-missing'
      message: string
      pageId: string
    }

export function resolveScenePreviewHtmlForPage(
  scene: CompositionScene,
  options?: {
    pageId?: string
    breakpoint?: ScenePreviewBreakpoint
    source?: ScenePreviewHtmlSource
  },
): ScenePreviewHtmlResult {
  const source = options?.source ?? 'scene'
  const breakpoint = normalizePreviewBreakpoint(options?.breakpoint)
  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const pageId =
    options?.pageId?.trim() ||
    (pages.length ? resolveActivePageId(pages, materialized.activePageId) : 'page-default')

  const page = pages.find((p) => p.id === pageId)
  if (options?.pageId?.trim() && !page) {
    return {
      ok: false,
      code: 'page-not-found',
      message: `Unknown page: ${pageId}`,
      pageId,
    }
  }

  if (source === 'import') {
    const raw = page?.importSourceHtml?.trim()
    if (!raw) {
      return {
        ok: false,
        code: 'import-source-missing',
        message: 'No import HTML stored for this page',
        pageId,
      }
    }
    return {
      ok: true,
      pageId,
      source,
      html: normalizeImportPreviewHtml(raw),
      importSourceHtmlAt: page?.importSourceHtmlAt,
    }
  }

  let root = cachedExpandCompositionScene(materialized, sceneDocumentFingerprint(materialized))
  if (pageId && pages.length) {
    const pageRoot = pageRootForPage(materialized, pageId)
    if (!pageRoot) {
      return {
        ok: false,
        code: 'page-not-found',
        message: `Unknown page: ${pageId}`,
        pageId,
      }
    }
    root = cachedExpandSceneTree(
      pageRoot,
      materialized.masters,
      sceneDocumentFingerprint(materialized),
    )
  }

  const html = buildScenePreviewHtml(root, {
    breakpoint: breakpoint as SceneBreakpointId,
    title: scene.name ?? scene.id,
    fontFamilies: collectSceneFontFamilies(root, [], { paintBreakpoint: breakpoint }),
  })

  return { ok: true, pageId, source, html }
}
