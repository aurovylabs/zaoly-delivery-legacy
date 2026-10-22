/**
 * Print HTML ↔ Mag PDF twin map — Drift-CI SoT.
 * Knowledge: knowledge/print-magazine-twins.md
 * Spec: specs/domain/zaoly-ui-mag-pdf-kit.md
 */

export type PrintMagTwin = {
  /** Storybook / catalog title segment under Print/ */
  printStory: string
  /** Mag export name from `@zaoly/ui/mag` */
  magExport: string
  /** HTML Print primitive export from print/PrintPrimitives (when present) */
  printExport?: string
}

/**
 * Structural twin matrix. Keep in sync with Mag* files and Print stories.
 * PrintQuickCheck is HTML-only (composed deck) — no Mag twin.
 */
export const PRINT_MAG_TWINS: readonly PrintMagTwin[] = [
  { printStory: 'Page', magExport: 'MagPage', printExport: 'PrintPage' },
  { printStory: 'Cover', magExport: 'MagCover', printExport: 'PrintCover' },
  { printStory: 'Chapter', magExport: 'MagChapter', printExport: 'PrintChapter' },
  { printStory: 'ScoreRing', magExport: 'MagScoreRing', printExport: 'PrintScoreRing' },
  { printStory: 'Donut', magExport: 'MagDonut', printExport: 'PrintDonut' },
  { printStory: 'Ledger', magExport: 'MagLedger', printExport: 'PrintLedger' },
  { printStory: 'RankedList', magExport: 'MagRankedList', printExport: 'PrintRankedList' },
  { printStory: 'TwoColumn', magExport: 'MagTwoColumn', printExport: 'PrintTwoColumn' },
  { printStory: 'PullQuote', magExport: 'MagPullQuote', printExport: 'PrintPullQuote' },
  { printStory: 'Callout', magExport: 'MagCallout', printExport: 'PrintCallout' },
  { printStory: 'Steps', magExport: 'MagSteps', printExport: 'PrintSteps' },
  { printStory: 'PersonaCard', magExport: 'MagPersonaCard', printExport: 'PrintPersonaCard' },
  { printStory: 'PersonaGrid', magExport: 'MagPersonaGrid', printExport: 'PrintPersonaGrid' },
  { printStory: 'TraitBars', magExport: 'MagTraitBars', printExport: 'PrintTraitBars' },
  { printStory: 'Table', magExport: 'MagTable', printExport: 'PrintTable' },
  { printStory: 'Chip', magExport: 'MagChip', printExport: 'PrintChip' },
  { printStory: 'ChipRow', magExport: 'MagChipRow', printExport: 'PrintChipRow' },
] as const
