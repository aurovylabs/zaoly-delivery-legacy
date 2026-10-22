/**
 * Serialize Site Kit trees for Storybook / Save as composition.
 * Spec: `specs/domain/site-kit.md` · `specs/api/site-kit-write.md`
 * Paint: `knowledge/site-kit-token-paint.md`
 * Client-safe (no node:fs).
 */
import type { CSSProperties } from 'react'
import type {
  SceneBreakpointId,
  SceneNode,
  SceneNodeId,
} from '@zaoly/contracts'
import {
  SITE_KIT_ALLOWED_PROPS,
  SITE_KIT_PAINT_PROP_KEYS,
} from '@zaoly/site-kit/composition-codegen'
import { fluidGridTemplateFromColumns } from '@zaoly/site-kit'
import {
  cssGapLiteral,
  isLayoutGapId,
  resolveNodePaintStyle,
  type LayoutGapId,
} from '../inspect/resolve-bindings'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { cascadeNodeForBreakpoint } from '../scene/cascade'
import { isSiteKitInsertableType } from '../scene/site-kit-palette'

export { SITE_KIT_PAINT_PROP_KEYS }

/** JSON tree Storybook renders 1:1 with editor paint (tokens → CSS, textAlign, …). */
export type SiteKitCompositionNode = {
  type: string
  name?: string
  /** Optional — keep aligned with `@zaoly/site-kit` CompositionPreview / codegen. */
  props?: Record<string, unknown>
  style?: Record<string, string | number>
  tokenBindings?: Record<string, string>
  children?: SiteKitCompositionNode[]
}

export type SerializeSiteKitOptions = {
  /** Active editor breakpoint — cascade before paint (default desktop). */
  breakpoint?: SceneBreakpointId
  /** Wave H — OP-9 cascade base (default desktop). */
  primaryBreakpoint?: Exclude<SceneBreakpointId, 'print'>
  /** Live token pack catalog (canvas parity). Falls back to fixture catalog. */
  tokenCatalog?: InspectTokenOption[]
}

function truthyWrap(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return undefined
}

/** Site Kit CSS vars aligned with `packages/site-kit/src/tokens.css` + DS gap ladder. */
const LAYOUT_GAP_CSS: Record<LayoutGapId, string> = {
  none: '0',
  xs: 'var(--site-space-1)',
  sm: 'var(--site-space-2)',
  md: 'var(--site-space-4)',
  lg: 'var(--site-space-5)',
  xl: 'var(--site-space-6)',
}

function walk(node: SceneNode, visit: (n: SceneNode) => void): void {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

/**
 * Keep only Site Kit contract props for `type`.
 * Inspect/paint keys (zIndex, gap, …) resolve into `style` via resolveNodePaintStyle.
 */
export function stripSiteKitPaintProps(
  props: Record<string, unknown>,
  type?: string,
): Record<string, unknown> {
  const allowed = type ? SITE_KIT_ALLOWED_PROPS[type] : undefined
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'slot') continue
    if (SITE_KIT_PAINT_PROP_KEYS.has(key)) continue
    if (allowed && !allowed.has(key)) continue
    if (value == null) continue
    out[key] = value
  }
  return out
}

/** Explicit gap enum/literal → CSS (token-bound gap already resolved by paint). */
export function resolveSiteKitGapCss(
  props?: Record<string, unknown> | null,
): string | number | undefined {
  const g = props?.gap
  if (isLayoutGapId(g)) return LAYOUT_GAP_CSS[g]
  return cssGapLiteral(props)
}

/**
 * Flex/grid layout must live on the Site Kit shell, not the selection wrap.
 * Sync Direction → flexDirection / wrap; Grid columns → gridTemplateColumns.
 */
export function ensureSiteKitLayoutPaint(
  type: string,
  props: Record<string, unknown>,
  paint: CSSProperties,
): CSSProperties {
  const next: CSSProperties = { ...paint }
  if (type === 'SiteGrid') {
    next.display = 'grid'
    const template = fluidGridTemplateFromColumns(
      props.columns as string | number | undefined,
    )
    if (template && (next.gridTemplateColumns == null || next.gridTemplateColumns === '')) {
      next.gridTemplateColumns = template
    }
    return next
  }
  if (type !== 'SiteStack' && type !== 'SiteContainer') return next

  next.display = 'flex'
  const dir = props.direction === 'row' ? 'row' : 'column'
  next.flexDirection = dir
  const wrap = truthyWrap(props.wrap)
  if (wrap === true) next.flexWrap = 'wrap'
  else if (wrap === false) next.flexWrap = 'nowrap'
  else if (dir === 'row' && next.flexWrap == null) next.flexWrap = 'wrap'
  return next
}

