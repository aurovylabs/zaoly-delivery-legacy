/**
 * Fixture token catalog — Zaoly pack path vocabulary + digital value JSON.
 * Live overlay: local pack (`GET /api/tokens`). Do not invent `space.md` / `color.ink`.
 */

import type { SceneStateId, SceneStateOverride } from '@zaoly/contracts'
import {
  asPackLeafInput,
  cssForLeafChannel,
  digitalCssForLeaf,
  type PackLeafInput,
  type TokenChannel,
  type TypographyFacet,
} from './digital-css'
import { buildStarterInspectCatalog } from '../tokens/zaoly-starter-pack'

export type { TokenChannel }

export type { TypographyFacet }

export type TokenGroupId =
  | 'color'
  | 'space'
  | 'radius'
  | 'opacity'
  | 'fontSize'
  | 'fontWeight'
  | 'fontFamily'
  | 'lineHeight'
  | 'letterSpacing'
  | 'shadow'
  | 'glow'
  | 'effect'
  | 'motion'
  | 'size'
  | 'blur'
  | 'rotate'
  | 'gradient'

export type InspectTokenOption = {
  path: string
  group: TokenGroupId
  label: string
  /** CSS preview for TokenPicker swatch / fallback when `value` is absent */
  preview: string
  /** Typography role leaves: one path, facet CSS per inspect field (CT-11). */
  previewFacets?: Partial<Record<TypographyFacet, string>>
  /** Pack leaf type when this row is a catalog leaf. */
  type?: string
  /** Pack `value` JSON (object). Canvas prefers this over `preview`. */
  value?: unknown
  status?: 'active' | 'pending'
}

const TYPE_GROUPS = new Set<TokenGroupId>([
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
])

const BINDING_FACET: Partial<Record<string, TypographyFacet>> = {
  fontFamily: 'family',
  fontSize: 'size',
  fontWeight: 'weight',
  lineHeight: 'lineHeight',
  letterSpacing: 'letterSpacing',
}

/** Inspect group → pack path prefix. */
export function pathPrefixForGroup(group: TokenGroupId): string {
  if (group === 'space') return 'spacing.'
  if (TYPE_GROUPS.has(group)) return 'typography.'
  return `${group}.`
}

function compactFacets(
  leaf: PackLeafInput,
): Partial<Record<TypographyFacet, string>> | undefined {
  const facets: Partial<Record<TypographyFacet, string>> = {}
  for (const facet of ['family', 'size', 'weight', 'lineHeight', 'letterSpacing'] as const) {
    const css = digitalCssForLeaf(leaf, facet)
    if (css) facets[facet] = css
  }
  return Object.keys(facets).length ? facets : undefined
}

function packCatalogToken(
  path: string,
  group: TokenGroupId,
  type: string,
  value: unknown,
): InspectTokenOption {
  const leaf: PackLeafInput = { path, type, value, status: 'active' }
  const facet = TYPE_GROUPS.has(group) ? 'family' : undefined
  const preview = digitalCssForLeaf(leaf, facet) ?? ''
  return {
    path,
    group,
    label: path,
    preview,
    previewFacets: type === 'typography' ? compactFacets(leaf) : undefined,
    type,
    value,
    status: 'active',
  }
}

const LOCAL_ONLY_GROUPS = new Set<TokenGroupId>(['blur', 'rotate', 'gradient'])

/** Inspect group for a pack leaf. Unmapped types omitted from picker. */
export function groupForPackLeaf(type: string, path: string): TokenGroupId | null {
  if (type === 'color' || path.startsWith('color.')) return 'color'
  if (type === 'spacing' || path.startsWith('spacing.')) return 'space'
  if (type === 'radius' || path.startsWith('radius.')) return 'radius'
  if (type === 'opacity' || path.startsWith('opacity.')) return 'opacity'
  if (type === 'shadow' || path.startsWith('shadow.')) return 'shadow'
  if (type === 'glow' || path.startsWith('glow.')) return 'glow'
  if (type === 'effect' || path.startsWith('effect.')) return 'effect'
  if (type === 'motion' || path.startsWith('motion.')) return 'motion'
  if (type === 'size' || path.startsWith('size.')) return 'size'
  if (type === 'typography' || path.startsWith('typography.')) return 'fontFamily'
  return null
}

export type ZaolyPackLeaf = {
  path: string
  type: string
  value: string
  status?: string
}

