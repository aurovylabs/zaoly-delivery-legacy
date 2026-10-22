import { describe, expect, it } from 'vitest'
import { EXPERIENCE_TOUR, EXPERIENCE_TOUR_COMPACT } from '../lib/landing/experience-tour'

describe('landing experience tour script', () => {
  it('keeps a compact tour for the home stage', () => {
    expect(EXPERIENCE_TOUR_COMPACT).toHaveLength(12)
    expect(EXPERIENCE_TOUR_COMPACT.filter((frame) => frame.chapter === 'kit').map((frame) => frame.step)).toEqual([
      'content',
      'layout',
      'page',
    ])
  })

  it('keeps a full tour covering every kit category through page', () => {
    expect(EXPERIENCE_TOUR).toHaveLength(17)
    expect(EXPERIENCE_TOUR.filter((frame) => frame.chapter === 'kit').map((frame) => frame.step)).toEqual([
      'content',
      'form',
      'media',
      'layout',
      'data',
      'page',
    ])
    expect(EXPERIENCE_TOUR.filter((frame) => frame.chapter === 'screens').map((frame) => frame.step)).toEqual([
      'desktop',
      'tablet',
      'mobile',
    ])
    expect(EXPERIENCE_TOUR.at(-1)).toEqual({ chapter: 'path', step: 'code' })
  })
})
