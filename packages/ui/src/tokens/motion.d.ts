/**
 * Motion scale — durations, easings, semantic recipes.
 * CSS mirror: design-system/css/tokens.css (+ prefers-reduced-motion).
 * Knowledge: knowledge/zaoly-ui-motion-buttons.md
 */
/** Primitive durations (ms strings for CSS vars). */
export declare const duration: {
    readonly instant: "50ms";
    readonly fast: "120ms";
    readonly snappy: "160ms";
    readonly normal: "220ms";
    readonly moderate: "320ms";
    readonly slow: "420ms";
    readonly deliberate: "800ms";
    /** Soft opacity-only fallback under reduced motion */
    readonly fade: "100ms";
    readonly pulse: "1600ms";
    readonly orbit: "2400ms";
};
export type DurationToken = keyof typeof duration;
/** Easing curves. */
export declare const easing: {
    readonly linear: "linear";
    readonly standard: "cubic-bezier(0.4, 0, 0.2, 1)";
    readonly enter: "cubic-bezier(0, 0, 0.2, 1)";
    readonly exit: "cubic-bezier(0.4, 0, 1, 1)";
    readonly emphasized: "cubic-bezier(0.2, 0.9, 0.1, 1)";
    readonly inOut: "cubic-bezier(0.45, 0, 0.55, 1)";
};
export type EasingToken = keyof typeof easing;
/**
 * Semantic motion recipes (duration + easing) for components.
 * Prefer these over raw duration/easing in UI CSS.
 */
export declare const motion: {
    readonly hover: "120ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly press: "50ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly enter: "220ms cubic-bezier(0, 0, 0.2, 1)";
    readonly exit: "160ms cubic-bezier(0.4, 0, 1, 1)";
    readonly reveal: "420ms cubic-bezier(0, 0, 0.2, 1)";
    readonly sheet: "220ms cubic-bezier(0.2, 0.9, 0.1, 1)";
    readonly meter: "320ms cubic-bezier(0.4, 0, 0.2, 1)";
    readonly pulse: "1600ms cubic-bezier(0.45, 0, 0.55, 1)";
    readonly orbit: "2400ms cubic-bezier(0.45, 0, 0.55, 1)";
    readonly fade: "100ms linear";
};
export type MotionRecipe = keyof typeof motion;
