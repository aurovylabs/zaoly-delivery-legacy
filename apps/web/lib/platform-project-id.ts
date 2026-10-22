/**
 * Opaque workspace / Collection ids: real bindings are UUIDs.
 * Local placeholders (`plx-local-*`, `plx-collection-demo-*`) are unbound for outbound origin.
 */

import { brandTokensUrl, paths } from './paths'

const PLATFORM_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isRealPlatformProjectId(id: string | null | undefined): boolean {
  const trimmed = id?.trim()
  if (!trimmed) return false
  return PLATFORM_UUID_RE.test(trimmed)
}

/**
 * BFF brand-token URL only when `id` is a real Collection UUID.
 * `brandTokensUrl` requires `string`; Coolify `next build` type-checks this path.
 */
export function boundBrandTokensUrl(id: string | null | undefined): string | null {
  if (typeof id !== 'string' || !isRealPlatformProjectId(id)) return null
  const projectId = id
  return brandTokensUrl(projectId)
}

/**
 * Editor always has a pack URL: live Collection when bound, otherwise
 * `plx-local-preview` so AUTH_BYPASS can enable session promote without upstream pack writes.
 */
export function editorBrandTokensUrl(id: string | null | undefined): string {
  return boundBrandTokensUrl(id) ?? brandTokensUrl(paths.localPromotePreviewPlatformId)
}

/** True when the project still needs platform origin binding (or re-bind). */
export function needsPlatformOrigin(platformProjectId: string | null | undefined): boolean {
  return !isRealPlatformProjectId(platformProjectId)
}
