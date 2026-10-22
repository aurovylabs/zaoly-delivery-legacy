import type { SceneNode, SceneStateId, SceneStateOverride } from '@zaoly/contracts'
import { resolveNodePaintStyle } from '../inspect/resolve-bindings'

export type CascadedStateView = {
  props: Record<string, unknown>
  tokenBindings: Record<string, string>
  style: Record<string, string | number>
  overrideKeys: Set<string>
}

/**
 * Resolves a SceneNode's active props, tokenBindings, and style for an interactive state
 * (hover, focus, active, disabled). Default state returns base properties.
 */
export function cascadeNodeForState(
  node: SceneNode,
  state: SceneStateId,
  basePropsInput?: Record<string, unknown>,
  baseBindingsInput?: Record<string, string>,
  baseStyleInput?: Record<string, string | number>,
): CascadedStateView {
  const baseProps = { ...(basePropsInput ?? node.props ?? {}) }
  const baseBindings = { ...(baseBindingsInput ?? node.tokenBindings ?? {}) }
  const baseStyle = { ...(baseStyleInput ?? (node.style ?? {}) as Record<string, string | number>) }
  const overrideKeys = new Set<string>()

  if (state === 'default' || !node.states) {
    return { props: baseProps, tokenBindings: baseBindings, style: baseStyle, overrideKeys }
  }

  const override: SceneStateOverride | undefined = node.states[state]
  if (!override) {
    return { props: baseProps, tokenBindings: baseBindings, style: baseStyle, overrideKeys }
  }

  if (override.props) {
    for (const [k, v] of Object.entries(override.props)) {
      baseProps[k] = v
      overrideKeys.add(k)
    }
  }

  if (override.tokenBindings) {
    for (const [k, v] of Object.entries(override.tokenBindings)) {
      baseBindings[k] = v
      overrideKeys.add(k)
    }
  }

  if (override.style) {
    for (const [k, v] of Object.entries(override.style)) {
      baseStyle[k] = v
      overrideKeys.add(k)
    }
  }

  return { props: baseProps, tokenBindings: baseBindings, style: baseStyle, overrideKeys }
}

/** Whether inspect writes should target a state override map (hover/focus/active/disabled). */
export function writesToStateOverride(state: SceneStateId): boolean {
  return state !== 'default'
}

function cssPropertyToKebab(prop: string): string {
  return prop.replace(/([A-Z])/g, '-$1').toLowerCase()
}

function declsForOverride(override: SceneStateOverride): string {
  const style = resolveNodePaintStyle(
    override.props,
    override.tokenBindings,
    override.style as React.CSSProperties,
  )
  return Object.entries(style)
    .map(([k, v]) => `${cssPropertyToKebab(k)}: ${v} !important;`)
    .join(' ')
}

/**
 * Generates scoped CSS for all pseudo-states (:hover, :focus, :active, :disabled) defined in the scene.
 */
export function generateSceneStatesCss(root: SceneNode): string {
  const rules: string[] = []

  function collect(node: SceneNode) {
    if (node.states) {
      const id = node.id
      const states = node.states

      if (states.hover) {
        const decls = declsForOverride(states.hover)
        if (decls) {
          rules.push(`[data-node-id="${id}"]:hover { ${decls} }`)
          // Inspect state-bar force-preview (canvas sets data-force-state).
          rules.push(`[data-node-id="${id}"][data-force-state="hover"] { ${decls} }`)
        }
      }

      if (states.focus) {
        const decls = declsForOverride(states.focus)
        if (decls) {
          rules.push(
            `[data-node-id="${id}"]:focus, [data-node-id="${id}"]:focus-visible, [data-node-id="${id}"]:focus-within { ${decls} }`,
          )
          rules.push(`[data-node-id="${id}"][data-force-state="focus"] { ${decls} }`)
        }
      }

      if (states.active) {
        const decls = declsForOverride(states.active)
        if (decls) {
          rules.push(`[data-node-id="${id}"]:active { ${decls} }`)
          rules.push(`[data-node-id="${id}"][data-force-state="active"] { ${decls} }`)
        }
      }

      if (states.disabled) {
        const decls = declsForOverride(states.disabled)
        if (decls) {
          rules.push(
            `[data-node-id="${id}"]:disabled, [data-node-id="${id}"][aria-disabled="true"], [data-node-id="${id}"][data-disabled="true"] { ${decls} }`,
          )
          rules.push(`[data-node-id="${id}"][data-force-state="disabled"] { ${decls} }`)
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        collect(child)
      }
    }
  }

  collect(root)

  if (rules.length === 0) return ''

  return `
/* Interactive Component States (:hover, :focus, :active, :disabled) */
[data-has-states="true"] {
  transition: all 0.15s ease-in-out;
}
${rules.join('\n')}
`
}
