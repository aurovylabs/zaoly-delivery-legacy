/**
 * Site Kit palette — atoms + layout only (atoms-first handoff).
 * Spec: `specs/domain/site-kit.md` · `knowledge/site-kit-atoms-first.md`
 * Client-safe: do not import `lib/site-kit/write` (node:fs).
 */
import { SITE_KIT_CATALOG } from '@zaoly/site-kit'

export const SITE_KIT_PALETTE_LAYER = 'Site' as const
/** Saved compositions re-inserted as atomic trees (Phase 5). */
export const SITE_KIT_PATTERNS_LAYER = 'Patterns' as const
/** Starter landing section Masters (scene compositions, not package shells). */
export const SITE_KIT_SECTIONS_LAYER = 'Sections' as const

/** Palette insertables — atoms + layout only (no SiteHero package shells). */
export const SITE_KIT_PALETTE_IDS = [
  'SiteButton',
  'SiteText',
  'SiteLink',
  'SiteInput',
  'SiteTextarea',
  'SiteSelect',
  'SiteCheckbox',
  'SiteBadge',
  'SiteChart',
  'SiteGauge',
  'SiteImage',
  'SiteSvg',
  'SiteShape',
  'SiteContainer',
  'SiteStack',
  'SiteGrid',
  'SiteDivider',
  'SiteTable',
  'SiteTableRow',
  'SiteTableCell',
] as const

export type SiteKitPaletteId = (typeof SITE_KIT_PALETTE_IDS)[number]

/**
 * Stable Master id for a palette / composition sourceKey.
 * Must be deterministic across SSR + client so editor boot does not hydrate-mismatch.
 */
export function paletteMasterId(sourceKey: string): string {
  const key = sourceKey.trim()
  if (!key) return 'master-untitled'
  return `master-${key.replace(/[^A-Za-z0-9:_-]/g, '_')}`
}

export type SiteKitPaletteItem = {
  id: string
  label: string
  layer:
    | typeof SITE_KIT_PALETTE_LAYER
    | typeof SITE_KIT_PATTERNS_LAYER
    | typeof SITE_KIT_SECTIONS_LAYER
  insertType: string
}

export function siteKitPaletteItems(): SiteKitPaletteItem[] {
  return SITE_KIT_PALETTE_IDS.map((id) => ({
    id,
    label: id.replace(/^Site/, ''),
    layer: SITE_KIT_PALETTE_LAYER,
    insertType: id,
  }))
}

/** True for kit types in the closed catalog (atoms + layout). */
export function isSiteKitInsertableType(type: string): boolean {
  return SITE_KIT_CATALOG.some((entry) => entry.id === type)
}

export function isSiteKitPaletteType(type: string): boolean {
  return (SITE_KIT_PALETTE_IDS as readonly string[]).includes(type)
}

/** Drop targets for nesting atoms — layout only. */
export const SITE_KIT_CONTAINER_TYPES = [
  'SiteContainer',
  'SiteStack',
  'SiteGrid',
  'SiteTable',
  'SiteTableRow',
  'SiteTableCell',
] as const

export function isSiteKitContainerType(type: string): boolean {
  return (SITE_KIT_CONTAINER_TYPES as readonly string[]).includes(type)
}
