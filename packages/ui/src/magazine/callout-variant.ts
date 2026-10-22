/**
 * Shared PrintCallout / MagCallout variant enum (P92 Phase B).
 * Keep HTML class modifiers and Mag styles in lockstep.
 */

export const PRINT_CALLOUT_VARIANTS = ['wash', 'emphasize', 'quiet'] as const

export type PrintCalloutVariant = (typeof PRINT_CALLOUT_VARIANTS)[number]

export function normalizePrintCalloutVariant(raw: unknown): PrintCalloutVariant {
  if (typeof raw === 'string' && (PRINT_CALLOUT_VARIANTS as readonly string[]).includes(raw)) {
    return raw as PrintCalloutVariant
  }
  return 'wash'
}
