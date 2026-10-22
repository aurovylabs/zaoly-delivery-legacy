import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { materializeNodeForBreakpoint } from '../scene/materialize-for-magazine'
import { resolvePrimaryBreakpoint } from '../scene/primary-breakpoint'
import { materializeScenePages } from '../scene/scene-pages'
import { collectPrintPages } from './collect-print-pages'

/**
 * Collect printable Mag pages from every scene page in `pages[]` order (P81.1).
 * Each page root is materialized on the print OP-9 lane before walking PrintPage nodes.
 */
export function collectScenePrintPages(scene: CompositionScene): SceneNode[] {
  const materialized = materializeScenePages(scene)
  const primary = resolvePrimaryBreakpoint(scene)
  const pages = materialized.pages
  if (!pages?.length) {
    return collectPrintPages(
      materializeNodeForBreakpoint(materialized.root, 'print', primary),
    )
  }
  const out: SceneNode[] = []
  for (const page of pages) {
    const root = materializeNodeForBreakpoint(page.root, 'print', primary)
    out.push(...collectPrintPages(root))
  }
  return out
}
