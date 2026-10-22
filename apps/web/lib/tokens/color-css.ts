/**
 * Multi-format CSS colors for Zaoly Token Studio digital channel.
 * Spec: specs/domain/zaoly-token-studio.md · CSS Color Level 4 via culori
 */
import { converter, formatHsl, formatRgb, parse } from 'culori'
import type { Color } from 'culori'

export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'oklch'

export const COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'oklch'] as const

export const COLOR_FORMAT_LABEL_KEYS: Record<ColorFormat, string> = {
  hex: 'tokens.colorFormatHex',
  rgb: 'tokens.colorFormatRgb',
  hsl: 'tokens.colorFormatHsl',
  oklch: 'tokens.colorFormatOklch',
}

const toRgb = converter('rgb')
const toOklch = converter('oklch')

function round(n: number, digits: number): number {
  const p = 10 ** digits
  return Math.round(n * p) / p
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function channel255(n: number): number {
  return Math.round(clamp01(n) * 255)
}

function alphaOf(color: Color): number {
  return typeof color.alpha === 'number' ? clamp01(color.alpha) : 1
}

function asColor(value: string | Color): Color | null {
  if (typeof value === 'string') return parse(value.trim()) ?? null
  return value
}

function formatHex8(color: Color): string {
  const rgb = toRgb(color)
  if (!rgb) return '#000000'
  const r = channel255(rgb.r).toString(16).padStart(2, '0')
  const g = channel255(rgb.g).toString(16).padStart(2, '0')
  const b = channel255(rgb.b).toString(16).padStart(2, '0')
  const a = alphaOf(rgb)
  if (a >= 1) return `#${r}${g}${b}`
  const aa = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${r}${g}${b}${aa}`
}

function formatOklchCss(color: Color): string {
  const o = toOklch(color)
  if (!o) return 'oklch(0 0 0)'
  const L = round(o.l, 4)
  const C = round(o.c, 4)
  const H = round(o.h ?? 0, 2)
  const a = alphaOf(o)
  if (a < 1) return `oklch(${L} ${C} ${H} / ${round(a, 3)})`
  return `oklch(${L} ${C} ${H})`
}

function formatParsed(color: Color, format: ColorFormat): string {
  if (format === 'hex') return formatHex8(color)
  if (format === 'rgb') return formatRgb(color)
  if (format === 'hsl') return formatHsl(color)
  return formatOklchCss(color)
}

/** True when the string parses as a paintable CSS color (not a compose expr). */
export function isValidCssColor(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  if (/^(transparent|currentcolor)$/i.test(v)) return true
  return parse(v) != null
}

export function detectColorFormat(value: string): ColorFormat {
  const v = value.trim()
  if (/^#([0-9a-f]{3,8})$/i.test(v)) return 'hex'
  if (/^rgba?\(/i.test(v)) return 'rgb'
  if (/^hsla?\(/i.test(v)) return 'hsl'
  if (/^oklch\(/i.test(v) || /^oklab\(/i.test(v)) return 'oklch'
  return 'hex'
}

/** Format a color into the requested CSS notation. */
export function formatColorAs(value: string | Color, format: ColorFormat): string | null {
  const parsed = asColor(value)
  if (!parsed) return null
  return formatParsed(parsed, format)
}

/** Convert between formats; returns null when the source is not a color. */
export function convertColorFormat(value: string, format: ColorFormat): string | null {
  return formatColorAs(value, format)
}

/** Opaque #rrggbb for `<input type="color">` (alpha stripped). */
export function toPickerHex(value: string): string {
  const parsed = parse(value.trim())
  if (!parsed) return '#000000'
  const rgb = toRgb(parsed)
  if (!rgb) return '#000000'
  const r = channel255(rgb.r).toString(16).padStart(2, '0')
  const g = channel255(rgb.g).toString(16).padStart(2, '0')
  const b = channel255(rgb.b).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

/**
 * Apply a picker hex while preserving alpha from the previous CSS color
 * and keeping the active format.
 */
export function applyPickerHex(previous: string, nextHex: string): string {
  const format = detectColorFormat(previous)
  const prev = parse(previous.trim())
  const next = parse(nextHex.trim())
  if (!next) return previous
  const rgb = toRgb(next)
  if (!rgb) return nextHex
  const alpha = prev ? alphaOf(prev) : 1
  const merged = alpha < 1 ? { ...rgb, alpha } : rgb
  return formatParsed(merged, format)
}
