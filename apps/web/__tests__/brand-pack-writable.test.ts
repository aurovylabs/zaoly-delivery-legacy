import { describe, expect, it } from 'vitest'
import {
  isBrandPackPromoteWritable,
  isLocalPackWritable,
  isLocalPromotePreview,
  isLiveUpstreamPackWritable,
} from '../lib/inspect/brand-pack-writable'
import type { BrandTokenPackResponse } from '../lib/inspect/token-catalog'

const local: BrandTokenPackResponse = {
  source: 'local',
  guidelineId: null,
  platformProjectId: '',
  tokens: [],
  canWrite: true,
}

const fixture: BrandTokenPackResponse = {
  source: 'fixture',
  guidelineId: null,
  platformProjectId: '',
  tokens: [],
}

describe('brand-pack-writable', () => {
  it('treats local pack with canWrite as writable', () => {
    expect(isLocalPackWritable(local)).toBe(true)
    expect(isBrandPackPromoteWritable(local)).toBe(true)
    expect(isLiveUpstreamPackWritable(local)).toBe(false)
    expect(isLocalPromotePreview(local)).toBe(false)
  })

  it('hides promote on fixture packs and read-only local packs', () => {
    expect(isBrandPackPromoteWritable(fixture)).toBe(false)
    expect(isBrandPackPromoteWritable({ ...local, canWrite: false })).toBe(false)
  })
})
