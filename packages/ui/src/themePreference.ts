/** Theme preference — specs/domain/zaoly-ui-settings-shell.md */

export const THEME_PREFERENCE_CHOICES = ['light', 'dark', 'auto'] as const
export type ThemePreference = (typeof THEME_PREFERENCE_CHOICES)[number]

export type ResolvedThemeId = 'zaoly' | 'zaoly-dark'

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCE_CHOICES as readonly string[]).includes(value)
}

/** Map stored legacy data-theme ids / prefs to ThemePreference. */
export function migrateLegacyThemeId(raw: string | null | undefined): ThemePreference {
  if (!raw) return 'dark'
  if (isThemePreference(raw)) return raw
  if (raw === 'zaoly' || raw === 'zaoly-v2') return 'light'
  if (raw === 'zaoly-dark' || raw === 'zaoly-v2-dark') return 'dark'
  return 'dark'
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveThemeId(
  pref: ThemePreference,
  prefersDark: boolean = systemPrefersDark(),
): ResolvedThemeId {
  if (pref === 'light') return 'zaoly'
  if (pref === 'dark') return 'zaoly-dark'
  return prefersDark ? 'zaoly-dark' : 'zaoly'
}

/**
 * Apply preference to `document.documentElement`.
 * For `auto`, listens to `prefers-color-scheme` and returns a cleanup.
 */
export function applyThemePreference(pref: ThemePreference): () => void {
  if (typeof document === 'undefined') return () => undefined

  const root = document.documentElement
  const paint = (dark: boolean) => {
    root.setAttribute('data-theme', resolveThemeId(pref, dark))
  }

  if (pref !== 'auto') {
    paint(pref === 'dark')
    return () => undefined
  }

  if (typeof window.matchMedia !== 'function') {
    paint(true)
    return () => undefined
  }

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => paint(mq.matches)
  paint(mq.matches)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}
