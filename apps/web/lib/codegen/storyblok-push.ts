/**
 * Push Storyblok handoff pack via Management API (server/scripts only).
 * Spec: specs/domain/storyblok-handoff.md
 */
import type { StoryblokComponentDef, StoryblokHandoffPack } from './storyblok-handoff'
import { storyblokStoryAppUrl } from './storyblok-config'

export type StoryblokPushConfig = {
  spaceId: string
  managementToken: string
  /** Default: paths.storyblokManagementApiBase */
  apiBase?: string
}

export type StoryblokPushResult = {
  componentsCreated: string[]
  componentsUpdated: string[]
  componentsSkipped: string[]
  storyId: number | null
  storySlug: string
  storyAction: 'created' | 'updated' | 'skipped'
  /** Present when space + story id known. */
  appUrl?: string
  /** Multi-page pushes. */
  stories?: Array<{
    storyId: number | null
    storySlug: string
    storyAction: 'created' | 'updated' | 'skipped'
    appUrl?: string
  }>
}

type ExistingComponent = {
  id: number
  name: string
  schema?: Record<string, unknown>
}
type ExistingStory = { id: number; name: string; slug: string }

async function mapi(
  config: StoryblokPushConfig,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const base = (config.apiBase ?? 'https://mapi.storyblok.com/v1').replace(/\/$/, '')
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: config.managementToken,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let json: unknown = null
  const text = await res.text()
  if (text) {
    try {
      json = JSON.parse(text) as unknown
    } catch {
      json = { raw: text }
    }
  }
  return { ok: res.ok, status: res.status, json }
}

