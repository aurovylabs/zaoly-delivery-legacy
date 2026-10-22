/**
 * Balanced JSX return extract + draft helpers for Kit Playground SK-V4.
 * Spec: `specs/domain/site-kit-playground.md`
 */
import {
  generateCompositionModule,
} from '@zaoly/site-kit/composition-codegen'
import type { SiteKitCompositionNode } from '@zaoly/site-kit'
import { SITE_KIT_CATALOG } from './site-kit-catalog'
import {
  updateNodeAtPath,
  type CompositionPath,
} from './composition-path'
import { paths } from '../paths'

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
}

/** Find `return (` … matching `)` with nested paren awareness (string-aware). */
export function extractReturnJsxBalanced(source: string): string | null {
  const cleaned = stripComments(source)
  const marker = cleaned.match(/return\s*\(/)
  if (!marker || marker.index === undefined) return null
  let i = marker.index + marker[0].length
  let depth = 1
  let inStr: '"' | "'" | '`' | null = null
  let escaped = false
  const start = i
  while (i < cleaned.length) {
    const ch = cleaned[i]
    if (inStr) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === inStr) {
        inStr = null
      }
      i += 1
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch
      i += 1
      continue
    }
    if (ch === '(') depth += 1
    else if (ch === ')') {
      depth -= 1
      if (depth === 0) return cleaned.slice(start, i).trim()
    }
    i += 1
  }
  return null
}

export function regeneratePlaygroundSource(
  exportName: string,
  composition: SiteKitCompositionNode,
): string {
  return generateCompositionModule(exportName, composition, SITE_KIT_CATALOG, {
    headerComment:
      '/** CREATION Kit Playground seed — ephemeral edits are not saved. */',
    componentsImportPath: paths.siteKitPackageName,
  })
}

export function setRootProp(
  root: SiteKitCompositionNode,
  key: string,
  value: string | number | boolean,
): SiteKitCompositionNode {
  return setNodeProp(root, [], key, value)
}

export function setRootStyle(
  root: SiteKitCompositionNode,
  key: string,
  value: string | number,
): SiteKitCompositionNode {
  return setNodeStyle(root, [], key, value)
}

/** Bind a token pack path on the composition root (ephemeral Kit Props). */
export function setRootTokenBinding(
  root: SiteKitCompositionNode,
  bindingKey: string,
  tokenPath: string,
): SiteKitCompositionNode {
  return setNodeTokenBinding(root, [], bindingKey, tokenPath)
}

/** Clear a root token binding (e.g. when writing a free style literal). */
export function clearRootTokenBinding(
  root: SiteKitCompositionNode,
  bindingKey: string,
): SiteKitCompositionNode {
  return clearNodeTokenBinding(root, [], bindingKey)
}

/**
 * Write a free style literal and clear the matching token binding so paint does not
 * overwrite the literal on the next re-paint.
 */
export function setRootStyleLiteralClearingBinding(
  root: SiteKitCompositionNode,
  styleKey: string,
  value: string | number,
  bindingKey: string,
): SiteKitCompositionNode {
  return setNodeStyleLiteralClearingBinding(root, [], styleKey, value, bindingKey)
}

export function setNodeProp(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  key: string,
  value: string | number | boolean,
): SiteKitCompositionNode {
  return updateNodeAtPath(root, path, (node) => ({
    ...node,
    props: {
      ...(node.props ?? {}),
      [key]: value,
    },
  }))
}

export function setNodeStyle(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  key: string,
  value: string | number,
): SiteKitCompositionNode {
  return updateNodeAtPath(root, path, (node) => ({
    ...node,
    style: {
      ...(node.style ?? {}),
      [key]: value,
    },
  }))
}

export function setNodeTokenBinding(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  bindingKey: string,
  tokenPath: string,
): SiteKitCompositionNode {
  const trimmed = tokenPath.trim()
  if (!trimmed) return root
  return updateNodeAtPath(root, path, (node) => ({
    ...node,
    tokenBindings: {
      ...(node.tokenBindings ?? {}),
      [bindingKey]: trimmed,
    },
  }))
}

export function clearNodeTokenBinding(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  bindingKey: string,
): SiteKitCompositionNode {
  return updateNodeAtPath(root, path, (node) => {
    const next = { ...(node.tokenBindings ?? {}) }
    delete next[bindingKey]
    if (Object.keys(next).length === 0) {
      const { tokenBindings: _removed, ...rest } = node
      return rest
    }
    return { ...node, tokenBindings: next }
  })
}

export function setNodeStyleLiteralClearingBinding(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  styleKey: string,
  value: string | number,
  bindingKey: string,
): SiteKitCompositionNode {
  return setNodeStyle(clearNodeTokenBinding(root, path, bindingKey), path, styleKey, value)
}

/** Ensure a style key exists so Add binding shows a TokenPicker row (unbound). */
export function ensureNodeStyleSlot(
  root: SiteKitCompositionNode,
  path: CompositionPath,
  styleKey: string,
): SiteKitCompositionNode {
  return updateNodeAtPath(root, path, (node) => {
    if (node.style?.[styleKey] != null) return node
    return {
      ...node,
      style: {
        ...(node.style ?? {}),
        [styleKey]: '',
      },
    }
  })
}

export type PlaygroundDraftMap = Record<
  string,
  { source: string; savedAt: number }
>

export function readPlaygroundDraft(componentId: string): string | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(paths.kitPlaygroundDraftStorageKey)
    if (!raw) return null
    const map = JSON.parse(raw) as PlaygroundDraftMap
    return map[componentId]?.source ?? null
  } catch {
    return null
  }
}

export function writePlaygroundDraft(componentId: string, source: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const raw = sessionStorage.getItem(paths.kitPlaygroundDraftStorageKey)
    const map: PlaygroundDraftMap = raw ? (JSON.parse(raw) as PlaygroundDraftMap) : {}
    map[componentId] = { source, savedAt: Date.now() }
    sessionStorage.setItem(paths.kitPlaygroundDraftStorageKey, JSON.stringify(map))
  } catch {
    /* ignore quota */
  }
}

export function clearPlaygroundDraft(componentId: string): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const raw = sessionStorage.getItem(paths.kitPlaygroundDraftStorageKey)
    if (!raw) return
    const map = JSON.parse(raw) as PlaygroundDraftMap
    delete map[componentId]
    sessionStorage.setItem(paths.kitPlaygroundDraftStorageKey, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}
