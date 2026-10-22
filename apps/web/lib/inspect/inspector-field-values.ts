import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import { SHELL_COPY_PROXY, shellCopyProxyValue } from '../scene/slots'
import {
  cascadeNodeForBreakpoint,
  type DigitalPrimaryBreakpoint,
} from '../scene/cascade'
import type { InspectFieldDef } from './field-catalog'

export function fieldValue(
  node: SceneNode,
  field: InspectFieldDef,
  cascaded: ReturnType<typeof cascadeNodeForBreakpoint>,
): string {
  if (field.name === 'type') return node.type
  if (field.name === 'id') return node.id
  if (field.name === 'name') return String(node.name ?? '')
  const proxy = shellCopyProxyValue(node, field.name)
  if (proxy !== null) return proxy
  if (field.kind === 'token') return cascaded.tokenBindings[field.name] ?? ''
  const raw = cascaded.props[field.name]
  // SiteChart: prefer chartType; fall back to legacy variant so old Instances still show.
  if (field.name === 'chartType' && (raw == null || raw === '')) {
    const legacy = cascaded.props.variant
    if (legacy != null && legacy !== '') return String(legacy)
  }
  if (field.kind === 'boolean') {
    if (raw === true || raw === 'true') return 'true'
    if (raw === false || raw === 'false') return 'false'
    return field.defaultValue ?? 'false'
  }
  if (raw == null || raw === '') {
    if (field.kind === 'enum' && !field.variantAxis) return ''
    return field.defaultValue ?? ''
  }
  // SiteChart series may be stored as point[] — show editable text in Inspect.
  if (field.name === 'data' && Array.isArray(raw)) {
    return raw
      .map((row) => {
        if (!row || typeof row !== 'object') return ''
        const r = row as Record<string, unknown>
        const label = String(r.label ?? '').trim()
        const value = typeof r.value === 'number' ? r.value : Number(r.value)
        if (!label || !Number.isFinite(value)) return ''
        return `${label}: ${value}`
      })
      .filter(Boolean)
      .join('\n')
  }
  return String(raw)
}

const STYLE_LITERAL_KEYS = new Set([
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
  'borderWidth',
  'gap',
])

export function literalFieldValue(
  node: SceneNode,
  field: InspectFieldDef,
  cascaded: ReturnType<typeof cascadeNodeForBreakpoint>,
): string {
  const raw = cascaded.props[field.name]
  if (raw != null && raw !== '') return String(raw)
  if (STYLE_LITERAL_KEYS.has(field.name) && node.style?.[field.name] != null && node.style[field.name] !== '') {
    return String(node.style[field.name])
  }
  return ''
}

/**
 * TokenPicker `value` for Inspect: explicit prop literals mask inherited bindings
 * (HUD / Instance overrides). Matches HUD `boundPath` + paint (props over bindings).
 */
export function tokenBindingForPicker(bindingPath: string, literal: string): string | null {
  if (literal.trim()) return null
  const path = bindingPath.trim()
  return path || null
}

export function sharedFieldValue(
  nodes: SceneNode[],
  field: InspectFieldDef,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): { value: string; shared: boolean } {
  const values = nodes.map((n) =>
    fieldValue(n, field, cascadeNodeForBreakpoint(n, breakpoint, primary)),
  )
  const first = values[0] ?? ''
  return { value: first, shared: values.every((v) => v === first) }
}

export function sharedLiteralValue(
  nodes: SceneNode[],
  field: InspectFieldDef,
  breakpoint: SceneBreakpointId,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): { value: string; shared: boolean } {
  const values = nodes.map((n) =>
    literalFieldValue(n, field, cascadeNodeForBreakpoint(n, breakpoint, primary)),
  )
  const first = values[0] ?? ''
  return { value: first, shared: values.every((v) => v === first) }
}

export function fieldMatchesQuery(field: InspectFieldDef, query: string): boolean {
  if (!query) return true
  const q = query.trim().toLowerCase()
  if (!q) return true
  return field.name.toLowerCase().includes(q) || field.label.toLowerCase().includes(q)
}

export type SiblingWriteContext =
  | { group: 'box'; kind: import('./box-model-groups').BoxModelKind; writeMode: import('./box-model-groups').BoxModelWriteMode }
  | { group: 'gap'; writeMode: import('./gap-groups').GapWriteMode }

export { SHELL_COPY_PROXY }
