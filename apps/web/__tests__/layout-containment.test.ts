import { describe, expect, it } from 'vitest'
import {
  applyLayoutContainment,
  resolveNodePaintStyle,
} from '../lib/inspect/resolve-bindings'

describe('layout containment (nested hug/fill inside fixed parent)', () => {
  it('hug (auto) gets minWidth 0 and maxWidth 100%', () => {
    const style = resolveNodePaintStyle({ width: 'auto' })
    expect(style.minWidth).toBe(0)
    expect(style.maxWidth).toBe('100%')
    expect(style.boxSizing).toBe('border-box')
  })

  it('fill (100%) gets minWidth 0 and maxWidth 100%', () => {
    const style = resolveNodePaintStyle({ width: '100%' })
    expect(style.width).toBe('100%')
    expect(style.minWidth).toBe(0)
    expect(style.maxWidth).toBe('100%')
  })

  it('unset width (default hug) still gets containment', () => {
    const style = resolveNodePaintStyle({})
    expect(style.minWidth).toBe(0)
    expect(style.maxWidth).toBe('100%')
  })

  it('fixed width keeps literal and does not force maxWidth', () => {
    const style = resolveNodePaintStyle({ width: 400 })
    expect(style.width).toBe(400)
    expect(style.maxWidth).toBeUndefined()
    expect(style.minWidth).toBe(0)
  })

  it('explicit maxWidth / minWidth win over containment defaults', () => {
    const style = resolveNodePaintStyle({
      width: '100%',
      maxWidth: '320px',
      minWidth: '40px',
    })
    expect(style.maxWidth).toBe('320px')
    expect(style.minWidth).toBe('40px')
  })

  it('applyLayoutContainment is idempotent for hug', () => {
    const once = applyLayoutContainment({ width: 'auto' })
    const twice = applyLayoutContainment(once)
    expect(twice).toEqual(once)
  })
})
