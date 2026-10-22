/**
 * Apply HTML→Site Kit import onto one scene page root.
 * Spec: specs/domain/html-scene-import.md · specs/api/scene-html-import.md · craft-debug.md
 */
import type {
  CompositionScene,
  SceneCraftDebugSpirionMeta,
  SceneNode,
} from '@zaoly/contracts'
import { applySceneOp } from './ops'
import {
  htmlToSceneRoot,
  type HtmlImportWarning,
  type HtmlToSceneResult,
} from './html-to-scene'
import { buildCraftDebugBundle } from './craft-debug'
import {
  materializeScenePages,
  resolveActivePageId,
  syncScenePagesRoot,
} from './scene-pages'

export type ApplyHtmlImportInput = {
  html: string
  pageName?: string
  pageId?: string
  mode?: 'replace-page-root'
  /** Optional Spirion / agent craft meta persisted on the page debug bundle. */
  craftMeta?: { spirion?: SceneCraftDebugSpirionMeta }
}

export type ApplyHtmlImportResult =
  | {
      ok: true
      scene: CompositionScene
      pageId: string
      warnings: HtmlImportWarning[]
      stats: { nodeCount: number; htmlBytes: number }
      craftDebug: ReturnType<typeof buildCraftDebugBundle>
    }
  | {
      ok: false
      code:
        | 'html-empty'
        | 'html-too-large'
        | 'html-map-failed'
        | 'page-not-found'
        | 'add-page-failed'
      message: string
    }

function replacePageRoot(
  scene: CompositionScene,
  pageId: string,
  root: SceneNode,
  opts: {
    importSourceHtml?: string
    craftDebug?: ReturnType<typeof buildCraftDebugBundle>
  },
): CompositionScene {
  const working = materializeScenePages(scene)
  const pages = structuredClone(working.pages ?? [])
  const idx = pages.findIndex((p) => p.id === pageId)
  if (idx < 0) {
    throw new Error(`page-not-found:${pageId}`)
  }
  const now = new Date().toISOString()
  pages[idx] = {
    ...pages[idx]!,
    root: structuredClone(root),
    ...(opts.importSourceHtml !== undefined
      ? { importSourceHtml: opts.importSourceHtml, importSourceHtmlAt: now }
      : {}),
    ...(opts.craftDebug
      ? { craftDebug: opts.craftDebug, craftDebugAt: now }
      : {}),
  }
  return syncScenePagesRoot({
    ...working,
    pages,
    activePageId: pageId,
    root: structuredClone(root),
    updatedAt: now,
  })
}

export async function applyHtmlImport(
  scene: CompositionScene,
  input: ApplyHtmlImportInput,
): Promise<ApplyHtmlImportResult> {
  const mode = input.mode ?? 'replace-page-root'
  if (mode !== 'replace-page-root') {
    return {
      ok: false,
      code: 'html-map-failed',
      message: `Unsupported mode: ${mode}`,
    }
  }

  const mapped: HtmlToSceneResult = await htmlToSceneRoot(input.html)
  if (!mapped.ok) {
    return { ok: false, code: mapped.code, message: mapped.message }
  }

  let working = materializeScenePages(scene)
  let targetPageId: string

  const pageName = input.pageName?.trim()
  if (pageName) {
    const added = applySceneOp(working, { op: 'add_page', name: pageName })
    if (!added.ok) {
      return {
        ok: false,
        code: 'add-page-failed',
        message: added.reason || 'Failed to add page',
      }
    }
    working = added.scene
    targetPageId = resolveActivePageId(working.pages ?? [], working.activePageId)
  } else if (input.pageId?.trim()) {
    targetPageId = input.pageId.trim()
    const pages = working.pages ?? []
    if (!pages.some((p) => p.id === targetPageId)) {
      return {
        ok: false,
        code: 'page-not-found',
        message: `Unknown page: ${targetPageId}`,
      }
    }
  } else {
    targetPageId = resolveActivePageId(working.pages ?? [], working.activePageId)
  }

  const now = new Date().toISOString()
  const craftDebug = buildCraftDebugBundle({
    pageId: targetPageId,
    root: mapped.root,
    html: input.html,
    importWarnings: mapped.warnings,
    spirion: input.craftMeta?.spirion,
    importSourceHtmlAt: now,
  })

  try {
    const next = replacePageRoot(working, targetPageId, mapped.root, {
      importSourceHtml: input.html,
      craftDebug,
    })
    return {
      ok: true,
      scene: next,
      pageId: targetPageId,
      warnings: mapped.warnings,
      stats: mapped.stats,
      craftDebug,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.startsWith('page-not-found:')) {
      return { ok: false, code: 'page-not-found', message: `Unknown page: ${targetPageId}` }
    }
    return { ok: false, code: 'html-map-failed', message: message.slice(0, 240) }
  }
}
