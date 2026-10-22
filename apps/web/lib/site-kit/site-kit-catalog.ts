/** Client-safe Site Kit atom catalog — re-exported from `@zaoly/site-kit`. */
import {
  SITE_KIT_CATALOG,
  type SiteKitCatalogEntry,
} from '@zaoly/site-kit'

export { SITE_KIT_CATALOG, type SiteKitCatalogEntry }

export function findSiteKitEntry(componentId: string): SiteKitCatalogEntry | undefined {
  return SITE_KIT_CATALOG.find((e) => e.id === componentId)
}
