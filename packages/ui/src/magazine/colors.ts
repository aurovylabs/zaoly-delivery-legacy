/**
 * Shared magazine print colors — SSOT for HTML Print* and react-pdf Mag*.
 * Spec: specs/domain/zaoly-ui-mag-pdf-kit.md
 */
export const magazineColors = {
  ink: '#141414',
  inkSoft: '#3a3a38',
  muted: '#6e6e6a',
  line: '#dddcd7',
  paper: '#f8f7f4',
  wash: '#efeee9',
  accent: '#00ca55',
  accentInk: '#007a33',
  neg: '#c23b2a',
  warn: '#b45309',
  track: '#e6e5e0',
  donut: [
    '#141414',
    '#00ca55',
    '#5a5a5a',
    '#9a9a9a',
    '#c23b2a',
    '#3a7bd5',
    '#b45309',
    '#6b6b6b',
  ],
} as const

export type MagazineColors = {
  ink: string
  inkSoft: string
  muted: string
  line: string
  paper: string
  wash: string
  accent: string
  accentInk: string
  neg: string
  warn: string
  track: string
  donut: readonly string[]
}

export type MagazineColorOverrides = Partial<
  Omit<MagazineColors, 'donut'> & { donut: readonly string[] }
>

/** Merge app/Brandion overrides onto DS magazine colors (app-layer theme hook). */
export function mergeMagazineColors(
  overrides?: MagazineColorOverrides | null,
  base: MagazineColors = magazineColors,
): MagazineColors {
  if (!overrides) return { ...base, donut: [...base.donut] }
  return {
    ink: overrides.ink ?? base.ink,
    inkSoft: overrides.inkSoft ?? base.inkSoft,
    muted: overrides.muted ?? base.muted,
    line: overrides.line ?? base.line,
    paper: overrides.paper ?? base.paper,
    wash: overrides.wash ?? base.wash,
    accent: overrides.accent ?? base.accent,
    accentInk: overrides.accentInk ?? base.accentInk,
    neg: overrides.neg ?? base.neg,
    warn: overrides.warn ?? base.warn,
    track: overrides.track ?? base.track,
    donut: overrides.donut ? [...overrides.donut] : [...base.donut],
  }
}
