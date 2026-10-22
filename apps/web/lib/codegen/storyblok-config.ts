/**
 * Resolve Storyblok Management credentials from env (server only).
 * Spec: specs/domain/storyblok-handoff.md · specs/api/storyblok-push.md
 */
import { paths } from '../paths'
import { isStoryblokHandoffEnabled } from '../runtime-config'
import type { StoryblokPushConfig } from './storyblok-push'

export function resolveStoryblokPushConfig():
  | { ok: true; config: StoryblokPushConfig }
  | { ok: false; code: 'storyblok_not_configured'; missing: string[] } {
  if (!isStoryblokHandoffEnabled()) {
    return {
      ok: false,
      code: 'storyblok_not_configured',
      missing: [paths.envZaolyStoryblokHandoff],
    }
  }
  const spaceId = process.env[paths.envStoryblokSpaceId]?.trim() || ''
  const managementToken = process.env[paths.envStoryblokManagementToken]?.trim() || ''
  const missing: string[] = []
  if (!spaceId) missing.push(paths.envStoryblokSpaceId)
  if (!managementToken) missing.push(paths.envStoryblokManagementToken)
  if (missing.length) {
    return { ok: false, code: 'storyblok_not_configured', missing }
  }
  return {
    ok: true,
    config: {
      spaceId,
      managementToken,
      apiBase: paths.storyblokManagementApiBase,
    },
  }
}

/** Deep-link into Storyblok Visual Editor for a story id. */
export function storyblokStoryAppUrl(spaceId: string, storyId: number | string): string {
  const base = paths.storyblokAppBase.replace(/\/$/, '')
  return `${base}/#/me/spaces/${encodeURIComponent(spaceId)}/stories/0/0/${encodeURIComponent(String(storyId))}`
}
