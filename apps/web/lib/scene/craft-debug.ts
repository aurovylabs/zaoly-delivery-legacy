/**
 * Craft debug bundle — scene stats + thin-craft flags after HTML import.
 * Spec: specs/domain/craft-debug.md
 */
import type {
  SceneCraftDebugBundle,
  SceneCraftDebugFlag,
  SceneCraftDebugSpirionMeta,
  SceneNode,
} from '@zaoly/contracts'

const LARGE_DISPLAY_PX = 48
const HEX_RE = /#(?:[0-9a-fA-F]{3,8})\b/g

function walk(node: SceneNode, visit: (n: SceneNode) => void): void {
  visit(node)
  for (const child of node.children ?? []) walk(child, visit)
}

function parseFontSizePx(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw !== 'string') return null
  const clamp = raw.match(/clamp\([^)]*?(\d+(?:\.\d+)?)px/i)
  if (clamp) return Number(clamp[1])
  const px = raw.trim().match(/^(\d+(?:\.\d+)?)px$/i)
  if (px) return Number(px[1])
  const rem = raw.trim().match(/^(\d+(?:\.\d+)?)rem$/i)
  if (rem) return Number(rem[1]) * 16
  return null
}

function collectHex(value: unknown, into: Set<string>): void {
  if (typeof value !== 'string') return
  for (const m of value.matchAll(HEX_RE)) {
    into.add(m[0]!.toLowerCase())
  }
}

