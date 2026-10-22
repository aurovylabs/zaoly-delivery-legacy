/**
 * Shared PrintSteps / MagSteps orientation (P92 Phase D).
 */

export const PRINT_STEPS_ORIENTATIONS = ['horizontal', 'vertical'] as const

export type PrintStepsOrientation = (typeof PRINT_STEPS_ORIENTATIONS)[number]

export function normalizePrintStepsOrientation(raw: unknown): PrintStepsOrientation {
  if (raw === 'vertical') return 'vertical'
  return 'horizontal'
}

/** 0-based; out of range / non-finite → undefined (no emphasis). */
export function normalizePrintStepsEmphasisIndex(
  raw: unknown,
  stepCount: number,
): number | undefined {
  const n =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string' && raw.trim() !== ''
        ? Number(raw)
        : NaN
  if (!Number.isFinite(n)) return undefined
  const i = Math.floor(n)
  if (i < 0 || i >= stepCount) return undefined
  return i
}
