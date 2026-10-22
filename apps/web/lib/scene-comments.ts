/**
 * Scene-anchored comments (P82b).
 * Persist on CompositionScene.comments — not Zaoly sidefiles.
 */

import type { CompositionScene, SceneComment, SceneNode, SceneNodeId } from '@zaoly/contracts'
import { collectSceneNodeIds } from './scene/scene-pages'

export function collectNodeIds(root: SceneNode): Set<SceneNodeId> {
  const ids = new Set<SceneNodeId>()
  const walk = (node: SceneNode) => {
    ids.add(node.id)
    for (const child of node.children ?? []) walk(child)
  }
  walk(root)
  return ids
}

export function pruneOrphanComments(
  comments: SceneComment[] | undefined,
  root: SceneNode,
): SceneComment[] {
  if (!comments?.length) return []
  const ids = collectNodeIds(root)
  return comments.filter((c) => (c.pinX !== undefined && c.pinY !== undefined) || (c.nodeId && ids.has(c.nodeId)))
}

export function pruneOrphanCommentsForScene(
  comments: SceneComment[] | undefined,
  scene: CompositionScene,
): SceneComment[] {
  if (!comments?.length) return []
  const ids = collectSceneNodeIds(scene)
  return comments.filter((c) => (c.pinX !== undefined && c.pinY !== undefined) || (c.nodeId && ids.has(c.nodeId)))
}

export function withPrunedComments(scene: CompositionScene): CompositionScene {
  const next = pruneOrphanCommentsForScene(scene.comments, scene)
  if (!scene.comments?.length && next.length === 0) return scene
  if (
    scene.comments &&
    scene.comments.length === next.length &&
    scene.comments.every((c, i) => c.id === next[i]?.id)
  ) {
    return scene
  }
  return { ...scene, comments: next.length ? next : undefined }
}

export function createSceneComment(input: {
  nodeId?: SceneNodeId
  body: string
  author?: string
  pinX?: number
  pinY?: number
}): SceneComment | null {
  const body = input.body.trim()
  if (!body) return null
  return {
    id: `cmt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    nodeId: input.nodeId,
    body,
    author: (input.author ?? 'designer').trim() || 'designer',
    createdAt: new Date().toISOString(),
    resolved: false,
    pinX: input.pinX,
    pinY: input.pinY,
    replies: [],
  }
}

export function addSceneComment(
  scene: CompositionScene,
  input: { nodeId?: SceneNodeId; body: string; author?: string; pinX?: number; pinY?: number },
): CompositionScene | null {
  const comment = createSceneComment(input)
  if (!comment) return null
  if (comment.nodeId && comment.pinX === undefined) {
    const ids = collectSceneNodeIds(scene)
    if (!ids.has(comment.nodeId)) return null
  }
  const prev = pruneOrphanCommentsForScene(scene.comments, scene)
  return { ...scene, comments: [...prev, comment] }
}

export function addCommentReply(
  scene: CompositionScene,
  commentId: string,
  reply: { body: string; author?: string },
): CompositionScene {
  const text = reply.body.trim()
  if (!text) return scene
  const prev = pruneOrphanCommentsForScene(scene.comments, scene)
  const next = prev.map((c) => {
    if (c.id !== commentId) return c
    const replies = c.replies ? [...c.replies] : []
    replies.push({
      id: `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      body: text,
      author: (reply.author ?? 'designer').trim() || 'designer',
      createdAt: new Date().toISOString(),
    })
    return { ...c, replies }
  })
  return { ...scene, comments: next.length ? next : undefined }
}

export function removeSceneComment(
  scene: CompositionScene,
  commentId: string,
): CompositionScene {
  const prev = pruneOrphanCommentsForScene(scene.comments, scene)
  const next = prev.filter((c) => c.id !== commentId)
  return { ...scene, comments: next.length ? next : undefined }
}

export function setCommentResolved(
  scene: CompositionScene,
  commentId: string,
  resolved: boolean,
): CompositionScene {
  const prev = pruneOrphanCommentsForScene(scene.comments, scene)
  const next = prev.map((c) => (c.id === commentId ? { ...c, resolved } : c))
  return { ...scene, comments: next.length ? next : undefined }
}

export function commentsForNode(
  comments: SceneComment[] | undefined,
  nodeId: SceneNodeId | null | undefined,
): SceneComment[] {
  if (!nodeId || !comments?.length) return []
  return comments.filter((c) => c.nodeId === nodeId)
}
