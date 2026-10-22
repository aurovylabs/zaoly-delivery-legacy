import { describe, expect, it } from 'vitest'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import { formatTokenPackCss, formatTokenPackJson, leafExportCssValue } from '../lib/tokens/pack-export'
import { paths } from '../lib/paths'

const leaves: ZaolyPackLeaf[] = [
  {
    path: 'color.action.primary',
    type: 'color',
    value: JSON.stringify({ digital: { hex: '#1f44ff' } }),
    status: 'active',
  },
  {
    path: 'spacing.static.large',
    type: 'spacing',
    value: JSON.stringify({ digital: 'calc({spacing.static.medium} * 2)' }),
    status: 'active',
  },
  {
    path: 'typography.heading.h1',
    type: 'typography',
    value: JSON.stringify({
      family: "'Noto Sans JP', sans-serif",
      weight: '700',
      digital: { size: '1.5rem', lineHeight: '1.2' },
    }),
    status: 'active',
  },
]

describe('token pack export', () => {
  it('emits nested DTCG-style JSON with Zaoly studio extension', () => {
    const json = formatTokenPackJson(leaves)
    const parsed = JSON.parse(json) as {
      color: {
        action: {
          primary: {
            $type: string
            $value: string
            $extensions: Record<string, { type: string; value: string }>
          }
        }
      }
      spacing: { static: { large: { $type: string; $value: string } } }
      typography: { heading: { h1: { $type: string; $value: string } } }
    }
    expect(parsed.color.action.primary.$type).toBe('color')
    expect(parsed.color.action.primary.$value).toBe('#1f44ff')
    expect(parsed.color.action.primary.$extensions[paths.tokenPackStudioExtensionKey]).toEqual({
      type: 'color',
      value: leaves[0]!.value,
    })
    expect(parsed.spacing.static.large.$type).toBe('dimension')
    expect(parsed.spacing.static.large.$value).toContain('{spacing.static.medium}')
    expect(parsed.typography.heading.h1.$type).toBe('typography')
    expect(parsed.typography.heading.h1.$value).toContain('1.5rem')
  })

  it('emits :root CSS custom properties with var() for expressions', () => {
    const css = formatTokenPackCss(leaves)
    expect(css).toContain(':root {')
    expect(css).toContain('--zaoly-color-action-primary: #1f44ff;')
    expect(css).toContain('--zaoly-spacing-static-large: calc(var(--zaoly-spacing-static-medium) * 2);')
    expect(css).toMatch(/--zaoly-typography-heading-h1:/)
  })

  it('formats typography as a shorthand export value', () => {
    expect(leafExportCssValue(leaves[2]!)).toContain("'Noto Sans JP', sans-serif")
    expect(leafExportCssValue(leaves[2]!)).toContain('700')
    expect(leafExportCssValue(leaves[2]!)).toContain('1.5rem')
  })
})
