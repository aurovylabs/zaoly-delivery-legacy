import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SITE_BUTTON_BINDINGS,
  defaultSiteKitTokenBindings,
  INSPECT_TOKEN_CATALOG,
  tokenByPath,
} from '../lib/inspect/token-catalog'
import {
  assertStarterPackComplete,
  starterPackLeavesForTheme,
  ZAOLY_CD_DARK,
  ZAOLY_STARTER_DARK_COLOR_OVERRIDES,
  ZAOLY_STARTER_MAG_PRINT_REQUIRED_PATHS,
  ZAOLY_STARTER_PACK_LEAVES,
  ZAOLY_STARTER_PACK_PATHS,
  ZAOLY_STARTER_REQUIRED_TYPES,
  ZAOLY_STARTER_SITE_KIT_REQUIRED_PATHS,
} from '../lib/tokens/zaoly-starter-pack'
import { catalogToPackLeaves } from '../lib/tokens/pack-merge'
import { printCssForLeaf } from '../lib/inspect/digital-css'

describe('zaoly starter token pack seed', () => {
  it('is complete: required types, no duplicate paths', () => {
    const check = assertStarterPackComplete()
    expect(check.missingTypes).toEqual([])
    expect(check.duplicatePaths).toEqual([])
    expect(check.ok).toBe(true)
    for (const type of ZAOLY_STARTER_REQUIRED_TYPES) {
      expect(ZAOLY_STARTER_PACK_LEAVES.some((l) => l.type === type)).toBe(true)
    }
  })

  it('exposes inventory paths in INSPECT_TOKEN_CATALOG (except asset)', () => {
    const catalogPaths = new Set(INSPECT_TOKEN_CATALOG.map((t) => t.path))
    for (const leaf of ZAOLY_STARTER_PACK_LEAVES) {
      if (leaf.type === 'asset') continue
      expect(catalogPaths.has(leaf.path)).toBe(true)
    }
    expect(ZAOLY_STARTER_PACK_PATHS.length).toBeGreaterThan(120)
  })

  it('covers Site Kit required role paths', () => {
    const catalogPaths = new Set(INSPECT_TOKEN_CATALOG.map((t) => t.path))
    for (const path of ZAOLY_STARTER_SITE_KIT_REQUIRED_PATHS) {
      expect(catalogPaths.has(path)).toBe(true)
    }
  })

  it('keeps CD brand defaults on key roles', () => {
    expect(tokenByPath('color.action.primary')?.preview).toBe('#1f44ff')
    expect(tokenByPath('color.background')?.preview).toBe('#f3eee4')
    expect(tokenByPath('color.ink')?.preview).toBe('#1e1b17')
    expect(tokenByPath('radius.control.md')?.preview).toBe('0')
    expect(tokenByPath('radius.surface')?.preview).toBe('0')
  })

  it('default Site Kit bindings only reference seed paths', () => {
    const fixturePaths = new Set(catalogToPackLeaves().map((l) => l.path))
    // assets are in starter but not inspect catalog — bindings must still be in starter paths
    const starterPaths = new Set(ZAOLY_STARTER_PACK_PATHS)
    const types = [
      'SiteButton',
      'SiteText',
      'SiteLink',
      'SiteInput',
      'SiteTextarea',
      'SiteSelect',
      'SiteStack',
      'SiteContainer',
      'SiteGrid',
      'SiteTable',
      'SiteBadge',
      'SiteCheckbox',
      'SiteDivider',
      'SiteSvg',
      'SiteShape',
      'SiteChart',
      'SiteGauge',
      'SiteImage',
    ]
    for (const type of types) {
      const bindings = defaultSiteKitTokenBindings(type)
      expect(Object.keys(bindings).length).toBeGreaterThan(0)
      for (const tokenPath of Object.values(bindings)) {
        expect(starterPaths.has(tokenPath)).toBe(true)
        expect(fixturePaths.has(tokenPath) || starterPaths.has(tokenPath)).toBe(true)
      }
    }
    expect(DEFAULT_SITE_BUTTON_BINDINGS.background).toBe('color.action.primary')
    expect(DEFAULT_SITE_BUTTON_BINDINGS.color).toBe('color.action.primaryForeground')
    expect(defaultSiteKitTokenBindings('SiteStack')).toMatchObject({
      padding: 'spacing.padding.md',
      radius: 'radius.surface',
      borderColor: 'color.line',
    })
  })

  it('dark theme keeps the same paths and flips CD role digital values', () => {
    const light = starterPackLeavesForTheme('light')
    const dark = starterPackLeavesForTheme('dark')
    expect(dark.map((l) => l.path)).toEqual(light.map((l) => l.path))

    const darkPrimary = dark.find((l) => l.path === 'color.action.primary')
    const darkBg = dark.find((l) => l.path === 'color.background')
    const darkInk = dark.find((l) => l.path === 'color.ink')
    expect((darkPrimary?.value as { digital: { hex: string } }).digital.hex).toBe(
      ZAOLY_CD_DARK.primary,
    )
    expect((darkBg?.value as { digital: { hex: string } }).digital.hex).toBe(ZAOLY_CD_DARK.paper)
    expect((darkInk?.value as { digital: { hex: string } }).digital.hex).toBe(ZAOLY_CD_DARK.ink)

    // Light fixture catalog unchanged
    expect(tokenByPath('color.action.primary')?.preview).toBe('#1f44ff')
    expect(tokenByPath('color.background')?.preview).toBe('#f3eee4')

    // Every dark override path exists in the seed
    for (const path of Object.keys(ZAOLY_STARTER_DARK_COLOR_OVERRIDES)) {
      expect(ZAOLY_STARTER_PACK_PATHS).toContain(path)
    }
  })

  it('Mag-critical leaves expose CSS-paintable print facets', () => {
    for (const path of ZAOLY_STARTER_MAG_PRINT_REQUIRED_PATHS) {
      const leaf = ZAOLY_STARTER_PACK_LEAVES.find((l) => l.path === path)
      expect(leaf, path).toBeDefined()
      if (!leaf) continue
      const css = printCssForLeaf({
        path: leaf.path,
        type: leaf.type,
        value: leaf.value,
        status: 'active',
      })
      expect(css, path).toBeTruthy()
      if (leaf.type === 'color') {
        expect(css, path).toMatch(/^#|^rgba?\(/i)
      } else if (leaf.type === 'spacing' || leaf.type === 'radius') {
        expect(css, path).toMatch(/mm|pt|0/)
      } else if (leaf.type === 'typography') {
        const size = printCssForLeaf(
          { path: leaf.path, type: leaf.type, value: leaf.value, status: 'active' },
          'size',
        )
        expect(size, `${path} size`).toMatch(/pt/)
      }
    }
  })

  it('includes palette ladders and chart series', () => {
    expect(tokenByPath('color.palette.cobalt.500')?.preview).toBe('#1f44ff')
    expect(tokenByPath('color.chart.5')).toBeDefined()
    expect(tokenByPath('typography.display')).toBeDefined()
    expect(tokenByPath('spacing.static.0')).toBeDefined()
    expect(tokenByPath('motion.easing.standard')).toBeDefined()
  })
})
