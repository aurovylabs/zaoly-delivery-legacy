/**
 * Kit Playground selection kind (SK-V19 / SK-V22).
 * Never use `includes('~')` — Atom forks also contain `~`.
 */
import {
  isCompositionOverrideId,
  isNamespacedAtomOverrideId,
} from './override-ids'
import { findSiteKitEntry } from './site-kit-catalog'
import { isZaolyStarterSectionComponentId } from './zaoly-starter-sections'

export type KitPlaygroundKind = 'atom' | 'pattern' | 'section'

export function kitPlaygroundKind(componentId: string): KitPlaygroundKind {
  const id = componentId.trim()
  if (!id) return 'atom'
  if (isZaolyStarterSectionComponentId(id)) return 'section'
  if (isCompositionOverrideId(id)) return 'pattern'
  if (isNamespacedAtomOverrideId(id)) return 'atom'
  if (findSiteKitEntry(id)) return 'atom'
  // Legacy Composition{Name} without tilde is covered by isCompositionOverrideId.
  if (id.startsWith('Composition')) return 'pattern'
  return 'atom'
}
