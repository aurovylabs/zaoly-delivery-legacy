/**
 * Map local pack leaves → Mag magazine colors (P80a path grammar).
 * Reuses printCssForLeaf / digitalCssForLeaf — no second path grammar.
 */

import {
  magColors,
  mergeMagazineColors,
  type MagazineColorOverrides,
  type MagazineColors,
} from '@zaoly/ui/mag'
import { digitalCssForLeaf, printCssForLeaf, type PackLeafInput } from '../inspect/digital-css'
import type { BrandTokenPackResponse } from '../inspect/token-catalog'
import { sanitizeMagPaper } from './mag-paper'

/** Scalar Mag keys we can override from pack color leaves. */
type MagScalarKey = Exclude<keyof MagazineColors, 'donut'>

/**
 * Pack path → Mag color key(s). Paths from knowledge/token-layers.md (P39/P42).
 * First mapped leaf wins per Mag key (document order of tokens array).
 * `color.background` → paper only when light enough (UI dark chrome is not Mag paper).
 */
export const PACK_PATH_TO_MAG_COLOR: Record<string, MagScalarKey | MagScalarKey[]> = {
  'color.background': 'paper',
  'color.surface.base': 'paper',
  'color.surface.elevated': 'wash',
  'color.surface.muted': 'wash',
  'color.neutral.100': ['wash', 'track'],
  'color.neutral.700': ['ink', 'inkSoft'],
  'color.ink': ['ink', 'inkSoft'],
  'color.inkMuted': 'muted',
  'color.action.primary': 'accent',
  'color.action.accent': 'accent',
  'color.brand.primary': 'accent',
  'color.brand.green': 'accent',
  'color.action.secondary': 'muted',
  'color.line': 'track',
}

export function isUsableTokenPack(pack: BrandTokenPackResponse | null | undefined): boolean {
  return Boolean(
    pack &&
      Array.isArray(pack.tokens) &&
      pack.tokens.length > 0 &&
      pack.source === 'local',
  )
}

/** Upstream live token pack — out of scope; always false on Zaoly. */
export function isLiveUpstreamPack(_pack: BrandTokenPackResponse | null | undefined): boolean {
  return false
}

function isCssHexOrRgb(value: string): boolean {
  const v = value.trim()
  return /^#([0-9a-fA-F]{3,8})$/.test(v) || /^(rgb|rgba)\(/i.test(v)
}

/** Prefer print-channel CSS; fall back to digital hex preview (printCssForLeaf contract). */
export function brandLeafToMagColor(leaf: PackLeafInput): string | undefined {
  if (leaf.type !== 'color') return undefined
  const css = printCssForLeaf(leaf) ?? digitalCssForLeaf(leaf)
  if (!css || !isCssHexOrRgb(css)) return undefined
  return css.trim()
}

/** Paper from pack color — reject dark digital UI backgrounds. */
export function brandLeafToMagPaper(leaf: PackLeafInput): string | undefined {
  return sanitizeMagPaper(brandLeafToMagColor(leaf))
}

/**
 * Resolve Mag colors for PDF export.
 * Live local pack → overrides; empty / fixture → DS magColors.
 */
export function magColorsFromBrandPack(
  pack: BrandTokenPackResponse | null | undefined,
): MagazineColors {
  if (!pack || !isUsableTokenPack(pack)) return magColors

  const overrides: MagazineColorOverrides = {}
  const assigned = new Set<MagScalarKey>()

  for (const tok of pack.tokens) {
    if (!tok.path || tok.type !== 'color') continue
    const targets = PACK_PATH_TO_MAG_COLOR[tok.path]
    if (!targets) continue
    const keys = Array.isArray(targets) ? targets : [targets]
    const isPaperOnly = keys.length === 1 && keys[0] === 'paper'
    const color = isPaperOnly ? brandLeafToMagPaper(tok) : brandLeafToMagColor(tok)
    if (!color) continue
    for (const key of keys) {
      if (assigned.has(key)) continue
      if (key === 'paper') {
        const paper = sanitizeMagPaper(color)
        if (!paper) continue
        overrides.paper = paper
        assigned.add(key)
        continue
      }
      overrides[key] = color
      assigned.add(key)
    }
  }

  if (Object.keys(overrides).length === 0) return magColors

  const merged = mergeMagazineColors(overrides)
  // Keep donut accent slot in sync when brand accent wins.
  if (overrides.accent && merged.donut.length > 1) {
    const donut = [...merged.donut]
    donut[1] = overrides.accent
    return { ...merged, donut }
  }
  return merged
}
