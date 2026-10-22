/**
 * Scene / Site Kit → Storyblok story + component schemas (clipboard PoC).
 * Spec: specs/domain/storyblok-handoff.md
 * Docs: knowledge/storyblok-handoff.md · knowledge/paths.md § Storyblok
 */
import type { CSSProperties } from 'react'
import type { CompositionScene, SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  SITE_KIT_ALLOWED_PROPS,
  SITE_KIT_PAINT_PROP_KEYS,
} from '@zaoly/site-kit/composition-codegen'
import { resolveNodePaintStyle } from '../inspect/resolve-bindings'
import { paths } from '../paths'
import {
  ensureSiteKitLayoutPaint,
  resolveSiteKitGapCss,
} from '../site-kit/sync-tree'
import { prepareSiteKitExportRoot } from './codegen-react'

export const STORYBLOK_HANDOFF_GENERATOR = 'zaoly-storyblok-poc' as const
export const STORYBLOK_PAGE_COMPONENT = 'creation_page' as const

/** Site Kit containers nest children under Storyblok `body` (bloks). */
const CONTAINER_TYPES = new Set([
  'SiteStack',
  'SiteGrid',
  'SiteContainer',
  'SiteTable',
  'SiteTableRow',
])

const BOOLEAN_PROP_KEYS = new Set([
  'disabled',
  'checked',
  'defaultChecked',
  'header',
  'striped',
])

const TEXTAREA_PROP_KEYS = new Set(['markup', 'options', 'caption'])

export type StoryblokFieldType = 'text' | 'textarea' | 'boolean' | 'bloks' | 'number'

export type StoryblokSchemaField = {
  type: StoryblokFieldType
  pos: number
  description?: string
}

export type StoryblokComponentDef = {
  name: string
  display_name?: string
  is_root?: boolean
  is_nestable: boolean
  schema: Record<string, StoryblokSchemaField>
}

/** Storyblok story content blok (every object needs `component` + `_uid`). */
export type StoryblokBlok = {
  _uid: string
  component: string
  body?: StoryblokBlok[]
  token_bindings?: string
  [key: string]: unknown
}

export type StoryblokHandoffPack = {
  meta: {
    generator: typeof STORYBLOK_HANDOFF_GENERATOR
    collectionId: string | null
    sceneId: string
    tokenPackNote: string
    docs: {
      knowledge: string
      storyObject: string
      componentObject: string
    }
  }
  story: {
    name: string
    slug: string
    content: StoryblokBlok
  }
  components: StoryblokComponentDef[]
}

export function siteKitTypeToBlokName(type: string): string {
  const trimmed = type.trim()
  if (!trimmed) return 'site_unknown'
  if (trimmed === STORYBLOK_PAGE_COMPONENT) return trimmed
  const base = trimmed.startsWith('Site') ? trimmed.slice(4) : trimmed
  const snake = base
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
  if (!snake) return 'site_unknown'
  return snake.startsWith('site_') ? snake : `site_${snake}`
}

export function slugifyStoryblok(input: string, fallback = 'page'): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function uidFor(nodeId: string, suffix = ''): string {
  const raw = `${nodeId}${suffix ? `-${suffix}` : ''}`
  // Storyblok _uid is typically a UUID; keep stable deterministic ids for PoC clipboard.
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'blok'
}

function propFieldType(key: string, value: unknown): StoryblokFieldType {
  if (BOOLEAN_PROP_KEYS.has(key) || typeof value === 'boolean') return 'boolean'
  if (TEXTAREA_PROP_KEYS.has(key) || (typeof value === 'string' && value.includes('\n'))) {
    return 'textarea'
  }
  if (typeof value === 'number') return 'number'
  return 'text'
}

