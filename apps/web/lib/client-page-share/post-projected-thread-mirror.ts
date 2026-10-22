/**
 * Immediately post designer replies/resolve for projected client-share pins
 * to active share records (P9 live mirror).
 *
 * Client-safe: only imports projected-comment-ids (no scene-store / pg).
 */
import type { SceneComment } from '@zaoly/contracts'
import { paths } from '../paths'
import { isProjectedGuestSceneComment } from './projected-comment-ids'

export async function postProjectedShareThreadMirror(
  sceneId: string,
  comment: SceneComment,
): Promise<void> {
  if (!isProjectedGuestSceneComment(comment.id)) return
  try {
    await fetch(paths.routes.apiSceneClientShareThread(sceneId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        sceneCommentId: comment.id,
        replies: comment.replies ?? [],
        resolved: Boolean(comment.resolved),
      }),
    })
  } catch {
    // Best-effort live mirror; scene Save still mirrors on PUT.
  }
}
