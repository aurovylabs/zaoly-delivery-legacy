/**
 * Inspect cascade: breakpoint overrides, then interactive state on top.
 * Spec: `specs/domain/canvas-smart-hud.md` W4 · `editor-inspect.md`
 */
import type { SceneBreakpointId, SceneNode, SceneStateId } from '@zaoly/contracts'
import {
  cascadeNodeForBreakpoint,
  type CascadedNodeView,
  type DigitalPrimaryBreakpoint,
} from '../scene/cascade'
import { cascadeNodeForState, writesToStateOverride } from '../scene/state-cascade'

/**
 * Display view for Inspect / HUD field reads.
 * Order: base ← breakpoint ← interactive state.
 */
export function cascadeInspectView(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  state: SceneStateId = 'default',
  primary: DigitalPrimaryBreakpoint = 'desktop',
): CascadedNodeView {
  const bp = cascadeNodeForBreakpoint(node, breakpoint, primary)
  if (!writesToStateOverride(state)) return bp
  const st = cascadeNodeForState(node, state, bp.props, bp.tokenBindings)
  return {
    props: st.props,
    tokenBindings: st.tokenBindings,
    dataBindings: bp.dataBindings,
    overrideKeys: new Set([...bp.overrideKeys, ...st.overrideKeys]),
  }
}