/** Editor / hub pack body. Client-safe. */
export type BrandTokenPackResponse = {
  source: 'local' | 'fixture'
  guidelineId: string | null
  platformProjectId: string
  tokens: ZaolyPackLeaf[]
  canWrite?: boolean
  origins?: Record<string, string>
  /** Legacy CREATION session overlay — unused on Zaoly product surfaces. */
  localPromotePreview?: boolean
}

export function editorPackFromLocalApi(body: {
  tokens?: ZaolyPackLeaf[]
  origins?: Record<string, string>
  canWrite?: boolean
}): BrandTokenPackResponse {
  return {
    source: 'local',
    guidelineId: null,
    platformProjectId: '',
    tokens: body.tokens ?? [],
    canWrite: body.canWrite === true,
    origins: body.origins,
  }
}

/** Map a live pack leaf to an inspect option. Pending → null. */
export function inspectOptionFromLeaf(leaf: ZaolyPackLeaf): InspectTokenOption | null {
  if (!leaf.path?.trim()) return null
  if (leaf.status && leaf.status !== 'active') return null
  const group = groupForPackLeaf(leaf.type, leaf.path)
  if (!group) return null
  let value: unknown = leaf.value
  if (typeof leaf.value === 'string') {
    const trimmed = leaf.value.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        value = JSON.parse(trimmed) as unknown
      } catch {
        value = leaf.value
      }
    }
  }
  return packCatalogToken(leaf.path, group, leaf.type, value)
}

/**
 * Overlay active live leaves onto the fixture catalog (CT-3 / CT-4).
 * Blur/rotate/gradient stay fixture-local. Pending omitted.
 */
export function mergeLivePackIntoCatalog(
  leaves: ZaolyPackLeaf[],
  base: InspectTokenOption[] = INSPECT_TOKEN_CATALOG,
): InspectTokenOption[] {
  const live = leaves
    .map(inspectOptionFromLeaf)
    .filter((row): row is InspectTokenOption => row != null)
  const liveByPath = new Map(live.map((row) => [row.path, row]))
  const merged: InspectTokenOption[] = []
  const seen = new Set<string>()
  for (const row of base) {
    if (LOCAL_ONLY_GROUPS.has(row.group)) {
      merged.push(row)
      seen.add(row.path)
      continue
    }
    merged.push(liveByPath.get(row.path) ?? row)
    seen.add(row.path)
  }
  for (const row of live) {
    if (!seen.has(row.path)) merged.push(row)
  }
  return merged
}

export const INSPECT_TOKEN_CATALOG: InspectTokenOption[] = [
  ...buildStarterInspectCatalog(packCatalogToken),

  { path: 'blur.none', group: 'blur', label: 'blur.none', preview: 'none' },
  { path: 'blur.sm', group: 'blur', label: 'blur.sm', preview: 'blur(4px)' },
  { path: 'blur.md', group: 'blur', label: 'blur.md', preview: 'blur(8px)' },
  { path: 'blur.lg', group: 'blur', label: 'blur.lg', preview: 'blur(16px)' },

  { path: 'rotate.none', group: 'rotate', label: 'rotate.none', preview: 'none' },
  { path: 'rotate.15', group: 'rotate', label: 'rotate.15', preview: 'rotate(15deg)' },
  { path: 'rotate.45', group: 'rotate', label: 'rotate.45', preview: 'rotate(45deg)' },
  { path: 'rotate.90', group: 'rotate', label: 'rotate.90', preview: 'rotate(90deg)' },
  { path: 'rotate.180', group: 'rotate', label: 'rotate.180', preview: 'rotate(180deg)' },

  {
    path: 'gradient.fade-paper',
    group: 'gradient',
    label: 'gradient.fade-paper',
    preview: 'linear-gradient(180deg, #ffffff 0%, transparent 100%)',
  },
  {
    path: 'gradient.accent',
    group: 'gradient',
    label: 'gradient.accent',
    preview: 'linear-gradient(135deg, #1f44ff 0%, #c6f24a 100%)',
  },
]

export function tokensForGroup(
  group: TokenGroupId,
  catalog: InspectTokenOption[] = INSPECT_TOKEN_CATALOG,
): InspectTokenOption[] {
  const prefix = pathPrefixForGroup(group)
  return catalog.filter((t) => t.path.startsWith(prefix) && t.status !== 'pending')
}

