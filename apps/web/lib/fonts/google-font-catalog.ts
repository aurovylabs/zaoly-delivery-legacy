import familiesJson from './google-font-families.json'
import { googleFontLiteralPath } from './google-fonts'

export const GOOGLE_FONT_FAMILIES: readonly string[] = familiesJson as string[]

/** Popular defaults shown when Google scope opens with empty search. */
export const GOOGLE_FONT_POPULAR: readonly string[] = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans 3',
  'Source Serif 4',
  'Nunito',
  'Raleway',
  'Work Sans',
  'IBM Plex Sans',
  'IBM Plex Serif',
  'IBM Plex Mono',
  'Noto Sans',
  'Noto Serif',
  'Playfair Display',
  'Merriweather',
  'Oswald',
  'Rubik',
  'DM Sans',
  'Space Grotesk',
  'Manrope',
  'Outfit',
]

export type GoogleFontPickerOption = {
  path: string
  label: string
  category: 'google'
  fontPreview: string
}

export function googleFontPickerOptions(
  families: readonly string[] = GOOGLE_FONT_FAMILIES,
): GoogleFontPickerOption[] {
  return families.map((family) => ({
    path: googleFontLiteralPath(family),
    label: family,
    category: 'google',
    fontPreview: family,
  }))
}

/** Ordered: popular first, then A–Z — for emptyQueryCap preview. */
export const GOOGLE_FONT_PICKER_OPTIONS: GoogleFontPickerOption[] = (() => {
  const popular = new Set(GOOGLE_FONT_POPULAR)
  const inCatalog = new Set(GOOGLE_FONT_FAMILIES)
  const head = GOOGLE_FONT_POPULAR.filter((f) => inCatalog.has(f))
  const rest = GOOGLE_FONT_FAMILIES.filter((f) => !popular.has(f))
  return googleFontPickerOptions([...head, ...rest])
})()
