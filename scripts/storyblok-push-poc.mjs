/**
 * One-shot PoC push — no app imports (avoids TS package resolution).
 * Usage: node --env-file=apps/web/.env.local scripts/storyblok-push-poc.mjs
 * Spec: specs/domain/storyblok-handoff.md
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

function loadEnvLocal() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env.local')
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    /* optional */
  }
}

loadEnvLocal()

const spaceId = process.env.STORYBLOK_SPACE_ID?.trim()
const token = process.env.STORYBLOK_MANAGEMENT_TOKEN?.trim()
const apiBase = 'https://mapi.storyblok.com/v1'

if (!spaceId || !token) {
  console.error('Missing STORYBLOK_SPACE_ID or STORYBLOK_MANAGEMENT_TOKEN')
  process.exit(1)
}

const pack = {
  story: {
    name: 'Creation PoC',
    slug: 'creation-poc',
    content: {
      _uid: 'creation-poc-page',
      component: 'creation_page',
      body: [
        {
          _uid: 'stack-poc',
          component: 'site_stack',
          name: 'Hero',
          token_bindings: JSON.stringify({ gap: 'spacing.static.medium' }),
          body: [
            {
              _uid: 'text-poc',
              component: 'site_text',
              children: 'Creation → Storyblok PoC',
              role: 'title',
              token_bindings: JSON.stringify({ color: 'color.ink.primary' }),
            },
            {
              _uid: 'btn-poc',
              component: 'site_button',
              children: 'Get started',
              variant: 'primary',
            },
          ],
        },
      ],
    },
  },
  components: [
    {
      name: 'creation_page',
      display_name: 'Creation Page',
      is_root: true,
      is_nestable: false,
      schema: {
        body: { type: 'bloks', pos: 0, description: 'Page body (Site Kit bloks)' },
      },
    },
    {
      name: 'site_stack',
      display_name: 'SiteStack',
      is_root: false,
      is_nestable: true,
      schema: {
        name: { type: 'text', pos: 0 },
        body: { type: 'bloks', pos: 1 },
        token_bindings: { type: 'textarea', pos: 2 },
      },
    },
    {
      name: 'site_text',
      display_name: 'SiteText',
      is_root: false,
      is_nestable: true,
      schema: {
        children: { type: 'text', pos: 0 },
        role: { type: 'text', pos: 1 },
        name: { type: 'text', pos: 2 },
        token_bindings: { type: 'textarea', pos: 3 },
      },
    },
    {
      name: 'site_button',
      display_name: 'SiteButton',
      is_root: false,
      is_nestable: true,
      schema: {
        children: { type: 'text', pos: 0 },
        variant: { type: 'text', pos: 1 },
        name: { type: 'text', pos: 2 },
        disabled: { type: 'boolean', pos: 3 },
        token_bindings: { type: 'textarea', pos: 4 },
      },
    },
  ],
}

async function mapi(method, path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { raw: text }
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${JSON.stringify(json)}`)
  }
  return json
}

const existingComponents = (await mapi('GET', `/spaces/${spaceId}/components/`)).components || []
const byName = new Map(existingComponents.map((c) => [c.name, c]))

const created = []
const updated = []
for (const def of pack.components) {
  const payload = { component: def }
  const found = byName.get(def.name)
  if (found) {
    await mapi('PUT', `/spaces/${spaceId}/components/${found.id}`, payload)
    updated.push(def.name)
  } else {
    await mapi('POST', `/spaces/${spaceId}/components/`, payload)
    created.push(def.name)
  }
}

const stories = (await mapi('GET', `/spaces/${spaceId}/stories/`)).stories || []
const existingStory = stories.find((s) => s.slug === pack.story.slug)
const storyPayload = { story: pack.story }

let storyId
let action
if (existingStory) {
  await mapi('PUT', `/spaces/${spaceId}/stories/${existingStory.id}`, storyPayload)
  storyId = existingStory.id
  action = 'updated'
} else {
  const out = await mapi('POST', `/spaces/${spaceId}/stories/`, storyPayload)
  storyId = out.story?.id
  action = 'created'
}

console.log(
  JSON.stringify(
    {
      componentsCreated: created,
      componentsUpdated: updated,
      storyAction: action,
      storyId,
      storySlug: pack.story.slug,
      appUrl: `https://app.storyblok.com/#/me/spaces/${spaceId}/stories/0/0/${storyId}`,
    },
    null,
    2,
  ),
)
