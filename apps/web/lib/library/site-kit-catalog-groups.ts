import { SITE_KIT_CATALOG, type SiteKitCatalogEntry } from '../site-kit/site-kit-catalog'

export type SiteKitCatalogGroupId = 'forms' | 'content' | 'layout'

const GROUP_ORDER: SiteKitCatalogGroupId[] = ['forms', 'content', 'layout']

const GROUP_BY_ID: Record<string, SiteKitCatalogGroupId> = {
  SiteButton: 'forms',
  SiteInput: 'forms',
  SiteTextarea: 'forms',
  SiteSelect: 'forms',
  SiteCheckbox: 'forms',
  SiteText: 'content',
  SiteLink: 'content',
  SiteBadge: 'content',
  SiteImage: 'content',
  SiteSvg: 'content',
  SiteShape: 'content',
  SiteTable: 'content',
  SiteTableRow: 'content',
  SiteTableCell: 'content',
  SiteContainer: 'layout',
  SiteStack: 'layout',
  SiteGrid: 'layout',
  SiteDivider: 'layout',
}

export type SiteKitCatalogGroup = {
  id: SiteKitCatalogGroupId
  items: SiteKitCatalogEntry[]
}

/** Group closed atom catalog for Library hub cards (spec: library-hub.md). */
export function groupSiteKitCatalog(
  entries: readonly SiteKitCatalogEntry[] = SITE_KIT_CATALOG,
): SiteKitCatalogGroup[] {
  const buckets = new Map<SiteKitCatalogGroupId, SiteKitCatalogEntry[]>()
  for (const entry of entries) {
    const groupId = GROUP_BY_ID[entry.id] ?? 'content'
    const list = buckets.get(groupId) ?? []
    list.push(entry)
    buckets.set(groupId, list)
  }
  return GROUP_ORDER.filter((id) => (buckets.get(id)?.length ?? 0) > 0).map((id) => ({
    id,
    items: buckets.get(id) ?? [],
  }))
}
