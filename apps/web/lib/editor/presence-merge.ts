import type { PresenceUpdatedPayload, ScenePresenceUser } from '@zaoly/contracts'

export type PresenceMergeInput = {
  /** Legacy frames omit mode — treat full `users` as snapshot. */
  mode?: PresenceUpdatedPayload['mode']
  users?: ScenePresenceUser[]
  upserts?: ScenePresenceUser[]
  removedUserIds?: string[]
}

/**
 * Merge an SSE presence payload into the local user list (Wave B).
 * Snapshot (or legacy full `users`) replaces; delta upserts/removes merge.
 */
export function mergePresenceUsers(
  prev: readonly ScenePresenceUser[],
  payload: PresenceMergeInput,
): ScenePresenceUser[] {
  const isSnapshot =
    payload.mode === 'snapshot' ||
    (payload.mode == null && Array.isArray(payload.users)) ||
    (payload.mode !== 'delta' && Array.isArray(payload.users) && !payload.upserts)

  if (isSnapshot) {
    return [...(payload.users ?? [])]
  }

  const map = new Map<string, ScenePresenceUser>()
  for (const user of prev) {
    map.set(user.userId, user)
  }
  for (const id of payload.removedUserIds ?? []) {
    map.delete(id)
  }
  for (const user of payload.upserts ?? []) {
    map.set(user.userId, user)
  }
  if ((payload.upserts?.length ?? 0) === 0 && Array.isArray(payload.users)) {
    for (const user of payload.users) {
      map.set(user.userId, user)
    }
  }
  return Array.from(map.values())
}
