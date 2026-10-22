import { describe, expect, it, vi, afterEach } from 'vitest'
import type { StoryblokHandoffPack } from '../lib/codegen/storyblok-handoff'
import { pushStoryblokHandoffPack } from '../lib/codegen/storyblok-push'

const pack: StoryblokHandoffPack = {
  meta: {
    generator: 'zaoly-storyblok-poc',
    collectionId: null,
    sceneId: 's1',
    tokenPackNote: 'note',
    docs: {
      knowledge: 'knowledge/storyblok-handoff.md',
      storyObject: 'https://example.test/story',
      componentObject: 'https://example.test/component',
    },
  },
  story: {
    name: 'Creation PoC',
    slug: 'creation-poc',
    content: {
      _uid: 'page-1',
      component: 'creation_page',
      body: [
        {
          _uid: 'btn-1',
          component: 'site_button',
          children: 'Hello',
        },
      ],
    },
  },
  components: [
    {
      name: 'creation_page',
      is_root: true,
      is_nestable: false,
      schema: { body: { type: 'bloks', pos: 0 } },
    },
    {
      name: 'site_button',
      is_nestable: true,
      schema: {
        children: { type: 'text', pos: 0 },
        token_bindings: { type: 'textarea', pos: 1 },
      },
    },
  ],
}

describe('storyblok-push', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('creates missing components then creates the story', async () => {
    const calls: Array<{ method: string; url: string; body?: unknown }> = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET'
        const body = init?.body ? JSON.parse(String(init.body)) : undefined
        calls.push({ method, url, body })
        if (url.endsWith('/components/') && method === 'GET') {
          return new Response(JSON.stringify({ components: [] }), { status: 200 })
        }
        if (url.endsWith('/components/') && method === 'POST') {
          return new Response(JSON.stringify({ component: { id: 1 } }), { status: 200 })
        }
        if (url.endsWith('/stories/') && method === 'GET') {
          return new Response(JSON.stringify({ stories: [] }), { status: 200 })
        }
        if (url.endsWith('/stories/') && method === 'POST') {
          return new Response(JSON.stringify({ story: { id: 99 } }), { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 })
      }),
    )

    const result = await pushStoryblokHandoffPack(
      {
        spaceId: '123',
        managementToken: 'pat-test',
        apiBase: 'https://mapi.example.test/v1',
      },
      pack,
    )

    expect(result.componentsCreated).toEqual(['creation_page', 'site_button'])
    expect(result.storyAction).toBe('created')
    expect(result.storyId).toBe(99)
    expect(calls.filter((c) => c.method === 'POST' && c.url.includes('/components/'))).toHaveLength(
      2,
    )
    const storyPost = calls.find((c) => c.method === 'POST' && c.url.endsWith('/stories/'))
    expect(storyPost?.body).toMatchObject({
      story: { slug: 'creation-poc', content: { component: 'creation_page' } },
    })
  })

  it('updates existing components and stories by name/slug', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET'
        if (url.endsWith('/components/') && method === 'GET') {
          return new Response(
            JSON.stringify({
              components: [
                { id: 10, name: 'creation_page' },
                { id: 11, name: 'site_button' },
              ],
            }),
            { status: 200 },
          )
        }
        if (method === 'PUT' && url.includes('/components/')) {
          return new Response(JSON.stringify({ component: {} }), { status: 200 })
        }
        if (url.endsWith('/stories/') && method === 'GET') {
          return new Response(
            JSON.stringify({ stories: [{ id: 55, name: 'Creation PoC', slug: 'creation-poc' }] }),
            { status: 200 },
          )
        }
        if (method === 'PUT' && url.includes('/stories/55')) {
          return new Response(JSON.stringify({ story: { id: 55 } }), { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'unexpected', url, method }), { status: 500 })
      }),
    )

    const result = await pushStoryblokHandoffPack(
      { spaceId: '123', managementToken: 'pat-test', apiBase: 'https://mapi.example.test/v1' },
      pack,
    )
    expect(result.componentsUpdated).toEqual(['creation_page', 'site_button'])
    expect(result.storyAction).toBe('updated')
    expect(result.storyId).toBe(55)
  })

  it('retries story PUT when layout snapshots were stripped', async () => {
    vi.useFakeTimers()
    const layout = JSON.stringify({ display: 'flex', flexDirection: 'row' })
    const packWithLayout: StoryblokHandoffPack = {
      ...pack,
      story: {
        ...pack.story,
        content: {
          _uid: 'page-1',
          component: 'creation_page',
          body: [
            {
              _uid: 'stack-1',
              component: 'site_stack',
              layout,
              body: [],
            },
          ],
        },
      },
      components: [
        pack.components[0]!,
        {
          name: 'site_stack',
          is_nestable: true,
          schema: {
            body: { type: 'bloks', pos: 0 },
            layout: { type: 'textarea', pos: 1 },
          },
        },
      ],
    }

    let storyPuts = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET'
        if (url.endsWith('/components/') && method === 'GET') {
          return new Response(
            JSON.stringify({
              components: [
                {
                  id: 10,
                  name: 'creation_page',
                  schema: { body: { type: 'bloks' } },
                },
                {
                  id: 12,
                  name: 'site_stack',
                  schema: { body: { type: 'bloks' }, layout: { type: 'textarea' } },
                },
              ],
            }),
            { status: 200 },
          )
        }
        if (method === 'PUT' && url.includes('/components/')) {
          return new Response(JSON.stringify({ component: {} }), { status: 200 })
        }
        if (url.endsWith('/stories/') && method === 'GET') {
          return new Response(
            JSON.stringify({ stories: [{ id: 77, name: 'Creation PoC', slug: 'creation-poc' }] }),
            { status: 200 },
          )
        }
        if (method === 'PUT' && url.includes('/stories/77')) {
          storyPuts += 1
          const content =
            storyPuts === 1
              ? { component: 'creation_page', body: [{ component: 'site_stack' }] }
              : packWithLayout.story.content
          return new Response(JSON.stringify({ story: { id: 77, content } }), { status: 200 })
        }
        return new Response(JSON.stringify({ error: 'unexpected', url, method }), { status: 500 })
      }),
    )

    const pending = pushStoryblokHandoffPack(
      { spaceId: '123', managementToken: 'pat-test', apiBase: 'https://mapi.example.test/v1' },
      packWithLayout,
    )
    await vi.runAllTimersAsync()
    const result = await pending
    expect(result.storyId).toBe(77)
    expect(storyPuts).toBe(2)
    vi.useRealTimers()
  })
})