function componentPayload(def: StoryblokComponentDef) {
  return {
    component: {
      name: def.name,
      display_name: def.display_name ?? null,
      is_root: Boolean(def.is_root),
      is_nestable: Boolean(def.is_nestable),
      schema: def.schema,
    },
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Count bloks that carry a non-empty `layout` snapshot. */
export function countStoryblokLayoutFields(node: unknown): number {
  if (!node || typeof node !== 'object') return 0
  let n = 0
  const rec = node as Record<string, unknown>
  if (typeof rec.layout === 'string' && rec.layout.trim()) n += 1
  for (const value of Object.values(rec)) {
    if (Array.isArray(value)) {
      for (const child of value) n += countStoryblokLayoutFields(child)
    } else if (value && typeof value === 'object') {
      n += countStoryblokLayoutFields(value)
    }
  }
  return n
}

function packNeedsLayoutSchema(
  components: StoryblokComponentDef[],
): boolean {
  return components.some((def) => Boolean(def.schema?.layout))
}

export async function listStoryblokComponents(
  config: StoryblokPushConfig,
): Promise<ExistingComponent[]> {
  const res = await mapi(config, 'GET', `/spaces/${config.spaceId}/components/`)
  if (!res.ok) {
    throw new Error(`list components failed: HTTP ${res.status} ${JSON.stringify(res.json)}`)
  }
  const data = res.json as { components?: ExistingComponent[] }
  return data.components ?? []
}

export async function listStoryblokStories(
  config: StoryblokPushConfig,
): Promise<ExistingStory[]> {
  const res = await mapi(config, 'GET', `/spaces/${config.spaceId}/stories/`)
  if (!res.ok) {
    throw new Error(`list stories failed: HTTP ${res.status} ${JSON.stringify(res.json)}`)
  }
  const data = res.json as { stories?: ExistingStory[] }
  return data.stories ?? []
}

async function assertLayoutSchemaReady(
  config: StoryblokPushConfig,
  defs: StoryblokComponentDef[],
): Promise<void> {
  const existing = await listStoryblokComponents(config)
  const byName = new Map(existing.map((c) => [c.name, c]))
  for (const def of defs) {
    if (!def.schema?.layout) continue
    const found = byName.get(def.name)
    if (!found) {
      throw new Error(`component ${def.name} missing after schema upsert`)
    }
    const keys = found.schema ? Object.keys(found.schema) : []
    if (!keys.includes('layout')) {
      // List payload sometimes omits schema — fetch one component.
      const detail = await mapi(
        config,
        'GET',
        `/spaces/${config.spaceId}/components/${found.id}`,
      )
      if (!detail.ok) {
        throw new Error(`read component ${def.name} failed: HTTP ${detail.status}`)
      }
      const schema = (detail.json as { component?: { schema?: Record<string, unknown> } })
        .component?.schema
      if (!schema || !('layout' in schema)) {
        throw new Error(
          `component ${def.name} schema missing "layout" after upsert (got: ${Object.keys(schema ?? {}).join(', ')})`,
        )
      }
    }
  }
}

async function putStoryEnsuringLayout(
  config: StoryblokPushConfig,
  storyId: number,
  storyBody: unknown,
  expectedLayouts: number,
): Promise<void> {
  const res = await mapi(
    config,
    'PUT',
    `/spaces/${config.spaceId}/stories/${storyId}`,
    storyBody,
  )
  if (!res.ok) {
    throw new Error(`update story failed: HTTP ${res.status} ${JSON.stringify(res.json)}`)
  }
  if (expectedLayouts === 0) return

  let got = countStoryblokLayoutFields(
    (res.json as { story?: { content?: unknown } }).story?.content,
  )
  if (got >= expectedLayouts) return

  await sleep(1500)
  const retry = await mapi(
    config,
    'PUT',
    `/spaces/${config.spaceId}/stories/${storyId}`,
    storyBody,
  )
  if (!retry.ok) {
    throw new Error(`retry story failed: HTTP ${retry.status} ${JSON.stringify(retry.json)}`)
  }
  got = countStoryblokLayoutFields(
    (retry.json as { story?: { content?: unknown } }).story?.content,
  )
  if (got < expectedLayouts) {
    throw new Error(
      `Storyblok stripped layout fields after push (expected ${expectedLayouts}, got ${got}). Component schemas must include textarea "layout".`,
    )
  }
}

/**
 * Upsert component schemas from the pack, then create/update the story content.
 * Existing starter bloks (`page`, `teaser`, …) are left alone unless names collide.
 * Multi-page packs MAY include `stories[]` — each is upserted after components.
 *
 * Storyblok drops unknown blok fields when the component schema lacks them.
 * When the pack defines `layout`, we settle schemas before writing story content
 * and retry once if layout snapshots were stripped.
 */
export async function pushStoryblokHandoffPack(
  config: StoryblokPushConfig,
  pack: StoryblokHandoffPack & { stories?: StoryblokHandoffPack['story'][] },
  options?: { publish?: boolean; storySlug?: string },
): Promise<StoryblokPushResult> {
  const existing = await listStoryblokComponents(config)
  const byName = new Map(existing.map((c) => [c.name, c]))

  const componentsCreated: string[] = []
  const componentsUpdated: string[] = []
  const componentsSkipped: string[] = []

  for (const def of pack.components) {
    const found = byName.get(def.name)
    if (found) {
      const res = await mapi(
        config,
        'PUT',
        `/spaces/${config.spaceId}/components/${found.id}`,
        componentPayload(def),
      )
      if (!res.ok) {
        throw new Error(
          `update component ${def.name} failed: HTTP ${res.status} ${JSON.stringify(res.json)}`,
        )
      }
      componentsUpdated.push(def.name)
    } else {
      const res = await mapi(
        config,
        'POST',
        `/spaces/${config.spaceId}/components/`,
        componentPayload(def),
      )
      if (!res.ok) {
        throw new Error(
          `create component ${def.name} failed: HTTP ${res.status} ${JSON.stringify(res.json)}`,
        )
      }
      componentsCreated.push(def.name)
    }
  }

  if (packNeedsLayoutSchema(pack.components)) {
    await sleep(1200)
    await assertLayoutSchemaReady(config, pack.components)
  }

  const storyList =
    pack.stories && pack.stories.length > 0 ? pack.stories : [pack.story]

  const storyResults: NonNullable<StoryblokPushResult['stories']> = []
  let listed = await listStoryblokStories(config)

  for (const story of storyList) {
    const slug =
      options?.storySlug && storyList.length === 1
        ? options.storySlug
        : story.slug || 'creation-poc'
    const existingStory = listed.find((s) => s.slug === slug)
    const storyBody = {
      story: {
        name: story.name,
        slug,
        content: story.content,
      },
      ...(options?.publish ? { publish: 1 } : {}),
    }
    const expectedLayouts = countStoryblokLayoutFields(story.content)

    if (existingStory) {
      await putStoryEnsuringLayout(config, existingStory.id, storyBody, expectedLayouts)
      storyResults.push({
        storyId: existingStory.id,
        storySlug: slug,
        storyAction: 'updated',
        appUrl: storyblokStoryAppUrl(config.spaceId, existingStory.id),
      })
    } else {
      const res = await mapi(config, 'POST', `/spaces/${config.spaceId}/stories/`, storyBody)
      if (!res.ok) {
        throw new Error(`create story failed: HTTP ${res.status} ${JSON.stringify(res.json)}`)
      }
      const created = res.json as { story?: { id?: number; content?: unknown } }
      const id = created.story?.id ?? null
      if (id != null && expectedLayouts > 0) {
        const got = countStoryblokLayoutFields(created.story?.content)
        if (got < expectedLayouts) {
          await putStoryEnsuringLayout(config, id, storyBody, expectedLayouts)
        }
      }
      storyResults.push({
        storyId: id,
        storySlug: slug,
        storyAction: 'created',
        appUrl: id != null ? storyblokStoryAppUrl(config.spaceId, id) : undefined,
      })
      listed = await listStoryblokStories(config)
    }
  }

  const primary = storyResults[storyResults.length - 1]!
  return {
    componentsCreated,
    componentsUpdated,
    componentsSkipped,
    storyId: primary.storyId,
    storySlug: primary.storySlug,
    storyAction: primary.storyAction,
    appUrl: primary.appUrl,
    stories: storyResults,
  }
}
