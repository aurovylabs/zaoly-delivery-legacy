/**
 * Motion scale — durations, easings, semantic recipes.
 * CSS mirror: design-system/css/tokens.css (+ prefers-reduced-motion).
 * Knowledge: knowledge/zaoly-ui-motion-buttons.md
 */

/** Primitive durations (ms strings for CSS vars). */
export const duration = {
  instant: '50ms',
  fast: '120ms',
  snappy: '160ms',
  normal: '220ms',
  moderate: '320ms',
  slow: '420ms',
  deliberate: '800ms',
  /** Soft opacity-only fallback under reduced motion */
  fade: '100ms',
  pulse: '1600ms',
  orbit: '2400ms',
} as const

export type DurationToken = keyof typeof duration

/** Easing curves. */
export const easing = {
  linear: 'linear',
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  emphasized: 'cubic-bezier(0.2, 0.9, 0.1, 1)',
  inOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
} as const

export type EasingToken = keyof typeof easing

/**
 * Semantic motion recipes (duration + easing) for components.
 * Prefer these over raw duration/easing in UI CSS.
 */
export const motion = {
  hover: `${duration.fast} ${easing.standard}`,
  press: `${duration.instant} ${easing.standard}`,
  enter: `${duration.normal} ${easing.enter}`,
  exit: `${duration.snappy} ${easing.exit}`,
  reveal: `${duration.slow} ${easing.enter}`,
  sheet: `${duration.normal} ${easing.emphasized}`,
  meter: `${duration.moderate} ${easing.standard}`,
  pulse: `${duration.pulse} ${easing.inOut}`,
  orbit: `${duration.orbit} ${easing.inOut}`,
  fade: `${duration.fade} ${easing.linear}`,
} as const

export type MotionRecipe = keyof typeof motion