export function computeSceneCraftStats(root: SceneNode): SceneCraftDebugBundle['sceneStats'] {
  let nodeCount = 0
  let siteGridCount = 0
  let siteStackCount = 0
  let maxFontSizePx: number | null = null
  const backgrounds = new Set<string>()
  const colors = new Set<string>()
  let hasLargeDisplay = false
  let hasHeroMedia = false
  let hasLooseDisplayLeading = false

  walk(root, (node) => {
    nodeCount += 1
    if (node.type === 'SiteGrid') siteGridCount += 1
    if (node.type === 'SiteStack' || node.type === 'SiteContainer') siteStackCount += 1
    if (node.type === 'SiteImage' || node.type === 'Image' || node.type === 'SiteSvg') {
      const w = typeof node.style?.width === 'number' ? node.style.width : 0
      const h = typeof node.style?.height === 'number' ? node.style.height : 0
      if (w >= 480 || h >= 320) hasHeroMedia = true
    }
    const props = node.props ?? {}
    // Full-bleed heroes often use Stack/Container backgroundImage (HTML import
    // strips absolute SiteImage overlays — see ignored-absolute-position).
    if (!hasHeroMedia && typeof props.backgroundImage === 'string') {
      const bg = props.backgroundImage
      if (/url\s*\(/i.test(bg) || /^https?:\/\//i.test(bg.trim())) {
        hasHeroMedia = true
      }
    }
    if (!hasHeroMedia && typeof props.background === 'string' && /url\s*\(/i.test(props.background)) {
      hasHeroMedia = true
    }
    collectHex(props.background, backgrounds)
    collectHex(props.color, colors)
    collectHex(props.borderColor, colors)
    const fs = parseFontSizePx(props.fontSize)
    if (fs != null) {
      maxFontSizePx = maxFontSizePx == null ? fs : Math.max(maxFontSizePx, fs)
      const role = typeof props.role === 'string' ? props.role.toLowerCase() : ''
      if ((role === 'display' || role === 'title') && fs >= LARGE_DISPLAY_PX) {
        hasLargeDisplay = true
      } else if (fs >= LARGE_DISPLAY_PX) {
        hasLargeDisplay = true
      }
      if (fs >= LARGE_DISPLAY_PX) {
        const lh = parseUnitlessLineHeight(props.lineHeight)
        // Missing or body-like leading on display → floaty wrapped lines.
        if (lh == null || lh > 1.25) hasLooseDisplayLeading = true
      }
    }
    if (typeof props.fontFamily === 'string' && props.fontFamily.trim()) {
      // counted in designSystem
    }
  })

  if (maxFontSizePx != null && maxFontSizePx >= LARGE_DISPLAY_PX) {
    hasLargeDisplay = true
  }

  return {
    nodeCount,
    siteGridCount,
    siteStackCount,
    maxFontSizePx,
    uniqueBackgrounds: [...backgrounds].slice(0, 24),
    uniqueColors: [...colors].slice(0, 24),
    hasLargeDisplay,
    hasHeroMedia,
    hasLooseDisplayLeading,
  }
}

function parseUnitlessLineHeight(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t)
  const pct = t.match(/^(\d+(?:\.\d+)?)%$/)
  if (pct) return Number(pct[1]) / 100
  return null
}

export function extractDesignSystemFromRoot(root: SceneNode): SceneCraftDebugBundle['designSystem'] {
  const colors = new Set<string>()
  const fonts = new Set<string>()
  const spacings = new Set<string>()

  walk(root, (node) => {
    const props = node.props ?? {}
    collectHex(props.background, colors)
    collectHex(props.color, colors)
    collectHex(props.borderColor, colors)
    if (typeof props.fontFamily === 'string' && props.fontFamily.trim()) {
      fonts.add(props.fontFamily.trim().slice(0, 120))
    }
    for (const key of ['gap', 'padding', 'paddingTop', 'paddingBottom', 'radius'] as const) {
      const v = props[key]
      if (typeof v === 'string' && v.trim()) spacings.add(`${key}:${v.trim()}`)
      if (typeof v === 'number' && Number.isFinite(v)) spacings.add(`${key}:${v}`)
    }
  })

  return {
    colors: [...colors].slice(0, 24),
    fonts: [...fonts].slice(0, 8),
    spacings: [...spacings].slice(0, 24),
  }
}

/** Soft flags — never block import. */
export function evaluateCraftThinFlags(
  stats: SceneCraftDebugBundle['sceneStats'],
): SceneCraftDebugFlag[] {
  const flags: SceneCraftDebugFlag[] = []
  const surfaceCount = stats.uniqueBackgrounds.length
  const thinSignals: string[] = []

  if (!stats.hasLargeDisplay && (stats.maxFontSizePx == null || stats.maxFontSizePx < LARGE_DISPLAY_PX)) {
    flags.push({
      code: 'craft-small-type',
      message: `Display/type max ${stats.maxFontSizePx ?? 0}px — expect ≥${LARGE_DISPLAY_PX}px for landing density`,
    })
    thinSignals.push('small-type')
  }
  if (stats.siteGridCount === 0 && stats.nodeCount >= 12) {
    flags.push({
      code: 'craft-no-grid',
      message: 'No SiteGrid on a multi-node page — layouts often look like thin column stacks',
    })
    thinSignals.push('no-grid')
  }
  if (surfaceCount <= 1 && stats.nodeCount >= 10) {
    flags.push({
      code: 'craft-few-surfaces',
      message: `Only ${surfaceCount} unique background(s) — page surfaces look flat/thin`,
    })
    thinSignals.push('few-surfaces')
  }
  if (!stats.hasHeroMedia && stats.nodeCount >= 8) {
    flags.push({
      code: 'craft-no-hero-media',
      message:
        'No hero media mass — use Stack backgroundImage (scrim+url, cover) or a large SiteImage; text-only heroes fail landing craft',
    })
    thinSignals.push('no-hero-media')
  }
  if (stats.hasLooseDisplayLeading) {
    flags.push({
      code: 'craft-loose-display-leading',
      message:
        'Display leading too loose (body 1.5–1.6 inherited) — set lineHeight ~1.05–1.12 and slight negative letterSpacing on ≥48px type',
    })
    thinSignals.push('loose-display-leading')
  }
  if (
    thinSignals.length >= 2 ||
    (!stats.hasLargeDisplay && !stats.hasHeroMedia && stats.nodeCount >= 10)
  ) {
    flags.push({
      code: 'craft-thin',
      message:
        'Craft looks thin: missing large type/media mass and/or varied surfaces — check Spirion page_rhythm + type scale',
    })
  }
  return flags
}

export type BuildCraftDebugInput = {
  pageId: string
  root: SceneNode
  html?: string
  importWarnings?: Array<{ code: string; message: string }>
  spirion?: SceneCraftDebugSpirionMeta
  importSourceHtmlAt?: string
}

export function buildCraftDebugBundle(input: BuildCraftDebugInput): SceneCraftDebugBundle {
  const sceneStats = computeSceneCraftStats(input.root)
  const designSystem = extractDesignSystemFromRoot(input.root)
  const craftFlags = evaluateCraftThinFlags(sceneStats)
  const html = input.html?.trim() ?? ''
  return {
    schemaVersion: '1',
    builtAt: new Date().toISOString(),
    pageId: input.pageId,
    designSystem,
    sceneStats,
    craftFlags,
    importWarnings: input.importWarnings?.length ? input.importWarnings : undefined,
    importHtmlBytes: html ? new TextEncoder().encode(html).byteLength : undefined,
    hasImportSourceHtml: Boolean(html),
    importSourceHtmlAt: input.importSourceHtmlAt,
    ...(input.spirion ? { spirion: input.spirion } : {}),
  }
}
