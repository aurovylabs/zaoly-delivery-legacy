/** Hex / HSV / RGB / HSL helpers for ColorPicker — no third-party deps. */

export type Rgba = { r: number; g: number; b: number; a: number }
export type Hsva = { h: number; s: number; v: number; a: number }
export type Hsla = { h: number; s: number; l: number; a: number }

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round(n: number): number {
  return Math.round(n)
}

/** Expand #rgb → #rrggbb; keep 6/8 digit. */
export function parseHex(input: string): Rgba | null {
  const raw = input.trim()
  if (!raw) return null
  const m = raw.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)
  if (!m) return null
  let hex = m[1]
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
  return { r, g, b, a }
}

/** `#rrggbb` when alpha ≈ 1; else `#rrggbbaa`. */
export function formatHex(c: Rgba): string {
  const r = clamp(round(c.r), 0, 255)
  const g = clamp(round(c.g), 0, 255)
  const b = clamp(round(c.b), 0, 255)
  const to2 = (n: number) => n.toString(16).padStart(2, '0')
  const base = `#${to2(r)}${to2(g)}${to2(b)}`
  const a = clamp(c.a, 0, 1)
  if (a >= 0.999) return base
  return `${base}${to2(round(a * 255))}`
}

export function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6
    else if (max === G) h = (B - R) / d + 2
    else h = (R - G) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return { h, s, v: max }
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const H = ((h % 360) + 360) % 360
  const C = v * s
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1))
  const m = v - C
  let rp = 0
  let gp = 0
  let bp = 0
  if (H < 60) {
    rp = C
    gp = X
  } else if (H < 120) {
    rp = X
    gp = C
  } else if (H < 180) {
    gp = C
    bp = X
  } else if (H < 240) {
    gp = X
    bp = C
  } else if (H < 300) {
    rp = X
    bp = C
  } else {
    rp = C
    bp = X
  }
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  }
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const R = r / 255
  const G = g / 255
  const B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === R) h = ((G - B) / d) % 6
    else if (max === G) h = (B - R) / d + 2
    else h = (R - G) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const H = ((h % 360) + 360) % 360
  const C = (1 - Math.abs(2 * l - 1)) * s
  const X = C * (1 - Math.abs(((H / 60) % 2) - 1))
  const m = l - C / 2
  let rp = 0
  let gp = 0
  let bp = 0
  if (H < 60) {
    rp = C
    gp = X
  } else if (H < 120) {
    rp = X
    gp = C
  } else if (H < 180) {
    gp = C
    bp = X
  } else if (H < 240) {
    gp = X
    bp = C
  } else if (H < 300) {
    rp = X
    bp = C
  } else {
    rp = C
    bp = X
  }
  return {
    r: (rp + m) * 255,
    g: (gp + m) * 255,
    b: (bp + m) * 255,
  }
}

export function rgbaToHsva(c: Rgba): Hsva {
  const { h, s, v } = rgbToHsv(c.r, c.g, c.b)
  return { h, s, v, a: c.a }
}

export function hsvaToRgba(c: Hsva): Rgba {
  const { r, g, b } = hsvToRgb(c.h, c.s, c.v)
  return { r, g, b, a: c.a }
}

export function rgbaToHsla(c: Rgba): Hsla {
  const { h, s, l } = rgbToHsl(c.r, c.g, c.b)
  return { h, s, l, a: c.a }
}

export function hslaToRgba(c: Hsla): Rgba {
  const { r, g, b } = hslToRgb(c.h, c.s, c.l)
  return { r, g, b, a: c.a }
}

export function normalizeHex(input: string): string | null {
  const parsed = parseHex(input)
  return parsed ? formatHex(parsed) : null
}

export function rgbaCss(c: Rgba): string {
  const a = clamp(c.a, 0, 1)
  return `rgba(${round(c.r)}, ${round(c.g)}, ${round(c.b)}, ${a})`
}

export function hasEyeDropper(): boolean {
  return typeof window !== 'undefined' && typeof (window as Window & { EyeDropper?: unknown }).EyeDropper === 'function'
}
