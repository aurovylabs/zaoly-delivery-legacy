/** Editor deep-link builder — specs/domain/editor-launch.md */

import { paths } from './paths'

export const EDITOR_PLATFORM_PROJECT_QUERY_PARAM = 'platformProjectId'
export const EDITOR_LAUNCH_CODE_QUERY_PARAM = paths.editorLaunchCodeQueryParam
export const EDITOR_INSERT_TYPE_QUERY_PARAM = paths.editorInsertTypeQueryParam
export const EDITOR_HINT_QUERY_PARAM = paths.editorHintQueryParam

export function buildEditorLaunchUrl(
  editorBase: string,
  opts?: {
    platformProjectId?: string | null
    launchCode?: string | null
    insertType?: string | null
    sceneId?: string | null
    hint?: string | null
  },
): string {
  const trimmed = editorBase.trim().replace(/\/$/, '')
  if (!trimmed) return trimmed

  const projectId = opts?.platformProjectId?.trim()
  const launchCode = opts?.launchCode?.trim()
  const insertType = opts?.insertType?.trim()
  const sceneId = opts?.sceneId?.trim()
  const hint = opts?.hint?.trim()

  const applyParams = (searchParams: URLSearchParams) => {
    if (projectId) searchParams.set(EDITOR_PLATFORM_PROJECT_QUERY_PARAM, projectId)
    if (launchCode) searchParams.set(EDITOR_LAUNCH_CODE_QUERY_PARAM, launchCode)
    if (insertType) searchParams.set(EDITOR_INSERT_TYPE_QUERY_PARAM, insertType)
    if (sceneId) searchParams.set('sceneId', sceneId)
    if (hint) searchParams.set(EDITOR_HINT_QUERY_PARAM, hint)
  }

  try {
    const url = new URL(trimmed)
    applyParams(url.searchParams)
    return url.toString()
  } catch {
    // Relative in-app path (`/editor`) — URL() needs a base.
    const url = new URL(trimmed, 'http://zaoly.local')
    applyParams(url.searchParams)
    return `${url.pathname}${url.search}`
  }
}

/** In-app `/editor` href with optional Collection + one-shot insertType + hint. */
export function editorHref(opts?: {
  platformProjectId?: string | null
  insertType?: string | null
  sceneId?: string | null
  hint?: string | null
}): string {
  return buildEditorLaunchUrl(paths.routes.editor, opts)
}
