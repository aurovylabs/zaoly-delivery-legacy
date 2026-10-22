/**
 * Public Zaoly Kit atom catalog for landing / explore demos.
 * Mirrors `@zaoly/site-kit` seed atoms (see `packages/site-kit/src/catalog.ts`) —
 * TableRow / TableCell fold into Table for marketing clarity.
 */

export type KitAtomCategory = 'content' | 'form' | 'media' | 'layout' | 'data'

export type KitAtomId =
  | 'Text'
  | 'Link'
  | 'Button'
  | 'Badge'
  | 'Input'
  | 'Textarea'
  | 'Select'
  | 'Checkbox'
  | 'Image'
  | 'Svg'
  | 'Shape'
  | 'Chart'
  | 'Gauge'
  | 'Stack'
  | 'Grid'
  | 'Container'
  | 'Divider'
  | 'Table'

export type KitAtomDef = {
  id: KitAtomId
  category: KitAtomCategory
  exportName: KitAtomId
  roleDe: string
  roleEn: string
}

export const KIT_ATOM_CATEGORIES: Array<{
  id: KitAtomCategory
  labelDe: string
  labelEn: string
  whyDe: string
  whyEn: string
}> = [
  {
    id: 'content',
    labelDe: 'Inhalt',
    labelEn: 'Content',
    whyDe: 'Text, Links, Buttons und Badges tragen Bedeutung — ohne sie bleibt ein Layout stumm.',
    whyEn: 'Text, links, buttons, and badges carry meaning — without them a layout stays silent.',
  },
  {
    id: 'form',
    labelDe: 'Formulare',
    labelEn: 'Forms',
    whyDe: 'Eingaben sind die Schnittstelle zum Produkt. Dieselben Atome landen in jedem Screen.',
    whyEn: 'Inputs are the product interface. The same atoms land on every screen.',
  },
  {
    id: 'media',
    labelDe: 'Medien',
    labelEn: 'Media',
    whyDe: 'Bilder, Formen und Charts machen Räume sichtbar — als Atome, nicht als einmalige Collagen.',
    whyEn: 'Images, shapes, and charts make space readable — as atoms, not one-off collages.',
  },
  {
    id: 'layout',
    labelDe: 'Layout',
    labelEn: 'Layout',
    whyDe: 'Stack, Grid, Container und Divider ordnen Atome zu vollständigen Seitenstrukturen.',
    whyEn: 'Stack, Grid, Container, and Divider arrange atoms into full page structures.',
  },
  {
    id: 'data',
    labelDe: 'Daten',
    labelEn: 'Data',
    whyDe: 'Tabellen halten strukturierte Inhalte — wiederverwendbar in Listen, Dashboards und Handoff.',
    whyEn: 'Tables hold structured content — reusable in lists, dashboards, and handoff.',
  },
]

export const KIT_ATOMS: readonly KitAtomDef[] = [
  { id: 'Text', category: 'content', exportName: 'Text', roleDe: 'Typografie und Absätze', roleEn: 'Typography and paragraphs' },
  { id: 'Link', category: 'content', exportName: 'Link', roleDe: 'Navigation und Inline-Bezug', roleEn: 'Navigation and inline reference' },
  { id: 'Button', category: 'content', exportName: 'Button', roleDe: 'Primäre und sekundäre Aktionen', roleEn: 'Primary and secondary actions' },
  { id: 'Badge', category: 'content', exportName: 'Badge', roleDe: 'Status und kurze Marker', roleEn: 'Status and short markers' },
  { id: 'Input', category: 'form', exportName: 'Input', roleDe: 'Einzeilige Eingabe', roleEn: 'Single-line input' },
  { id: 'Textarea', category: 'form', exportName: 'Textarea', roleDe: 'Mehrzeilige Eingabe', roleEn: 'Multi-line input' },
  { id: 'Select', category: 'form', exportName: 'Select', roleDe: 'Auswahl aus Optionen', roleEn: 'Choice from options' },
  { id: 'Checkbox', category: 'form', exportName: 'Checkbox', roleDe: 'Zustimmung und Schalter', roleEn: 'Consent and toggles' },
  { id: 'Image', category: 'media', exportName: 'Image', roleDe: 'Raster- und Hero-Medien', roleEn: 'Raster and hero media' },
  { id: 'Svg', category: 'media', exportName: 'Svg', roleDe: 'Vektor-Marken und Icons', roleEn: 'Vector marks and icons' },
  { id: 'Shape', category: 'media', exportName: 'Shape', roleDe: 'Flächen und Akzente', roleEn: 'Planes and accents' },
  { id: 'Chart', category: 'media', exportName: 'Chart', roleDe: 'Datenreihen visualisieren', roleEn: 'Visualize series' },
  { id: 'Gauge', category: 'media', exportName: 'Gauge', roleDe: 'Kennzahl auf einen Blick', roleEn: 'Metric at a glance' },
  { id: 'Stack', category: 'layout', exportName: 'Stack', roleDe: 'Vertikale / horizontale Reihen', roleEn: 'Vertical / horizontal stacks' },
  { id: 'Grid', category: 'layout', exportName: 'Grid', roleDe: 'Spalten und responsive Raster', roleEn: 'Columns and responsive grids' },
  { id: 'Container', category: 'layout', exportName: 'Container', roleDe: 'Breite und Seitenrahmen', roleEn: 'Width and page frame' },
  { id: 'Divider', category: 'layout', exportName: 'Divider', roleDe: 'Trennung und Rhythmus', roleEn: 'Separation and rhythm' },
  { id: 'Table', category: 'data', exportName: 'Table', roleDe: 'Zeilen, Zellen, Struktur', roleEn: 'Rows, cells, structure' },
] as const

export function kitAtomsInCategory(category: KitAtomCategory): KitAtomDef[] {
  return KIT_ATOMS.filter((atom) => atom.category === category)
}

export function kitAtomById(id: KitAtomId): KitAtomDef | undefined {
  return KIT_ATOMS.find((atom) => atom.id === id)
}
