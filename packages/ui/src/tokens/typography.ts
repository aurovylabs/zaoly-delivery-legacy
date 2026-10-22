/**
 * Typography — faces, steps, weights, tracking.
 * Spec: specs/domain/zaoly-ui-typography.md
 * Knowledge: knowledge/zaoly-ui-typography.md
 */

export const fontStacks = {
  display: "'Noto Sans JP', 'Noto Sans', system-ui, sans-serif",
  body: "'Noto Sans JP', 'Noto Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const

/** Size steps → CSS --type-* */
export const typeSteps = {
  '2xs': '0.62rem',
  xs: '0.65rem',
  sm: '0.72rem',
  md: '0.78rem',
  lg: '0.88rem',
  xl: '1rem',
  '2xl': '1.15rem',
  '3xl': '1.5rem',
  /** Signal / briefing article headlines */
  display: 'clamp(1.55rem, 3.6vw, 2.35rem)',
  /** Overview brand wordmark only */
  brand: 'clamp(2.8rem, 8vw, 4.5rem)',
} as const

export type TypeStep = keyof typeof typeSteps

/** Weights → CSS --weight-* */
export const fontWeights = {
  thin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  /** Content headlines (signal-title, brand) — not buttons */
  bold: 700,
} as const

export type FontWeightToken = keyof typeof fontWeights

/** Letter-spacing → CSS --track-* */
export const letterSpacing = {
  label: '0.06em',
  meta: '0.04em',
  tight: '-0.01em',
  /** Brand / signal headline */
  display: '-0.02em',
} as const

export type LetterSpacingToken = keyof typeof letterSpacing

/** Semantic text roles (map to .ds-text-* classes). */
export const textRoles = [
  'display',
  'headline',
  'title',
  'body',
  'label',
  'meta',
  'hint',
  'mono',
  'numeric',
] as const

export type TextRole = (typeof textRoles)[number]
