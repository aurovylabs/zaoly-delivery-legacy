/**
 * SK-S5 scoped package imports / Collection barrels.
 * Spec: specs/domain/site-kit-collection-scope.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  SITE_KIT_PACKAGE_NAME,
  compositionExportNamesFromFilenames,
  compositionPackageCollectionImportPath,
  compositionPackageImportPath,
  compositionScopeKey,
  generateCompositionCollectionBarrel,
} from '@zaoly/site-kit/composition-codegen'
import { saveSiteKitComposition } from '../lib/site-kit/composition-write'
import { __resetOverrideSchemaForTests } from '../lib/site-kit/override-store'
import { paths } from '../lib/paths'

describe('SK-S5 package import helpers', () => {
  it('builds scoped module + Collection barrel paths from platformProjectId', () => {
    const pid = 'plx-import-a'
    const scope = compositionScopeKey(pid)
    expect(compositionPackageImportPath('Hero', pid)).toBe(
      `${SITE_KIT_PACKAGE_NAME}/c/${scope}/Hero`,
    )
    expect(compositionPackageCollectionImportPath(pid)).toBe(
      `${SITE_KIT_PACKAGE_NAME}/c/${scope}`,
    )
    expect(paths.siteKitPackageName).toBe(SITE_KIT_PACKAGE_NAME)
  })

  it('generates sorted Collection barrels without mixing scopes', () => {
    const src = generateCompositionCollectionBarrel(['Hero', 'Footer', 'Hero'])
    expect(src).toContain("export { Footer } from './Footer'")
    expect(src).toContain("export { Hero } from './Hero'")
    expect(src.indexOf('Footer')).toBeLessThan(src.indexOf('Hero'))
    expect(src).not.toContain('Composition')
  })

  it('derives export names from disk filenames', () => {
    expect(
      compositionExportNamesFromFilenames([
        'Hero.tsx',
        'Hero.stories.tsx',
        'index.ts',
        'Footer.tsx',
        'bad-name.tsx',
      ]),
    ).toEqual(['Hero', 'Footer'])
  })
})

describe('saveSiteKitComposition writes SK-S5 barrel', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'sk-s5-'))
    __resetOverrideSchemaForTests()
    vi.stubEnv('COOLIFY_TOKEN', '')
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('writes index.ts barrel under compositions/c/{scopeKey}', async () => {
    const pid = 'plx-s5-barrel'
    const scope = compositionScopeKey(pid)
    const result = await saveSiteKitComposition(
      {
        name: 'Hero',
        platformProjectId: pid,
        root: {
          type: 'SiteStack',
          props: {},
          style: { gap: '8px' },
          children: [],
        },
      },
      { kitRoot: root, cwd: root },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.wrote.some((w) => w.endsWith(`c/${scope}/index.ts`))).toBe(true)
    const barrel = await readFile(
      path.join(root, `src/compositions/c/${scope}/index.ts`),
      'utf8',
    )
    expect(barrel).toContain("export { Hero } from './Hero'")
    expect(compositionPackageImportPath('Hero', pid)).toContain(`/c/${scope}/Hero`)
  })
})
