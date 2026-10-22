/**
 * Redis client helpers for Scene SSE + presence (Wave D).
 * Lazy-connect; no-op when `ZAOLY_REDIS_URL` is unset.
 */
import Redis from 'ioredis'
import { paths } from '../paths'
import { getZaolyRedisUrl } from '../runtime-config'

declare global {
  // eslint-disable-next-line no-var
  var __creationRedisPublisher__: Redis | undefined
  // eslint-disable-next-line no-var
  var __creationRedisSubscriber__: Redis | undefined
}

function createClient(label: string): Redis | null {
  const url = getZaolyRedisUrl()
  if (!url) return null
  const client = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: true,
  })
  client.on('error', (err) => {
    console.error(`[zaoly-redis:${label}]`, err.message)
  })
  return client
}

export function getRedisPublisher(): Redis | null {
  if (!getZaolyRedisUrl()) return null
  if (!globalThis.__creationRedisPublisher__) {
    globalThis.__creationRedisPublisher__ = createClient('pub') ?? undefined
  }
  return globalThis.__creationRedisPublisher__ ?? null
}

export function getRedisSubscriber(): Redis | null {
  if (!getZaolyRedisUrl()) return null
  if (!globalThis.__creationRedisSubscriber__) {
    globalThis.__creationRedisSubscriber__ = createClient('sub') ?? undefined
  }
  return globalThis.__creationRedisSubscriber__ ?? null
}

export function presenceRedisKey(sceneId: string): string {
  return `${paths.presenceRedisKeyPrefix}:${sceneId.trim()}`
}

export function launchCodeRedisKey(jti: string): string {
  return `${paths.launchCodeRedisKeyPrefix}:${jti.trim()}`
}

export function sceneEventsChannel(): string {
  return paths.sceneEventsRedisChannel
}

export async function ensureRedisConnected(client: Redis | null): Promise<boolean> {
  if (!client) return false
  try {
    if (client.status === 'wait') await client.connect()
    return true
  } catch (err) {
    console.error('[zaoly-redis] connect failed', err)
    return false
  }
}

/** Test helper — drop cached clients. */
export function __resetCreationRedisForTests(): void {
  const pub = globalThis.__creationRedisPublisher__
  const sub = globalThis.__creationRedisSubscriber__
  globalThis.__creationRedisPublisher__ = undefined
  globalThis.__creationRedisSubscriber__ = undefined
  try {
    pub?.disconnect()
  } catch {
    /* ignore */
  }
  try {
    sub?.disconnect()
  } catch {
    /* ignore */
  }
}
