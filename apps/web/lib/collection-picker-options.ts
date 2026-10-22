/**
 * Map accessible Collections to `@zaoly/ui` Select options.
 * Pin a known Collection id (Zaoly) when present.
 */

export type FederationCollection = {
  id: string
  name: string
  status?: string
  companyId?: string | null
  domain?: string | null
}

export type CollectionPickerOption = {
  value: string
  label: string
  pinned: boolean
}

export function mapCollectionsToPickerOptions(
  collections: FederationCollection[],
  pinId: string,
  pinnedSuffix: string,
): CollectionPickerOption[] {
  const pin = pinId.trim()
  const seen = new Set<string>()
  const items: CollectionPickerOption[] = []

  for (const collection of collections) {
    const id = collection.id?.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    const name = collection.name?.trim() || id
    const pinned = pin.length > 0 && id === pin
    items.push({
      value: id,
      label: pinned && pinnedSuffix ? `${name} · ${pinnedSuffix}` : name,
      pinned,
    })
  }

  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return 0
  })
}

export function isPickerDummyDisabled(error: string | null | undefined): boolean {
  return error === 'federation_mode_dummy'
}
