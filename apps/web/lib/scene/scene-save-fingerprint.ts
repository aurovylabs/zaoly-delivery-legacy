import type { CompositionScene, PrintPresetId } from '@zaoly/contracts'
import type { EditorBreakpoint } from './breakpoints'

/**
 * Full-document save fingerprint — use at save boundaries (P78), not per React render.
 * Spec: specs/domain/scene-core-split-w5.md (W5f) · knowledge/scene-core-split.md
 */
export function sceneSaveFingerprint(
  scene: CompositionScene,
  bp: EditorBreakpoint,
  printPreset: PrintPresetId,
): string {
  return JSON.stringify({ ...scene, activeBreakpoint: bp, activePrintPreset: printPreset })
}

/** O(1) dirty identity — mutation revision + viewport document lanes. */
export type SceneDirtyIdentity = {
  revision: number
  activeBreakpoint: EditorBreakpoint
  activePrintPreset: PrintPresetId
}

export function sceneDirtyIdentityKey(id: SceneDirtyIdentity): string {
  return `${id.revision}|${id.activeBreakpoint}|${id.activePrintPreset}`
}

export function isSceneDirty(live: SceneDirtyIdentity, saved: SceneDirtyIdentity): boolean {
  return sceneDirtyIdentityKey(live) !== sceneDirtyIdentityKey(saved)
}
