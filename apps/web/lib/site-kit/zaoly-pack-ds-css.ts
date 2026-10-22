/**
 * Local pack `:root` CSS for Kit Handoff / Storyblok preview.
 * Emits Site Kit `--ds-*` (module grammar) and Zaoly `--zaoly-*` aliases.
 * Spec: `zaoly-token-studio.md` · `zaoly-starter-token-pack.md` (theme-aware emit)
 * Knowledge: `knowledge/upstream-pack-out-of-scope-for-zaoly.md`
 */
import { tokenPathToCssVar } from '@zaoly/site-kit/composition-codegen'
import { digitalCssForLeaf } from '../inspect/digital-css'
import type { InspectTokenOption } from '../inspect/token-catalog'
import {
  starterPackLeavesForTheme,
  type StarterPackTheme,
  ZAOLY_STARTER_DARK_COLOR_OVERRIDES,
  ZAOLY_STARTER_PACK_LEAVES,
} from '../tokens/zaoly-starter-pack'
import { pathToZaolyCssVar } from '../tokens/token-expr'

/** Minimal tree shape — avoids dual SiteKitCompositionNode type imports. */
export type TokenBindingTree = {
  tokenBindings?: Record<string, string>
  children?: TokenBindingTree[]
}

export type TokenPackCssOptions = {
  onlyPaths?: readonly string[]
  /** When `dark`, swap digital color values still at light starter defaults. */
  theme?: StarterPackTheme
}

/** Collect unique pack paths from a composition tree's tokenBindings. */
export function collectCompositionBindingPaths(
  node: TokenBindingTree | null | undefined,
): string[] {
  if (!node) return []
  const into = new Set<string>()
  const walk = (n: TokenBindingTree) => {
    if (n.tokenBindings) {
      for (const path of Object.values(n.tokenBindings)) {
        const trimmed = typeof path === 'string' ? path.trim() : ''
        if (trimmed) into.add(trimmed)
      }
    }
    for (const child of n.children ?? []) walk(child)
  }
  walk(node)
  return [...into].sort()
}

function digitalHexFromLeafValue(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined
  const digital = (value as { digital?: unknown }).digital
  if (!digital || typeof digital !== 'object') return undefined
  const hex = (digital as { hex?: unknown }).hex
  return typeof hex === 'string' && hex.trim() ? hex.trim().toLowerCase() : undefined
}

function lightStarterDigitalCss(path: string, type: string): string | undefined {
  const leaf = ZAOLY_STARTER_PACK_LEAVES.find((l) => l.path === path)
  if (!leaf) return undefined
  return digitalCssForLeaf({
    path,
    type: leaf.type || type,
    value: leaf.value,
    status: 'active',
  })?.trim()
}

/**
 * Resolve digital CSS for emit. Dark theme swaps starter color roles that are
 * still at light seed values; live-pack / designer overrides win.
 */
export function resolvePackEmitDigitalCss(
  opt: InspectTokenOption,
  theme: StarterPackTheme = 'light',
): string {
  const path = opt.path?.trim() ?? ''
  let value = ''
  if (opt.value != null && opt.type) {
    value =
      digitalCssForLeaf({
        path,
        type: opt.type,
        value: opt.value,
        status: opt.status ?? 'active',
      })?.trim() ?? ''
  }
  if (!value && typeof opt.preview === 'string') {
    const preview = opt.preview.trim()
    if (preview && !preview.startsWith('{') && !preview.startsWith('[')) {
      value = preview
    }
  }
  if (!value || theme !== 'dark' || !path) return value
  if (!(path in ZAOLY_STARTER_DARK_COLOR_OVERRIDES)) return value

  const lightCss = lightStarterDigitalCss(path, opt.type ?? 'color')
  const normalized = value.trim().toLowerCase()
  const lightNorm = lightCss?.trim().toLowerCase()
  const lightHex = digitalHexFromLeafValue(
    ZAOLY_STARTER_PACK_LEAVES.find((l) => l.path === path)?.value,
  )
  const stillStarter =
    (lightNorm && normalized === lightNorm) || (lightHex && normalized === lightHex)
  if (!stillStarter) return value

  const darkLeaf = starterPackLeavesForTheme('dark').find((l) => l.path === path)
  if (!darkLeaf) return value
  return (
    digitalCssForLeaf({
      path,
      type: darkLeaf.type,
      value: darkLeaf.value,
      status: 'active',
    })?.trim() ?? value
  )
}

/**
 * Emit digital-channel CSS custom properties for the local pack.
 * When `onlyPaths` is non-empty, only those paths (present in catalog) are emitted.
 */
export function buildTokenPackRootCss(
  catalog: readonly InspectTokenOption[],
  options?: TokenPackCssOptions,
): string {
  const byPath = new Map<string, InspectTokenOption>()
  for (const opt of catalog) {
    if (opt.path?.trim()) byPath.set(opt.path.trim(), opt)
  }

  const only = (options?.onlyPaths ?? [])
    .map((p) => p.trim())
    .filter(Boolean)
  const paths = (only.length > 0 ? only : [...byPath.keys()]).sort()
  const theme = options?.theme ?? 'light'

  const lines: string[] = []
  for (const path of paths) {
    const opt = byPath.get(path)
    if (!opt) continue
    const value = resolvePackEmitDigitalCss(opt, theme)
    if (!value) continue
    // Site Kit module grammar + Zaoly local pack prefix (same values).
    lines.push(`  ${tokenPathToCssVar(path)}: ${value};`)
    lines.push(`  ${pathToZaolyCssVar(path)}: ${value};`)
  }

  if (lines.length === 0) return ''
  const themeNote = theme === 'dark' ? ' (dark)' : ''
  return `/* Zaoly local pack digital channel${themeNote} — Site Kit --ds-* + --zaoly-* */\n:root {\n${lines.join('\n')}\n}\n`
}

/** Same as `buildTokenPackRootCss` — Zaoly product naming. */
export const buildZaolyPackRootCss = buildTokenPackRootCss

/** Map a resolved app theme id (`zaoly` / `zaoly-dark`) onto the pack emit theme. */
export function starterPackThemeFromResolvedId(resolved: string): StarterPackTheme {
  return resolved === 'zaoly-dark' ? 'dark' : 'light'
}

/** Prefer composition bindings; fall back to full catalog digital leaves. */
export function tokenPackCssForHandoff(
  catalog: readonly InspectTokenOption[],
  composition: TokenBindingTree | null | undefined,
  options?: { theme?: StarterPackTheme },
): string {
  const used = collectCompositionBindingPaths(composition)
  const theme = options?.theme
  if (used.length > 0) {
    const scoped = buildTokenPackRootCss(catalog, { onlyPaths: used, theme })
    if (scoped) return scoped
  }
  return buildTokenPackRootCss(catalog, { theme })
}
