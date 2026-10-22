/**
 * Typography leaves → Mag registered font family (P81b · P82c).
 * Default: map known names onto bundled NotoSans.
 * When typography.source is a fetchable TTF/OTF/WOFF URL or path, register that face.
 */

import {
  MAG_FONT_FAMILY,
  registerMagazinePdfFontFromSrc,
} from '@zaoly/ui/mag'
import type { BrandTokenPackResponse } from '../inspect/token-catalog'
import { isUsableTokenPack } from './resolve-mag-colors'

export type MagFontResolve = {
  /** Family name passed to react-pdf styles (must be Font.register’d). */
  registeredFamily: string
  /** Families found on typography leaves in the pack (informational). */
  brandFamilies: string[]
  /** True when brand asked for a face we cannot embed — fell back to Mag kit. */
  usedFallback: boolean
  /** Typography.source when present (P82c). */
  fontSrc: string | null
  /** True when registerMagazinePdfFontFromSrc succeeded. */
  embeddedFromSrc: boolean
}

/** Families that map onto the bundled Mag NotoSans face. */
const ALIAS_TO_MAG: Record<string, string> = {
  notosans: MAG_FONT_FAMILY,
  'noto sans': MAG_FONT_FAMILY,
  geist: MAG_FONT_FAMILY,
  inter: MAG_FONT_FAMILY,
  system: MAG_FONT_FAMILY,
  'system-ui': MAG_FONT_FAMILY,
}

const FONT_SRC_RE = /\.(ttf|otf|woff2?|ttc)(\?|#|$)/i

function parseTypography(value: unknown): { family: string | null; source: string | null } {
  if (value == null) return { family: null, source: null }
  let parsed: unknown = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return { family: null, source: null }
    if (trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed) as unknown
      } catch {
        return { family: null, source: null }
      }
    } else {
      return { family: trimmed, source: null }
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { family: null, source: null }
  }
  const rec = parsed as Record<string, unknown>
  const family = typeof rec.family === 'string' && rec.family.trim() ? rec.family.trim() : null
  const source = typeof rec.source === 'string' && rec.source.trim() ? rec.source.trim() : null
  return { family, source }
}

function mapToRegistered(family: string): string | null {
  const key = family.toLowerCase().replace(/['"]/g, '').trim()
  if (ALIAS_TO_MAG[key]) return ALIAS_TO_MAG[key]
  if (key.includes('noto')) return MAG_FONT_FAMILY
  return null
}

export function isUsableFontSrc(src: string): boolean {
  const s = src.trim()
  if (!s) return false
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('file:')) {
    return FONT_SRC_RE.test(s) || s.includes('/fonts/')
  }
  // Absolute or package-relative filesystem path
  return FONT_SRC_RE.test(s)
}

/**
 * Resolve Mag font from local pack and optionally register typography.source.
 * Always returns a registered family (NotoSans when embed fails).
 */
export function magFontFromBrandPack(
  pack: BrandTokenPackResponse | null | undefined,
): MagFontResolve {
  if (!pack || !isUsableTokenPack(pack)) {
    return {
      registeredFamily: MAG_FONT_FAMILY,
      brandFamilies: [],
      usedFallback: false,
      fontSrc: null,
      embeddedFromSrc: false,
    }
  }

  const brandFamilies: string[] = []
  let fontSrc: string | null = null
  let embedFamily: string | null = null

  for (const tok of pack.tokens) {
    if (tok.type !== 'typography') continue
    const { family, source } = parseTypography(tok.value)
    if (family && !brandFamilies.includes(family)) brandFamilies.push(family)
    if (!fontSrc && source && isUsableFontSrc(source) && family) {
      fontSrc = source
      embedFamily = family
    }
  }

  if (fontSrc && embedFamily) {
    const ok = registerMagazinePdfFontFromSrc(embedFamily, fontSrc)
    if (ok) {
      return {
        registeredFamily: embedFamily,
        brandFamilies,
        usedFallback: false,
        fontSrc,
        embeddedFromSrc: true,
      }
    }
  }

  if (brandFamilies.length === 0) {
    return {
      registeredFamily: MAG_FONT_FAMILY,
      brandFamilies,
      usedFallback: false,
      fontSrc,
      embeddedFromSrc: false,
    }
  }

  for (const family of brandFamilies) {
    const mapped = mapToRegistered(family)
    if (mapped) {
      return {
        registeredFamily: mapped,
        brandFamilies,
        usedFallback: mapped === MAG_FONT_FAMILY && family.toLowerCase() !== 'notosans',
        fontSrc,
        embeddedFromSrc: false,
      }
    }
  }

  return {
    registeredFamily: MAG_FONT_FAMILY,
    brandFamilies,
    usedFallback: true,
    fontSrc,
    embeddedFromSrc: false,
  }
}
