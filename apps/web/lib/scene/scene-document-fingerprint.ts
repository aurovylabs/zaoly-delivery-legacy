import type { CompositionScene } from '@zaoly/contracts'
import { withPrunedComments } from '../scene-comments'

const fingerprintCache = new WeakMap<object, string>()

/** Stable document key for expand cache (excludes session breakpoint / print preset). */
export function sceneDocumentFingerprint(scene: CompositionScene): string {
  const cached = fingerprintCache.get(scene)
  if (cached) return cached
  const scrubbed = withPrunedComments(scene)
  const { activeBreakpoint: _bp, activePrintPreset: _pp, ...doc } = scrubbed
  const fp = JSON.stringify(doc)
  fingerprintCache.set(scene, fp)
  return fp
}
