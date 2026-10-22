/**
 * Marketing example master used on public landing / explore illustrations.
 * Not a `@zaoly/site-kit` seed atom — see `kit-atoms.ts` for the real catalog.
 */
export const LANDING_EXAMPLE_COMPOSITION = {
  name: 'FeatureCard',
  fileName: 'FeatureCard.tsx',
  labelDe: 'Beispiel-Master',
  labelEn: 'Example master',
  noteDe: 'Marketing-Beispiel · kein Seed-Atom',
  noteEn: 'Marketing example · not a seed atom',
} as const

export function kitAtomTsxSnippet(exportName: string): string {
  return `import { ${exportName} } from '@zaoly/site-kit'\n\nexport function Demo() {\n  return <${exportName} />\n}`
}
