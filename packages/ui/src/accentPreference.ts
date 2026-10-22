/** Accent preference — specs/domain/zaoly-ui-settings-shell.md */

export const ACCENT_PREFERENCE_CHOICES = [
  'purple',
  'blue',
  'pink',
  'orange',
  'green',
  'yellow',
  'grey',
  'ink',
] as const

export type AccentPreference = (typeof ACCENT_PREFERENCE_CHOICES)[number]

export type AccentOption = {
  id: AccentPreference
  preview: string
  textColor: string
  /** Legacy CSS custom-property name used in Plexon localStorage */
  legacyVar?: string
}

export const ACCENT_OPTIONS: AccentOption[] = [
  { id: 'purple', preview: '#b638ff', textColor: '#ffffff', legacyVar: '--color-secondary-dx-purple' },
  { id: 'blue', preview: '#3b82f6', textColor: '#ffffff', legacyVar: '--color-secondary-dx-blue' },
  { id: 'pink', preview: '#f256b6', textColor: '#ffffff', legacyVar: '--color-secondary-dx-pink' },
  { id: 'orange', preview: '#ff6a3b', textColor: '#ffffff', legacyVar: '--color-secondary-dx-orange' },
  { id: 'green', preview: '#00ca55', textColor: '#000000', legacyVar: '--color-secondary-dx-green' },
  { id: 'yellow', preview: '#fef14d', textColor: '#000000', legacyVar: '--color-secondary-dx-yellow' },
  { id: 'grey', preview: '#d4d2d2', textColor: '#000000', legacyVar: '--color-secondary-dx-grey-light' },
  { id: 'ink', preview: '#0f172a', textColor: '#ffffff', legacyVar: '--audion-light-border-color' },
]

export const ACCENT_PREFERENCE_DEFAULT: AccentPreference = 'green'

export function isAccentPreference(value: unknown): value is AccentPreference {
  return typeof value === 'string' && (ACCENT_PREFERENCE_CHOICES as readonly string[]).includes(value)
}

export function resolveAccentOption(id: AccentPreference): AccentOption {
  return ACCENT_OPTIONS.find((o) => o.id === id) ?? ACCENT_OPTIONS.find((o) => o.id === 'green')!
}

/** Map short ids, legacy CSS vars, or storage junk → AccentPreference. */
export function migrateLegacyAccent(raw: string | null | undefined): AccentPreference {
  if (!raw) return ACCENT_PREFERENCE_DEFAULT
  if (isAccentPreference(raw)) return raw
  const byVar = ACCENT_OPTIONS.find((o) => o.legacyVar === raw)
  if (byVar) return byVar.id
  const byPreview = ACCENT_OPTIONS.find((o) => o.preview.toLowerCase() === raw.toLowerCase())
  if (byPreview) return byPreview.id
  return ACCENT_PREFERENCE_DEFAULT
}

/**
 * Apply accent to `document.documentElement` (`--accent` + contrast helpers).
 */
export function applyAccentPreference(id: AccentPreference): void {
  if (typeof document === 'undefined') return
  const option = resolveAccentOption(id)
  const root = document.documentElement
  root.style.setProperty('--accent', option.preview)
  root.style.setProperty('--accent-contrast', option.textColor)
  root.setAttribute('data-accent', option.id)
}
