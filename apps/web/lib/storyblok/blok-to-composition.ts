/**
 * Storyblok blok tree → Site Kit composition for Visual Preview.
 * Spec: specs/domain/storyblok-preview.md
 */
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import { tokenPathToCssVarRef } from '@zaoly/site-kit/composition-codegen'

export type StoryblokBlokLike = {
  _uid?: string
  component?: string
  body?: StoryblokBlokLike[]
  token_bindings?: string
  layout?: string
  collection_id?: string
  [key: string]: unknown
}

const SKIP_KEYS = new Set([
  '_uid',
  'component',
  'body',
  'token_bindings',
  'layout',
  'collection_id',
  '_editable',
  '_stopResolving',
])

export function blokNameToSiteKitType(component: string): string {
  const c = component.trim()
  if (!c || c === 'creation_page') return 'SiteStack'
  if (c.startsWith('Site')) return c
  if (c.startsWith('site_')) {
    const parts = c.slice(5).split('_').filter(Boolean)
    return `Site${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`
  }
  return `Site${c.charAt(0).toUpperCase()}${c.slice(1)}`
}

function parseTokenBindings(raw: unknown): Record<string, string> | undefined {
  if (raw == null || raw === '') return undefined
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string' && v.trim()) out[k] = v.trim()
    }
    return Object.keys(out).length ? out : undefined
  }
  if (typeof raw !== 'string') return undefined
  try {
    const parsed = JSON.parse(raw) as unknown
    return parseTokenBindings(parsed)
  } catch {
    return undefined
  }
}

function parseLayout(raw: unknown): Record<string, string | number> | undefined {
  if (raw == null || raw === '') return undefined
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const out: Record<string, string | number> = {}
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === 'string' || typeof v === 'number') out[k] = v
    }
    return Object.keys(out).length ? out : undefined
  }
  if (typeof raw !== 'string') return undefined
  try {
    return parseLayout(JSON.parse(raw) as unknown)
  } catch {
    return undefined
  }
}

function styleFromBindings(bindings: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!bindings) return undefined
  const style: Record<string, string> = {}
  for (const [key, path] of Object.entries(bindings)) {
    style[key] = tokenPathToCssVarRef(path)
  }
  return Object.keys(style).length ? style : undefined
}

function mergePreviewStyle(
  bindings: Record<string, string> | undefined,
  layout: Record<string, string | number> | undefined,
): Record<string, string | number> | undefined {
  const fromTokens = styleFromBindings(bindings)
  if (!fromTokens && !layout) return undefined
  // Layout first (Creation snapshot), then token CSS vars win for bound keys.
  return { ...(layout ?? {}), ...(fromTokens ?? {}) }
}

/** Map one nestable blok (not creation_page wrapper) to a composition node. */
export function storyblokBlokToComposition(blok: StoryblokBlokLike): SiteKitCompositionNode | null {
  const component = typeof blok.component === 'string' ? blok.component : ''
  if (!component) return null

  if (component === 'creation_page') {
    const kids = (blok.body ?? [])
      .map(storyblokBlokToComposition)
      .filter((n): n is SiteKitCompositionNode => n != null)
    return {
      type: 'SiteStack',
      name: 'creation_page',
      props: {},
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        padding: 0,
        width: '100%',
        minHeight: '100%',
      },
      children: kids,
    }
  }

  const type = blokNameToSiteKitType(component)
  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(blok)) {
    if (SKIP_KEYS.has(key)) continue
    if (value === undefined) continue
    props[key] = value
  }

  const tokenBindings = parseTokenBindings(blok.token_bindings)
  const layout = parseLayout(blok.layout)
  const style = mergePreviewStyle(tokenBindings, layout)

  // CompositionPreview contract strips paint props; pass direction for Stack class.
  if (
    (type === 'SiteStack' || type === 'SiteContainer') &&
    (style?.flexDirection === 'row' || props.direction === 'row')
  ) {
    props.direction = 'row'
  }

  const children = (blok.body ?? [])
    .map(storyblokBlokToComposition)
    .filter((n): n is SiteKitCompositionNode => n != null)

  return {
    type,
    name: typeof props.name === 'string' ? props.name : undefined,
    props,
    tokenBindings,
    style,
    ...(children.length ? { children } : {}),
  }
}

/** Root story.content → composition tree. */
export function storyblokContentToComposition(content: StoryblokBlokLike | null | undefined): SiteKitCompositionNode {
  if (!content) {
    return { type: 'SiteStack', props: {}, children: [] }
  }
  const mapped = storyblokBlokToComposition(content)
  return mapped ?? { type: 'SiteStack', props: {}, children: [] }
}

export function collectionIdFromStoryblokContent(
  content: StoryblokBlokLike | null | undefined,
): string | undefined {
  const raw = content?.collection_id
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined
}
