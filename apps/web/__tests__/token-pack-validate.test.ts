import { describe, expect, it } from 'vitest'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import {
  buildResolveCssFromLeaves,
  validateStudioLeafWrite,
} from '../lib/tokens/pack-validate'
import { paths } from '../lib/paths'

const pack: ZaolyPackLeaf[] = [
  {
    path: 'color.action.primary',
    type: 'color',
    value: JSON.stringify({ digital: { hex: '#1f44ff' } }),
    status: 'active',
  },
  {
    path: 'spacing.static.medium',
    type: 'spacing',
    value: JSON.stringify({ digital: '1rem' }),
    status: 'active',
  },
  {
    path: 'spacing.static.large',
    type: 'spacing',
    value: JSON.stringify({ digital: 'calc({spacing.static.medium} * 2)' }),
    status: 'active',
  },
]

describe('token pack validate', () => {
  const resolveCss = buildResolveCssFromLeaves(pack)

  it('accepts a valid color literal', () => {
    expect(
      validateStudioLeafWrite({
        path: 'color.action.primary',
        type: 'color',
        value: JSON.stringify({ digital: { hex: '#112233' } }),
        resolveCss,
      }),
    ).toEqual({ ok: true })
  })

  it('rejects invalid path / type / empty digital', () => {
    expect(
      validateStudioLeafWrite({
        path: 'color.bad',
        type: 'spacing',
        value: JSON.stringify({ digital: '1rem' }),
        resolveCss,
      }).ok,
    ).toBe(false)
    expect(
      validateStudioLeafWrite({
        path: 'color.action.primary',
        type: 'nope',
        value: JSON.stringify({ digital: { hex: '#112233' } }),
        resolveCss,
      }),
    ).toEqual({ ok: false, error: 'invalid_type' })
    expect(
      validateStudioLeafWrite({
        path: 'color.action.primary',
        type: 'color',
        value: JSON.stringify({ digital: {} }),
        resolveCss,
      }),
    ).toEqual({ ok: false, error: 'invalid_value' })
  })

  it('rejects oversized values', () => {
    const huge = JSON.stringify({ digital: { hex: `#${'a'.repeat(paths.tokenPackMaxValueBytes)}` } })
    expect(
      validateStudioLeafWrite({
        path: 'color.action.primary',
        type: 'color',
        value: huge,
        resolveCss,
        maxValueBytes: paths.tokenPackMaxValueBytes,
      }),
    ).toEqual({ ok: false, error: 'value_too_large' })
  })

  it('rejects expression cycles', () => {
    expect(
      validateStudioLeafWrite({
        path: 'spacing.static.medium',
        type: 'spacing',
        value: JSON.stringify({ digital: 'calc({spacing.static.large} * 2)' }),
        resolveCss,
      }),
    ).toEqual({ ok: false, error: 'expr_cycle' })
  })

  it('accepts a safe spacing scale expression', () => {
    expect(
      validateStudioLeafWrite({
        path: 'spacing.static.xlarge',
        type: 'spacing',
        value: JSON.stringify({ digital: 'calc({spacing.static.medium} * 3)' }),
        resolveCss,
      }),
    ).toEqual({ ok: true })
  })

  it('rejects structured leaves that omit required digital fields', () => {
    expect(
      validateStudioLeafWrite({
        path: 'shadow.elevation.md',
        type: 'shadow',
        value: JSON.stringify({ digital: { blur: '8px' } }),
        resolveCss,
      }),
    ).toEqual({ ok: false, error: 'invalid_value' })
    expect(
      validateStudioLeafWrite({
        path: 'shadow.elevation.md',
        type: 'shadow',
        value: JSON.stringify({
          digital: {
            offsetY: '4px',
            blur: '12px',
            color: 'rgba(0,0,0,0.2)',
          },
        }),
        resolveCss,
      }),
    ).toEqual({ ok: true })
  })
})
