import type { SiteKitCompositionNode } from '@zaoly/site-kit'

/** Parse override / API JSON into a CompositionPreview node. */
export function asSiteKitCompositionNode(raw: unknown): SiteKitCompositionNode | null {
  if (!raw || typeof raw !== 'object') return null
  const rec = raw as { type?: unknown }
  if (typeof rec.type !== 'string' || !rec.type.trim()) return null
  return raw as SiteKitCompositionNode
}
