import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ColorPicker } from './ColorPicker'
import { formatHex, normalizeHex, parseHex, rgbToHsv, hsvToRgb } from './color-utils'

afterEach(() => {
  cleanup()
})

describe('color-utils', () => {
  it('round-trips hex including alpha', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc')
    expect(normalizeHex('#FF000080')).toBe('#ff000080')
    expect(formatHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#ff0000')
    expect(parseHex('#00ff00')).toEqual({ r: 0, g: 255, b: 0, a: 1 })
  })

  it('hsv ↔ rgb stays in range', () => {
    const { h, s, v } = rgbToHsv(128, 64, 200)
    const rgb = hsvToRgb(h, s, v)
    expect(rgb.r).toBeGreaterThanOrEqual(0)
    expect(rgb.r).toBeLessThanOrEqual(255)
  })
})

describe('ColorPicker', () => {
  it('opens panel and commits hex', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#112233" onChange={onChange} defaultOpen />)
    expect(screen.getByTestId('color-picker-panel')).toBeInTheDocument()
    const hex = screen.getByTestId('color-picker-hex')
    fireEvent.change(hex, { target: { value: '#ff0000' } })
    fireEvent.blur(hex)
    expect(onChange).toHaveBeenCalledWith('#ff0000')
  })

  it('alpha yields 8-digit hex', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#112233" onChange={onChange} defaultOpen />)
    fireEvent.change(screen.getByTestId('color-picker-alpha'), { target: { value: '50' } })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.at(-1)?.[0] as string
    expect(last).toMatch(/^#[0-9a-f]{8}$/)
  })

  it('syncs RGB tab into onChange', () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#000000" onChange={onChange} defaultOpen />)
    fireEvent.click(screen.getByTestId('color-picker-tab-rgb'))
    fireEvent.change(screen.getByTestId('color-picker-rgb-r'), { target: { value: '255' } })
    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.at(-1)?.[0] as string
    expect(last.startsWith('#ff')).toBe(true)
  })

  it('hides eyedropper without EyeDropper API', () => {
    render(<ColorPicker value="#000" defaultOpen />)
    expect(screen.queryByTestId('color-picker-eyedropper')).toBeNull()
  })

  it('Escape closes the panel', () => {
    const onOpenChange = vi.fn()
    render(<ColorPicker value="#000" open onOpenChange={onOpenChange} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
