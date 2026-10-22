export type GoogleFontCategory = 'sans-serif' | 'serif' | 'monospace' | 'display' | 'handwriting'

export type GoogleFontCatalogEntry = {
  family: string
  category: GoogleFontCategory
}

/** Curated Google Fonts subset for FontFamilyPicker (TP-1). */
export const GOOGLE_FONTS_CATALOG: GoogleFontCatalogEntry[] = [
  { family: 'Inter', category: 'sans-serif' },
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Open Sans', category: 'sans-serif' },
  { family: 'Lato', category: 'sans-serif' },
  { family: 'Montserrat', category: 'sans-serif' },
  { family: 'Poppins', category: 'sans-serif' },
  { family: 'Source Sans 3', category: 'sans-serif' },
  { family: 'Nunito', category: 'sans-serif' },
  { family: 'Raleway', category: 'sans-serif' },
  { family: 'Work Sans', category: 'sans-serif' },
  { family: 'DM Sans', category: 'sans-serif' },
  { family: 'Manrope', category: 'sans-serif' },
  { family: 'IBM Plex Sans', category: 'sans-serif' },
  { family: 'Source Serif 4', category: 'serif' },
  { family: 'Merriweather', category: 'serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Libre Baskerville', category: 'serif' },
  { family: 'Cormorant Garamond', category: 'serif' },
  { family: 'IBM Plex Serif', category: 'serif' },
  { family: 'JetBrains Mono', category: 'monospace' },
  { family: 'Roboto Mono', category: 'monospace' },
  { family: 'Source Code Pro', category: 'monospace' },
  { family: 'Fira Code', category: 'monospace' },
  { family: 'Space Grotesk', category: 'display' },
  { family: 'Oswald', category: 'display' },
  { family: 'Bebas Neue', category: 'display' },
  { family: 'Archivo', category: 'display' },
  { family: 'Caveat', category: 'handwriting' },
  { family: 'Dancing Script', category: 'handwriting' },
]

export function filterGoogleFontsCatalog(
  query: string,
  catalog: readonly GoogleFontCatalogEntry[] = GOOGLE_FONTS_CATALOG,
): GoogleFontCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...catalog]
  return catalog.filter(
    (entry) =>
      entry.family.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q),
  )
}