function serializePropValue(value: unknown): string | boolean | number {
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function allowedPropKeys(type: string): ReadonlySet<string> | null {
  return SITE_KIT_ALLOWED_PROPS[type] ?? null
}

/**
 * Creation layout/paint snapshot for Visual Preview fidelity.
 * Omits tokenBindings resolution so token pack paths stay SSOT via `token_bindings`.
 * Literals (imported HTML, inspect lengths) round-trip for layout.
 */
export function layoutSnapshotForStoryblok(
  node: SceneNode,
): Record<string, string | number> | undefined {
  const props = { ...(node.props ?? {}) }
  let paint = resolveNodePaintStyle(
    props,
    undefined,
    (node.style ?? {}) as CSSProperties,
    undefined,
  )
  const gapCss = resolveSiteKitGapCss(props)
  if (gapCss != null && (paint.gap == null || paint.gap === '')) {
    paint.gap = gapCss
  }
  paint = ensureSiteKitLayoutPaint(node.type, props, paint)

  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(paint)) {
    if (v == null || v === '') continue
    if (typeof v === 'string' || typeof v === 'number') out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

function mapNodeToBlok(node: SceneNode, usedTypes: Set<string>): StoryblokBlok | null {
  if (node.hidden) return null
  const component = siteKitTypeToBlokName(node.type)
  usedTypes.add(node.type)
  const blok: StoryblokBlok = {
    _uid: uidFor(node.id),
    component,
  }

  const allowed = allowedPropKeys(node.type)
  const props = node.props ?? {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      // Textual children live as props.children on leaves; tree children are node.children.
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        blok.children = serializePropValue(value)
      }
      continue
    }
    if (SITE_KIT_PAINT_PROP_KEYS.has(key)) continue
    if (allowed && !allowed.has(key)) continue
    if (value === undefined) continue
    blok[key] = serializePropValue(value)
  }

  if (node.name && !blok.name) {
    blok.name = node.name
  }

  if (node.tokenBindings && Object.keys(node.tokenBindings).length > 0) {
    blok.token_bindings = JSON.stringify(node.tokenBindings)
  }

  const layout = layoutSnapshotForStoryblok(node)
  if (layout) {
    blok.layout = JSON.stringify(layout)
  }

  const isContainer = CONTAINER_TYPES.has(node.type)
  const childNodes = node.children ?? []
  if (isContainer || childNodes.length > 0) {
    const body: StoryblokBlok[] = []
    for (const child of childNodes) {
      const mapped = mapNodeToBlok(child, usedTypes)
      if (mapped) body.push(mapped)
    }
    blok.body = body
  }

  return blok
}

function schemaForType(type: string): StoryblokComponentDef {
  const name = siteKitTypeToBlokName(type)
  const schema: Record<string, StoryblokSchemaField> = {}
  let pos = 0

  const allowed = allowedPropKeys(type)
  if (allowed) {
    for (const key of [...allowed].sort()) {
      if (key === 'children' && CONTAINER_TYPES.has(type)) {
        // Tree children use `body`; skip duplicating children as text for containers.
        continue
      }
      const sample =
        key === 'disabled' ||
        key === 'checked' ||
        key === 'defaultChecked' ||
        key === 'header' ||
        key === 'striped'
          ? false
          : key === 'rows'
            ? 3
            : ''
      schema[key] = {
        type: propFieldType(key, sample),
        pos: pos++,
        description: key === 'children' ? 'Text content (leaf)' : undefined,
      }
    }
  } else {
    schema.name = { type: 'text', pos: pos++ }
  }

  if (CONTAINER_TYPES.has(type)) {
    schema.body = {
      type: 'bloks',
      pos: pos++,
      description: 'Nested Site Kit bloks',
    }
  }

  schema.token_bindings = {
    type: 'textarea',
    pos: pos++,
    description: 'Token pack paths JSON (not hex SSOT)',
  }

  schema.layout = {
    type: 'textarea',
    pos: pos++,
    description:
      'Creation layout/paint CSS snapshot (JSON). Preview applies this; brand colors prefer token_bindings.',
  }

  return {
    name,
    display_name: type,
    is_nestable: true,
    is_root: false,
    schema,
  }
}

function pageComponentDef(): StoryblokComponentDef {
  return {
    name: STORYBLOK_PAGE_COMPONENT,
    display_name: 'Creation Page',
    is_root: true,
    is_nestable: false,
    schema: {
      body: {
        type: 'bloks',
        pos: 0,
        description: 'Page body (Site Kit bloks)',
      },
      collection_id: {
        type: 'text',
        pos: 1,
        description: 'Collection platformProjectId for token pack preview CSS',
      },
    },
  }
}

