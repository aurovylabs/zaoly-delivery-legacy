/**
 * Client-safe: which Scene Masters publish to Site Kit.
 * Spec: site-kit.md §5b
 */
import type { SceneMaster } from '@zaoly/contracts'
import { listMasterVariants } from '../scene/master-variants'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'

/** Masters whose root type is a Site Kit catalog atom — one per componentId. */
export function collectPublishableMasters(masters: SceneMaster[]): SceneMaster[] {
  const byType = new Map<string, SceneMaster>()
  for (const master of masters) {
    const type = master.root?.type
    if (!type || !isSiteKitInsertableType(type)) continue
    const existing = byType.get(type)
    if (!existing) {
      byType.set(type, master)
      continue
    }
    const nextCount = listMasterVariants(master).length
    const prevCount = listMasterVariants(existing).length
    if (nextCount >= prevCount) byType.set(type, master)
  }
  return [...byType.values()]
}
