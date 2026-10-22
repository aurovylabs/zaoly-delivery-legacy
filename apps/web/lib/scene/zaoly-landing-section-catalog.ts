/**
 * Starter landing section catalog (palette keys only — no scene trees).
 * Trees live in `zaoly-default-landing-scene.ts`.
 */
export const ZAOLY_LANDING_SECTION_EXPORT_NAMES = [
  'LandingNav',
  'LandingHero',
  'LandingShowcase',
  'LandingFeatures',
  'LandingKitBand',
  'LandingCta',
  'LandingFooter',
  'LandingCard',
] as const

export type ZaolyLandingSectionExportName =
  (typeof ZAOLY_LANDING_SECTION_EXPORT_NAMES)[number]

export function zaolyLandingSectionSourceKey(
  exportName: ZaolyLandingSectionExportName,
): string {
  return `Composition:${exportName}`
}

export function zaolyLandingSectionPaletteItems(): Array<{
  id: string
  label: string
  insertType: string
}> {
  return [
    { exportName: 'LandingNav' as const, label: 'Nav' },
    { exportName: 'LandingHero' as const, label: 'Hero' },
    { exportName: 'LandingCard' as const, label: 'Card' },
    { exportName: 'LandingShowcase' as const, label: 'Showcase' },
    { exportName: 'LandingFeatures' as const, label: 'Features' },
    { exportName: 'LandingKitBand' as const, label: 'Kit band' },
    { exportName: 'LandingCta' as const, label: 'CTA' },
    { exportName: 'LandingFooter' as const, label: 'Footer' },
  ].map((item) => {
    const insertType = zaolyLandingSectionSourceKey(item.exportName)
    return { id: insertType, label: item.label, insertType }
  })
}
