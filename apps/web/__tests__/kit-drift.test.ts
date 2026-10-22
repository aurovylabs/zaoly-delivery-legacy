import { describe, expect, it } from 'vitest'
import type { SceneMaster } from '@zaoly/contracts'
import {
  assessKitDrift,
  classifyKitDrift,
  kitDriftDismissFingerprint,
} from '../lib/site-kit/kit-drift'

const master = (partial: Partial<SceneMaster> & Pick<SceneMaster, 'id' | 'name'>): SceneMaster => ({
  root: { id: 'r', type: 'SiteButton', children: [] },
  sourceKey: 'SiteButton',
  ...partial,
})

describe('kit-drift', () => {
  it('classifies synced / kit-newer / never-pulled / unknown', () => {
    expect(classifyKitDrift('override:a', 'override:a')).toBe('synced')
    expect(classifyKitDrift('override:a', 'override:b')).toBe('kit-newer')
    expect(classifyKitDrift(undefined, 'catalog:SiteButton')).toBe('never-pulled')
    expect(classifyKitDrift('override:a', null)).toBe('unknown')
  })

  it('summarizes actionable Masters for the drift banner', () => {
    const summary = assessKitDrift(
      [
        master({ id: 'm1', name: 'CTA', kitRevision: 'override:old' }),
        master({ id: 'm2', name: 'Fresh', kitRevision: 'catalog:SiteButton' }),
        master({ id: 'm3', name: 'New' }),
      ],
      new Map([
        ['SiteButton', 'catalog:SiteButton'],
      ]),
    )
    // m1: sourceKey SiteButton → kit-newer (old vs catalog)
    // m2: synced
    // m3: never-pulled (classified, not banner-actionable)
    expect(summary.kitNewerCount).toBe(1)
    expect(summary.neverPulledCount).toBe(1)
    expect(summary.actionable.map((r) => r.masterId)).toEqual(['m1'])
    expect(kitDriftDismissFingerprint('scene-1', summary.fingerprint)).toContain('scene-1::')
  })

  it('does not treat never-pulled catalog Masters as banner drift', () => {
    const summary = assessKitDrift(
      [
        master({ id: 'm-btn', name: 'Button', sourceKey: 'SiteButton' }),
        master({ id: 'm-text', name: 'Text', sourceKey: 'SiteText', root: { id: 'r', type: 'SiteText', children: [] } }),
      ],
      new Map([
        ['SiteButton', 'catalog:SiteButton'],
        ['SiteText', 'catalog:SiteText'],
      ]),
    )
    expect(summary.actionable).toHaveLength(0)
    expect(summary.neverPulledCount).toBe(2)
    expect(summary.rows.every((r) => r.kind === 'never-pulled')).toBe(true)
  })
})
