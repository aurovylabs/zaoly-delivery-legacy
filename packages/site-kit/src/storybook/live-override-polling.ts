export const OVERRIDE_FETCH_TIMEOUT_MS = 8000
export const OVERRIDE_POLL_INTERVAL_MS = 4000

export type OverrideFetchStatus = 'loading' | 'ready' | 'not-found' | 'error' | 'stale'

export type OverrideFetchState<T> = {
  status: OverrideFetchStatus
  override: T | null
}

export function initialOverrideFetchState<T>(): OverrideFetchState<T> {
  return { status: 'loading', override: null }
}

export function reduceOverrideFetch<T>(
  prev: OverrideFetchState<T>,
  event:
    | { type: 'reset' }
    | { type: 'success'; override: T }
    | { type: 'not-found' }
    | { type: 'error' },
): OverrideFetchState<T> {
  switch (event.type) {
    case 'reset':
      return initialOverrideFetchState()
    case 'success':
      return { status: 'ready', override: event.override }
    case 'not-found':
      return { status: 'not-found', override: null }
    case 'error':
      return {
        status: prev.override ? 'stale' : 'error',
        override: prev.override,
      }
  }
}

export async function fetchOverrideJson<T>(
  url: string,
  signal?: AbortSignal,
  init?: RequestInit,
): Promise<T | null> {
  const timeout = AbortSignal.timeout(OVERRIDE_FETCH_TIMEOUT_MS)
  const merged = signal ? AbortSignal.any([signal, timeout]) : timeout
  const res = await fetch(url, {
    cache: 'no-store',
    signal: merged,
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

