/**
 * Wave D — primary/secondary insert–delete visibility (Figma Sites → OP-9).
 * Spec: specs/domain/responsive-breakpoint-primary-secondary.md
 * Wave H — secondary = any digital BP ≠ scene.primaryBreakpoint.
 */
import type {
  SceneBreakpointId,
  SceneNode,
  SceneOp,
} from '@zaoly/contracts'
import type { DigitalPrimaryBreakpoint } from './cascade'

const DIGITAL_BPS: readonly SceneBreakpointId[] = ['desktop', 'tablet', 'mobile']

/**
 * Secondary write targets for hide / BP-only insert / structure lock.
 * Print is never secondary. Default primary = desktop (pre–Wave H).
 */
export function isBreakpointSecondary(
  bp: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): boolean {
  if (bp === 'print') return false
  if (bp === primary) return false
  return bp === 'desktop' || bp === 'tablet' || bp === 'mobile'
}

/**
 * Wave F — tree topology edits belong on primary only.
 * Returns a stable reason code when the active BP is secondary.
 */
export function secondaryStructureLockedReason(
  bp: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): 'secondary-structure-locked' | null {
  return isBreakpointSecondary(bp, primary) ? 'secondary-structure-locked' : null
}

/** Effective hidden for paint / Layers at a breakpoint. */
export function cascadeNodeHidden(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): boolean {
  if (breakpoint !== primary) {
    const lane = node.breakpoints?.[breakpoint]
    if (lane && typeof lane.hidden === 'boolean') return lane.hidden
  }
  return Boolean(node.hidden)
}

function wouldBeHiddenOnAllDigital(
  node: SceneNode,
  hideAt: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint,
): boolean {
  for (const bp of DIGITAL_BPS) {
    if (bp === hideAt) continue
    if (!cascadeNodeHidden(node, bp, primary)) return false
  }
  return true
}

/** Delete / Backspace: secondary → hide (or remove if orphaned). */
export function planBreakpointAwareRemove(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  if (!isBreakpointSecondary(breakpoint, primary)) {
    return [{ op: 'remove_node', nodeId: node.id }]
  }
  if (wouldBeHiddenOnAllDigital(node, breakpoint, primary)) {
    return [{ op: 'remove_node', nodeId: node.id }]
  }
  return [
    {
      op: 'set_breakpoint_override',
      nodeId: node.id,
      breakpoint,
      hidden: true,
    },
  ]
}

/** True when remove ops only hide on a secondary BP (no hard remove_node). */
export function secondaryRemoveIsHideOnly(ops: SceneOp[]): boolean {
  if (!ops.length) return false
  let sawHide = false
  for (const op of ops) {
    if (op.op === 'remove_node') return false
    if (op.op === 'set_breakpoint_override' && op.hidden === true) {
      sawHide = true
      continue
    }
    return false
  }
  return sawHide
}

/** After insert on secondary: base-hidden + show only on active BP. */
export function planBreakpointAwareInsertVisibility(
  nodeId: string,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  if (!isBreakpointSecondary(breakpoint, primary)) return []
  return [
    { op: 'set_flags', nodeId, hidden: true },
    {
      op: 'set_breakpoint_override',
      nodeId,
      breakpoint,
      hidden: false,
    },
  ]
}

/** Layers eye — secondary writes BP hidden, primary writes node.hidden. */
export function planBreakpointAwareToggleHidden(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp {
  const currently = cascadeNodeHidden(node, breakpoint, primary)
  if (!isBreakpointSecondary(breakpoint, primary)) {
    return { op: 'set_flags', nodeId: node.id, hidden: !currently }
  }
  return {
    op: 'set_breakpoint_override',
    nodeId: node.id,
    breakpoint,
    hidden: !currently,
  }
}

/** True when the node has any sparse override on this BP lane. */
export function nodeHasBreakpointOverrides(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): boolean {
  if (breakpoint === primary) return false
  const lane = node.breakpoints?.[breakpoint]
  if (!lane) return false
  if (lane.props && Object.keys(lane.props).length) return true
  if (lane.tokenBindings && Object.keys(lane.tokenBindings).length) return true
  if (lane.dataBindings && Object.keys(lane.dataBindings).length) return true
  return typeof lane.hidden === 'boolean'
}

/**
 * Wave E — Figma “Reset all changes”: clear the entire secondary lane
 * for each node that has overrides. No-op on primary / empty selection.
 */
export function planResetBreakpointOverrides(
  nodes: SceneNode[],
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  if (!isBreakpointSecondary(breakpoint, primary)) return []
  const ops: SceneOp[] = []
  for (const node of nodes) {
    if (!nodeHasBreakpointOverrides(node, breakpoint, primary)) continue
    ops.push({
      op: 'clear_breakpoint_override',
      nodeId: node.id,
      breakpoint,
    })
  }
  return ops
}
