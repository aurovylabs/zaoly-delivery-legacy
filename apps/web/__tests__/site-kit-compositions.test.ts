import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  generateCompositionModule,
  generateCompositionStory,
  listSiteKitCompositions,
  saveSiteKitComposition,
  validateCompositionName,
  validateCompositionTree,
  validateNamedCompositionVariants,
  compositionVariantStoryName,
  storyExportName,
} from '../lib/site-kit/composition-write'
import {
  compositionComponentId,
  compositionScopeKey,
} from '@zaoly/site-kit/composition-codegen'

describe('site-kit compositions', () => {
  const originalFetch = globalThis.fetch
  const pid = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
  const scope = compositionScopeKey(pid)

  beforeEach(() => {
    vi.stubEnv('COOLIFY_TOKEN', 'test-token')
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllEnvs()
  })
  it('normalizes variant story exports with leading digits', () => {
    expect(storyExportName('3-up')).toBe('Up3')
  })

  it('normalizes freeform names to PascalCase and rejects reserved atom exports', () => {
    expect(validateCompositionName('MarketingHero')).toEqual({
      ok: true,
      exportName: 'MarketingHero',
    })
    expect(validateCompositionName('test')).toEqual({ ok: true, exportName: 'Test' })
    expect(validateCompositionName('my hero')).toEqual({ ok: true, exportName: 'MyHero' })
    expect(validateCompositionName('3col')).toEqual({ ok: true, exportName: 'Col3' })
    expect(validateCompositionName('3-col grid')).toEqual({ ok: true, exportName: 'ColGrid3' })
    expect(validateCompositionName('button').ok).toBe(false) // → Button, reserved
    expect(validateCompositionName('Button').ok).toBe(false)
  })

  it('rejects unknown types in tree', () => {
    const bad = validateCompositionTree({
      type: 'NotAKit',
      props: {},
    })
    expect(bad.ok).toBe(false)
  })

  it('generates children-first React with resolved style', () => {
    const src = generateCompositionModule('MarketingHero', {
      type: 'SiteStack',
      props: {},
      style: { display: 'flex', flexDirection: 'column', gap: '16px' },
      children: [
        {
          type: 'SiteText',
          props: { role: 'display', children: 'Hello' },
          style: { color: 'rgb(1, 2, 3)', textAlign: 'right' },
          tokenBindings: { color: 'color.action.primary' },
        },
        {
          type: 'SiteButton',
          props: { variant: 'primary', children: 'Go' },
        },
      ],
    })
    expect(src).toContain('export function MarketingHero')
    expect(src).toContain('<Stack')
    expect(src).toContain('<Text')
    expect(src).toContain('textAlign: "right"')
    expect(src).toContain('Hello')
    expect(src).toContain("from '../components'")
  })

  it('avoids CSF story export name colliding with composition export', () => {
    expect(compositionVariantStoryName('test', 'Test')).toBe('TestVariant')
    const src = generateCompositionStory('Test', [
      {
        id: 'v1',
        name: 'Default',
        composition: { type: 'SiteButton', props: { children: 'A' } },
      },
      {
        id: 'v2',
        name: 'test',
        composition: { type: 'SiteButton', props: { children: 'B' } },
      },
    ])
    expect(src).toContain('export const TestVariant: Story')
    expect(src).not.toMatch(/export const Test: Story/)
  })

  it('rejects duplicate variant story names', () => {
    const bad = validateNamedCompositionVariants(
      [
        { id: 'v1', name: 'Hover', composition: { type: 'SiteButton', props: {} } },
        { id: 'v2', name: 'hover', composition: { type: 'SiteButton', props: {} } },
      ],
      'CardSet',
    )
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.code).toBe('duplicate-variant-name')
  })

  it('writes module + story + override', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-comp-'))
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(
      path.join(root, 'src/index.ts'),
      "export { Button } from './components/Button'\n",
      'utf8',
    )

    const result = await saveSiteKitComposition(
      {
        name: 'MarketingHero',
        platformProjectId: pid,
        root: {
          type: 'SiteStack',
          props: {},
          children: [
            { type: 'SiteButton', props: { children: 'Go', variant: 'primary' } },
          ],
        },
      },
      { kitRoot: root, cwd: root },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.diskWritten).toBe(true)
    expect(result.writesGit).toBe(false)
    expect(result.componentId).toBe(compositionComponentId('MarketingHero', pid))
    expect(result.platformProjectId).toBe(pid)
    expect(result.storybookRedeploy.status).toBe('queued')
    const moduleSrc = await readFile(
      path.join(root, `src/compositions/c/${scope}/MarketingHero.tsx`),
      'utf8',
    )
    expect(moduleSrc).toContain('MarketingHero')
    const story = await readFile(
      path.join(root, `src/compositions/c/${scope}/MarketingHero.stories.tsx`),
      'utf8',
    )
    expect(story).toMatch(new RegExp(`title:\\s*['"]Compositions/${pid}/MarketingHero['"]`))
    expect(story).toContain(compositionComponentId('MarketingHero', pid))
    const override = JSON.parse(
      await readFile(
        path.join(
          root,
          `.data/site-kit/overrides/${compositionComponentId('MarketingHero', pid)}.json`,
        ),
        'utf8',
      ),
    )
    expect(override.composition.type).toBe('SiteStack')
    expect(override.platformProjectId).toBe(pid)
    expect(override.composition.style == null || typeof override.composition === 'object').toBe(
      true,
    )

    const listed = await listSiteKitCompositions({ kitRoot: root, cwd: root })
    const hero = listed.find((c) => c.exportName === 'MarketingHero')
    expect(hero).toBeTruthy()
    expect(hero?.previewRoot?.type).toBe('SiteStack')
    expect(hero?.platformProjectId).toBe(pid)

    const scoped = await listSiteKitCompositions({
      kitRoot: root,
      cwd: root,
      platformProjectId: pid,
    })
    expect(scoped.some((c) => c.exportName === 'MarketingHero')).toBe(true)

    const other = await listSiteKitCompositions({
      kitRoot: root,
      cwd: root,
      platformProjectId: '11111111-2222-4333-8444-555555555555',
    })
    expect(other.some((c) => c.exportName === 'MarketingHero')).toBe(false)

    const unscoped = await listSiteKitCompositions({
      kitRoot: root,
      cwd: root,
      unscoped: true,
    })
    expect(unscoped.some((c) => c.exportName === 'MarketingHero')).toBe(false)
  })

  it('rejects save without Collection bind', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-comp-unbound-'))
    const result = await saveSiteKitComposition(
      {
        name: 'NoScope',
        root: { type: 'SiteButton', props: { children: 'X' } },
      },
      { kitRoot: root, cwd: root },
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('missing-platform-project-id')
  })

  it('writes module + story + override with named variants', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-comp-var-'))
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(
      path.join(root, 'src/index.ts'),
      "export { Button } from './components/Button'\n",
      'utf8',
    )

    const result = await saveSiteKitComposition(
      {
        name: 'CardSet',
        platformProjectId: pid,
        root: {
          type: 'SiteStack',
          props: {},
          children: [{ type: 'SiteText', props: { children: 'Default' } }],
        },
        defaultVariantId: 'v-default',
        variants: [
          {
            id: 'v-default',
            name: 'Default',
            composition: {
              type: 'SiteStack',
              props: {},
              children: [{ type: 'SiteText', props: { children: 'Default' } }],
            },
          },
          {
            id: 'v-hover',
            name: 'Hover',
            composition: {
              type: 'SiteStack',
              props: {},
              children: [{ type: 'SiteText', props: { children: 'Hover' } }],
            },
          },
        ],
      },
      { kitRoot: root, cwd: root },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.variantCount).toBe(2)
    const story = await readFile(
      path.join(root, `src/compositions/c/${scope}/CardSet.stories.tsx`),
      'utf8',
    )
    expect(story).toContain('export const Hover')
    expect(story).toContain('CompositionPreview')
    expect(story).toContain(compositionComponentId('CardSet', pid))
    const override = JSON.parse(
      await readFile(
        path.join(
          root,
          `.data/site-kit/overrides/${compositionComponentId('CardSet', pid)}.json`,
        ),
        'utf8',
      ),
    )
    expect(override.variants).toHaveLength(2)
    expect(override.defaultVariantId).toBe('v-default')
    expect(override.variants[1].name).toBe('Hover')
  })
})
