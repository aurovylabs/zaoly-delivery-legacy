/**
 * SK-S2 namespaced Pattern ids.
 * Spec: specs/domain/site-kit-collection-scope.md
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  compositionCatalogKey,
  compositionComponentId,
  compositionScopeKey,
  isLegacyCompositionOverrideId,
  isNamespacedCompositionOverrideId,
  parseCompositionComponentId,
} from '@zaoly/site-kit/composition-codegen'
import {
  listSiteKitCompositions,
  saveSiteKitComposition,
} from '../lib/site-kit/composition-write'
import {
  readSiteKitOverride,
  writeSiteKitOverride,
  __resetOverrideSchemaForTests,
} from '../lib/site-kit/override-store'
import { kitComponentIdForMaster } from '../lib/site-kit/pull-merge'

describe('compositionComponentId SK-S2', () => {
  it('builds namespaced ids per Collection', () => {
    const a = compositionComponentId('Hero', 'collection-aaa')
    const b = compositionComponentId('Hero', 'collection-bbb')
    expect(a).not.toBe(b)
    expect(isNamespacedCompositionOverrideId(a)).toBe(true)
    expect(a).toBe(`Composition~${compositionScopeKey('collection-aaa')}~Hero`)
    expect(a.length).toBeLessThanOrEqual(80)
  })

  it('keeps legacy form without Collection', () => {
    const id = compositionComponentId('Hero')
    expect(id).toBe('CompositionHero')
    expect(isLegacyCompositionOverrideId(id)).toBe(true)
    expect(parseCompositionComponentId(id)).toEqual({
      exportName: 'Hero',
      scopeKey: null,
      legacy: true,
    })
  })

  it('parses namespaced ids', () => {
    const id = compositionComponentId('CardSet', 'plx-1')
    const parsed = parseCompositionComponentId(id)
    expect(parsed).toEqual({
      exportName: 'CardSet',
      scopeKey: compositionScopeKey('plx-1'),
      legacy: false,
    })
  })

  it('catalog keys isolate Collections', () => {
    expect(compositionCatalogKey('a', 'Hero')).not.toBe(compositionCatalogKey('b', 'Hero'))
  })
})

describe('kitComponentIdForMaster', () => {
  it('namespaces Composition sourceKey with Collection', () => {
    expect(
      kitComponentIdForMaster(
        {
          id: 'm1',
          name: 'Hero',
          root: { id: 'r', type: 'SiteStack', children: [] },
          sourceKey: 'Composition:Hero',
        },
        'plx-z',
      ),
    ).toBe(compositionComponentId('Hero', 'plx-z'))
  })
})

describe('duplicate Hero across Collections', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'sk-s2-'))
    __resetOverrideSchemaForTests()
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('saves two Heroes under distinct override ids', async () => {
    const tree = {
      type: 'SiteStack',
      props: {},
      style: { gap: '8px' },
      children: [],
    } as const
    const a = await saveSiteKitComposition(
      { name: 'Hero', root: tree, platformProjectId: 'col-a' },
      { kitRoot: root, cwd: root },
    )
    const b = await saveSiteKitComposition(
      { name: 'Hero', root: tree, platformProjectId: 'col-b' },
      { kitRoot: root, cwd: root },
    )
    expect(a).toMatchObject({ ok: true })
    expect(b).toMatchObject({ ok: true })
    if (!a.ok || !b.ok) return
    expect(a.componentId).not.toBe(b.componentId)
    expect(a.componentId).toContain('~Hero')
    expect(b.componentId).toContain('~Hero')

    const listedA = await listSiteKitCompositions({
      kitRoot: root,
      cwd: root,
      platformProjectId: 'col-a',
    })
    const listedB = await listSiteKitCompositions({
      kitRoot: root,
      cwd: root,
      platformProjectId: 'col-b',
    })
    expect(listedA.map((e) => e.componentId)).toEqual([a.componentId])
    expect(listedB.map((e) => e.componentId)).toEqual([b.componentId])
  })

  it('resolves legacy CompositionHero when scope matches', async () => {
    const scope = compositionScopeKey('col-legacy')
    const namespaced = `Composition~${scope}~Hero`
    await writeSiteKitOverride(
      {
        componentId: 'CompositionHero',
        exportName: 'Hero',
        platformProjectId: 'col-legacy',
        composition: { type: 'SiteStack', props: {} },
        args: {},
        updatedAt: new Date().toISOString(),
      },
      { cwd: root },
    )
    const body = await readSiteKitOverride(namespaced, { cwd: root })
    expect(body?.exportName).toBe('Hero')
    expect(body?.componentId).toBe(namespaced)
    expect(body?.platformProjectId).toBe('col-legacy')
  })

  it('does not resolve legacy row for wrong Collection fingerprint', async () => {
    await writeSiteKitOverride(
      {
        componentId: 'CompositionHero',
        exportName: 'Hero',
        platformProjectId: 'col-a',
        composition: { type: 'SiteStack', props: {} },
        args: {},
        updatedAt: new Date().toISOString(),
      },
      { cwd: root },
    )
    const wrong = compositionComponentId('Hero', 'col-b')
    expect(await readSiteKitOverride(wrong, { cwd: root })).toBeNull()
  })
})
