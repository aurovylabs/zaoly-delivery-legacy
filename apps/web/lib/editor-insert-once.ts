/**
 * One-shot Kit → Editor insertType apply + URL strip.
 * Spec: editor-launch.md · site-kit-playground.md SK-V6/V7
 */
import { paths } from './paths'
import { EDITOR_INSERT_TYPE_QUERY_PARAM } from './editor-launch'

const appliedEditorInsertKeys = new Set<string>()

export function editorInsertAppliedKey(sceneId: string, insertType: string): string {
  return `${sceneId.trim()}::${insertType.trim()}`
}

export function __resetAppliedEditorInsertKeysForTests(): void {
  appliedEditorInsertKeys.clear()
}

/** Returns true the first time this scene+type should hydrate; false if already applied. */
export function claimEditorInsertOnce(sceneId: string, insertType: string): boolean {
  const sid = sceneId.trim()
  const type = insertType.trim()
  if (!sid || !type) return false
  const key = editorInsertAppliedKey(sid, type)
  if (appliedEditorInsertKeys.has(key)) return false
  appliedEditorInsertKeys.add(key)
  return true
}

/** Strip `insertType` from an absolute or relative URL / current location href. */
export function stripEditorInsertTypeFromUrl(href: string): string {
  try {
    const url = new URL(href, 'http://zaoly.local')
    url.searchParams.delete(EDITOR_INSERT_TYPE_QUERY_PARAM)
    url.searchParams.delete(paths.editorInsertTypeQueryParam)
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return url.toString()
    }
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return href
  }
}

export function stripEditorInsertTypeFromLocation(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has(paths.editorInsertTypeQueryParam)) return
  url.searchParams.delete(paths.editorInsertTypeQueryParam)
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}

export function stripEditorHintFromLocation(): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (!url.searchParams.has(paths.editorHintQueryParam)) return
  url.searchParams.delete(paths.editorHintQueryParam)
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`)
}
