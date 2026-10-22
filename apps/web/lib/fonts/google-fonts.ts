/**
 * Google Fonts helpers for CREATION editor canvas + inspect.
 * Pattern mirrors suite design-token-preview (preview/on-demand CSS2).
 * Canonical base: `paths.googleFontsCss2Base` · knowledge/creation-editor-fonts.md
 */

import { paths } from '../paths'

/** Non–token-pack path prefix for Google Font picks in TokenPicker (writes literal). */
export const GOOGLE_FONT_LITERAL_PREFIX = 'gf:' as const

const GOOGLE_FONT_ALIASES: Record<string, string> = {
  geist: 'Inter',
  'geist sans': 'Inter',
  'source serif 4': 'Source Serif 4',
  'source serif': 'Source Serif 4',
}

const GENERIC =
  /^(system-ui|ui-sans-serif|ui-serif|ui-monospace|sans-serif|serif|monospace|cursive|fantasy|inherit|initial|unset)$/i

const loadedHrefs = new Set<string>()

export function googleFontFamilyName(family: string): string | null {
  const trimmed = family.trim()
  if (!trimmed) return null
  // Strip CSS fallbacks: `"Inter", system-ui` → Inter
  const primary = trimmed.split(',')[0]?.trim().replace(/^["']|["']$/g, '') ?? ''
  if (!primary || GENERIC.test(primary)) return null
  const key = primary.toLowerCase()
  if (GOOGLE_FONT_ALIASES[key]) return GOOGLE_FONT_ALIASES[key]!
  return primary
}

export function googleFontsStylesheetHref(family: string, weight?: string): string | null {
  const googleFamily = googleFontFamilyName(family)
  if (!googleFamily) return null
  const weights = new Set<string>(['400', '600', '700'])
  if (weight && /^\d{3}$/.test(weight)) weights.add(weight)
  const familyParam = encodeURIComponent(googleFamily).replace(/%20/g, '+')
  const axis = `wght@${[...weights].sort().join(';')}`
  return `${paths.googleFontsCss2Base}?family=${familyParam}:${axis}&display=swap`
}

export function googleFontLiteralPath(family: string): string {
  return `${GOOGLE_FONT_LITERAL_PREFIX}${family}`
}

export function parseGoogleFontLiteralPath(path: string): string | null {
  if (!path.startsWith(GOOGLE_FONT_LITERAL_PREFIX)) return null
  const family = path.slice(GOOGLE_FONT_LITERAL_PREFIX.length).trim()
  return family || null
}

export function isGoogleFontLiteralPath(path: string): boolean {
  return parseGoogleFontLiteralPath(path) != null
}

/** Inject a CSS2 stylesheet link once per href (document head). */
export function ensureGoogleFontStylesheet(family: string, weight?: string): string | null {
  if (typeof document === 'undefined') return null
  const href = googleFontsStylesheetHref(family, weight)
  const resolved = googleFontFamilyName(family)
  if (!href || !resolved) return null
  if (loadedHrefs.has(href)) return resolved
  const existing = Array.from(
    document.querySelectorAll<HTMLLinkElement>('link[data-creation-google-font]'),
  ).find((el) => el.getAttribute('data-creation-google-font') === href)
  if (existing) {
    loadedHrefs.add(href)
    return resolved
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-creation-google-font', href)
  link.onload = () => {
    loadedHrefs.add(href)
  }
  document.head.appendChild(link)
  loadedHrefs.add(href)
  return resolved
}

export function ensureGoogleFontStylesheets(families: Iterable<string>): void {
  for (const family of families) {
    ensureGoogleFontStylesheet(family)
  }
}

/** Unique Google Fonts CSS2 hrefs for SSR preview HTML (P93). */
export function collectGoogleFontStylesheetHrefs(families: Iterable<string>): string[] {
  const hrefs = new Set<string>()
  for (const family of families) {
    const href = googleFontsStylesheetHref(family)
    if (href) hrefs.add(href)
  }
  return [...hrefs]
}

/** `<link rel="stylesheet">` tags for preview HTML head injection. */
export function buildGoogleFontLinkTagsHtml(families: Iterable<string>): string {
  return collectGoogleFontStylesheetHrefs(families)
    .map(
      (href) =>
        `<link rel="stylesheet" href="${href.replace(/&/g, '&amp;')}" data-creation-google-font="${href.replace(/"/g, '&quot;')}" />`,
    )
    .join('\n')
}
