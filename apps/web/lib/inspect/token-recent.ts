/**
 * Session-scoped TokenPicker Recent paths (P77).
 * Key documented in `knowledge/paths.md`.
 */

export const TOKEN_RECENT_STORAGE_KEY = 'zaoly.inspect.tokenRecent'

const MAX = 8

export function loadTokenRecent(): string[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(TOKEN_RECENT_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is string => typeof p === 'string').slice(0, MAX)
  } catch {
    return []
  }
}

export function saveTokenRecent(paths: string[]): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const next = paths.filter((p): p is string => typeof p === 'string').slice(0, MAX)
    sessionStorage.setItem(TOKEN_RECENT_STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota / private mode */
  }
}
