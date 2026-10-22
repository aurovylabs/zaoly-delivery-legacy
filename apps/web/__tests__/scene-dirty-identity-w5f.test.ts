import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { sceneDocumentFingerprint } from '../lib/scene/scene-document-fingerprint'
import {
  isSceneDirty,
  sceneDirtyIdentityKey,
  sceneSaveFingerprint,
} from '../lib/scene/scene-save-fingerprint'

function scene(name: string): CompositionScene {
  return {
    id: 's1',
    name,
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
}

describe('scene dirty identity (W5f)', () => {
  it('isSceneDirty is O(1) key compare', () => {
    const saved = {
      revision: 0,
      activeBreakpoint: 'desktop' as const,
      activePrintPreset: 'a4-portrait' as const,
    }
    expect(
      isSceneDirty(
        { revision: 0, activeBreakpoint: 'desktop', activePrintPreset: 'a4-portrait' },
        saved,
      ),
    ).toBe(false)
    expect(
      isSceneDirty(
        { revision: 1, activeBreakpoint: 'desktop', activePrintPreset: 'a4-portrait' },
        saved,
      ),
    ).toBe(true)
    expect(
      isSceneDirty(
        { revision: 0, activeBreakpoint: 'mobile', activePrintPreset: 'a4-portrait' },
        saved,
      ),
    ).toBe(true)
    expect(sceneDirtyIdentityKey(saved)).toContain('0|desktop|')
  })

  it('sceneSaveFingerprint remains for save boundaries', () => {
    const a = sceneSaveFingerprint(scene('A'), 'desktop', 'a4-portrait')
    const b = sceneSaveFingerprint(scene('B'), 'desktop', 'a4-portrait')
    expect(a).not.toBe(b)
  })

  it('sceneDocumentFingerprint caches per scene object identity', () => {
    const s = scene('Cache')
    const first = sceneDocumentFingerprint(s)
    const second = sceneDocumentFingerprint(s)
    expect(first).toBe(second)
    expect(sceneDocumentFingerprint(scene('Cache'))).toBe(first)
  })
})