export function buildStoryblokHandoffPack(input: {
  target: SceneNode
  scene: CompositionScene
  storyName?: string
  storySlug?: string
  masters?: SceneMaster[] | null
}): StoryblokHandoffPack {
  const prepared = prepareSiteKitExportRoot(input.target, input.masters ?? input.scene.masters)
  const usedTypes = new Set<string>()
  const rootBlok = mapNodeToBlok(prepared, usedTypes)

  const body: StoryblokBlok[] = rootBlok ? [rootBlok] : []
  const name =
    input.storyName?.trim() ||
    input.target.name?.trim() ||
    input.scene.name?.trim() ||
    'Creation page'
  const slug = slugifyStoryblok(input.storySlug || name)

  const components: StoryblokComponentDef[] = [pageComponentDef()]
  const seenBloks = new Set<string>([STORYBLOK_PAGE_COMPONENT])
  for (const type of [...usedTypes].sort()) {
    const def = schemaForType(type)
    if (seenBloks.has(def.name)) continue
    seenBloks.add(def.name)
    components.push(def)
  }

  return {
    meta: {
      generator: STORYBLOK_HANDOFF_GENERATOR,
      collectionId: input.scene.platformProjectId ?? null,
      sceneId: input.scene.id,
      tokenPackNote:
        'Look stays token pack --ds-* + Site Kit; Storyblok stores structure + copy. Do not invent CMS hex as brand SSOT.',
      docs: {
        knowledge: 'knowledge/storyblok-handoff.md',
        storyObject: paths.storyblokDocsStoryObject,
        componentObject: paths.storyblokDocsComponentObject,
      },
    },
    story: {
      name,
      slug,
      content: {
        _uid: uidFor(input.scene.id, 'page'),
        component: STORYBLOK_PAGE_COMPONENT,
        ...(input.scene.platformProjectId
          ? { collection_id: input.scene.platformProjectId }
          : {}),
        body,
      },
    },
    components,
  }
}

export function formatStoryblokHandoffPack(pack: StoryblokHandoffPack): string {
  return JSON.stringify(pack, null, 2)
}

/** Multi-page export: one story per artboard + union of component schemas. */
export function buildStoryblokHandoffPackForPages(input: {
  pages: Array<{ id: string; name: string; root: SceneNode }>
  scene: CompositionScene
  masters?: SceneMaster[] | null
}): StoryblokHandoffPack & { stories: StoryblokHandoffPack['story'][] } {
  const stories: StoryblokHandoffPack['story'][] = []
  const componentsByName = new Map<string, StoryblokComponentDef>()
  let first: StoryblokHandoffPack | null = null

  for (const page of input.pages) {
    const pack = buildStoryblokHandoffPack({
      target: page.root,
      scene: input.scene,
      storyName: page.name || page.id,
      storySlug: slugifyStoryblok(page.name || page.id),
      masters: input.masters,
    })
    if (!first) first = pack
    stories.push(pack.story)
    for (const def of pack.components) {
      if (!componentsByName.has(def.name)) componentsByName.set(def.name, def)
    }
  }

  const meta = first?.meta ?? {
    generator: STORYBLOK_HANDOFF_GENERATOR,
    collectionId: input.scene.platformProjectId ?? null,
    sceneId: input.scene.id,
    tokenPackNote:
      'Look stays token pack --ds-* + Site Kit; Storyblok stores structure + copy. Do not invent CMS hex as brand SSOT.',
    docs: {
      knowledge: 'knowledge/storyblok-handoff.md',
      storyObject: paths.storyblokDocsStoryObject,
      componentObject: paths.storyblokDocsComponentObject,
    },
  }

  const story = stories[0] ?? {
    name: 'Creation page',
    slug: 'page',
    content: {
      _uid: uidFor(input.scene.id, 'page'),
      component: STORYBLOK_PAGE_COMPONENT,
      body: [],
    },
  }

  return {
    meta,
    story,
    stories,
    components: [...componentsByName.values()],
  }
}