function jsonSafeStyle(style: CSSProperties): Record<string, string | number> | undefined {
  const out: Record<string, string | number> = {}
  for (const [k, v] of Object.entries(style)) {
    if (v == null || v === '') continue
    if (typeof v === 'string' || typeof v === 'number') out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

/** Contract-only args for CSF story patch (no padding/width paint junk). */
export function siteKitArgsFromNode(node: SceneNode): Record<string, unknown> {
  return stripSiteKitPaintProps({ ...(node.props ?? {}) }, node.type)
}

/** Full nested tree + resolved CSS so Storybook matches CREATION canvas. */
export function serializeSiteKitComposition(
  node: SceneNode,
  options?: SerializeSiteKitOptions,
): SiteKitCompositionNode {
  const breakpoint = options?.breakpoint ?? 'desktop'
  const primary =
    options?.primaryBreakpoint === 'tablet' ||
    options?.primaryBreakpoint === 'mobile' ||
    options?.primaryBreakpoint === 'desktop'
      ? options.primaryBreakpoint
      : 'desktop'
  const cascaded = cascadeNodeForBreakpoint(node, breakpoint, primary)
  const props = stripSiteKitPaintProps({ ...cascaded.props }, node.type)
  let paint = resolveNodePaintStyle(
    cascaded.props,
    cascaded.tokenBindings,
    (node.style ?? {}) as CSSProperties,
    options?.tokenCatalog,
  )
  const gapCss = resolveSiteKitGapCss(cascaded.props)
  if (gapCss != null) {
    const enumWins = isLayoutGapId(cascaded.props.gap)
    if (enumWins || paint.gap == null || paint.gap === '') {
      paint.gap = gapCss
    }
  }
  paint = ensureSiteKitLayoutPaint(node.type, cascaded.props, paint)
  const style = jsonSafeStyle(paint)
  const tokenBindings =
    cascaded.tokenBindings && Object.keys(cascaded.tokenBindings).length > 0
      ? { ...cascaded.tokenBindings }
      : undefined
  return {
    type: node.type,
    ...(node.name ? { name: node.name } : {}),
    props,
    ...(style ? { style } : {}),
    ...(tokenBindings ? { tokenBindings } : {}),
    ...(node.children?.length
      ? {
          children: node.children.map((child) =>
            serializeSiteKitComposition(child, options),
          ),
        }
      : {}),
  }
}

/** Merge token paths from the tree (for story parameters / docs). */
export function collectSiteKitTokenBindings(node: SceneNode): Record<string, string> {
  const out: Record<string, string> = { ...(node.tokenBindings ?? {}) }
  walk(node, (n) => {
    if (n === node || !n.tokenBindings) return
    for (const [k, v] of Object.entries(n.tokenBindings)) {
      const key = n.name ? `${n.name}.${k}` : `${n.type}.${k}`
      out[key] = v
    }
  })
  return out
}

/** Rehydrate override composition JSON into a scene subtree (Patterns palette). */
export function deserializeSiteKitComposition(
  node: SiteKitCompositionNode,
  createId: (prefix: string) => SceneNodeId,
): SceneNode {
  const style = node.style as SceneNode['style'] | undefined
  return {
    id: createId(node.type.toLowerCase()),
    type: node.type,
    ...(node.name ? { name: node.name } : {}),
    props: { ...(node.props ?? {}) },
    ...(style ? { style } : {}),
    ...(node.tokenBindings && Object.keys(node.tokenBindings).length
      ? { tokenBindings: { ...node.tokenBindings } }
      : {}),
    ...(node.children?.length
      ? {
          children: node.children.map((child) =>
            deserializeSiteKitComposition(child, createId),
          ),
        }
      : {}),
  }
}

/** @deprecated Prefer selected atom / Save as composition. Kept for write-client re-exports. */
export function resolveSiteKitSyncRoot(
  selected: SceneNode,
  _sceneRoot: SceneNode,
): SceneNode | null {
  return isSiteKitInsertableType(selected.type) ? selected : null
}
