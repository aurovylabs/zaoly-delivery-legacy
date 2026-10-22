import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CATALOG, catalogInsert, catalogInsertType } from './catalog'
import { catalogComponent } from './catalog-registry'

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Barrel component modules that must appear in CATALOG (by id). */
const REQUIRED_BARREL_STORY_IDS = [
  'AppFrame',
  'NavRail',
  'BrandCorner',
  'BrandCornerProductMenu',
  'TopStatus',
  'KpiStrip',
  'PipelinePanel',
  'StatusMeterPanel',
  'DivergingBar',
  'Lede',
  'Icons',
] as const

describe('catalogCompleteness', () => {
  it('every catalog entry has co-located stories + mdx files', () => {
    const missing: string[] = []
    for (const entry of CATALOG) {
      const storiesPath = join(srcRoot, entry.stories)
      const mdxPath = join(srcRoot, entry.mdx)
      if (!existsSync(storiesPath)) missing.push(`stories:${entry.id} → ${entry.stories}`)
      if (!existsSync(mdxPath)) missing.push(`mdx:${entry.id} → ${entry.mdx}`)
    }
    expect(missing).toEqual([])
  })

  it('catalog titles match layer/name convention', () => {
    for (const entry of CATALOG) {
      expect(entry.title.startsWith(`${entry.layer}/`)).toBe(true)
    }
  })

  it('shell / overview / viz barrel gaps are catalogued', () => {
    const ids = new Set(CATALOG.map((e) => e.id))
    for (const id of REQUIRED_BARREL_STORY_IDS) {
      expect(ids.has(id), `missing catalog id: ${id}`).toBe(true)
    }
  })

  it('catalog ids are unique', () => {
    const ids = CATALOG.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('P1 promoted stories import from the same folder (./Type)', () => {
    const files: string[] = []
    const walk = (dir: string) => {
      for (const ent of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, ent.name)
        if (ent.isDirectory()) walk(p)
        else if (ent.name.endsWith('.promoted.stories.tsx')) files.push(p)
      }
    }
    walk(srcRoot)
    expect(files.length).toBeGreaterThan(0)
    for (const file of files) {
      const text = readFileSync(file, 'utf8')
      expect(text, file).not.toContain("from '../components/")
      expect(text, file).toMatch(/from '\.\//)
      expect(text, file).not.toMatch(/<[A-Z][A-Za-z0-9]*[\s/>]/)
    }
  })

  /**
   * CREATION Print* palette types MUST equal Storybook catalog ids (round-trip Phase 1).
   * Source: creation-v3 `EDITOR_PALETTE_GROUP_TYPES.print`. PrintQuickCheck is catalog-only.
   */
  it('CREATION Print palette types have matching Print/ catalog ids', () => {
    const ids = new Set(CATALOG.map((e) => e.id))
    const creationPrintPalette = [
      'PrintPage',
      'PrintChapter',
      'PrintCover',
      'PrintPullQuote',
      'PrintCallout',
      'PrintSteps',
      'PrintScoreRing',
      'PrintChip',
      'PrintChipRow',
      'PrintTwoColumn',
      'PrintDonut',
      'PrintRankedList',
      'PrintLedger',
      'PrintTraitBars',
      'PrintTable',
      'PrintPersonaCard',
      'PrintPersonaGrid',
    ] as const
    for (const id of creationPrintPalette) {
      expect(ids.has(id), `missing catalog id for CREATION palette type ${id}`).toBe(true)
    }
    expect(ids.has('PrintQuickCheck')).toBe(true)
  })
})

describe('catalog insert + registry', () => {
  it('every non-docs catalog id has a React catalogComponent', () => {
    const missing: string[] = []
    for (const entry of CATALOG) {
      if (catalogInsert(entry) === 'docs') {
        expect(catalogComponent(entry.id)).toBeNull()
        continue
      }
      const Comp = catalogComponent(entry.id)
      if (typeof Comp !== 'function') missing.push(entry.id)
    }
    expect(missing).toEqual([])
  })

  it('ChannelLane is a canvas catalog id', () => {
    const lane = CATALOG.find((e) => e.id === 'ChannelLane')
    expect(lane).toBeTruthy()
    expect(catalogInsert(lane!)).toBe('canvas')
    expect(catalogInsertType(lane!)).toBe('ChannelLane')
  })

  it('MagCover print-twin inserts PrintCover', () => {
    const mag = CATALOG.find((e) => e.id === 'MagCover')
    expect(catalogInsert(mag!)).toBe('print-twin')
    expect(catalogInsertType(mag!)).toBe('PrintCover')
  })

  it('catalog registry and hook primitives are Next client modules', () => {
    const hookRe =
      /\b(useState|useEffect|useRef|useReducer|useCallback|useMemo|useId|useLayoutEffect|useSyncExternalStore|useImperativeHandle|useTransition|useDeferredValue)\b/
    const registryPath = join(srcRoot, 'storybook/catalog-registry.ts')
    const registry = readFileSync(registryPath, 'utf8')
    expect(registry.startsWith("'use client'")).toBe(true)
    const missing: string[] = []
    for (const match of registry.matchAll(/from '\.\.\/(components\/[^']+|print\/[^']+|SectionChrome)'/g)) {
      const rel = match[1]
      const tsx = join(srcRoot, `${rel}.tsx`)
      const ts = join(srcRoot, `${rel}.ts`)
      const file = existsSync(tsx) ? tsx : ts
      const text = readFileSync(file, 'utf8')
      if (hookRe.test(text) && !text.startsWith("'use client'") && !text.startsWith('"use client"')) {
        missing.push(file.replace(`${srcRoot}/`, ''))
      }
    }
    expect(missing).toEqual([])
  })
})
