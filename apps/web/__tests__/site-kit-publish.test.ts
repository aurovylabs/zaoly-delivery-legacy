import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { SceneMaster } from '@zaoly/contracts'
import { collectPublishableMasters } from '../lib/site-kit/publish-collect'
import { publishSiteKitItems } from '../lib/site-kit/publish'
import { writeSiteKitStory } from '../lib/site-kit/write'
import { paths } from '../lib/paths'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const buttonRoot = {
  id: 'n1',
  type: 'SiteButton',
  props: { children: 'Go' },
}

function master(partial: Partial<SceneMaster> & Pick<SceneMaster, 'id' | 'name' | 'root'>): SceneMaster {
  return partial
}

describe('collectPublishableMasters', () => {
  it('keeps only Site Kit root types and dedupes by type', () => {
    const masters = [
      master({
        id: 'm1',
        name: 'Btn',
        root: buttonRoot,
        variants: [
          { id: 'v1', name: 'A', root: buttonRoot },
          { id: 'v2', name: 'B', root: { ...buttonRoot, id: 'n2' } },
        ],
      }),
      master({
        id: 'm2',
        name: 'Other',
        root: { id: 'x', type: 'Frame', props: {} },
      }),
      master({
        id: 'm3',
        name: 'Btn2',
        root: buttonRoot,
      }),
    ]
    const found = collectPublishableMasters(masters)
    expect(found).toHaveLength(1)
    expect(found[0]!.id).toBe('m1')
  })
})

describe('publishSiteKitItems', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubEnv('COOLIFY_TOKEN', 'test-token')
    vi.stubEnv(paths.envSiteKitSharedSeedWrite, '1')
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  it('writes items then requests one Storybook rebuild', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-pub-'))
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(
      path.join(root, 'src/components/Button.stories.tsx'),
      `import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
const meta = { title: 'Site/Button', component: Button, args: { children: 'x' } } satisfies Meta<typeof Button>
export default meta
export const Default: StoryObj<typeof meta> = {}
`,
      'utf8',
    )
    vi.stubEnv(paths.envSiteKitRoot, root)

    const result = await publishSiteKitItems([
      {
        componentId: 'SiteButton',
        args: { children: 'Pub' },
      },
    ])

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.published).toBe(1)
    expect(result.componentIds).toEqual(['SiteButton'])
    expect(result.storybookRedeploy.status).toBe('queued')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  it('returns partial failures without hiding successful ids', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-pub-partial-'))
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(
      path.join(root, 'src/components/Button.stories.tsx'),
      `import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
const meta = { title: 'Site/Button', component: Button, args: { children: 'x' } } satisfies Meta<typeof Button>
export default meta
export const Default: StoryObj<typeof meta> = {}
`,
      'utf8',
    )
    vi.stubEnv(paths.envSiteKitRoot, root)

    const result = await publishSiteKitItems([
      { componentId: 'SiteButton', args: { children: 'Pub' } },
      { componentId: 'NotAllowed', args: {} },
    ])

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.published).toBe(1)
    expect(result.componentIds).toEqual(['SiteButton'])
    expect(result.failures?.[0]?.componentId).toBe('NotAllowed')
  })

  it('reports failed redeploy when Coolify rejects', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-pub-fail-'))
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(
      path.join(root, 'src/components/Button.stories.tsx'),
      `import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
const meta = { title: 'Site/Button', component: Button, args: { children: 'x' } } satisfies Meta<typeof Button>
export default meta
export const Default: StoryObj<typeof meta> = {}
`,
      'utf8',
    )
    vi.stubEnv(paths.envSiteKitRoot, root)
    globalThis.fetch = vi.fn(async () => new Response('nope', { status: 500 }))

    const result = await publishSiteKitItems([
      { componentId: 'SiteButton', args: { children: 'Pub' } },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.storybookRedeploy.status).toBe('failed')
  })
})

describe('writeSiteKitStory redeploy', () => {
  beforeEach(() => {
    vi.stubEnv(paths.envSiteKitSharedSeedWrite, '1')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not attach storybookRedeploy on single write', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-noredeploy-'))
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(
      path.join(root, 'src/components/Button.stories.tsx'),
      `import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
const meta = { title: 'Site/Button', component: Button, args: { children: 'x' } } satisfies Meta<typeof Button>
export default meta
export const Default: StoryObj<typeof meta> = {}
`,
      'utf8',
    )
    const result = await writeSiteKitStory(
      { componentId: 'SiteButton', args: { children: 'Solo' } },
      { kitRoot: root, cwd: root },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect('storybookRedeploy' in result).toBe(false)
  })
})
