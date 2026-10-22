/**
 * Resolve craft-debug JSON for a scene page (stored + live recompute).
 * Spec: specs/domain/craft-debug.md
 */
import type { CompositionScene, SceneCraftDebugBundle } from '@zaoly/contracts'
import {
  buildCraftDebugBundle,
  computeSceneCraftStats,
  evaluateCraftThinFlags,
  extractDesignSystemFromRoot,
} from './craft-debug'
import { materializeScenePages, resolveActivePageId } from './scene-pages'

const IMPORT_PREVIEW_CHARS = 2000

export type ResolveCraftDebugResult =
  | {
      ok: true
      pageId: string
      bundle: SceneCraftDebugBundle
      stored: SceneCraftDebugBundle | null
      craftDebugAt?: string
      importSourceHtmlPreview?: string
    }
  | { ok: false; code: 'page-not-found'; message: string; pageId?: string }

export function resolveCraftDebugForPage(
  scene: CompositionScene,
  opts?: { pageId?: string },
): ResolveCraftDebugResult {
  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const pageId = opts?.pageId?.trim()
    ? opts.pageId.trim()
    : resolveActivePageId(pages, materialized.activePageId)
  const page = pages.find((p) => p.id === pageId)
  if (!page) {
    return { ok: false, code: 'page-not-found', message: `Unknown page: ${pageId}`, pageId }
  }

  const liveStats = computeSceneCraftStats(page.root)
  const liveDesign = extractDesignSystemFromRoot(page.root)
  const liveFlags = evaluateCraftThinFlags(liveStats)
  const stored = page.craftDebug ?? null

  const bundle: SceneCraftDebugBundle = {
    schemaVersion: '1',
    builtAt: new Date().toISOString(),
    pageId,
    designSystem: liveDesign,
    sceneStats: liveStats,
    craftFlags: liveFlags.length ? liveFlags : stored?.craftFlags ?? [],
    importWarnings: stored?.importWarnings,
    importHtmlBytes: stored?.importHtmlBytes,
    hasImportSourceHtml: Boolean(page.importSourceHtml?.trim()),
    importSourceHtmlAt: page.importSourceHtmlAt ?? stored?.importSourceHtmlAt,
    ...(stored?.spirion ? { spirion: stored.spirion } : {}),
  }

  // Prefer stored spirion/import meta; live tree wins for stats.
  if (stored?.spirion && !bundle.spirion) bundle.spirion = stored.spirion

  const raw = page.importSourceHtml?.trim()
  const importSourceHtmlPreview = raw
    ? raw.length > IMPORT_PREVIEW_CHARS
      ? `${raw.slice(0, IMPORT_PREVIEW_CHARS)}\n/* … truncated … */`
      : raw
    : undefined

  return {
    ok: true,
    pageId,
    bundle,
    stored,
    craftDebugAt: page.craftDebugAt,
    importSourceHtmlPreview,
  }
}

/** Re-export builder for import path. */
export { buildCraftDebugBundle }
