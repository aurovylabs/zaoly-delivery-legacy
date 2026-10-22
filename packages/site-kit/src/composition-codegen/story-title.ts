/**
 * CSF sidebar grouping for Collection-scoped Patterns.
 * Spec: specs/domain/site-kit-compositions.md
 */

export const COMPOSITION_STORY_SHARED_SCOPE = 'Shared'

/** Sanitize Collection id for CSF title segment (Storybook slug-safe). */
export function compositionStoryScopeSegment(
  platformProjectId: string | null | undefined,
): string {
  const trimmed = platformProjectId?.trim()
  if (!trimmed) return COMPOSITION_STORY_SHARED_SCOPE
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || COMPOSITION_STORY_SHARED_SCOPE
}

/** CSF title `Compositions/{Shared|scope}/{ExportName}`. */
export function compositionStoryTitle(
  exportName: string,
  platformProjectId?: string | null,
): string {
  const scope = compositionStoryScopeSegment(platformProjectId)
  return `Compositions/${scope}/${exportName}`
}
