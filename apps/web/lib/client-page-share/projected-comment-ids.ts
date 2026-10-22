/**
 * Client-safe helpers for projected client-share scene comment ids (P8/P9).
 * Keep free of server-only imports (scene-store / pg).
 */
import { paths } from '../paths'

export function sceneCommentIdForGuest(guestCommentId: string): string {
  return `${paths.clientShareSceneCommentIdPrefix}${guestCommentId}`
}

export function isProjectedGuestSceneComment(commentId: string): boolean {
  return commentId.startsWith(paths.clientShareSceneCommentIdPrefix)
}

export function guestIdFromSceneCommentId(commentId: string): string | null {
  if (!isProjectedGuestSceneComment(commentId)) return null
  return commentId.slice(paths.clientShareSceneCommentIdPrefix.length)
}
