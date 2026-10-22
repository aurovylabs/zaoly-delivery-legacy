/**
 * Materialize OP-9 cascade into base props/tokenBindings for Mag PDF.
 * Canvas paints via cascadeNodeForBreakpoint; Mag flatten must see the same view.
 */

import type { CompositionScene, SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import {
  cascadeNodeForBreakpoint,
  type DigitalPrimaryBreakpoint,
} from './cascade'
import { resolvePrimaryBreakpoint } from './primary-breakpoint'

/** Deep-clone tree with cascaded props/bindings folded into each node (export-only). */
export function materializeNodeForBreakpoint(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneNode {
  const cascaded = cascadeNodeForBreakpoint(node, breakpoint, primary)
  const children = node.children?.map((child) =>
    materializeNodeForBreakpoint(child, breakpoint, primary),
  )
  return {
    ...node,
    props: cascaded.props,
    tokenBindings:
      Object.keys(cascaded.tokenBindings).length > 0
        ? cascaded.tokenBindings
        : node.tokenBindings,
    children,
  }
}

/**
 * Scene view Mag PDF should render (P89).
 * Mag is the print twin — always fold the **print** OP-9 lane (not tablet/mobile/
 * activeBreakpoint). Print inspect overrides then match the Print viewport; base
 * props remain when no print override exists. Wave H: cascade uses scene primary.
 */
export function materializeSceneForMagazine(scene: CompositionScene): CompositionScene {
  const primary = resolvePrimaryBreakpoint(scene)
  return {
    ...scene,
    root: materializeNodeForBreakpoint(scene.root, 'print', primary),
  }
}
