import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CATALOG, catalogInsert, catalogInsertType } from '@zaoly/ui'
import {
  catalogPaletteItems,
  editorPaletteItems,
  groupCatalogPaletteItems,
  isCatalogInsertableType,
  resolveCatalogInsertType,
} from '../lib/scene/catalog-palette'
import { hasComponentContract, inspectFieldsForType } from '../lib/inspect/field-catalog'

const DOCS_IDS = ['tokens', 'typography', 'motion', 'MagOverview', 'ChatCatalog', 'BrandionTokenStudio']

describe('catalog palette (Phase 7)', () => {
  it('builds insertable items from CATALOG and skips docs', () => {
    const items = catalogPaletteItems()
    const ids = items.map((item) => item.id)
    expect(ids).toContain('Button')
    expect(ids).toContain('ChatBlockPanel')
    expect(ids).toContain('ChannelLane')
    expect(ids).toContain('PrintQuickCheck')
    expect(ids).toContain('MagCover')
    for (const docsId of DOCS_IDS) {
      expect(ids).not.toContain(docsId)
    }
    const magCover = items.find((item) => item.id === 'MagCover')
    expect(magCover?.insertType).toBe('PrintCover')
    expect(magCover?.label).toContain('PrintCover')
    expect(resolveCatalogInsertType('MagCover')).toBe('PrintCover')
    expect(isCatalogInsertableType('PrintCover')).toBe(true)
    expect(isCatalogInsertableType('tokens')).toBe(false)
  })

  it('groups palette items by catalog layer', () => {
    const groups = groupCatalogPaletteItems(catalogPaletteItems())
    const ids = groups.map((group) => group.id)
    expect(ids).toEqual(['Foundation', 'Atoms', 'Molecules', 'Organisms', 'Templates', 'Print', 'Mag'])
    expect(groups.find((group) => group.id === 'Molecules')?.items.some((item) => item.id === 'ChatBlockPanel')).toBe(
      true,
    )
  })

  it('editor palette is Site Kit only (no zaoly catalog layers)', () => {
    const items = editorPaletteItems()
    const groups = groupCatalogPaletteItems(items)
    expect(groups.map((g) => g.id)).toEqual(['Site'])
    expect(items.some((item) => item.id === 'SiteButton')).toBe(true)
    expect(items.some((item) => item.id === 'Button')).toBe(false)
    expect(items.some((item) => item.id === 'PrintChip')).toBe(false)
    expect(items.every((item) => item.id.startsWith('Site'))).toBe(true)
  })

  it('every CATALOG insertable id is either a palette item or a print-twin target', () => {
    const paletteIds = new Set(catalogPaletteItems().map((item) => item.id))
    for (const entry of CATALOG) {
      if (catalogInsert(entry) === 'docs') {
        expect(paletteIds.has(entry.id)).toBe(false)
        continue
      }
      const insertType = catalogInsertType(entry)
      if (!insertType) continue
      expect(paletteIds.has(entry.id)).toBe(true)
    }
  })

  it('ChatBlockPanel has no typed inspect contract (reject, do not guess)', () => {
    expect(hasComponentContract('ChatBlockPanel')).toBe(false)
    expect(hasComponentContract('Text')).toBe(true)
  })

  it('ChatBlockPanel inspect still shows instance DESIGN chrome', () => {
    const names = inspectFieldsForType('ChatBlockPanel').map((field) => field.name)
    expect(names).toEqual(
      expect.arrayContaining([
        'name',
        'color',
        'background',
        'radius',
        'fontSize',
        'fontFamily',
        'textAlign',
        'padding',
        'width',
      ]),
    )
    expect(names).not.toContain('variant')
  })

  it('CREATION keeps catalog metadata on the server barrel and catalogComponent on the client module', () => {
    const barrel = readFileSync(path.resolve(__dirname, '../lib/zaoly-ui.ts'), 'utf8')
    expect(barrel).not.toContain('storybook/catalog-registry')
    expect(barrel).toContain('catalogComponentName')
    expect(barrel).toContain('insertableCatalogEntries')
    expect(barrel).toContain('CATALOG_LAYER_ORDER')
    const catalog = readFileSync(path.resolve(__dirname, '../lib/zaoly-ui-catalog.ts'), 'utf8')
    expect(catalog.startsWith("'use client'")).toBe(true)
    expect(catalog).toContain('catalogComponent')
    const nextConfig = readFileSync(path.resolve(__dirname, '../next.config.ts'), 'utf8')
    expect(nextConfig).toContain('@zaoly/ui/catalog-registry')
    const tsconfig = readFileSync(path.resolve(__dirname, '../tsconfig.json'), 'utf8')
    expect(tsconfig).toContain('@zaoly/ui/catalog-registry')
  })
})

describe('scene-node-view generic fallback', () => {
  it('keeps ChatBlockPanel out of the hand-written switch', () => {
    const source = readFileSync(path.resolve(__dirname, '../components/scene-node-view.tsx'), 'utf8')
    expect(source).toContain("from '@zaoly/ui/catalog-registry'")
    expect(source).toContain('catalogComponent(node.type)')
    expect(source).not.toMatch(/case ['"]ChatBlockPanel['"]/)
    expect(source).toContain('scene-node-unsupported')
  })
})
