/**
 * Catalog base id for Kit seed diff (SK-V20).
 * Never use `includes('~')` — Atom forks also contain `~`.
 */
import {
  atomBaseTypeFromOverrideId,
  isNamespacedAtomOverrideId,
} from './override-ids'
import { findSiteKitEntry } from './site-kit-catalog'
import { kitPlaygroundKind } from './kit-playground-kind'

/** Catalog `Site*` id to fetch as Diff original, or null for Patterns / unknown. */
export function kitSeedDiffBaseId(componentId: string): string | null {
  const id = componentId.trim()
  if (!id) return null
  const kind = kitPlaygroundKind(id)
  if (kind === 'pattern' || kind === 'section') return null
  if (isNamespacedAtomOverrideId(id)) {
    const base = atomBaseTypeFromOverrideId(id)
    return base && findSiteKitEntry(base) ? base : null
  }
  return findSiteKitEntry(id) ? id : null
}
