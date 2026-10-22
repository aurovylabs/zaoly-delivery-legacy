/**
 * Zaoly brand accent — maps preference ids onto CD cobalt.
 * knowledge/corporate-design.md · paths.brandPrimaryHex
 */
import {
  applyAccentPreference,
  isAccentPreference,
  migrateLegacyAccent,
  type AccentPreference,
} from '@zaoly/ui'
import { paths } from './paths'

/** Default / “blue” swatch = Zaoly cobalt (not zaoly-ui Tailwind `#3b82f6`). */
export function applyZaolyAccentPreference(id: AccentPreference): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (id === 'blue') {
    root.style.setProperty('--accent', paths.brandPrimaryHex)
    root.style.setProperty('--accent-contrast', paths.brandPrimaryContrastHex)
    root.style.setProperty('--brand-primary', paths.brandPrimaryHex)
    root.style.setProperty('--color-brand-primary', paths.brandPrimaryHex)
    root.setAttribute('data-accent', 'blue')
    return
  }
  applyAccentPreference(id)
  const accent = root.style.getPropertyValue('--accent').trim() || paths.brandPrimaryHex
  root.style.setProperty('--brand-primary', accent)
  root.style.setProperty('--color-brand-primary', accent)
}

/** Empty / junk storage → Zaoly blue (not suite green). */
export function migrateZaolyAccent(raw: string | null | undefined): AccentPreference {
  if (!raw) return paths.defaultAccent
  const lower = raw.trim().toLowerCase()
  if (
    lower === paths.brandPrimaryHex ||
    lower === paths.brandPrimaryHexDark ||
    lower === 'cobalt' ||
    lower === 'zaoly'
  ) {
    return 'blue'
  }
  if (isAccentPreference(raw)) return raw
  return migrateLegacyAccent(raw)
}
