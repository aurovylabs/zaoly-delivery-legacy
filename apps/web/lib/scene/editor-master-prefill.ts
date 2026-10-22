/**
 * Editor-open Master prefill: Site Kit atoms + starter landing sections.
 * Spec: `composition-masters.md` · `zaoly-landing-section-masters.md`
 */
import type { CompositionScene } from '@zaoly/contracts'
import { seedSiteKitPaletteMasters } from './ops'
import { seedZaolyLandingSectionMasters } from './zaoly-default-landing-scene'

export function seedEditorPrefillMasters(scene: CompositionScene): CompositionScene {
  return seedZaolyLandingSectionMasters(seedSiteKitPaletteMasters(scene))
}
