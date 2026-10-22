/**
 * Open Kit Playground deep-link after Pattern save (Web editor only).
 * Spec: page-as-pattern.md §9
 */
export function openKitPlaygroundHref(href: string): boolean {
  if (typeof window === 'undefined') return false
  const clean = href.trim()
  if (!clean.startsWith('/')) return false
  const opened = window.open(clean, '_blank', 'noopener,noreferrer')
  return opened != null
}
