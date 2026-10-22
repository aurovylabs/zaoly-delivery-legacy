import { describe, expect, it } from 'vitest'
import {
  normalizeSceneUpdatedAt,
  sceneUpdatedAtEquals,
} from '../lib/scene/normalize-updated-at'

describe('normalizeSceneUpdatedAt', () => {
  it('normalizes PG-like strings to ISO', () => {
    expect(normalizeSceneUpdatedAt('2026-10-04 08:10:00.123+00')).toBe(
      '2026-10-04T08:10:00.123Z',
    )
  })

  it('treats equivalent timestamps as equal', () => {
    expect(
      sceneUpdatedAtEquals('2026-10-04T08:10:00.123Z', '2026-10-04 08:10:00.123+00:00'),
    ).toBe(true)
  })

  it('rejects mismatched locks', () => {
    expect(
      sceneUpdatedAtEquals('2026-10-04T08:10:00.123Z', '2026-10-04T08:10:01.123Z'),
    ).toBe(false)
  })
})
