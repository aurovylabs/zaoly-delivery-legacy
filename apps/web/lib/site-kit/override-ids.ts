/**
 * Atom id (`SiteButton`), Collection atom fork (`Atom~…~SiteButton`), or Pattern override id.
 * SK-S2: `Composition~{scopeKey}~{ExportName}` (+ legacy `Composition{Name}`).
 * SK-S4: `Atom~{scopeKey}~{SiteType}` Collection forks; seed remains bare catalog id.
 */
import {
  atomBaseTypeFromOverrideId,
  isCompositionOverrideId as isCompositionOverrideIdCore,
  isNamespacedAtomOverrideId,
  parseCompositionComponentId,
} from '@zaoly/site-kit/composition-codegen'
import { findSiteKitEntry } from './site-kit-catalog'
import { isZaolyStarterSectionComponentId } from './zaoly-starter-sections'

export {
  atomBaseTypeFromOverrideId,
  atomForkComponentId,
  isCompositionOverrideId,
  isLegacyCompositionOverrideId,
  isNamespacedAtomOverrideId,
  isNamespacedCompositionOverrideId,
  parseAtomOverrideId,
  parseCompositionComponentId,
} from '@zaoly/site-kit/composition-codegen'

export function isAllowedOverrideId(componentId: string): boolean {
  if (!componentId || componentId.length > 80) return false
  if (findSiteKitEntry(componentId)) return true
  if (isZaolyStarterSectionComponentId(componentId)) return true
  if (isCompositionOverrideIdCore(componentId)) return true
  if (isNamespacedAtomOverrideId(componentId)) {
    const base = atomBaseTypeFromOverrideId(componentId)
    return Boolean(base && findSiteKitEntry(base))
  }
  return false
}

export function exportNameFromCompositionId(componentId: string): string | null {
  return parseCompositionComponentId(componentId)?.exportName ?? null
}
