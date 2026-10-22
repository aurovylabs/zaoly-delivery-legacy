/** Print* scene type allowlist for Magazin-PDF export (P79). */

export const PRINT_SCENE_TYPES = [
  'PrintPage',
  'PrintCover',
  'PrintChapter',
  'PrintPullQuote',
  'PrintCallout',
  'PrintSteps',
  'PrintScoreRing',
  'PrintDonut',
  'PrintRankedList',
  'PrintLedger',
  'PrintTraitBars',
  'PrintTable',
  'PrintTwoColumn',
  'PrintChip',
  'PrintChipRow',
  'PrintPersonaCard',
  'PrintPersonaGrid',
] as const

export type PrintSceneType = (typeof PRINT_SCENE_TYPES)[number]

const PRINT_SET = new Set<string>(PRINT_SCENE_TYPES)

export function isPrintSceneType(type: string): type is PrintSceneType {
  return PRINT_SET.has(type)
}

/** Print module types that can sit orphaned under root without PrintPage. */
export function isPrintModuleType(type: string): boolean {
  return isPrintSceneType(type) && type !== 'PrintPage'
}
