/**
 * OP-9 cascade: base props/bindings ← active breakpoint override.
 * Primary BP (Wave H, default desktop) uses base only.
 */

import type {
  SceneBreakpointId,
  SceneNode,
} from '@zaoly/contracts'

export type CascadedNodeView = {
  props: Record<string, unknown>
  tokenBindings: Record<string, string>
  dataBindings: Record<string, string>
  /** Keys present on the active BP override (props or tokens). */
  overrideKeys: Set<string>
}

export type DigitalPrimaryBreakpoint = Exclude<SceneBreakpointId, 'print'>

export function cascadeNodeForBreakpoint(
  node: SceneNode,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): CascadedNodeView {
  const baseProps = { ...(node.props ?? {}) }
  const baseBindings = { ...(node.tokenBindings ?? {}) }
  const baseDataBindings = { ...(node.dataBindings ?? {}) }
  const overrideKeys = new Set<string>()

  if (breakpoint === primary) {
    return {
      props: baseProps,
      tokenBindings: baseBindings,
      dataBindings: baseDataBindings,
      overrideKeys,
    }
  }

  const override = node.breakpoints?.[breakpoint]
  if (!override) {
    return {
      props: baseProps,
      tokenBindings: baseBindings,
      dataBindings: baseDataBindings,
      overrideKeys,
    }
  }

  if (override.props) {
    for (const key of Object.keys(override.props)) overrideKeys.add(key)
  }
  if (override.tokenBindings) {
    for (const key of Object.keys(override.tokenBindings)) overrideKeys.add(key)
  }
  if (override.dataBindings) {
    for (const key of Object.keys(override.dataBindings)) overrideKeys.add(key)
  }

  return {
    props: { ...baseProps, ...(override.props ?? {}) },
    tokenBindings: { ...baseBindings, ...(override.tokenBindings ?? {}) },
    dataBindings: { ...baseDataBindings, ...(override.dataBindings ?? {}) },
    overrideKeys,
  }
}

/** Whether inspect writes should target a BP override map (non-primary). */
export function writesToBreakpointOverride(
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): boolean {
  return breakpoint !== primary
}
