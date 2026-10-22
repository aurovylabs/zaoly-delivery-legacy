/**
 * Which breakpoints carry an OP-9 override for a given field key.
 * Spec: specs/domain/editor-inspect.md · OP-9 elsewhere badge
 */
import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'

/** Lanes that can hold sparse overrides (desktop is base — never listed). */
export const OVERRIDE_BREAKPOINT_LANES: readonly Exclude<SceneBreakpointId, 'desktop'>[] = [
  'mobile',
  'tablet',
  'print',
]

export function breakpointsWithFieldOverride(
  node: SceneNode,
  fieldName: string,
): Exclude<SceneBreakpointId, 'desktop'>[] {
  const out: Exclude<SceneBreakpointId, 'desktop'>[] = []
  for (const bp of OVERRIDE_BREAKPOINT_LANES) {
    const lane = node.breakpoints?.[bp]
    if (!lane) continue
    if (lane.props && Object.prototype.hasOwnProperty.call(lane.props, fieldName)) {
      out.push(bp)
      continue
    }
    if (
      lane.tokenBindings &&
      Object.prototype.hasOwnProperty.call(lane.tokenBindings, fieldName)
    ) {
      out.push(bp)
      continue
    }
    if (
      lane.dataBindings &&
      Object.prototype.hasOwnProperty.call(lane.dataBindings, fieldName)
    ) {
      out.push(bp)
    }
  }
  return out
}

/**
 * Breakpoints (other than `activeBreakpoint`) that override `fieldName`
 * on any of the given nodes (union for multi-select).
 */
export function elsewhereBreakpointsForField(
  nodes: SceneNode[],
  fieldName: string,
  activeBreakpoint: SceneBreakpointId,
): Exclude<SceneBreakpointId, 'desktop'>[] {
  const set = new Set<Exclude<SceneBreakpointId, 'desktop'>>()
  for (const node of nodes) {
    for (const bp of breakpointsWithFieldOverride(node, fieldName)) {
      if (bp !== activeBreakpoint) set.add(bp)
    }
  }
  return OVERRIDE_BREAKPOINT_LANES.filter((bp) => set.has(bp))
}

export function breakpointChipAbbrev(bp: Exclude<SceneBreakpointId, 'desktop'>): string {
  if (bp === 'mobile') return 'M'
  if (bp === 'tablet') return 'T'
  return 'P'
}
