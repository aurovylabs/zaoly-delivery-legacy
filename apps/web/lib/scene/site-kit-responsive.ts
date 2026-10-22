/**
 * Site Kit responsive defaults (OP-9 sparse overrides + wrap).
 * Spec: specs/domain/site-kit-responsive-defaults.md
 */
import type {
  SceneBreakpointId,
  SceneBreakpointOverride,
  SceneNode,
} from '@zaoly/contracts'

const LAYOUT_SHELLS = new Set(['SiteStack', 'SiteContainer', 'SiteGrid'])

function isRowDirection(node: SceneNode): boolean {
  const dir = node.props?.direction
  if (dir === 'row' || dir === 'row-reverse') return true
  const flex = node.style?.flexDirection
  return flex === 'row' || flex === 'row-reverse'
}

function mergeOverrideLane(
  existing: SceneBreakpointOverride | undefined,
  patch: SceneBreakpointOverride,
): SceneBreakpointOverride {
  const props = { ...(existing?.props ?? {}) }
  for (const [key, value] of Object.entries(patch.props ?? {})) {
    if (!Object.prototype.hasOwnProperty.call(props, key)) props[key] = value
  }
  const tokenBindings = { ...(existing?.tokenBindings ?? {}) }
  for (const [key, value] of Object.entries(patch.tokenBindings ?? {})) {
    if (!Object.prototype.hasOwnProperty.call(tokenBindings, key)) {
      tokenBindings[key] = value
    }
  }
  const dataBindings = { ...(existing?.dataBindings ?? {}) }
  for (const [key, value] of Object.entries(patch.dataBindings ?? {})) {
    if (!Object.prototype.hasOwnProperty.call(dataBindings, key)) {
      dataBindings[key] = value
    }
  }
  const out: SceneBreakpointOverride = {}
  if (Object.keys(props).length) out.props = props
  if (Object.keys(tokenBindings).length) out.tokenBindings = tokenBindings
  if (Object.keys(dataBindings).length) out.dataBindings = dataBindings
  if (typeof existing?.hidden === 'boolean') out.hidden = existing.hidden
  else if (typeof patch.hidden === 'boolean') out.hidden = patch.hidden
  return out
}

function withLane(
  node: SceneNode,
  lane: Exclude<SceneBreakpointId, 'desktop'>,
  patch: SceneBreakpointOverride,
): SceneNode {
  const prev = node.breakpoints?.[lane]
  const merged = mergeOverrideLane(prev, patch)
  if (
    JSON.stringify(merged) === JSON.stringify(prev ?? {}) ||
    (!merged.props && !merged.tokenBindings && !merged.dataBindings)
  ) {
    return node
  }
  return {
    ...node,
    breakpoints: {
      ...(node.breakpoints ?? {}),
      [lane]: merged,
    },
  }
}

/** Props soft-fill for layout shells (wrap on row-capable inserts). */
export function siteKitResponsiveBaseProps(
  type: string,
  props: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const next = { ...(props ?? {}) }
  if (type === 'SiteStack' || type === 'SiteContainer') {
    if (next.wrap == null) next.wrap = true
  }
  return next
}

function propsEqual(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined,
): boolean {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {})
}

/**
 * Apply merge-only responsive defaults to one node (not children).
 * - Row shells → wrap + mobile column/gap
 * - Grids → mobile gap soft-fill when unset on lane
 * - Large horizontal pad tokens → tablet/mobile tighter pad
 * Returns the same reference when nothing changed.
 */
export function applySiteKitResponsiveNode(node: SceneNode): SceneNode {
  const baseProps = siteKitResponsiveBaseProps(node.type, node.props)
  let next: SceneNode = propsEqual(baseProps, node.props)
    ? node
    : { ...node, props: baseProps }

  if (
    (node.type === 'SiteStack' || node.type === 'SiteContainer') &&
    isRowDirection(next)
  ) {
    if (next.props?.wrap == null) {
      next = { ...next, props: { ...(next.props ?? {}), wrap: true } }
    }
    next = withLane(next, 'mobile', {
      props: { direction: 'column', gap: 'sm' },
    })
  }

  if (node.type === 'SiteGrid') {
    next = withLane(next, 'mobile', { props: { gap: 'md' } })
    next = withLane(next, 'tablet', { props: { gap: 'md' } })
  }

  const padInline = next.tokenBindings?.paddingInline
  if (
    padInline === 'spacing.padding.xl' ||
    padInline === 'spacing.padding.page' ||
    padInline === 'spacing.margin.section'
  ) {
    next = withLane(next, 'tablet', {
      tokenBindings: { paddingInline: 'spacing.padding.lg' },
    })
    next = withLane(next, 'mobile', {
      tokenBindings: { paddingInline: 'spacing.padding.md' },
    })
  }

  const padBlock =
    next.tokenBindings?.paddingBlock ?? next.tokenBindings?.paddingTop
  if (
    padBlock === 'spacing.margin.section' ||
    padBlock === 'spacing.padding.page'
  ) {
    next = withLane(next, 'mobile', {
      tokenBindings: {
        ...(padBlock === next.tokenBindings?.paddingTop
          ? { paddingTop: 'spacing.padding.xl' }
          : { paddingBlock: 'spacing.padding.xl' }),
      },
    })
  }

  return next
}

/** Deep walk — merge-only, safe to re-run. Same reference if unchanged. */
export function applySiteKitResponsiveDefaults(root: SceneNode): SceneNode {
  const self = applySiteKitResponsiveNode(root)
  if (!root.children?.length) return self
  let childChanged = false
  const children = root.children.map((child) => {
    const next = applySiteKitResponsiveDefaults(child)
    if (next !== child) childChanged = true
    return next
  })
  if (!childChanged && self === root) return root
  return { ...self, children }
}

/** True when a row shell is missing wrap or mobile direction override. */
export function siteKitNodeNeedsResponsiveDefaults(node: SceneNode): boolean {
  if (
    (node.type === 'SiteStack' || node.type === 'SiteContainer') &&
    isRowDirection(node)
  ) {
    const wrap = node.props?.wrap
    if (wrap !== true && wrap !== 'true') return true
    if (node.breakpoints?.mobile?.props?.direction == null) return true
  }
  if (node.type === 'SiteGrid') {
    if (node.breakpoints?.mobile?.props?.gap == null) return true
  }
  for (const child of node.children ?? []) {
    if (siteKitNodeNeedsResponsiveDefaults(child)) return true
  }
  return false
}
