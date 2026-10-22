/**
 * In-process SSE fan-out for editor live reload after scene writes + presence.
 *
 * **Replica stance (Wave D):**
 * - Default (no `ZAOLY_REDIS_URL`): listeners live in this Node process only.
 *   Valid while Coolify `swarm_replicas=1`.
 * - With `ZAOLY_REDIS_URL`: publish/subscribe on `paths.sceneEventsRedisChannel`
 *   so every replica delivers `scene-updated` + `presence-updated` to its SSE clients.
 *   Own publishes are tagged with an instance id and ignored on the subscriber echo.
 */
import { randomUUID } from 'node:crypto'
import type { PresenceUpdatedPayload, ScenePresenceUser } from '@zaoly/contracts'
import {
  ensureRedisConnected,
  getRedisPublisher,
  getRedisSubscriber,
  sceneEventsChannel,
} from '../redis/zaoly-redis'
import { isRedisConfigured } from '../runtime-config'

type SceneEventSource =
  | 'scene_ops'
  | 'scene_put'
  | 'scene_delete'
  | 'scene_import_html'
  | 'site_kit_page_save'
  | 'client_share_guest_comment'

export type SceneUpdatedEvent = {
  type: 'scene-updated'
  sceneId: string
  updatedAt: string
  platformProjectId: string | null
  source: SceneEventSource
}

/** SSE presence frame — Wave B dual mode. */
export type PresenceUpdatedEvent = PresenceUpdatedPayload

export type SceneBusEvent = SceneUpdatedEvent | PresenceUpdatedEvent

type SceneListener = (event: SceneBusEvent) => void

type SceneEventBusState = {
  listenersByScene: Map<string, Set<SceneListener>>
  instanceId: string
  redisSubscribed: boolean
}

declare global {
  // eslint-disable-next-line no-var
  var __creationSceneEventBus__: SceneEventBusState | undefined
}

function sceneEventBusState(): SceneEventBusState {
  const globalState = globalThis as typeof globalThis & {
    __creationSceneEventBus__?: SceneEventBusState
  }
  if (!globalState.__creationSceneEventBus__) {
    globalState.__creationSceneEventBus__ = {
      listenersByScene: new Map<string, Set<SceneListener>>(),
      instanceId: randomUUID(),
      redisSubscribed: false,
    }
  }
  return globalState.__creationSceneEventBus__
}

export const SCENE_EVENTS_HEARTBEAT_MS = 15_000
/** Presence SSE coalesce window (Wave B). */
export const PRESENCE_SSE_COALESCE_MS = 80

type RedisEnvelope = {
  origin: string
  event: SceneBusEvent
}

function deliverLocal(event: SceneBusEvent): void {
  const { listenersByScene } = sceneEventBusState()
  const listeners = listenersByScene.get(event.sceneId)
  if (!listeners?.size) return
  for (const listener of listeners) {
    listener(event)
  }
}

async function ensureRedisSubscriber(): Promise<void> {
  const state = sceneEventBusState()
  if (state.redisSubscribed || !isRedisConfigured()) return
  const sub = getRedisSubscriber()
  if (!(await ensureRedisConnected(sub))) return
  if (!sub) return
  state.redisSubscribed = true
  const channel = sceneEventsChannel()
  await sub.subscribe(channel)
  sub.on('message', (ch, message) => {
    if (ch !== channel) return
    try {
      const envelope = JSON.parse(message) as RedisEnvelope
      if (!envelope?.event || envelope.origin === state.instanceId) return
      deliverLocal(envelope.event)
    } catch {
      // ignore malformed
    }
  })
}

async function publishRemote(event: SceneBusEvent): Promise<void> {
  if (!isRedisConfigured()) return
  await ensureRedisSubscriber()
  const pub = getRedisPublisher()
  if (!(await ensureRedisConnected(pub)) || !pub) return
  const envelope: RedisEnvelope = {
    origin: sceneEventBusState().instanceId,
    event,
  }
  try {
    await pub.publish(sceneEventsChannel(), JSON.stringify(envelope))
  } catch (err) {
    console.error('[scene-events] redis publish failed', err)
  }
}

function fanout(event: SceneBusEvent): void {
  deliverLocal(event)
  void publishRemote(event)
}

export function publishSceneUpdated(event: Omit<SceneUpdatedEvent, 'type'>): void {
  const payload: SceneUpdatedEvent = { type: 'scene-updated', ...event }
  fanout(payload)
}

export function publishPresenceUpdated(
  event: Omit<PresenceUpdatedEvent, 'type'> & { type?: 'presence-updated' },
): void {
  const key = event.sceneId.trim()
  const payload: PresenceUpdatedEvent = {
    type: 'presence-updated',
    sceneId: key,
    mode: event.mode,
    users: event.users,
    upserts: event.upserts,
    removedUserIds: event.removedUserIds,
    activeUsersCount: event.activeUsersCount,
  }
  fanout(payload)
}

/** Full snapshot frame helper (SSE subscribe / resync). */
export function publishPresenceSnapshot(
  sceneId: string,
  users: ScenePresenceUser[],
): void {
  publishPresenceUpdated({
    sceneId,
    mode: 'snapshot',
    users,
    activeUsersCount: users.length,
  })
}

export function subscribeSceneUpdated(
  sceneId: string,
  listener: SceneListener,
): () => void {
  void ensureRedisSubscriber()
  const { listenersByScene } = sceneEventBusState()
  const key = sceneId.trim()
  const listeners = listenersByScene.get(key) ?? new Set<SceneListener>()
  listeners.add(listener)
  listenersByScene.set(key, listeners)
  return () => {
    const current = listenersByScene.get(key)
    if (!current) return
    current.delete(listener)
    if (current.size === 0) listenersByScene.delete(key)
  }
}

/** Alias — listeners receive both scene-updated and presence-updated. */
export const subscribeSceneEvents = subscribeSceneUpdated

export function encodeSceneEvent(event: SceneUpdatedEvent): string {
  return `event: scene-updated\ndata: ${JSON.stringify(event)}\n\n`
}

export function encodePresenceEvent(event: PresenceUpdatedEvent): string {
  return `event: presence-updated\ndata: ${JSON.stringify(event)}\n\n`
}

export function encodeSceneBusEvent(event: SceneBusEvent): string {
  if (event.type === 'presence-updated') return encodePresenceEvent(event)
  return encodeSceneEvent(event)
}

export function encodeSceneHeartbeat(ts = Date.now()): string {
  return `event: heartbeat\ndata: ${JSON.stringify({ ts })}\n\n`
}

/** Test-only: deliver as if received from another replica. */
export function __deliverRemoteSceneBusEventForTests(event: SceneBusEvent): void {
  deliverLocal(event)
}

export function __resetSceneEventsForTests(): void {
  const state = sceneEventBusState()
  state.listenersByScene.clear()
  state.redisSubscribed = false
}
