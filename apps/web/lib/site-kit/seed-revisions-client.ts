/**
 * Client: batch seed revisions for Kit drift banner.
 * Spec: site-kit-kit-pull.md
 */
import { paths } from '../paths'

export type SeedRevisionRow = {
  componentId: string
  kitRevision: string
}

export async function requestSiteKitSeedRevisions(
  componentIds: string[],
): Promise<SeedRevisionRow[]> {
  const ids = [...new Set(componentIds.map((id) => id.trim()).filter(Boolean))]
  if (ids.length === 0) return []

  try {
    const res = await fetch(paths.routes.apiSiteKitSeedRevisions, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ componentIds: ids }),
    })
    if (!res.ok) return []
    const body = (await res.json().catch(() => null)) as
      | { ok?: boolean; revisions?: SeedRevisionRow[] }
      | null
    if (!body || body.ok !== true || !Array.isArray(body.revisions)) return []
    return body.revisions.filter(
      (row) =>
        typeof row?.componentId === 'string' &&
        row.componentId.trim() &&
        typeof row?.kitRevision === 'string' &&
        row.kitRevision.trim(),
    )
  } catch {
    // Relative `/api/...` fails in Node test fetch (no base URL); treat as empty.
    return []
  }
}
