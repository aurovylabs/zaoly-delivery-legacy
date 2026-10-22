import { describe, expect, it } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  ensureMasterFromPageRoot,
  prepareCompositionFromPage,
  uniquePagePatternNames,
} from '../lib/site-kit/prepare-composition-from-page'
import { INSTANCE_TYPE } from '../lib/scene/expand-instances'

const PLATFORM_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

function pageScene(overrides?: Partial<CompositionScene>): CompositionScene {
  return {
    id: 'scene-page-pattern',
    name: 'Page pattern scene',
    version: 1,
    updatedAt: '2026-09-12T12:00:00.000Z',
    platformProjectId: PLATFORM_ID,
    root: {
      id: 'root-home',
      type: 'SiteStack',
      name: 'HomeRoot',
      props: { direction: 'column' },
      children: [{ id: 'home-text', type: 'SiteText', props: { children: 'Hello' } }],
    },
    pages: [
      {
        id: 'page-home',
        name: 'Home Page',
        root: {
          id: 'root-home',
          type: 'SiteStack',
          name: 'HomeRoot',
          props: { direction: 'column' },
          children: [{ id: 'home-text', type: 'SiteText', props: { children: 'Hello' } }],
        },
      },
      {
        id: 'page-about',
        name: 'About',
        root: {
          id: 'root-about',
          type: 'SiteStack',
          name: 'AboutRoot',
          props: { direction: 'column' },
          children: [{ id: 'about-text', type: 'SiteText', props: { children: 'About' } }],
        },
      },
    ],
    activePageId: 'page-home',
    masters: [],
    ...overrides,
  }
}

describe('ensureMasterFromPageRoot', () => {
  it('creates Master + Instance when page root is a free tree', () => {
    const ensured = ensureMasterFromPageRoot(pageScene(), 'page-home', 'HomePage')
    expect(ensured.ok).toBe(true)
    if (!ensured.ok) return
    expect(ensured.masterId).toMatch(/^master/)
    const page = ensured.scene.pages?.find((p) => p.id === 'page-home')
    expect(page?.root.type).toBe(INSTANCE_TYPE)
    expect(page?.root.instanceOf).toBe(ensured.masterId)
    expect(ensured.scene.masters?.some((m) => m.id === ensured.masterId)).toBe(true)
  })

  it('reuses existing custom Master Instance on the page root', () => {
    const scene = pageScene({
      masters: [
        {
          id: 'master-home',
          name: 'HomePage',
          root: {
            id: 'master-root',
            type: 'SiteStack',
            props: { direction: 'column' },
            children: [{ id: 'm-text', type: 'SiteText', props: { children: 'Hi' } }],
          },
        },
      ],
      pages: [
        {
          id: 'page-home',
          name: 'Home Page',
          root: {
            id: 'root-home',
            type: INSTANCE_TYPE,
            instanceOf: 'master-home',
          },
        },
      ],
      root: { id: 'root-home', type: INSTANCE_TYPE, instanceOf: 'master-home' },
    })
    const ensured = ensureMasterFromPageRoot(scene, 'page-home', 'HomePage')
    expect(ensured.ok).toBe(true)
    if (!ensured.ok) return
    expect(ensured.masterId).toBe('master-home')
  })

  it('rejects palette atom Instance as page root', () => {
    const scene = pageScene({
      masters: [
        {
          id: 'master-atom',
          name: 'Button',
          sourceKey: 'SiteButton',
          root: { id: 'btn-root', type: 'SiteButton' },
        },
      ],
      pages: [
        {
          id: 'page-home',
          name: 'Home',
          root: { id: 'root-home', type: INSTANCE_TYPE, instanceOf: 'master-atom' },
        },
      ],
      root: { id: 'root-home', type: INSTANCE_TYPE, instanceOf: 'master-atom' },
    })
    const ensured = ensureMasterFromPageRoot(scene, 'page-home', 'Home')
    expect(ensured.ok).toBe(false)
    if (ensured.ok) return
    expect(ensured.code).toBe('invalid-page-root')
  })
})

