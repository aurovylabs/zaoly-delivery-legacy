import { describe, expect, it } from 'vitest'
import {
  SITE_SVG_DEFAULT_MARK_ID,
  SITE_SVG_MARKS,
  siteSvgMark,
  siteSvgMarkOptions,
} from './svg-marks'
import { sanitizeSiteSvgMarkup } from './sanitize-svg'

describe('SITE_SVG_MARKS', () => {
  it('ships a closed curated catalog with currentColor paints', () => {
    expect(SITE_SVG_MARKS.length).toBeGreaterThanOrEqual(5)
    expect(siteSvgMark(SITE_SVG_DEFAULT_MARK_ID)?.id).toBe('triangle')
    for (const mark of SITE_SVG_MARKS) {
      const r = sanitizeSiteSvgMarkup(mark.markup)
      expect(r.ok).toBe(true)
      if (r.ok) {
        expect(r.markup).toMatch(/currentColor/)
        expect(r.viewBox).toBe(mark.viewBox)
      }
    }
  })

  it('exposes custom as a non-catalog option', () => {
    expect(siteSvgMark('custom')).toBeUndefined()
    expect(siteSvgMarkOptions().some((o) => o.value === 'custom')).toBe(true)
  })
})
