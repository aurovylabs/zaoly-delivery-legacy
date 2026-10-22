import { describe, expect, it } from 'vitest'
import {
  isSuitableMagPaper,
  MAG_PAPER_MIN_LUMINANCE,
  relativeLuminance,
  sanitizeMagPaper,
} from '../lib/magazine-pdf/mag-paper'
import { withCanvasFontFallback } from '../lib/inspect/resolve-bindings'
import { magColors } from '@zaoly/ui/mag'

describe('mag-paper luminance guard', () => {
  it('treats DS cream and light brand paper as suitable', () => {
    expect(isSuitableMagPaper(magColors.paper)).toBe(true)
    expect(isSuitableMagPaper('#fff8f0')).toBe(true)
    expect(isSuitableMagPaper('#ffffff')).toBe(true)
    expect(relativeLuminance(magColors.paper)!).toBeGreaterThanOrEqual(MAG_PAPER_MIN_LUMINANCE)
  })

  it('rejects dark UI chrome backgrounds', () => {
    expect(isSuitableMagPaper('#0f0f12')).toBe(false)
    expect(isSuitableMagPaper('#141414')).toBe(false)
    expect(sanitizeMagPaper('#0f0f12')).toBeUndefined()
    expect(sanitizeMagPaper('#f8f7f4')).toBe('#f8f7f4')
  })
})

describe('withCanvasFontFallback', () => {
  it('appends sans generic when family has no fallback', () => {
    expect(withCanvasFontFallback('Geist')).toBe('Geist, system-ui, sans-serif')
    expect(withCanvasFontFallback('Noto Sans')).toBe('Noto Sans, system-ui, sans-serif')
  })

  it('leaves stacks that already include a generic alone', () => {
    expect(withCanvasFontFallback("'Noto Sans', system-ui, sans-serif")).toBe(
      "'Noto Sans', system-ui, sans-serif",
    )
  })
})