export function tokenByPath(
  path: string,
  catalog: InspectTokenOption[] = INSPECT_TOKEN_CATALOG,
): InspectTokenOption | undefined {
  return catalog.find((t) => t.path === path)
}

/** CSS string for a bound inspect field; skip when a typography facet is missing. */
export function previewForBinding(
  tok: InspectTokenOption,
  bindingKey: string,
  channel: TokenChannel = 'digital',
): string | undefined {
  if (tok.status === 'pending') return undefined
  const facet = BINDING_FACET[bindingKey]
  const leaf = asPackLeafInput(tok)
  if (leaf) {
    return cssForLeafChannel(leaf, facet, channel)
  }
  if (channel === 'print') return undefined
  if (facet) return tok.previewFacets?.[facet]
  return tok.preview
}

/** Short inspect label (leaf; title-case for family / weight / color). */
export function tokenDisplayLabel(tok: InspectTokenOption): string {
  const parts = tok.path.split('.')
  let leaf = parts.pop() ?? tok.path
  // `typography.body.family` → Body (not "Family")
  if (leaf === 'family' && parts.length) {
    leaf = parts[parts.length - 1] ?? leaf
  }
  if (tok.group === 'fontFamily' || tok.group === 'fontWeight' || tok.group === 'color') {
    return leaf.charAt(0).toUpperCase() + leaf.slice(1)
  }
  return leaf
}

/**
 * TokenPicker option / bound-strip label for a field.
 * Typography: lead with resolved facet (font name, size, weight, line-height).
 */
export function tokenPickerOptionLabel(
  tok: InspectTokenOption,
  bindingKey: string,
  facetPreview?: string,
): string {
  const preview = facetPreview ?? previewForBinding(tok, bindingKey)
  const role = tokenDisplayLabel(tok)
  if (!preview) return role
  if (TYPE_GROUPS.has(tok.group) || BINDING_FACET[bindingKey]) {
    return preview === role ? preview : `${preview} · ${role}`
  }
  return role
}

export const DEFAULT_BODY_TYPE_BINDINGS: Record<string, string> = {
  fontFamily: 'typography.body.family',
  fontSize: 'typography.body.family',
  fontWeight: 'typography.body.family',
  lineHeight: 'typography.body.family',
  color: 'color.ink',
}

export const DEFAULT_HEADLINE_TYPE_BINDINGS: Record<string, string> = {
  fontFamily: 'typography.heading.h1',
  fontSize: 'typography.heading.h1',
  fontWeight: 'typography.heading.h1',
  lineHeight: 'typography.heading.h1',
  letterSpacing: 'typography.heading.h1',
  color: 'color.ink',
}

/** Site Kit palette defaults — complete starter pack roles. */
export const DEFAULT_SITE_BUTTON_BINDINGS: Record<string, string> = {
  fontFamily: 'typography.label',
  fontSize: 'typography.label',
  fontWeight: 'typography.label',
  lineHeight: 'typography.label',
  background: 'color.action.primary',
  color: 'color.action.primaryForeground',
  radius: 'radius.control.md',
  padding: 'spacing.padding.control',
}

export const DEFAULT_SITE_TEXT_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.ink',
}

export const DEFAULT_SITE_LINK_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.action.link',
}

export const DEFAULT_SITE_FIELD_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  background: 'color.surface.field',
  borderColor: 'color.line',
  radius: 'radius.control.sm',
  color: 'color.ink',
  padding: 'spacing.padding.md',
}

export const DEFAULT_SITE_LAYOUT_BINDINGS: Record<string, string> = {
  gap: 'spacing.gap.modules',
  background: 'color.surface.canvas',
  padding: 'spacing.padding.md',
  radius: 'radius.surface',
  borderColor: 'color.line',
}

export const DEFAULT_SITE_BADGE_BINDINGS: Record<string, string> = {
  fontFamily: 'typography.label.sm',
  fontSize: 'typography.label.sm',
  fontWeight: 'typography.label.sm',
  lineHeight: 'typography.label.sm',
  background: 'color.action.accent',
  color: 'color.action.accentForeground',
  radius: 'radius.control.sm',
  padding: 'spacing.padding.xs',
}

export const DEFAULT_SITE_CHECKBOX_BINDINGS: Record<string, string> = {
  ...DEFAULT_BODY_TYPE_BINDINGS,
  color: 'color.action.primary',
  borderColor: 'color.line',
}

