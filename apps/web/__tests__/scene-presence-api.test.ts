import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScenePresenceUser } from '@zaoly/contracts'
import {
  __resetPresenceStoreForTests,
  flushPresenceCoalesce,
  getScenePresence,
  recordPresenceHeartbeat,
  removePresenceUser,
} from '../lib/scene/presence-store'
import {
  __deliverRemoteSceneBusEventForTests,
  __resetSceneEventsForTests,
  encodePresenceEvent,
  PRESENCE_SSE_COALESCE_MS,
  publishPresenceUpdated,
  subscribeSceneEvents,
  type PresenceUpdatedEvent,
} from '../lib/scene/scene-events'
import { createThrottle } from '../lib/editor/presence-throttle'
import { presenceColorForUserId } from '../lib/editor/presence-color'
import { softLockConflict } from '../lib/editor/presence-soft-lock'
import { mergePresenceUsers } from '../lib/editor/presence-merge'
import { paths } from '../lib/paths'
import { isRedisConfigured } from '../lib/runtime-config'

function sampleUser(overrides: Partial<ScenePresenceUser> = {}): ScenePresenceUser {
  return {
    userId: 'usr_sarah',
    name: 'Sarah Miller',
    color: '#0d9488',
    pageId: 'page-home',
    cursor: { x: 100, y: 200, pageId: 'page-home', lastActiveAt: new Date().toISOString() },
    selectedIds: ['node_btn_1'],
    isIdle: false,
    lastSeenAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('Scene Presence & Multi-Cursor Store (P114)', () => {
  beforeEach(() => {
    vi.useRealTimers()
    __resetPresenceStoreForTests()
    __resetSceneEventsForTests()
  })

  it('records heartbeat and tracks multiple active peers', async () => {
    const state1 = await recordPresenceHeartbeat('scene-collab', sampleUser())
    expect(state1.users.length).toBe(1)
    expect(state1.users[0].name).toBe('Sarah Miller')

    const state2 = await recordPresenceHeartbeat(
      'scene-collab',
      sampleUser({
        userId: 'usr_alex',
        name: 'Alex Chen',
        color: '#2563eb',
        selectedIds: [],
        cursor: { x: 350, y: 420, pageId: 'page-home', lastActiveAt: new Date().toISOString() },
      }),
    )
    expect(state2.users.length).toBe(2)
    expect((await getScenePresence('scene-collab')).users.length).toBe(2)
  })

  it('coalesces presence-updated SSE to one delta frame within 80ms', async () => {
    vi.useFakeTimers()
    const frames: PresenceUpdatedEvent[] = []
    const unsub = subscribeSceneEvents('scene-collab', (event) => {
      if (event.type === 'presence-updated') frames.push(event)
    })

    await recordPresenceHeartbeat('scene-collab', sampleUser())
    await recordPresenceHeartbeat(
      'scene-collab',
      sampleUser({
        userId: 'usr_alex',
        name: 'Alex Chen',
        color: '#2563eb',
        selectedIds: [],
      }),
    )
    expect(frames).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(PRESENCE_SSE_COALESCE_MS)
    expect(frames).toHaveLength(1)
    expect(frames[0].mode).toBe('delta')
    expect(frames[0].upserts?.map((u) => u.userId).sort()).toEqual(['usr_alex', 'usr_sarah'])
    expect(frames[0].activeUsersCount).toBe(2)

    const encoded = encodePresenceEvent(frames[0])
    expect(encoded).toContain('event: presence-updated')
    expect(encoded).toContain('"mode":"delta"')

    unsub()
    vi.useRealTimers()
  })

  it('publishes delta removedUserIds on leave after coalesce', async () => {
    vi.useFakeTimers()
    const frames: PresenceUpdatedEvent[] = []
    subscribeSceneEvents('scene-collab', (event) => {
      if (event.type === 'presence-updated') frames.push(event)
    })
    await recordPresenceHeartbeat('scene-collab', sampleUser())
    await vi.advanceTimersByTimeAsync(PRESENCE_SSE_COALESCE_MS)
    frames.length = 0

    await removePresenceUser('scene-collab', 'usr_sarah')
    expect((await getScenePresence('scene-collab')).users.length).toBe(0)
    await vi.advanceTimersByTimeAsync(PRESENCE_SSE_COALESCE_MS)
    expect(frames).toHaveLength(1)
    expect(frames[0].mode).toBe('delta')
    expect(frames[0].removedUserIds).toContain('usr_sarah')
    expect(frames[0].activeUsersCount).toBe(0)
    vi.useRealTimers()
  })

  it('prunes stale users whose heartbeat is older than 15 seconds', async () => {
    await recordPresenceHeartbeat(
      'scene-collab',
      sampleUser({
        userId: 'usr_stale',
        name: 'Stale User',
        lastSeenAt: new Date(Date.now() - 20_000).toISOString(),
        isIdle: true,
      }),
    )
    const updated = await recordPresenceHeartbeat(
      'scene-collab',
      sampleUser({ userId: 'usr_fresh', name: 'Active User', selectedIds: [] }),
    )
    expect(updated.users.length).toBe(1)
    expect(updated.users[0].userId).toBe('usr_fresh')
  })

  it('exposes presence path helpers and redis env key', () => {
    expect(paths.routes.apiScenePresence('scene-1')).toBe('/api/scenes/scene-1/presence')
    expect(paths.routes.apiScenePresenceHeartbeat('scene-1')).toBe(
      '/api/scenes/scene-1/presence/heartbeat',
    )
    expect(paths.envRedisUrl).toBe('ZAOLY_REDIS_URL')
    expect(paths.sceneEventsRedisChannel).toBe('zaoly:scene-bus')
    expect(isRedisConfigured()).toBe(false)
  })

  it('flushPresenceCoalesce is idempotent when buffer empty', async () => {
    await flushPresenceCoalesce('missing')
  })

  it('delivers remote bus events to local SSE listeners (Wave D)', () => {
    const frames: PresenceUpdatedEvent[] = []
    subscribeSceneEvents('scene-remote', (event) => {
      if (event.type === 'presence-updated') frames.push(event)
    })
    __deliverRemoteSceneBusEventForTests({
      type: 'presence-updated',
      sceneId: 'scene-remote',
      mode: 'delta',
      upserts: [sampleUser({ userId: 'usr_remote' })],
      removedUserIds: [],
      activeUsersCount: 1,
    })
    expect(frames).toHaveLength(1)
    expect(frames[0].upserts?.[0]?.userId).toBe('usr_remote')
  })
})

describe('presence merge (Wave B)', () => {
  it('replaces on snapshot and merges delta upserts/removes', () => {
    const a = sampleUser({ userId: 'a', name: 'A' })
    const b = sampleUser({ userId: 'b', name: 'B' })
    const snap = mergePresenceUsers([], { mode: 'snapshot', users: [a, b] })
    expect(snap.map((u) => u.userId).sort()).toEqual(['a', 'b'])

    const b2 = sampleUser({ userId: 'b', name: 'B2' })
    const merged = mergePresenceUsers(snap, {
      mode: 'delta',
      upserts: [b2],
      removedUserIds: ['a'],
    })
    expect(merged).toHaveLength(1)
    expect(merged[0].name).toBe('B2')
  })

  it('treats legacy users-only frames as snapshot', () => {
    const a = sampleUser({ userId: 'a' })
    const out = mergePresenceUsers([sampleUser({ userId: 'old' })], { users: [a] })
    expect(out).toHaveLength(1)
    expect(out[0].userId).toBe('a')
  })
})

describe('presence throttle + color + soft-lock', () => {
  it('throttles rapid calls', async () => {
    vi.useFakeTimers()
    const throttle = createThrottle(100)
    let count = 0
    throttle(() => {
      count += 1
    })
    throttle(() => {
      count += 1
    })
    expect(count).toBe(1)
    vi.advanceTimersByTime(100)
    expect(count).toBe(2)
    vi.useRealTimers()
  })

  it('hashes stable colors', () => {
    expect(presenceColorForUserId('a')).toBe(presenceColorForUserId('a'))
    expect(presenceColorForUserId('a')).not.toBe(presenceColorForUserId('b'))
  })

  it('soft-locks structural and leaf ops against peer selection', () => {
    const peers: ScenePresenceUser[] = [
      sampleUser({ userId: 'peer', selectedIds: ['node_x'] }),
    ]
    expect(
      softLockConflict([{ op: 'remove_node', nodeId: 'node_x' }], peers),
    ).toMatch(/Soft-lock/)
    expect(
      softLockConflict([{ op: 'set_prop', nodeId: 'node_x', key: 'label', value: 'ok' }], peers),
    ).toMatch(/Soft-lock/)
    expect(
      softLockConflict([{ op: 'set_style', nodeId: 'other', key: 'width', value: 12 }], peers),
    ).toBeNull()
  })

  it('publishPresenceUpdated fans out without store', () => {
    const seen: string[] = []
    subscribeSceneEvents('scene-x', (e) => {
      if (e.type === 'presence-updated') seen.push(e.sceneId)
    })
    publishPresenceUpdated({
      sceneId: 'scene-x',
      mode: 'snapshot',
      users: [],
      activeUsersCount: 0,
    })
    expect(seen).toEqual(['scene-x'])
  })
})
