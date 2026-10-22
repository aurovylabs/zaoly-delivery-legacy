import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Font } from '@react-pdf/renderer'

/** DS stack twin — Noto Sans (latin subset) for Magazin-PDF. */
export const MAG_FONT_FAMILY = 'NotoSans'

let registered = false

function magFontsDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts')
}

export function registerMagazinePdfFonts(): void {
  if (registered) return
  const dir = magFontsDir()
  const regular = path.join(dir, 'NotoSans-Regular.ttf')
  const bold = path.join(dir, 'NotoSans-Bold.ttf')
  if (!fs.existsSync(regular) || !fs.existsSync(bold)) {
    throw new Error(
      `Mag PDF fonts missing under ${dir} (expected NotoSans-Regular.ttf + NotoSans-Bold.ttf)`,
    )
  }
  Font.register({
    family: MAG_FONT_FAMILY,
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  })
  registered = true
}

const customFamilies = new Set<string>()

/**
 * P82c — Register an extra Mag face from URL or filesystem path (TTF/OTF).
 * Brandion font-bytes upload MIME is still out; typography.source may point at a fetchable file.
 * Idempotent per family name. Returns false on empty input or register failure.
 */
export function registerMagazinePdfFontFromSrc(family: string, src: string): boolean {
  const name = family.trim()
  const href = src.trim()
  if (!name || !href) return false
  if (customFamilies.has(name)) return true
  try {
    Font.register({ family: name, src: href })
    customFamilies.add(name)
    return true
  } catch {
    return false
  }
}

/** Test helper — clear custom registrations bookkeeping (Font itself stays registered). */
export function resetMagazinePdfCustomFontsForTests(): void {
  customFamilies.clear()
}