export const DEFAULT_SITE_DIVIDER_BINDINGS: Record<string, string> = {
  borderColor: 'color.line',
  color: 'color.line',
}

/** SiteSvg — recolor via host `color` → `currentColor` fills (Phase 1). */
export const DEFAULT_SITE_SVG_BINDINGS: Record<string, string> = {
  color: 'color.ink',
}

export const DEFAULT_SITE_CHART_BINDINGS: Record<string, string> = {
  color: 'color.chart.1',
  borderColor: 'color.line',
}

export const DEFAULT_SITE_GAUGE_BINDINGS: Record<string, string> = {
  color: 'color.status.ok',
  background: 'color.surface.muted',
  borderColor: 'color.line',
}

export const DEFAULT_SITE_IMAGE_BINDINGS: Record<string, string> = {
  background: 'color.surface.muted',
  radius: 'radius.surface',
}

/** Default tokenBindings for a Site Kit palette insert type (empty if unknown). */
export function defaultSiteKitTokenBindings(type: string): Record<string, string> {
  switch (type) {
    case 'SiteButton':
      return { ...DEFAULT_SITE_BUTTON_BINDINGS }
    case 'SiteText':
      return { ...DEFAULT_SITE_TEXT_BINDINGS }
    case 'SiteLink':
      return { ...DEFAULT_SITE_LINK_BINDINGS }
    case 'SiteInput':
    case 'SiteTextarea':
    case 'SiteSelect':
      return { ...DEFAULT_SITE_FIELD_BINDINGS }
    case 'SiteStack':
    case 'SiteContainer':
    case 'SiteGrid':
    case 'SiteTable':
      return { ...DEFAULT_SITE_LAYOUT_BINDINGS }
    case 'SiteBadge':
      return { ...DEFAULT_SITE_BADGE_BINDINGS }
    case 'SiteCheckbox':
      return { ...DEFAULT_SITE_CHECKBOX_BINDINGS }
    case 'SiteDivider':
      return { ...DEFAULT_SITE_DIVIDER_BINDINGS }
    case 'SiteSvg':
    case 'SiteShape':
      return { ...DEFAULT_SITE_SVG_BINDINGS }
    case 'SiteChart':
      return { ...DEFAULT_SITE_CHART_BINDINGS }
    case 'SiteGauge':
      return { ...DEFAULT_SITE_GAUGE_BINDINGS }
    case 'SiteImage':
      return { ...DEFAULT_SITE_IMAGE_BINDINGS }
    default:
      return {}
  }
}

type InteractiveStateKey = Exclude<SceneStateId, 'default'>

/** Default interactive state overrides for Site Kit atoms (starter role paths). */
export function defaultSiteKitInteractiveStates(
  type: string,
): Partial<Record<InteractiveStateKey, SceneStateOverride>> | undefined {
  switch (type) {
    case 'SiteButton':
      return {
        hover: { tokenBindings: { background: 'color.action.primaryHover' } },
        focus: { tokenBindings: { borderColor: 'color.ring' } },
        active: { tokenBindings: { background: 'color.action.primaryActive' } },
        disabled: {
          tokenBindings: {
            background: 'color.action.primaryDisabled',
            color: 'color.action.primaryDisabledForeground',
          },
        },
      }
    case 'SiteLink':
      return {
        hover: { tokenBindings: { color: 'color.action.linkHover' } },
        focus: { tokenBindings: { color: 'color.action.linkHover' } },
        disabled: { tokenBindings: { color: 'color.inkMuted' } },
      }
    case 'SiteInput':
    case 'SiteTextarea':
    case 'SiteSelect':
      return {
        hover: { tokenBindings: { borderColor: 'color.lineStrong' } },
        focus: { tokenBindings: { borderColor: 'color.ring' } },
        disabled: {
          tokenBindings: {
            background: 'color.surface.muted',
            color: 'color.inkMuted',
          },
        },
      }
    case 'SiteCheckbox':
      return {
        hover: { tokenBindings: { borderColor: 'color.action.primaryHover' } },
        focus: { tokenBindings: { borderColor: 'color.ring' } },
        disabled: {
          tokenBindings: {
            color: 'color.inkMuted',
            borderColor: 'color.line',
          },
        },
      }
    default:
      return undefined
  }
}
