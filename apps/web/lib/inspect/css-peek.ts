import type { CSSProperties } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import { resolveNodePaintStyle } from './resolve-bindings'
import type { InspectTokenOption } from './token-catalog'

export type CssPeekRow = { key: string; value: string }

/**
 * Read-only CSS / attr peek for the inspector CSS tab.
 * Resolves token bindings + numeric style; lists notable props as attrs.
 */
export function peekResolvedCss(
  node: SceneNode,
  catalog?: InspectTokenOption[],
): {
  styles: CssPeekRow[]
  attrs: CssPeekRow[]
} {
  const resolved = resolveNodePaintStyle(
    node.props,
    node.tokenBindings,
    (node.style ?? {}) as CSSProperties,
    catalog,
  )
  const styles: CssPeekRow[] = Object.entries(resolved)
    .filter(([, v]) => v != null && v !== '')
    .map(([key, value]) => ({ key, value: String(value) }))
    .sort((a, b) => a.key.localeCompare(b.key))

  const skip = new Set(['children'])
  const attrs: CssPeekRow[] = [
    { key: 'type', value: node.type },
    { key: 'id', value: node.id },
  ]
  if (node.name?.trim()) {
    attrs.push({ key: 'name', value: node.name.trim() })
  }
  for (const [key, value] of Object.entries(node.props ?? {})) {
    if (skip.has(key) || value == null || value === '') continue
    attrs.push({
      key,
      value: typeof value === 'boolean' ? String(value) : String(value),
    })
  }
  attrs.sort((a, b) => a.key.localeCompare(b.key))

  if (node.tokenBindings) {
    for (const [key, path] of Object.entries(node.tokenBindings)) {
      attrs.push({ key: `token:${key}`, value: path })
    }
  }

  return { styles, attrs }
}
