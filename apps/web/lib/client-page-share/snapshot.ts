/**
 * Build a pinned, page-subset snapshot for Client Page Share.
 * Strips import HTML, craft debug, and comments.
 */
import type {
  CompositionScene,
  SceneMaster,
  ScenePage,
} from '@zaoly/contracts'
import { materializeScenePages } from '../scene/scene-pages'

export type ClientSharePageSnapshot = {
  id: string
  name: string
  root: ScenePage['root']
  frame?: ScenePage['frame']
  breakpoint?: ScenePage['breakpoint']
}

export type ClientShareSnapshot = {
  schemaVersion: 1
  sceneId: string
  name: string
  platformProjectId: string | null
  activeBreakpoint?: CompositionScene['activeBreakpoint']
  activePrintPreset?: CompositionScene['activePrintPreset']
  masters?: SceneMaster[]
  pages: ClientSharePageSnapshot[]
  pinnedAt: string
}

function stripPage(page: ScenePage): ClientSharePageSnapshot {
  return {
    id: page.id,
    name: page.name,
    root: structuredClone(page.root),
    ...(page.frame ? { frame: structuredClone(page.frame) } : {}),
    ...(page.breakpoint ? { breakpoint: page.breakpoint } : {}),
  }
}

export function buildClientShareSnapshot(
  scene: CompositionScene,
  pageIds: string[],
): { ok: true; snapshot: ClientShareSnapshot } | { ok: false; error: string } {
  const ids = [...new Set(pageIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return { ok: false, error: 'page_ids_required' }

  const materialized = materializeScenePages(scene)
  const allPages = materialized.pages ?? []
  const selected: ClientSharePageSnapshot[] = []
  for (const id of ids) {
    const page = allPages.find((p) => p.id === id)
    if (!page) return { ok: false, error: `unknown_page:${id}` }
    selected.push(stripPage(page))
  }

  return {
    ok: true,
    snapshot: {
      schemaVersion: 1,
      sceneId: scene.id,
      name: scene.name,
      platformProjectId: scene.platformProjectId ?? null,
      ...(scene.activeBreakpoint ? { activeBreakpoint: scene.activeBreakpoint } : {}),
      ...(scene.activePrintPreset ? { activePrintPreset: scene.activePrintPreset } : {}),
      ...(materialized.masters?.length
        ? { masters: structuredClone(materialized.masters) }
        : {}),
      pages: selected,
      pinnedAt: new Date().toISOString(),
    },
  }
}

/** Reconstruct a minimal CompositionScene for preview HTML from a snapshot. */
export function sceneFromClientShareSnapshot(
  snapshot: ClientShareSnapshot,
): CompositionScene {
  const first = snapshot.pages[0]
  return {
    id: snapshot.sceneId,
    name: snapshot.name,
    version: 1,
    platformProjectId: snapshot.platformProjectId,
    ...(snapshot.activeBreakpoint
      ? { activeBreakpoint: snapshot.activeBreakpoint }
      : {}),
    ...(snapshot.activePrintPreset
      ? { activePrintPreset: snapshot.activePrintPreset }
      : {}),
    ...(snapshot.masters?.length ? { masters: snapshot.masters } : {}),
    pages: snapshot.pages.map((p) => ({
      id: p.id,
      name: p.name,
      root: p.root,
      ...(p.frame ? { frame: p.frame } : {}),
      ...(p.breakpoint ? { breakpoint: p.breakpoint } : {}),
    })),
    activePageId: first?.id,
    root: first ? structuredClone(first.root) : { id: 'empty', type: 'Stack', children: [] },
    updatedAt: snapshot.pinnedAt,
  }
}
