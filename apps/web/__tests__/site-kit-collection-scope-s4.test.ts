/**
 * SK-S4 atom Publish policy — shared seed vs Collection fork.
 * Spec: specs/domain/site-kit-collection-scope.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  atomForkComponentId,
  compositionScopeKey,
  isNamespacedAtomOverrideId,
  parseAtomOverrideId,
} from '@zaoly/site-kit/composition-codegen'
import { resolveAtomWriteTarget } from '../lib/site-kit/atom-publish-lane'
import { writeSiteKitStory } from '../lib/site-kit/write'
import { isAllowedOverrideId } from '../lib/site-kit/override-ids'
import { kitComponentIdForMaster } from '../lib/site-kit/pull-merge'
import { resolveSiteKitSeed } from '../lib/site-kit/seed'
import { writeSiteKitOverride, __resetOverrideSchemaForTests } from '../lib/site-kit/override-store'
import { paths } from '../lib/paths'

describe('SK-S4 atom fork ids', () => {
  it('builds Atom~{scopeKey}~SiteType grammar', () => {
    const id = atomForkComponentId('SiteButton', 'plx-a')
    expect(id).toBe(`Atom~${compositionScopeKey('plx-a')}~SiteButton`)
    expect(isNamespacedAtomOverrideId(id)).toBe(true)
    expect(parseAtomOverrideId(id)).toEqual({
      scopeKey: compositionScopeKey('plx-a'),
      atomType: 'SiteButton',
    })
    expect(isAllowedOverrideId(id)).toBe(true)
  })
})

describe('resolveAtomWriteTarget', () => {
  it('defaults to fork when Collection is bound', () => {
    const t = resolveAtomWriteTarget({
      componentId: 'SiteButton',
      platformProjectId: 'plx-a',
      sharedSeedEnabled: false,
    })
    expect(t.ok).toBe(true)
    if (!t.ok) return
    expect(t.lane).toBe('fork')
    expect(t.overrideId).toBe(atomForkComponentId('SiteButton', 'plx-a'))
    expect(t.patchDiskStory).toBe(false)
  })

  it('rejects seed writes without shared-lane env', () => {
    const t = resolveAtomWriteTarget({
      componentId: 'SiteButton',
      publishLane: 'seed',
      sharedSeedEnabled: false,
    })
    expect(t.ok).toBe(false)
    if (t.ok) return
    expect(t.code).toBe('seed-write-forbidden')
  })

  it('allows seed when shared lane enabled', () => {
    const t = resolveAtomWriteTarget({
      componentId: 'SiteButton',
      publishLane: 'seed',
      sharedSeedEnabled: true,
    })
    expect(t.ok).toBe(true)
    if (!t.ok) return
    expect(t.overrideId).toBe('SiteButton')
    expect(t.patchDiskStory).toBe(true)
  })
})

describe('writeSiteKitStory lanes', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'sk-s4-'))
    __resetOverrideSchemaForTests()
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.unstubAllEnvs()
  })

  it('writes Collection fork without patching shared story CSF', async () => {
    const storyRel = 'src/components/Button.stories.tsx'
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    const original =
      "export const Default = {}\n"
    await writeFile(path.join(root, storyRel), original, 'utf8')

    const result = await writeSiteKitStory(
      {
        componentId: 'SiteButton',
        publishLane: 'fork',
        platformProjectId: 'plx-fork',
        args: { children: 'Forked' },
        composition: { type: 'SiteButton', props: { children: 'Forked' } },
      },
      { kitRoot: root, cwd: root },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.publishLane).toBe('fork')
    expect(result.componentId).toBe(atomForkComponentId('SiteButton', 'plx-fork'))
    const story = await readFile(path.join(root, storyRel), 'utf8')
    expect(story).toBe(original)
    const forkPath = path.join(
      root,
      paths.siteKitOverridesRelPath,
      `${result.componentId}.json`,
    )
    const override = JSON.parse(await readFile(forkPath, 'utf8'))
    expect(override.platformProjectId).toBe('plx-fork')
    expect(override.args.children).toBe('Forked')
  })

  it('seed write fails without env', async () => {
    vi.stubEnv(paths.envSiteKitSharedSeedWrite, '0')
    const result = await writeSiteKitStory(
      {
        componentId: 'SiteButton',
        publishLane: 'seed',
        args: { children: 'Nope' },
      },
      { kitRoot: root, cwd: root },
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('seed-write-forbidden')
  })
})

describe('Pull prefers fork then seed', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'sk-s4-pull-'))
    __resetOverrideSchemaForTests()
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('kitComponentIdForMaster returns Atom~ fork when Collection bound', () => {
    expect(
      kitComponentIdForMaster(
        {
          id: 'm1',
          name: 'Btn',
          root: { id: 'r', type: 'SiteButton', props: {} },
          sourceKey: 'SiteButton',
        },
        'plx-pull',
      ),
    ).toBe(atomForkComponentId('SiteButton', 'plx-pull'))
  })

  it('resolveSiteKitSeed falls back from missing fork to catalog seed', async () => {
    const forkId = atomForkComponentId('SiteButton', 'plx-miss')
    const seed = await resolveSiteKitSeed(forkId, { cwd: root })
    expect('ok' in seed && seed.ok === false).toBe(false)
    if ('ok' in seed && seed.ok === false) return
    expect(seed.kitRevision).toBe('catalog:SiteButton')
  })

  it('resolveSiteKitSeed uses fork override when present', async () => {
    const forkId = atomForkComponentId('SiteButton', 'plx-hit')
    await writeSiteKitOverride(
      {
        componentId: forkId,
        platformProjectId: 'plx-hit',
        composition: { type: 'SiteButton', props: { children: 'FromFork' } },
        args: {},
        updatedAt: new Date().toISOString(),
      },
      { cwd: root },
    )
    const seed = await resolveSiteKitSeed(forkId, { cwd: root })
    if ('ok' in seed && seed.ok === false) {
      expect.fail(seed.error)
      return
    }
    expect(seed.kitRevision.startsWith('override:')).toBe(true)
    expect(seed.root.props?.children).toBe('FromFork')
  })
})
