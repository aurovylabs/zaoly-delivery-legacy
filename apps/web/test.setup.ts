import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { paths } from './lib/paths'

/** Vitest defaults to local auth bypass (`ZAOLY_AUTH_BYPASS`). */
if (!process.env.ZAOLY_AUTH_BYPASS && !process.env.ZAOLY_AUTH_BYPASS) {
  process.env.ZAOLY_AUTH_BYPASS = '1'
}

const nativeFetch =
  typeof globalThis.fetch === 'function' ? globalThis.fetch.bind(globalThis) : undefined

/**
 * Node 25+ ships experimental file-backed `localStorage` (`--localstorage-file`).
 * Under parallel vitest workers that path is often invalid and getItem/setItem
 * can block — editor mounts that read Compare prefs then look “hung” past 5s.
 * Use an in-memory Storage for the whole suite.
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value))
    },
  }
}

const memoryLocal = createMemoryStorage()
const memorySession = createMemoryStorage()
vi.stubGlobal('localStorage', memoryLocal)
vi.stubGlobal('sessionStorage', memorySession)

class MockEventSource {
  static instances: MockEventSource[] = []
  onerror: ((this: EventSource, ev: Event) => unknown) | null = null
  readonly listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>()
  constructor(public readonly url: string) {
    MockEventSource.instances.push(this)
  }
  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type) ?? new Set<(event: MessageEvent<string>) => void>()
    const fn =
      typeof listener === 'function'
        ? (listener as (event: MessageEvent<string>) => void)
        : (event: MessageEvent<string>) => listener.handleEvent(event)
    set.add(fn)
    this.listeners.set(type, set)
  }
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type)
    if (!set) return
    const fn =
      typeof listener === 'function'
        ? (listener as (event: MessageEvent<string>) => void)
        : (event: MessageEvent<string>) => listener.handleEvent(event)
    set.delete(fn)
  }
  close() {}
}

vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource)

class MockIntersectionObserver {
  readonly root: Element | Document | null = null
  readonly rootMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver)

/**
 * Node undici rejects relative `/api/...` URLs. Editor mounts probe kit drift,
 * tokens, and auth session — answer those with empty ok JSON so jsdom workers
 * don't spam ClientFetchError / unhandled rejections under parallel load.
 * See knowledge/editor-kit-drift-seed-revisions-test.md.
 */
beforeEach(() => {
  memoryLocal.clear()
  memorySession.clear()
  // Default: onboarding already completed so editor workspace tests are not blocked
  // by Welcome/tour overlays. Onboarding suites clear these via `clearOnboardingFlags`.
  memoryLocal.setItem(paths.onboarding.welcomeStorageKey, '1')
  memoryLocal.setItem(paths.onboarding.tourStorageKey, 'done')
  MockEventSource.instances = []
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (
      url.includes('/api/site-kit/seed-revisions') ||
      url.includes('/api/tokens') ||
      url.includes('/api/auth/session')
    ) {
      const body = url.includes('/api/site-kit/seed-revisions')
        ? { ok: true, revisions: [] }
        : url.includes('/api/tokens')
          ? { tokens: [], canWrite: false }
          : { user: null }
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (url.startsWith('/') || url.startsWith('./')) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (nativeFetch) return nativeFetch(input, init)
    throw new TypeError(`fetch not mocked for ${url}`)
  }) as typeof fetch
})

afterEach(() => {
  cleanup()
  if (nativeFetch) globalThis.fetch = nativeFetch
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver
}
