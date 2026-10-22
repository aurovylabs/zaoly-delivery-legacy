import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BODY_TYPE_BINDINGS,
  DEFAULT_HEADLINE_TYPE_BINDINGS,
  INSPECT_TOKEN_CATALOG,
  mergeLivePackIntoCatalog,
  previewForBinding,
  tokenByPath,
  tokenDisplayLabel,
  tokenPickerOptionLabel,
  tokensForGroup,
} from '../lib/inspect/token-catalog'
import { resolveTokenBindingsToStyle } from '../lib/inspect/resolve-bindings'

const FORBIDDEN_PATHS = ['space.md', 'fontSize.xl', 'fontFamily.sans']

describe('Zaoly starter token vocabulary', () => {
  it('catalog uses pack paths and drops invented aliases', () => {
    const paths = INSPECT_TOKEN_CATALOG.map((t) => t.path)
    expect(paths).toContain('color.action.primary')
    expect(paths).toContain('color.ink')
    expect(paths).toContain('spacing.static.medium')
    expect(paths).toContain('typography.heading.h1')
    expect(paths).toContain('glow.accent')
    expect(paths).toContain('effect.blur.md')
    expect(paths).toContain('motion.base')
    expect(paths).toContain('radius.control.md')
    for (const banned of FORBIDDEN_PATHS) {
      expect(paths).not.toContain(banned)
    }
    expect(paths.some((p) => p.startsWith('space.'))).toBe(false)
    expect(paths.some((p) => p.startsWith('fontSize.'))).toBe(false)
  })

  it('maps inspect groups onto pack prefixes', () => {
    expect(tokensForGroup('space').every((t) => t.path.startsWith('spacing.'))).toBe(true)
    expect(tokensForGroup('fontSize').every((t) => t.path.startsWith('typography.'))).toBe(true)
    expect(tokensForGroup('fontFamily').map((t) => t.path)).toEqual(
      tokensForGroup('fontWeight').map((t) => t.path),
    )
  })

  it('demo type bindings share one typography leaf per role', () => {
    expect(DEFAULT_HEADLINE_TYPE_BINDINGS.fontFamily).toBe('typography.heading.h1')
    expect(DEFAULT_HEADLINE_TYPE_BINDINGS.fontSize).toBe('typography.heading.h1')
    expect(DEFAULT_HEADLINE_TYPE_BINDINGS.color).toBe('color.ink')
    expect(DEFAULT_BODY_TYPE_BINDINGS.fontSize).toBe('typography.body.family')
  })

  it('resolves typography facets from one path', () => {
    const leaf = tokenByPath('typography.heading.h1')
    expect(leaf).toBeDefined()
    expect(previewForBinding(leaf!, 'fontFamily')).toBe('Geist')
    expect(previewForBinding(leaf!, 'fontSize')).toBe('2rem')
    expect(previewForBinding(leaf!, 'fontWeight')).toBe('600')
    const style = resolveTokenBindingsToStyle({
      fontFamily: 'typography.heading.h1',
      fontSize: 'typography.heading.h1',
      fontWeight: 'typography.heading.h1',
      color: 'color.ink',
    })
    expect(style.fontFamily).toMatch(/^Geist/)
    expect(style.fontSize).toBe('2rem')
    expect(style.fontWeight).toBe('600')
    expect(style.color).toBe('#1e1b17')
  })

  it('picker labels lead with resolved typography facets', () => {
    const body = tokenByPath('typography.body.family')!
    const h1 = tokenByPath('typography.heading.h1')!
    expect(tokenDisplayLabel(body)).toBe('Body')
    expect(tokenPickerOptionLabel(body, 'fontFamily')).toBe('Geist · Body')
    expect(tokenPickerOptionLabel(body, 'fontSize')).toBe('1rem · Body')
    expect(tokenPickerOptionLabel(body, 'fontWeight')).toBe('400 · Body')
    expect(tokenPickerOptionLabel(body, 'lineHeight')).toBe('1.5 · Body')
    expect(tokenPickerOptionLabel(h1, 'fontFamily')).toBe('Geist · H1')
    expect(tokenPickerOptionLabel(h1, 'fontSize')).toBe('2rem · H1')
    expect(tokenPickerOptionLabel(h1, 'fontWeight')).toBe('600 · H1')
  })

  it('skips missing typography facets instead of guessing', () => {
    const style = resolveTokenBindingsToStyle({
      letterSpacing: 'typography.body.family',
    })
    expect(style.letterSpacing).toBeUndefined()
  })
})

describe('live pack merge', () => {
  it('overlays live active leaves, omits pending, keeps blur/rotate/gradient', () => {
    const merged = mergeLivePackIntoCatalog([
      {
        path: 'color.action.primary',
        type: 'color',
        value: JSON.stringify({ digital: { hex: '#00ff88' } }),
        status: 'active',
      },
      {
        path: 'spacing.fluid.medium',
        type: 'spacing',
        value: JSON.stringify({ digital: 'clamp(1rem, 2vw, 1.5rem)' }),
        status: 'pending',
      },
      {
        path: 'color.action.live-only',
        type: 'color',
        value: JSON.stringify({ digital: { hex: '#111111' } }),
        status: 'active',
      },
    ])
    expect(tokenByPath('color.action.primary', merged)?.preview).toBe('#00ff88')
    expect(tokensForGroup('color', merged).some((t) => t.path === 'color.action.live-only')).toBe(
      true,
    )
    expect(merged.some((t) => t.path === 'spacing.fluid.medium')).toBe(false)
    expect(tokensForGroup('space', merged).every((t) => t.status !== 'pending')).toBe(true)
    expect(tokensForGroup('blur', merged).some((t) => t.path === 'blur.sm')).toBe(true)
    expect(tokensForGroup('rotate', merged).some((t) => t.path === 'rotate.15')).toBe(true)
    expect(tokensForGroup('gradient', merged).some((t) => t.path === 'gradient.accent')).toBe(true)
    const style = resolveTokenBindingsToStyle(
      { color: 'color.action.primary' },
      undefined,
      merged,
    )
    expect(style.color).toBe('#00ff88')
  })
})
