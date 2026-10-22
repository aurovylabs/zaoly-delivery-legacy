import { describe, expect, it } from 'vitest'
import {
  promoteSiteSvgMarkupToCurrentColor,
  sanitizeSiteSvgMarkup,
  SITE_SVG_PLACEHOLDER_MARKUP,
} from './sanitize-svg'

describe('sanitizeSiteSvgMarkup', () => {
  it('accepts placeholder mark', () => {
    const r = sanitizeSiteSvgMarkup(SITE_SVG_PLACEHOLDER_MARKUP)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.markup).toContain('<svg')
      expect(r.viewBox).toBe('0 0 48 48')
    }
  })

  it('rejects script', () => {
    const r = sanitizeSiteSvgMarkup(
      '<svg><script>alert(1)</script><circle/></svg>',
    )
    expect(r.ok).toBe(false)
  })

  it('strips event handlers', () => {
    const r = sanitizeSiteSvgMarkup(
      '<svg viewBox="0 0 10 10"><circle onclick="evil()" cx="5" cy="5" r="4"/></svg>',
    )
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.markup).not.toMatch(/onclick/i)
      expect(r.stripped).toBe(true)
    }
  })
})

describe('promoteSiteSvgMarkupToCurrentColor', () => {
  it('rewrites hard-coded fill/stroke and leaves currentColor alone', () => {
    const r = promoteSiteSvgMarkupToCurrentColor(
      '<svg viewBox="0 0 10 10"><circle fill="#1a1a1a" stroke="none" cx="5" cy="5" r="4"/><path fill="currentColor" d="M0 0"/></svg>',
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.markup).toMatch(/fill="currentColor"/)
    expect(r.markup).toMatch(/stroke="none"/)
    expect(r.markup).not.toMatch(/#1a1a1a/)
  })
})
