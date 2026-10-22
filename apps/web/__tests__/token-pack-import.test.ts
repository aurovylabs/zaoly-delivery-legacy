import { describe, expect, it } from 'vitest'
import type { ZaolyPackLeaf } from '../lib/inspect/token-catalog'
import { formatTokenPackJson } from '../lib/tokens/pack-export'
import {
  diffTokenPackImport,
  leavesForImportApply,
  parseDtcgTokenPack,
} from '../lib/tokens/pack-import'
import { paths } from '../lib/paths'

const current: ZaolyPackLeaf[] = [
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
]

describe('token pack import', () => {
  it('round-trips export JSON via studio extension', () => {
    const exported = formatTokenPackJson([
      ...current,
      {
        path: 'color.custom.brand',
        type: 'color',
        value: JSON.stringify({ digital: { hex: '#112233' } }),
        status: 'active',
      },
    ])
    const parsed = parseDtcgTokenPack(exported)
    expect(parsed.invalid).toEqual([])
    expect(parsed.leaves.map((l) => l.path).sort()).toEqual([
      'color.action.primary',
      'color.custom.brand',
      'spacing.static.medium',
    ])
    const diff = diffTokenPackImport(parsed.leaves, current)
    expect(diff.create).toEqual(['color.custom.brand'])
    expect(diff.update).toEqual([])
    expect(diff.unchanged).toEqual(['color.action.primary', 'spacing.static.medium'])
    expect(leavesForImportApply(parsed.leaves, diff).map((l) => l.path)).toEqual([
      'color.custom.brand',
    ])
  })

  it('accepts scalar-only DTCG without extension', () => {
    const json = JSON.stringify({
      color: {
        action: {
          primary: { $type: 'color', $value: '#aabbcc' },
        },
      },
    })
    const parsed = parseDtcgTokenPack(json)
    expect(parsed.invalid).toEqual([])
    expect(parsed.leaves).toHaveLength(1)
    const diff = diffTokenPackImport(parsed.leaves, current)
    expect(diff.update).toEqual(['color.action.primary'])
  })

  it('marks structured leaves without extension as invalid', () => {
    const json = JSON.stringify({
      typography: {
        heading: {
          h1: { $type: 'typography', $value: 'Inter 700 1.5rem' },
        },
      },
    })
    const parsed = parseDtcgTokenPack(json)
    expect(parsed.leaves).toEqual([])
    expect(parsed.invalid[0]?.error).toBe('missing_studio_extension')
  })

  it('exposes download + import path constants', () => {
    expect(paths.routes.apiTokensImport).toBe('/api/tokens/import')
    expect(paths.tokenPackDownloadJsonName).toBe('zaoly-tokens.json')
    expect(paths.tokenPackDownloadCssName).toBe('zaoly-tokens.css')
    expect(paths.tokenPackStudioExtensionKey).toBe('com.zaoly.studio')
    expect(paths.tokenPackMaxImportBytes).toBe(512_000)
  })
})
