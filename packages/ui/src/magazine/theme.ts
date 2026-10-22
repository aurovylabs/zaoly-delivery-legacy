/**
 * Renderer-neutral magazine theme — SSOT for HTML custom properties and Mag createMagStyles.
 * Spec: specs/domain/zaoly-ui-mag-pdf-kit.md · knowledge/print-magazine-twins.md
 */
import { magazineColors, type MagazineColors, type MagazineColorOverrides, mergeMagazineColors } from './colors'

export type MagazineLayoutTheme = {
  /** Content column max width (CSS). A4 Mag kit ≈ 428pt → ~34rem editor twin. */
  columnMax: string
  pagePaddingBlock: string
  pagePaddingInline: string
  typeBody: string
  typeEyebrow: string
  typeHeadline: string
  typeTable: string
  typeTableHead: string
  fontFamily: string
  /** Physical CSS px → PDF pt (96dpi / 72pt). */
  cssPxToPdfPt: number
}

export type MagazineTheme = {
  colors: MagazineColors
  layout: MagazineLayoutTheme
}

export const magazineLayoutDefaults: MagazineLayoutTheme = {
  columnMax: '34rem',
  pagePaddingBlock: '3rem',
  pagePaddingInline: '3.25rem',
  typeBody: '0.875rem',
  typeEyebrow: '0.65rem',
  typeHeadline: '1.25rem',
  typeTable: '0.78rem',
  typeTableHead: '0.6rem',
  fontFamily: "'Noto Sans', 'Noto Sans JP', system-ui, sans-serif",
  cssPxToPdfPt: 0.75,
}

export const magazineTheme: MagazineTheme = {
  colors: { ...magazineColors, donut: [...magazineColors.donut] },
  layout: { ...magazineLayoutDefaults },
}

/** CSS custom properties for `.zaoly-print-page` (and descendants). */
export function magazineThemeToCssVars(
  theme: MagazineTheme = magazineTheme,
): Record<string, string> {
  const { colors, layout } = theme
  return {
    '--print-ink': colors.ink,
    '--print-ink-soft': colors.inkSoft,
    '--print-muted': colors.muted,
    '--print-line': colors.line,
    '--print-paper': colors.paper,
    '--print-wash': colors.wash,
    '--print-accent': colors.accent,
    '--print-accent-ink': colors.accentInk,
    '--print-neg': colors.neg,
    '--print-warn': colors.warn,
    '--print-track': colors.track,
    '--print-type-body': layout.typeBody,
    '--print-table-font-size': layout.typeTable,
    '--print-table-head-size': layout.typeTableHead,
    '--print-font-family': layout.fontFamily,
  }
}

export function mergeMagazineTheme(input?: {
  colors?: MagazineColorOverrides | null
  layout?: Partial<MagazineLayoutTheme> | null
}): MagazineTheme {
  return {
    colors: mergeMagazineColors(input?.colors),
    layout: { ...magazineLayoutDefaults, ...(input?.layout ?? {}) },
  }
}
