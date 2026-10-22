import { describe, expect, it } from 'vitest'
import {
  applyPickerHex,
  convertColorFormat,
  detectColorFormat,
  isValidCssColor,
  toPickerHex,
} from '../lib/tokens/color-css'

describe('color-css', () => {
  it('validates and detects hex / rgb / hsl / oklch', () => {
    expect(isValidCssColor('#1f44ff')).toBe(true)
    expect(isValidCssColor('rgba(31, 68, 255, 0.5)')).toBe(true)
    expect(isValidCssColor('hsl(230 100% 56%)')).toBe(true)
    expect(isValidCssColor('oklch(0.51 0.27 266)')).toBe(true)
    expect(isValidCssColor('not-a-color')).toBe(false)
    expect(detectColorFormat('#1f44ff')).toBe('hex')
    expect(detectColorFormat('rgb(31, 68, 255)')).toBe('rgb')
    expect(detectColorFormat('hsla(230, 100%, 56%, 0.5)')).toBe('hsl')
    expect(detectColorFormat('oklch(0.51 0.27 266)')).toBe('oklch')
  })

  it('converts between formats and preserves alpha on picker edits', () => {
    const rgb = convertColorFormat('#1f44ff', 'rgb')
    expect(rgb).toMatch(/^rgb\(/i)
    expect(convertColorFormat('#1f44ff', 'hsl')).toMatch(/^hsl/i)
    expect(convertColorFormat('#1f44ff', 'oklch')).toMatch(/^oklch\(/i)
    expect(toPickerHex('rgba(31, 68, 255, 0.5)')).toBe('#1f44ff')
    const next = applyPickerHex('rgba(31, 68, 255, 0.5)', '#00ca55')
    expect(next).toMatch(/^rgba\(/i)
    expect(next).toContain('0.5')
  })
})
