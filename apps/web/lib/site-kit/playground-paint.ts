/**
 * Re-paint Site Kit composition trees for Kit Playground preview.
 * Spec: site-kit-playground.md SK-V6/V7 · knowledge/site-kit-token-paint.md
 *
 * SK-V7: viewport drives deserialize → cascade (via serializeSiteKitComposition) → paint.
 * Kit override SSOT stays single-BP flattened at save; cascade is a no-op until a SceneNode
 * carries `breakpoints`.
 */
import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { createSceneNodeId } from '../scene/scene-tree'
import {
  deserializeSiteKitComposition,
  serializeSiteKitComposition,
} from './sync-tree'

export type PlaygroundPaintOptions = {
  tokenCatalog?: InspectTokenOption[]
  /** Digital viewport / editor breakpoint (default desktop). */
  breakpoint?: SceneBreakpointId
}

/** Paint a kit composition tree for the selected Playground viewport. */
export function paintPlaygroundComposition(
  node: SiteKitCompositionNode,
  tokenCatalogOrOptions?: InspectTokenOption[] | PlaygroundPaintOptions,
  breakpointArg?: SceneBreakpointId,
): SiteKitCompositionNode {
  const opts: PlaygroundPaintOptions = Array.isArray(tokenCatalogOrOptions)
    ? { tokenCatalog: tokenCatalogOrOptions, breakpoint: breakpointArg }
    : { ...(tokenCatalogOrOptions ?? {}), breakpoint: breakpointArg ?? tokenCatalogOrOptions?.breakpoint }

  const breakpoint = opts.breakpoint && opts.breakpoint !== 'print' ? opts.breakpoint : 'desktop'
  const root = deserializeSiteKitComposition(node, createSceneNodeId)
  return serializeSiteKitComposition(root, {
    breakpoint,
    tokenCatalog: opts.tokenCatalog,
  })
}

/**
 * Paint a scene root that may carry `breakpoints` (unit tests / future BP-aware seeds).
 * Kit SSOT compositions normally lack this matrix.
 */
export function paintPlaygroundSceneRoot(
  root: SceneNode,
  opts?: PlaygroundPaintOptions,
): SiteKitCompositionNode {
  const breakpoint = opts?.breakpoint && opts.breakpoint !== 'print' ? opts.breakpoint : 'desktop'
  return serializeSiteKitComposition(root, {
    breakpoint,
    tokenCatalog: opts?.tokenCatalog,
  })
}
