/**
 * Typography — faces, steps, weights, tracking.
 * Spec: specs/domain/zaoly-ui-typography.md
 * Knowledge: knowledge/zaoly-ui-typography.md
 */
export declare const fontStacks: {
    readonly display: "'Noto Sans JP', 'Noto Sans', system-ui, sans-serif";
    readonly body: "'Noto Sans JP', 'Noto Sans', system-ui, sans-serif";
    readonly mono: "'IBM Plex Mono', ui-monospace, monospace";
};
/** Size steps → CSS --type-* */
export declare const typeSteps: {
    readonly '2xs': "0.62rem";
    readonly xs: "0.65rem";
    readonly sm: "0.72rem";
    readonly md: "0.78rem";
    readonly lg: "0.88rem";
    readonly xl: "1rem";
    readonly '2xl': "1.15rem";
    readonly '3xl': "1.5rem";
    /** Signal / briefing article headlines */
    readonly display: "clamp(1.55rem, 3.6vw, 2.35rem)";
    /** Overview brand wordmark only */
    readonly brand: "clamp(2.8rem, 8vw, 4.5rem)";
};
export type TypeStep = keyof typeof typeSteps;
/** Weights → CSS --weight-* */
export declare const fontWeights: {
    readonly thin: 200;
    readonly light: 300;
    readonly regular: 400;
    readonly medium: 500;
    readonly semibold: 600;
    /** Content headlines (signal-title, brand) — not buttons */
    readonly bold: 700;
};
export type FontWeightToken = keyof typeof fontWeights;
/** Letter-spacing → CSS --track-* */
export declare const letterSpacing: {
    readonly label: "0.06em";
    readonly meta: "0.04em";
    readonly tight: "-0.01em";
    /** Brand / signal headline */
    readonly display: "-0.02em";
};
export type LetterSpacingToken = keyof typeof letterSpacing;
/** Semantic text roles (map to .ds-text-* classes). */
export declare const textRoles: readonly ["display", "headline", "title", "body", "label", "meta", "hint", "mono", "numeric"];
export type TextRole = (typeof textRoles)[number];
