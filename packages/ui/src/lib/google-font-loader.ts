/** Load Google Fonts CSS2 stylesheets for FontFamilyPicker preview. */

const GOOGLE_FONT_ALIASES: Record<string, string> = {
  geist: 'Inter',
  'geist sans': 'Inter',
}

const loadedHrefs = new Set<string>()

export function resolveGoogleFontFamily(family: string): string | null {
  const key = family.trim().toLowerCase()
  if (GOOGLE_FONT_ALIASES[key]) return GOOGLE_FONT_ALIASES[key]!
  if (
    /^(system-ui|ui-sans-serif|sans-serif|serif|monospace|cursive|fantasy|inherit|initial)$/i.test(
      family.trim(),
    )
  ) {
    return null
  }
  return family.trim()
}

export function googleFontStylesheetHref(
  family: string,
  weights: string[] = ['400', '600'],
): string | null {
  const resolved = resolveGoogleFontFamily(family)
  if (!resolved) return null
  const familyParam = encodeURIComponent(resolved).replace(/%20/g, '+')
  const axis = `wght@${[...new Set(weights)].sort().join(';')}`
  return `https://fonts.googleapis.com/css2?family=${familyParam}:${axis}&display=swap`
}

export function ensureGoogleFontStylesheet(
  family: string,
  weights: string[] = ['400', '600'],
): void {
  if (typeof document === 'undefined') return
  const href = googleFontStylesheetHref(family, weights)
  const resolved = resolveGoogleFontFamily(family)
  if (!href || !resolved) return
  if (loadedHrefs.has(href)) return
  const existing = document.querySelector<HTMLLinkElement>(
    `link[data-ds-google-font="${href}"]`,
  )
  if (existing) {
    loadedHrefs.add(href)
    return
  }
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.setAttribute('data-ds-google-font', href)
  document.head.appendChild(link)
  loadedHrefs.add(href)
}
