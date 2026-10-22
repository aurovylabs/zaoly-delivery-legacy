/**
 * CREATION editor palette = Site Kit (+ Patterns). Catalog helpers remain for
 * resolve/render of legacy/demo nodes — not shown in the insert palette.
 * Spec: specs/domain/site-kit.md · knowledge/site-kit-atoms-first.md
 */
import {
  CATALOG_LAYER_ORDER,
  catalogInsertType,
  insertableCatalogEntries,
  type CatalogLayer,
} from '@zaoly/ui'
import {
  SITE_KIT_PALETTE_LAYER,
  SITE_KIT_PATTERNS_LAYER,
  SITE_KIT_SECTIONS_LAYER,
  siteKitPaletteItems,
  isSiteKitInsertableType,
  isSiteKitPaletteType,
  type SiteKitPaletteItem,
} from './site-kit-palette'
import { zaolyLandingSectionPaletteItems } from './zaoly-landing-section-catalog'

export type EditorPaletteLayer =
  | CatalogLayer
  | typeof SITE_KIT_PALETTE_LAYER
  | typeof SITE_KIT_PATTERNS_LAYER
  | typeof SITE_KIT_SECTIONS_LAYER

/** Site + Patterns first; catalog layers kept only for grouping catalogPaletteItems(). */
export const EDITOR_PALETTE_LAYER_ORDER: readonly EditorPaletteLayer[] = [
  SITE_KIT_PALETTE_LAYER,
  SITE_KIT_SECTIONS_LAYER,
  SITE_KIT_PATTERNS_LAYER,
  ...CATALOG_LAYER_ORDER,
]

export type CatalogPaletteItem = {
  id: string
  label: string
  layer: EditorPaletteLayer
  insertType: string
}

export function catalogPaletteItems(): CatalogPaletteItem[] {
  const items: CatalogPaletteItem[] = []
  for (const entry of insertableCatalogEntries()) {
    const insertType = catalogInsertType(entry)
    if (!insertType) continue
    items.push({
      id: entry.id,
      label: entry.id === insertType ? entry.id : `${entry.id} → ${insertType}`,
      layer: entry.layer,
      insertType,
    })
  }
  return items
}

/** Editor insert palette: Site Kit atoms/layout only (+ Patterns via patternPaletteItems). */
export function editorPaletteItems(): CatalogPaletteItem[] {
  return [...siteKitPaletteItems()]
}

export function resolveCatalogInsertType(type: string): string {
  const match = catalogPaletteItems().find((item) => item.id === type)
  return match?.insertType ?? type
}

export function resolveEditorInsertType(type: string): string {
  if (type.startsWith('Composition:')) return type
  if (isSiteKitPaletteType(type) || isSiteKitInsertableType(type)) return type
  return resolveCatalogInsertType(type)
}

export function isCatalogInsertableType(type: string): boolean {
  return catalogPaletteItems().some((item) => item.id === type || item.insertType === type)
}

/** Types the designer may insert from the palette / drop (Site Kit + compositions). */
export function isEditorInsertableType(type: string): boolean {
  return (
    isSiteKitPaletteType(type) ||
    type.startsWith('Composition:') ||
    isSiteKitInsertableType(type)
  )
}

export function landingSectionPaletteItems(): SiteKitPaletteItem[] {
  return zaolyLandingSectionPaletteItems().map((item) => ({
    ...item,
    layer: SITE_KIT_SECTIONS_LAYER,
  }))
}

/** User-saved Site Kit compositions as Patterns palette group. */
export function patternPaletteItems(
  compositions: Array<{ exportName: string }>,
): SiteKitPaletteItem[] {
  return compositions.map((c) => ({
    id: `Composition:${c.exportName}`,
    label: c.exportName,
    layer: SITE_KIT_PATTERNS_LAYER,
    insertType: `Composition:${c.exportName}`,
  }))
}

export function groupCatalogPaletteItems<T extends { layer: EditorPaletteLayer }>(
  items: T[],
): Array<{ id: EditorPaletteLayer; items: T[] }> {
  return EDITOR_PALETTE_LAYER_ORDER.map((layer) => ({
    id: layer,
    items: items.filter((item) => item.layer === layer),
  })).filter((group) => group.items.length > 0)
}