describe('prepareCompositionFromPage', () => {
  it('ensures Master and prepares a validated composition payload', () => {
    const prepared = prepareCompositionFromPage({
      scene: pageScene(),
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.exportName).toBe('HomePage')
    expect(prepared.root.type).toBe('SiteStack')
    expect(prepared.scene.pages?.find((p) => p.id === 'page-home')?.root.type).toBe(
      INSTANCE_TYPE,
    )
  })

  it('rejects unbound Collection', () => {
    const prepared = prepareCompositionFromPage({
      scene: pageScene({ platformProjectId: 'plx-local-preview' }),
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(false)
    if (prepared.ok) return
    expect(prepared.code).toBe('missing-platform-project-id')
  })
})

describe('uniquePagePatternNames', () => {
  it('PascalCases page names and suffixes collisions', () => {
    const names = uniquePagePatternNames([
      { id: 'a', name: 'home page' },
      { id: 'b', name: 'Home Page' },
      { id: 'c', name: 'about' },
    ])
    expect(names.a).toBe('HomePage')
    expect(names.b).toBe('HomePage2')
    expect(names.c).toBe('About')
  })
})

describe('coerce after nested Master expand', () => {
  it('strips SiteSvg mark on prepare', () => {
    const scene = pageScene({
      pages: [
        {
          id: 'page-home',
          name: 'Home Page',
          root: {
            id: 'root-home',
            type: 'SiteStack',
            props: { direction: 'column' },
            children: [
              {
                id: 'svg-1',
                type: 'SiteSvg',
                props: {
                  mark: 'triangle',
                  markup: '<svg viewBox="0 0 48 48"><path d="M24 4L44 40H4z"/></svg>',
                  alt: 'Mark',
                  viewBox: '0 0 48 48',
                },
              },
            ],
          },
        },
      ],
      root: {
        id: 'root-home',
        type: 'SiteStack',
        children: [],
      },
    })
    const prepared = prepareCompositionFromPage({
      scene,
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    const svg = prepared.root.children?.[0]
    expect(svg?.type).toBe('SiteSvg')
    expect(svg?.props.mark).toBeUndefined()
    expect(typeof svg?.props.markup).toBe('string')
  })

  it('strips SiteStack rowGap/columnGap into style paint lane', () => {
    const scene = pageScene({
      pages: [
        {
          id: 'page-home',
          name: 'Home Page',
          root: {
            id: 'root-home',
            type: 'SiteStack',
            props: {
              direction: 'column',
              rowGap: '16px',
              columnGap: '8px',
            },
            children: [
              { id: 't1', type: 'SiteText', props: { children: 'A' } },
            ],
          },
        },
      ],
      root: { id: 'root-home', type: 'SiteStack', children: [] },
    })
    const prepared = prepareCompositionFromPage({
      scene,
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.root.props.rowGap).toBeUndefined()
    expect(prepared.root.props.columnGap).toBeUndefined()
    expect(prepared.root.props.direction).toBeUndefined()
  })

  it('strips SiteStack zIndex and other inspect paint props', () => {
    const scene = pageScene({
      pages: [
        {
          id: 'page-home',
          name: 'Home Page',
          root: {
            id: 'root-home',
            type: 'SiteStack',
            props: {
              zIndex: '3',
              position: 'relative',
              top: '8px',
              flexGrow: '1',
            },
            children: [{ id: 't1', type: 'SiteText', props: { children: 'A' } }],
          },
        },
      ],
      root: { id: 'root-home', type: 'SiteStack', children: [] },
    })
    const prepared = prepareCompositionFromPage({
      scene,
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.root.props.zIndex).toBeUndefined()
    expect(prepared.root.props.position).toBeUndefined()
    expect(prepared.root.props.top).toBeUndefined()
    expect(prepared.root.props.flexGrow).toBeUndefined()
  })

  it('rewrites Stack inlined from nested Masters', () => {
    const scene = pageScene({
      masters: [
        {
          id: 'master-block',
          name: 'Block',
          root: {
            id: 'block-root',
            type: 'Stack',
            props: { direction: 'column' },
            children: [{ id: 'block-text', type: 'SiteText', props: { children: 'Nested' } }],
          },
        },
      ],
      pages: [
        {
          id: 'page-home',
          name: 'Home Page',
          root: {
            id: 'root-home',
            type: 'SiteStack',
            props: { direction: 'column' },
            children: [
              {
                id: 'inst-block',
                type: INSTANCE_TYPE,
                instanceOf: 'master-block',
              },
            ],
          },
        },
      ],
      root: {
        id: 'root-home',
        type: 'SiteStack',
        props: { direction: 'column' },
        children: [
          { id: 'inst-block', type: INSTANCE_TYPE, instanceOf: 'master-block' },
        ],
      },
    })
    const prepared = prepareCompositionFromPage({
      scene,
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.root.type).toBe('SiteStack')
    const nested = prepared.root.children?.[0]
    expect(nested?.type).toBe('SiteStack')
    expect(JSON.stringify(prepared.root)).not.toContain('"type":"Stack"')
  })
})

describe('coerce editor Stack on Save page as Pattern', () => {
  it('rewrites Stack/Grid chrome to SiteStack/SiteGrid before prepare', () => {
    const scene = pageScene({
      pages: [
        {
          id: 'page-home',
          name: 'Home Page',
          root: {
            id: 'root-home',
            type: 'Stack',
            name: 'HomeRoot',
            props: { direction: 'column', gap: 'md' },
            children: [
              {
                id: 'wrap-1',
                type: 'Grid',
                props: { columns: 2 },
                children: [
                  { id: 'heading', type: 'Heading', props: { text: 'Hello' } },
                  { id: 'btn', type: 'Button', props: { label: 'Go' } },
                ],
              },
            ],
          },
        },
      ],
      root: {
        id: 'root-home',
        type: 'Stack',
        name: 'HomeRoot',
        props: { direction: 'column', gap: 'md' },
        children: [],
      },
    })
    const prepared = prepareCompositionFromPage({
      scene,
      pageId: 'page-home',
      name: 'HomePage',
    })
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    expect(prepared.root.type).toBe('SiteStack')
    expect(prepared.root.children?.[0]?.type).toBe('SiteGrid')
    expect(prepared.root.children?.[0]?.children?.[0]?.type).toBe('SiteText')
    expect(prepared.root.children?.[0]?.children?.[1]?.type).toBe('SiteButton')
    expect(prepared.root.children?.[0]?.children?.[0]?.props.children).toBe('Hello')
    expect(prepared.root.children?.[0]?.children?.[1]?.props.children).toBe('Go')
    const master = prepared.scene.masters?.find((m) => m.id === prepared.masterId)
    expect(master?.root.type).toBe('SiteStack')
  })
})
