/** Editor breakpoint ids (OP-9) — persisted on CompositionScene.activeBreakpoint. */

import type { PrintPresetId } from '@zaoly/contracts'
import { DEFAULT_PRINT_PRESET, PRINT_PRESET_IDS } from '@zaoly/contracts'

export const EDITOR_BREAKPOINTS = ['mobile', 'tablet', 'desktop', 'print'] as const
export type EditorBreakpoint = (typeof EDITOR_BREAKPOINTS)[number]

export type DigitalEditorBreakpoint = Exclude<EditorBreakpoint, 'print'>

/** Zaoly web-design UI — print lane is out of scope (`knowledge/print-out-of-scope-for-zaoly.md`). */
export const DIGITAL_EDITOR_BREAKPOINTS = ['mobile', 'tablet', 'desktop'] as const

/** Coerce legacy `print` (and unknown) to a digital lane for Zaoly preview. */
export function resolveDigitalEditorBreakpoint(
  value: string | null | undefined,
): DigitalEditorBreakpoint {
  if (value === 'mobile' || value === 'tablet' || value === 'desktop') return value
  return 'desktop'
}

/** Digital artboard widths (content height is measured unless frame.height is set). Print uses PRINT_PRESETS. */
export const EDITOR_BREAKPOINT_WIDTHS: Record<DigitalEditorBreakpoint, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
}

export const DEFAULT_EDITOR_BREAKPOINT: EditorBreakpoint = 'desktop'

/** 96dpi CSS px from millimetres. */
export function mmToCssPx(mm: number): number {
  return Math.round((mm * 96) / 25.4)
}

export type PrintPresetDef = {
  id: PrintPresetId
  labelKey: string
  widthMm: number
  heightMm: number
  cssWidth: number
  cssHeight: number
}

function preset(
  id: PrintPresetId,
  labelKey: string,
  widthMm: number,
  heightMm: number,
): PrintPresetDef {
  return {
    id,
    labelKey,
    widthMm,
    heightMm,
    cssWidth: mmToCssPx(widthMm),
    cssHeight: mmToCssPx(heightMm),
  }
}

/**
 * Print / presentation artboard catalog — DIN + US Letter + Slide 16:9
 * (spec: artboard-dimensions.md). Mag PDF page size stays DIN-A4 kit until a later Mag wave (P85).
 */
export const PRINT_PRESETS: Record<PrintPresetId, PrintPresetDef> = {
  /** PowerPoint-style widescreen — locked CSS px (not mm-derived paper). */
  'slide-16-9': {
    id: 'slide-16-9',
    labelKey: 'editor.printPreset.slide169',
    widthMm: (1920 * 25.4) / 96,
    heightMm: (1080 * 25.4) / 96,
    cssWidth: 1920,
    cssHeight: 1080,
  },
  'a3-portrait': preset('a3-portrait', 'editor.printPreset.a3Portrait', 297, 420),
  'a3-landscape': preset('a3-landscape', 'editor.printPreset.a3Landscape', 420, 297),
  'a4-portrait': preset('a4-portrait', 'editor.printPreset.a4Portrait', 210, 297),
  'a4-landscape': preset('a4-landscape', 'editor.printPreset.a4Landscape', 297, 210),
  'a5-portrait': preset('a5-portrait', 'editor.printPreset.a5Portrait', 148, 210),
  'a5-landscape': preset('a5-landscape', 'editor.printPreset.a5Landscape', 210, 148),
  'a6-portrait': preset('a6-portrait', 'editor.printPreset.a6Portrait', 105, 148),
  'a6-landscape': preset('a6-landscape', 'editor.printPreset.a6Landscape', 148, 105),
  'letter-portrait': preset('letter-portrait', 'editor.printPreset.letterPortrait', 215.9, 279.4),
  'letter-landscape': preset(
    'letter-landscape',
    'editor.printPreset.letterLandscape',
    279.4,
    215.9,
  ),
}

export const PRINT_PRESET_LIST: PrintPresetDef[] = PRINT_PRESET_IDS.map((id) => PRINT_PRESETS[id])

export function isEditorBreakpoint(value: string): value is EditorBreakpoint {
  return (EDITOR_BREAKPOINTS as readonly string[]).includes(value)
}

export function isPrintPresetId(value: string): value is PrintPresetId {
  return (PRINT_PRESET_IDS as readonly string[]).includes(value)
}

export function resolveSceneBreakpoint(
  value: string | null | undefined,
): EditorBreakpoint {
  if (value && isEditorBreakpoint(value)) return value
  return DEFAULT_EDITOR_BREAKPOINT
}

export function resolvePrintPreset(
  value: string | null | undefined,
): PrintPresetId {
  if (value && isPrintPresetId(value)) return value
  return DEFAULT_PRINT_PRESET
}

export function artboardCssSize(
  breakpoint: EditorBreakpoint,
  printPreset: PrintPresetId = DEFAULT_PRINT_PRESET,
): { width: number; height: number | null } {
  if (breakpoint === 'print') {
    const p = PRINT_PRESETS[resolvePrintPreset(printPreset)]
    return { width: p.cssWidth, height: p.cssHeight }
  }
  return { width: EDITOR_BREAKPOINT_WIDTHS[breakpoint], height: null }
}
