import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { htmlToSceneRoot } from '../lib/scene/html-to-scene'

const html = readFileSync(
  resolve(__dirname, '../lib/fixtures/html-import/aive-got-news/issue-01.html'),
  'utf8',
)

describe('aive-got-news-import-shell', () => {
  it('page root is paper full-bleed without center chrome', async () => {
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const p = result.root.props ?? {}
    expect(p.background).toBe('#f8f6f0')
    expect(p.align).toBe('stretch')
    expect(p.padding).toBe('0')
    expect(String(p.padding ?? '0')).not.toMatch(/24px 12px/)
    expect(p.direction).toBe('column')
    expect(p.color).toBe('#141414')
    expect(p.maxWidth).toBe('820px')

    // Body min-height → root box style for artboard mass
    expect(result.root.style?.height ?? result.root.style?.minHeight).toBe(640)

    // Absolute ghosts must not pollute the import
    expect(result.warnings.filter((w) => w.code === 'ignored-absolute-position')).toHaveLength(0)

    // Grids still map
    expect(result.warnings.some((w) => w.code === 'mapped-grid-to-sitegrid')).toBe(true)
  })
})
