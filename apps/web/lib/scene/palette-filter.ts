import {
  EDITOR_PALETTE_GROUP_IDS,
  EDITOR_PALETTE_GROUP_TYPES,
  type EditorPaletteGroupId,
} from '@zaoly/contracts'

export function filterPaletteItems<T extends { id: string; label: string }>(
  items: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (item) => item.id.toLowerCase().includes(q) || item.label.toLowerCase().includes(q),
  )
}

export type PaletteGroup<T> = {
  id: EditorPaletteGroupId
  items: T[]
}

/** Partition filtered palette items into non-empty groups (P35). */
export function groupPaletteItems<T extends { id: string }>(items: T[]): PaletteGroup<T>[] {
  return EDITOR_PALETTE_GROUP_IDS.map((id) => ({
    id,
    items: items.filter((item) =>
      (EDITOR_PALETTE_GROUP_TYPES[id] as readonly string[]).includes(item.id),
    ),
  })).filter((group) => group.items.length > 0)
}
