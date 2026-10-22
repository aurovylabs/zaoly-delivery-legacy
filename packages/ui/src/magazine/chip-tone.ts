/**
 * Shared Print/Mag chip tone vocabulary (P92 Phase A).
 * Spec: specs/domain/zaoly-ui-print-report-primitives.md
 */

export const PRINT_CHIP_TONES = ['default', 'muted', 'accent', 'solid'] as const

export type PrintChipTone = (typeof PRINT_CHIP_TONES)[number]

export function normalizePrintChipTone(raw: unknown): PrintChipTone {
  if (raw === 'muted' || raw === 'accent' || raw === 'solid' || raw === 'default') return raw
  return 'default'
}
