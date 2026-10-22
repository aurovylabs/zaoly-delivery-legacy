import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import {
  STORYBLOK_HANDOFF_GENERATOR,
  STORYBLOK_PAGE_COMPONENT,
  buildStoryblokHandoffPack,
  buildStoryblokHandoffPackForPages,
  formatStoryblokHandoffPack,
  siteKitTypeToBlokName,
  slugifyStoryblok,
} from '../lib/codegen/storyblok-handoff'
import { paths } from '../lib/paths'

const sceneStub = (over: Partial<CompositionScene> = {}): CompositionScene => ({
  id: 'scene-sb-1',
  name: 'Landing',
  version: 1,
  platformProjectId: 'col-demo',
  root: { id: 'root', type: 'SiteStack', props: {} },
  updatedAt: '2026-09-14T00:00:00.000Z',
  ...over,
})

describe('storyblok-handoff', () => {
  it('maps Site Kit types to site_* blok names', () => {
    expect(siteKitTypeToBlokName('SiteButton')).toBe('site_button')
    expect(siteKitTypeToBlokName('SiteStack')).toBe('site_stack')
    expect(siteKitTypeToBlokName('SiteTableCell')).toBe('site_table_cell')
    expect(slugifyStoryblok('Hello World!')).toBe('hello-world')
  })

  it('builds a creation_page story with nested body bloks + schemas', () => {
    const tree: SceneNode = {
      id: 'stack-1',
      type: 'SiteStack',
      name: 'Hero',
      tokenBindings: { gap: 'spacing.static.medium' },
      children: [
        {
          id: 'text-1',
          type: 'SiteText',
          props: { children: 'Welcome', role: 'title' },
          tokenBindings: { color: 'color.ink.primary' },
        },
        {
          id: 'btn-1',
          type: 'SiteButton',
          props: { children: 'Get started', variant: 'primary', disabled: false },
        },
      ],
    }

    const pack = buildStoryblokHandoffPack({
      target: tree,
      scene: sceneStub(),
      storyName: 'Home',
    })

    expect(pack.meta.generator).toBe(STORYBLOK_HANDOFF_GENERATOR)
    expect(pack.meta.collectionId).toBe('col-demo')
    expect(pack.meta.docs.storyObject).toBe(paths.storyblokDocsStoryObject)
    expect(pack.meta.docs.componentObject).toBe(paths.storyblokDocsComponentObject)
    expect(pack.story.name).toBe('Home')
    expect(pack.story.slug).toBe('home')
    expect(pack.story.content.component).toBe(STORYBLOK_PAGE_COMPONENT)
    expect(pack.story.content.body).toHaveLength(1)

    const stack = pack.story.content.body![0]!
    expect(stack.component).toBe('site_stack')
    expect(stack.token_bindings).toContain('spacing.static.medium')
    expect(stack.body).toHaveLength(2)
    expect(stack.body![0]!.component).toBe('site_text')
    expect(stack.body![0]!.children).toBe('Welcome')
    expect(stack.body![0]!.token_bindings).toContain('color.ink.primary')
    expect(stack.body![1]!.component).toBe('site_button')
    expect(stack.body![1]!.children).toBe('Get started')
    expect(stack.body![1]!.variant).toBe('primary')

    const names = pack.components.map((c) => c.name)
    expect(names).toContain(STORYBLOK_PAGE_COMPONENT)
    expect(names).toContain('site_stack')
    expect(names).toContain('site_text')
    expect(names).toContain('site_button')

    const pageDef = pack.components.find((c) => c.name === STORYBLOK_PAGE_COMPONENT)!
    expect(pageDef.is_root).toBe(true)
    expect(pageDef.schema.body.type).toBe('bloks')

    const stackDef = pack.components.find((c) => c.name === 'site_stack')!
    expect(stackDef.is_nestable).toBe(true)
    expect(stackDef.schema.body.type).toBe('bloks')
    expect(stackDef.schema.token_bindings.type).toBe('textarea')

    const json = formatStoryblokHandoffPack(pack)
    expect(json).toContain('"component": "creation_page"')
    expect(json).not.toContain('#f256b6')
  })

  it('omits paint props from bloks but round-trips layout snapshot', () => {
    const tree: SceneNode = {
      id: 'btn-paint',
      type: 'SiteButton',
      props: { children: 'Go', color: '#ff0000', padding: 16 },
      style: { width: 200 },
    }
    const pack = buildStoryblokHandoffPack({ target: tree, scene: sceneStub() })
    const btn = pack.story.content.body![0]!
    expect(btn.children).toBe('Go')
    expect(btn.color).toBeUndefined()
    expect(btn.padding).toBeUndefined()
    expect(btn.layout).toContain('"padding"')
    expect(btn.layout).toContain('"width"')
  })

  it('snapshots SiteStack direction/gap into layout JSON', () => {
    const tree: SceneNode = {
      id: 'stack-row',
      type: 'SiteStack',
      props: { direction: 'row', gap: 'md' },
      children: [{ id: 't1', type: 'SiteText', props: { children: 'A' } }],
    }
    const pack = buildStoryblokHandoffPack({ target: tree, scene: sceneStub() })
    const stack = pack.story.content.body![0]!
    expect(stack.layout).toBeTruthy()
    const layout = JSON.parse(String(stack.layout)) as Record<string, unknown>
    expect(layout.flexDirection).toBe('row')
    expect(layout.display).toBe('flex')
    expect(layout.gap).toBeTruthy()
    expect(pack.story.content.collection_id).toBe('col-demo')
    expect(pack.components.find((c) => c.name === 'site_stack')!.schema.layout.type).toBe(
      'textarea',
    )
  })

  it('merges multi-page stories', () => {
    const pack = buildStoryblokHandoffPackForPages({
      scene: sceneStub(),
      pages: [
        {
          id: 'p1',
          name: 'Home',
          root: {
            id: 'r1',
            type: 'SiteText',
            props: { children: 'A' },
          },
        },
        {
          id: 'p2',
          name: 'About',
          root: {
            id: 'r2',
            type: 'SiteButton',
            props: { children: 'B' },
          },
        },
      ],
    })
    expect(pack.stories).toHaveLength(2)
    expect(pack.stories[0]!.slug).toBe('home')
    expect(pack.stories[1]!.slug).toBe('about')
    expect(pack.components.map((c) => c.name)).toEqual(
      expect.arrayContaining(['creation_page', 'site_text', 'site_button']),
    )
  })
})
