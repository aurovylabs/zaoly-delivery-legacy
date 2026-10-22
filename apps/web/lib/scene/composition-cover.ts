import type { CompositionScene } from '@zaoly/contracts'
import { DEFAULT_SCENE_PAGE_ID, materializeScenePages, resolveActivePageId } from './scene-pages'

/**
 * Page id for hub live thumbnails / cover.
 * Prefer valid `coverPageId`, else first page, else active / default.
 */
export function resolveCompositionCoverPageId(scene: CompositionScene): string {
  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const cover = scene.coverPageId?.trim()
  if (cover && pages.some((p) => p.id === cover)) return cover
  if (pages.length) return pages[0]!.id
  return resolveActivePageId(pages, materialized.activePageId) || DEFAULT_SCENE_PAGE_ID
}
