import type { ScenePresenceState, ScenePresenceUser } from '@zaoly/contracts'
import { paths } from '../paths'
import {
  ensureRedisConnected,
  getRedisPublisher,
  presenceRedisKey,
} from '../redis/zaoly-redis'
import { isRedisConfigured } from '../runtime-config'
import {
  PRESENCE_SSE_COALESCE_MS,
  publishPresenceSnapshot,
  publishPresenceUpdated,
} from './scene-events'

const presenceMap = new Map<string, Map<string, ScenePresenceUser>>()
const PRUNE_TIMEOUT_MS = 15_000

type CoalesceBuffer = {
  upserts: Map<string, ScenePresenceUser>
  removed: Set<string>
  timer: ReturnType<typeof setTimeout> | null
}

const coalesceBuffers = new Map<string, CoalesceBuffer>()

function pruneUserMap(userMap: Map<string, ScenePresenceUser>): string[] {
  const now = Date.now()
  const prunedIds: string[] = []
  for (const [userId, user] of userMap.entries()) {
    const lastSeen = new Date(user.lastSeenAt).getTime()
    if (isNaN(lastSeen) || now - lastSeen > PRUNE_TIMEOUT_MS) {
      userMap.delete(userId)
      prunedIds.push(userId)
    }
  }
  return prunedIds
}

function pruneStaleUsers(sceneId: string): {
  userMap: Map<string, ScenePresenceUser>
  prunedIds: string[]
} {
  let userMap = presenceMap.get(sceneId)
  if (!userMap) {
    userMap = new Map()
    presenceMap.set(sceneId, userMap)
    return { userMap, prunedIds: [] }
  }
  return { userMap, prunedIds: pruneUserMap(userMap) }
}

function snapshot(sceneId: string, userMap: Map<string, ScenePresenceUser>): ScenePresenceState {
  return {
    sceneId,
    users: Array.from(userMap.values()),
  }
}

function getBuffer(sceneId: string): CoalesceBuffer {
  let buf = coalesceBuffers.get(sceneId)
  if (!buf) {
    buf = { upserts: new Map(), removed: new Set(), timer: null }
    coalesceBuffers.set(sceneId, buf)
  }
  return buf
}

function scheduleFlush(sceneId: string): void {
  const buf = getBuffer(sceneId)
  if (buf.timer) return
  buf.timer = setTimeout(() => {
    buf.timer = null
    void flushPresenceCoalesce(sceneId)
  }, PRESENCE_SSE_COALESCE_MS)
}

function enqueueUpsert(sceneId: string, user: ScenePresenceUser): void {
  const buf = getBuffer(sceneId)
  buf.removed.delete(user.userId)
  buf.upserts.set(user.userId, user)
  scheduleFlush(sceneId)
}

function enqueueRemove(sceneId: string, userId: string): void {
  const buf = getBuffer(sceneId)
  buf.upserts.delete(userId)
  buf.removed.add(userId)
  scheduleFlush(sceneId)
}

async function loadRedisUserMap(sceneId: string): Promise<Map<string, ScenePresenceUser>> {
  const redis = getRedisPublisher()
  const map = new Map<string, ScenePresenceUser>()
  if (!(await ensureRedisConnected(redis)) || !redis) return map
  const raw = await redis.hgetall(presenceRedisKey(sceneId))
  for (const [userId, json] of Object.entries(raw)) {
    try {
      const user = JSON.parse(json) as ScenePresenceUser
      map.set(userId, user)
    } catch {
      // skip bad field
    }
  }
  return map
}

async function persistRedisUserMap(
  sceneId: string,
  userMap: Map<string, ScenePresenceUser>,
): Promise<void> {
  const redis = getRedisPublisher()
  if (!(await ensureRedisConnected(redis)) || !redis) return
  const key = presenceRedisKey(sceneId)
  const multi = redis.multi()
  multi.del(key)
  if (userMap.size > 0) {
    const entries: string[] = []
    for (const [userId, user] of userMap) {
      entries.push(userId, JSON.stringify(user))
    }
    multi.hset(key, ...entries)
    multi.expire(key, paths.presenceRedisKeyTtlSec)
  }
  await multi.exec()
}

export async function flushPresenceCoalesce(sceneId: string): Promise<void> {
  const buf = coalesceBuffers.get(sceneId)
  if (!buf) return
  if (buf.timer) {
    clearTimeout(buf.timer)
    buf.timer = null
  }
  const upserts = Array.from(buf.upserts.values())
  const removedUserIds = Array.from(buf.removed)
  buf.upserts.clear()
  buf.removed.clear()
  if (upserts.length === 0 && removedUserIds.length === 0) return

  let activeUsersCount = 0
  if (isRedisConfigured()) {
    const userMap = await loadRedisUserMap(sceneId)
    pruneUserMap(userMap)
    activeUsersCount = userMap.size
  } else {
    activeUsersCount = (presenceMap.get(sceneId) ?? new Map()).size
  }

  publishPresenceUpdated({
    sceneId,
    mode: 'delta',
    upserts,
    removedUserIds,
    activeUsersCount,
  })
}

export async function recordPresenceHeartbeat(
  sceneId: string,
  user: ScenePresenceUser,
): Promise<ScenePresenceState> {
  const updatedUser: ScenePresenceUser = {
    ...user,
    lastSeenAt: user.lastSeenAt || new Date().toISOString(),
  }

  if (isRedisConfigured()) {
    const userMap = await loadRedisUserMap(sceneId)
    const prunedIds = pruneUserMap(userMap)
    for (const id of prunedIds) enqueueRemove(sceneId, id)
    userMap.set(updatedUser.userId, updatedUser)
    await persistRedisUserMap(sceneId, userMap)
    enqueueUpsert(sceneId, updatedUser)
    return snapshot(sceneId, userMap)
  }

  const { userMap, prunedIds } = pruneStaleUsers(sceneId)
  for (const id of prunedIds) enqueueRemove(sceneId, id)
  userMap.set(updatedUser.userId, updatedUser)
  enqueueUpsert(sceneId, updatedUser)
  return snapshot(sceneId, userMap)
}

export async function getScenePresence(sceneId: string): Promise<ScenePresenceState> {
  if (isRedisConfigured()) {
    const userMap = await loadRedisUserMap(sceneId)
    pruneUserMap(userMap)
    return snapshot(sceneId, userMap)
  }
  const { userMap } = pruneStaleUsers(sceneId)
  return snapshot(sceneId, userMap)
}

export async function removePresenceUser(sceneId: string, userId: string): Promise<void> {
  if (isRedisConfigured()) {
    const userMap = await loadRedisUserMap(sceneId)
    if (!userMap.has(userId)) return
    userMap.delete(userId)
    await persistRedisUserMap(sceneId, userMap)
    enqueueRemove(sceneId, userId)
    return
  }
  const userMap = presenceMap.get(sceneId)
  if (!userMap) return
  if (!userMap.has(userId)) return
  userMap.delete(userId)
  enqueueRemove(sceneId, userId)
}

/** Emit a full snapshot on the bus (SSE subscribe). */
export async function emitPresenceSnapshot(sceneId: string): Promise<void> {
  const state = await getScenePresence(sceneId)
  publishPresenceSnapshot(sceneId, state.users)
}

export function __resetPresenceStoreForTests(): void {
  for (const buf of coalesceBuffers.values()) {
    if (buf.timer) clearTimeout(buf.timer)
  }
  coalesceBuffers.clear()
  presenceMap.clear()
}
