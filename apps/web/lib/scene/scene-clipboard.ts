/**
 * Editor scene-node clipboard serialize/parse + paste insert plan (W5c).
 * Spec: specs/domain/scene-core-split-w5.md · knowledge/editor-clipboard.md
 */
import type { CompositionScene, SceneNode, SceneNodeId } from '@zaoly/contracts'
import { paths } from '../paths'
import {
  findNode,
  findParent,
  isNodeOrAncestorLocked,
} from './scene-tree'
import {
  isSceneContainerType,
  type InsertPlan,
} from './scene-drop-plan'

/** Payload kind for editor clipboard JSON (`knowledge/editor-clipboard.md`). */
export const EDITOR_CLIPBOARD_KIND = paths.editorClipboardKind

export function planPasteInsert(
  scene: CompositionScene,
  selectedId: SceneNodeId | null,
  root: SceneNode = scene.root,
): InsertPlan {
  const primary = selectedId ? findNode(root, selectedId) : root
  if (!primary) return { ok: false, reason: 'Unknown paste target' }
  if (isSceneContainerType(primary.type)) {
    if (isNodeOrAncestorLocked(root, primary.id)) {
      return { ok: false, reason: `Node is locked: ${primary.id}` }
    }
    return { ok: true, parentId: primary.id, index: primary.children?.length ?? 0 }
  }
  const located = findParent(root, primary.id)
  if (!located) return { ok: false, reason: 'Cannot paste beside root' }
  if (isNodeOrAncestorLocked(root, located.parent.id)) {
    return { ok: false, reason: `Node is locked: ${located.parent.id}` }
  }
  return { ok: true, parentId: located.parent.id, index: located.index + 1 }
}

export function clipboardNodesFromSelection(
  scene: CompositionScene,
  ids: SceneNodeId[],
  root: SceneNode = scene.root,
): SceneNode[] {
  const nodes: SceneNode[] = []
  for (const id of ids) {
    if (!id || id === root.id) continue
    const node = findNode(root, id)
    if (node) nodes.push(structuredClone(node))
  }
  return nodes
}

function isSceneNodeLike(value: unknown): value is SceneNode {
  if (!value || typeof value !== 'object') return false
  const node = value as Record<string, unknown>
  if (typeof node.id !== 'string' || !node.id.trim()) return false
  if (typeof node.type !== 'string' || !node.type.trim()) return false
  if (node.children == null) return true
  return Array.isArray(node.children) && node.children.every(isSceneNodeLike)
}

export function isValidClipboardNodes(value: unknown): value is SceneNode[] {
  return Array.isArray(value) && value.length > 0 && value.every(isSceneNodeLike)
}

export function serializeEditorClipboard(nodes: SceneNode[]): string {
  return JSON.stringify({ kind: EDITOR_CLIPBOARD_KIND, nodes })
}

export function parseEditorClipboard(raw: string): SceneNode[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const payload = parsed as { kind?: unknown; nodes?: unknown }
    if (payload.kind === EDITOR_CLIPBOARD_KIND) {
      return isValidClipboardNodes(payload.nodes) ? payload.nodes : null
    }
    return isValidClipboardNodes(parsed) ? parsed : null
  } catch {
    return null
  }
}

