'use client'

import { buildEditorLaunchUrl } from '../lib/editor-launch'
import { paths } from '../lib/paths'

/** Mint launch code (best-effort) then open editor in a new tab. */
export async function openEditorWithLaunchCode(opts: {
  editorBase: string
  platformProjectId?: string | null
  insertType?: string | null
}): Promise<{ ok: boolean; href: string; error?: string }> {
  let launchCode: string | null = null
  try {
    const res = await fetch(paths.routes.apiEditorLaunchCode, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platformProjectId: opts.platformProjectId ?? undefined,
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { launchCode?: string }
      launchCode = data.launchCode?.trim() || null
    } else if (res.status === 401) {
      return { ok: false, href: '', error: 'unauthorized' }
    }
  } catch {
    // Fall through — still open editor without code.
  }

  const href = buildEditorLaunchUrl(opts.editorBase, {
    platformProjectId: opts.platformProjectId,
    launchCode,
    insertType: opts.insertType,
  })
  if (typeof window !== 'undefined') {
    window.open(href, '_blank', 'noopener,noreferrer')
  }
  return { ok: true, href }
}
