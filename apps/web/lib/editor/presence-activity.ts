import type { ScenePresenceUser } from '@zaoly/contracts'

export type PresenceActivityChip = {
  userId: string
  name: string
  color: string
  /** Compact label: `Name · pageId` (+ optional selection hint). */
  label: string
  pageId: string
  isIdle: boolean
}

function shortId(id: string, max = 12): string {
  if (id.length <= max) return id
  return `${id.slice(0, max - 1)}…`
}

/** Build compact awareness chips for remote peers (Wave C). */
export function buildPresenceActivityChips(
  users: readonly ScenePresenceUser[],
  localUserId?: string | null,
  limit = 4,
): PresenceActivityChip[] {
  const peers = users.filter((u) => u.userId !== localUserId)
  return peers.slice(0, limit).map((user) => {
    const selection = user.selectedIds?.[0]
    const parts = [user.name, shortId(user.pageId || 'page')]
    if (selection) parts.push(shortId(selection, 10))
    return {
      userId: user.userId,
      name: user.name,
      color: user.color || '#0d9488',
      label: parts.join(' · '),
      pageId: user.pageId,
      isIdle: Boolean(user.isIdle),
    }
  })
}
