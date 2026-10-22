import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import {
  generateAtomStorySource,
  patchStoryArgs,
  patchTokenBindings,
  findSiteKitEntry,
  stripSeedDemoStories,
  writeSiteKitStory,
} from '../lib/site-kit/write'
import { paths } from '../lib/paths'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

const SAMPLE = `import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'

const meta = {
  title: 'Site/Button',
  component: Button,
  tags: ['site-kit'],
  args: {
    children: 'Get started',
    variant: 'primary',
  },
} satisfies Meta<typeof Button>

export default meta
export const Default: StoryObj<typeof meta> = {}
`

describe('site-kit write', () => {
  beforeEach(() => {
    vi.stubEnv(paths.envSiteKitSharedSeedWrite, '1')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('finds catalog entries', () => {
    expect(findSiteKitEntry('SiteButton')?.exportName).toBe('Button')
    expect(findSiteKitEntry('Nope')).toBeUndefined()
  })

  it('patches story args', () => {
    const next = patchStoryArgs(SAMPLE, { children: 'Go', variant: 'secondary' })
    expect(next).toContain('children: "Go"')
    expect(next).toContain('variant: "secondary"')
  })

  it('patches tokenBindings parameters', () => {
    const next = patchTokenBindings(SAMPLE, { color: 'color.action.primary' })
    expect(next).toContain('tokenBindings')
    expect(next).toContain('color.action.primary')
  })

  it('writes story + override without GitHub', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-'))
    const storyRel = 'src/components/Button.stories.tsx'
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(path.join(root, storyRel), SAMPLE, 'utf8')

    const result = await writeSiteKitStory(
      {
        componentId: 'SiteButton',
        args: { children: 'Synced', variant: 'primary' },
        tokenBindings: { radius: 'radius.md' },
      },
      { kitRoot: root, cwd: root },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.writesGit).toBe(false)
    const story = await readFile(path.join(root, storyRel), 'utf8')
    expect(story).toContain('Synced')
    expect(story).not.toContain('Secondary')
    expect(story).not.toContain('Ghost')
    const override = await readFile(
      path.join(root, '.data/site-kit/overrides/SiteButton.json'),
      'utf8',
    )
    expect(JSON.parse(override).args.children).toBe('Synced')
  })

  it('strips seed demo stories', () => {
    const withDemos = `${SAMPLE}
export const Secondary: Story = {
  args: { variant: 'secondary' },
}

export const Ghost: Story = {
  args: { variant: 'ghost' },
}
`
    expect(stripSeedDemoStories(withDemos)).not.toContain('Secondary')
    expect(stripSeedDemoStories(withDemos)).not.toContain('Ghost')
  })

  it('writes named Master variants onto atom override + CSF', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'site-kit-nvar-'))
    const storyRel = 'src/components/Button.stories.tsx'
    await mkdir(path.join(root, 'src/components'), { recursive: true })
    await writeFile(path.join(root, storyRel), SAMPLE, 'utf8')

    const result = await writeSiteKitStory(
      {
        componentId: 'SiteButton',
        args: { children: 'Default', variant: 'primary' },
        composition: { type: 'SiteButton', props: { children: 'Default' } },
        defaultVariantId: 'v1',
        variants: [
          {
            id: 'v1',
            name: 'Default',
            composition: { type: 'SiteButton', props: { children: 'Default' } },
          },
          {
            id: 'v2',
            name: 'Hover',
            composition: { type: 'SiteButton', props: { children: 'Hover' } },
          },
        ],
      },
      { kitRoot: root, cwd: root },
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.variantCount).toBe(2)
    const story = await readFile(path.join(root, storyRel), 'utf8')
    expect(story).toContain('export const Hover')
    expect(story).toContain('control: { type: \'select\' }')
    expect(story).toContain('Hover')
    expect(story).not.toContain('Secondary')
    expect(story).not.toContain('masterVariant')
    const override = JSON.parse(
      await readFile(path.join(root, '.data/site-kit/overrides/SiteButton.json'), 'utf8'),
    )
    expect(override.variants).toHaveLength(2)
    expect(override.variants[1].name).toBe('Hover')
  })

  it('generateAtomStorySource emits Default-only without variants', () => {
    const entry = findSiteKitEntry('SiteButton')!
    const src = generateAtomStorySource(entry, { args: { children: 'X' } })
    expect(src).toContain('export const Default')
    expect(src).not.toContain('Secondary')
  })
})
