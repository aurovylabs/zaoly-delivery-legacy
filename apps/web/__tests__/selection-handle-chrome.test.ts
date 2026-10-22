import { describe, expect, it } from 'vitest'
import {
  resolveSelectionHandleChromeVars,
  snapCssLengthToDevicePx,
} from '../lib/editor/selection-handle-chrome'

describe('selection-handle-chrome', () => {
  it('snaps lengths to device pixels', () => {
    expect(snapCssLengthToDevicePx(8, 2)).toBe(8)
    expect(snapCssLengthToDevicePx(8, 1.5)).toBe(8)
  })

  it('exports handle size and offset CSS vars', () => {
    const vars = resolveSelectionHandleChromeVars(2)
    expect(vars['--creation-selection-handle-size']).toBe('8px')
    expect(vars['--creation-selection-handle-offset']).toBe('4px')
    expect(vars['--creation-selection-border-width']).toBe('1px')
  })
})
