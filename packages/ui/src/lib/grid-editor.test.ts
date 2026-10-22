import { describe, expect, it } from 'vitest'
import {
  clampColumns,
  formatDigitalLengthFromStagePx,
  gridPreviewPctFromLength,
  patchGridMetrics,
} from '../lib/grid-editor'

describe('grid-editor', () => {
  it('clamps column counts', () => {
    expect(clampColumns(12)).toBe(12)
    expect(clampColumns(0)).toBeUndefined()
    expect(clampColumns(30)).toBe(24)
  })

  it('maps digital lengths to mock percentages', () => {
    expect(gridPreviewPctFromLength('600px', 1200)).toBe('50%')
    expect(gridPreviewPctFromLength('1.5rem', 1200)).toBe('2%')
  })

  it('patches metrics', () => {
    expect(patchGridMetrics({ columns: 12 }, { gutter: '1rem' })).toEqual({
      columns: 12,
      gutter: '1rem',
    })
  })

  it('formats digital lengths from stage px', () => {
    expect(formatDigitalLengthFromStagePx(24, 'rem')).toBe('1.5rem')
    expect(formatDigitalLengthFromStagePx(16, 'px')).toBe('16px')
  })
})
