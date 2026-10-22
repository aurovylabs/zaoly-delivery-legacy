import { zaolyRoles, zaolyRolesDark } from './roles';
export type ChartTokens = {
    muted: string;
    accent: string;
    ok: string;
    ink: string;
    grid: string;
    tipBg: string;
    tipBorder: string;
    tipFg: string;
};
export type SemanticTheme = {
    bg0: string;
    bg1: string;
    ink: string;
    muted: string;
    accent: string;
    line: string;
    danger: string;
    ok: string;
    warn: string;
    surface: string;
    surface2: string;
    chart: ChartTokens;
    roles: typeof zaolyRoles | typeof zaolyRolesDark;
};
/** Trial light (legacy theme id `zaoly`) */
export declare const zaolyLight: SemanticTheme;
/** Trial dark (legacy `zaoly-dark`) */
export declare const zaolyDark: SemanticTheme;
/**
 * zaoly-ui light — same brand, clearer surfaces + soft panel radius via CSS.
 */
export declare const zaolyV2Light: SemanticTheme;
/**
 * zaoly-ui dark — slightly clearer elevated surfaces than trial dark.
 */
export declare const zaolyV2Dark: SemanticTheme;
export declare const forestChart: ChartTokens;
