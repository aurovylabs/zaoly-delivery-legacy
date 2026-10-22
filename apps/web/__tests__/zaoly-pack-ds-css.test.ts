import { describe, expect, it } from 'vitest'
import {
  buildTokenPackRootCss,
  buildZaolyPackRootCss,
  collectCompositionBindingPaths,
  starterPackThemeFromResolvedId,
  tokenPackCssForHandoff,
} from '../lib/site-kit/zaoly-pack-ds-css'
import type { InspectTokenOption } from '../lib/inspect/token-catalog'

const catalog: InspectTokenOption[] = [
  {
    path: 'color.action.primary',
    group: 'color',
    label: 'color.action.primary',
    preview: '#1f44ff',
    type: 'color',
  },
  {
    path: 'spacing.static.medium',
    group: 'space',
    label: 'spacing.static.medium',
    preview: '1rem',
    type: 'spacing',
  },
  {
    path: 'color.muted',
    group: 'color',
    label: 'color.muted',
    preview: '#a1a1aa',
    type: 'color',
  },
]

describe('zaoly-pack-ds-css (SK-V15)', () => {
  it('collects unique binding paths from a tree', () => {
    expect(
      collectCompositionBindingPaths({
        type: 'SiteStack',
        tokenBindings: { gap: 'spacing.static.medium' },
        children: [
          {
            type: 'SiteButton',
            tokenBindings: { color: 'color.action.primary', gap: 'spacing.static.medium' },
          },
        ],
      }),
    ).toEqual(['color.action.primary', 'spacing.static.medium'])
  })

  it('emits :root --ds-* for catalog digital previews', () => {
    const css = buildTokenPackRootCss(catalog, {
      onlyPaths: ['color.action.primary', 'spacing.static.medium'],
    })
    expect(css).toContain(':root {')
    expect(css).toContain('--ds-color-action-primary: #1f44ff;')
    expect(css).toContain('--zaoly-color-action-primary: #1f44ff;')
    expect(css).toContain('--ds-spacing-static-medium: 1rem;')
    expect(css).toContain('--zaoly-spacing-static-medium: 1rem;')
    expect(css).not.toContain('--ds-color-muted')
    expect(css).toMatch(/Zaoly local pack/)
    expect(buildZaolyPackRootCss(catalog, { onlyPaths: ['color.action.primary'] })).toContain(
      '--ds-color-action-primary',
    )
  })

  it('dark theme swaps starter color roles that are still at light defaults', () => {
    const cssDark = buildTokenPackRootCss(
      [
        {
          path: 'color.action.primary',
          group: 'color',
          label: 'color.action.primary',
          preview: '#1f44ff',
          type: 'color',
          value: { digital: { hex: '#1f44ff' } },
        },
        {
          path: 'color.background',
          group: 'color',
          label: 'color.background',
          preview: '#f3eee4',
          type: 'color',
          value: { digital: { hex: '#f3eee4' } },
        },
      ],
      { theme: 'dark' },
    )
    expect(cssDark).toContain('--ds-color-action-primary: #3e63ff;')
    expect(cssDark).toContain('--ds-color-background: #201c17;')
    expect(cssDark).toMatch(/\(dark\)/)

    const cssOverride = buildTokenPackRootCss(
      [
        {
          path: 'color.action.primary',
          group: 'color',
          label: 'color.action.primary',
          preview: '#ff00aa',
          type: 'color',
          value: { digital: { hex: '#ff00aa' } },
        },
      ],
      { theme: 'dark' },
    )
    expect(cssOverride).toContain('--ds-color-action-primary: #ff00aa;')
    expect(cssOverride).not.toContain('#3e63ff')
  })

  it('prefers digitalCssForLeaf over raw JSON preview strings', () => {
    const css = buildTokenPackRootCss(
      [
        {
          path: 'color.action.primary',
          group: 'color',
          label: 'color.action.primary',
          preview: '{"hex":"#deadbeef"}',
          type: 'color',
          value: '{"hex":"#00aa00"}',
        },
      ],
      { onlyPaths: ['color.action.primary'] },
    )
    expect(css).toContain('--ds-color-action-primary: #00aa00;')
    expect(css).toContain('--zaoly-color-action-primary: #00aa00;')
    expect(css).not.toContain('deadbeef')
    expect(css).not.toContain('{"hex"')
  })

  it('handoff prefers composition bindings then falls back to full catalog', () => {
    const scoped = tokenPackCssForHandoff(catalog, {
      type: 'SiteButton',
      tokenBindings: { color: 'color.action.primary' },
    })
    expect(scoped).toContain('--ds-color-action-primary')
    expect(scoped).toContain('--zaoly-color-action-primary')
    expect(scoped).not.toContain('--ds-color-muted')

    const full = tokenPackCssForHandoff(catalog, { type: 'SiteButton', props: {} })
    expect(full).toContain('--ds-color-muted')
    expect(full).toContain('--zaoly-color-muted')
    expect(full).toContain('--ds-spacing-static-medium')
  })

  it('maps the resolved app theme id onto the pack emit theme', () => {
    expect(starterPackThemeFromResolvedId('zaoly-dark')).toBe('dark')
    expect(starterPackThemeFromResolvedId('zaoly')).toBe('light')
    expect(starterPackThemeFromResolvedId('dark')).toBe('light')
  })

  it('returns empty when nothing resolves', () => {
    expect(buildTokenPackRootCss([], { onlyPaths: ['color.action.primary'] })).toBe('')
    expect(
      buildTokenPackRootCss(catalog, { onlyPaths: ['color.unknown.path'] }),
    ).toBe('')
  })
})
