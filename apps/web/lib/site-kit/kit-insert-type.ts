/**
 * Map Kit Playground selection → editor `insertType` query.
 * Spec: site-kit-playground.md SK-V6 · editor-launch.md
 */

export type KitInsertSelection = {
  kind: 'atom' | 'pattern' | 'section'
  componentId: string
  exportName?: string
}

/** Atom → `Site*`; Pattern/Section → `Composition:{exportName}` (section componentId is already sourceKey). */
export function kitInsertTypeFromSelection(sel: KitInsertSelection | null | undefined): string | null {
  if (!sel) return null
  if (sel.kind === 'section') {
    const id = sel.componentId.trim()
    return id || null
  }
  if (sel.kind === 'pattern') {
    const name = sel.exportName?.trim()
    return name ? `Composition:${name}` : null
  }
  const id = sel.componentId.trim()
  return id || null
}
