import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TokenKindGlyph, tokenKindGlyphId } from './TokenKindGlyph'

afterEach(() => {
  cleanup()
})

describe('TokenKindGlyph', () => {
  it('renders ui-icon without hardcoded fills', () => {
    const { container } = render(<TokenKindGlyph id="shadow" />)
    const svg = container.querySelector('svg')
    expect(svg?.classList.contains('ui-icon')).toBe(true)
    expect(svg?.classList.contains('ds-token-kind-glyph')).toBe(true)
    expect(container.innerHTML).not.toMatch(/#fff|#ffffff|#000/i)
  })

  it('maps studio types to glyph ids', () => {
    expect(tokenKindGlyphId('spacing')).toBe('space')
    expect(tokenKindGlyphId('typography')).toBe('type')
    expect(tokenKindGlyphId('asset')).toBe('asset')
    expect(tokenKindGlyphId('all')).toBe('all')
    expect(tokenKindGlyphId('layout.grid')).toBe('size')
    expect(tokenKindGlyphId('border')).toBe('radius')
    expect(tokenKindGlyphId('clearspace')).toBe('space')
  })
})
