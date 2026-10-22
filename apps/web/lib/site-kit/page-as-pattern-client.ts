/**
 * Client helper for Save page as Pattern.
 * Spec: page-as-pattern.md
 */
import type { CompositionScene, SceneBreakpointId } from '@zaoly/contracts'
import { paths } from '../paths'

export type SavePageAsPatternResult =
  | {
      ok: true
      scene: CompositionScene
      exportName: string
      masterId: string
      componentId: string
      storyTitle: string
      results: Array<{
        pageId: string
        exportName: string
        masterId: string
        componentId: string
        storyTitle: string
      }>
    }
  | { ok: false; code?: string; error: string }

export async function requestSavePageAsPattern(input: {
  sceneId: string
  pageId?: string
  name?: string
  allPages?: boolean
  breakpoint?: SceneBreakpointId
}): Promise<SavePageAsPatternResult> {
  const res = await fetch(paths.routes.apiSiteKitCompositionsFromPage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sceneId: input.sceneId,
      ...(input.pageId ? { pageId: input.pageId } : {}),
      ...(input.name ? { name: input.name } : {}),
      ...(input.allPages ? { allPages: true } : {}),
      ...(input.breakpoint ? { breakpoint: input.breakpoint } : {}),
    }),
  })
  let data: unknown
  try {
    data = await res.json()
  } catch {
    return { ok: false, error: `Save page as Pattern failed (${res.status})` }
  }
  const rec = data as SavePageAsPatternResult & { error?: string; code?: string }
  if (!res.ok || !rec || rec.ok !== true) {
    return {
      ok: false,
      code: typeof rec?.code === 'string' ? rec.code : undefined,
      error:
        typeof rec?.error === 'string'
          ? rec.error
          : `Save page as Pattern failed (${res.status})`,
    }
  }
  return rec
}
