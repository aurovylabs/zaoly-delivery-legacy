import {
  DENIED_PROP_KEYS,
  isAllowedSiteKitProp,
  SITE_KIT_PAINT_PROP_KEYS,
} from './contracts'
import {
  EXPORT_IDENTIFIER_RE,
  MAX_IDENTIFIER_LEN,
  normalizeExportIdentifier,
  storyExportName,
} from './identifiers'
import type {
  CompositionNamedVariant,
  SiteKitCatalogEntry,
  SiteKitCompositionNode,
} from './types'

export { storyExportName } from './identifiers'

const COMPOSITION_NAME_RE = /^[A-Z][A-Za-z0-9]*$/
export const MAX_TREE_DEPTH = 64
export const MAX_TREE_NODES = 500

export function buildTypeToExport(
  catalog: readonly SiteKitCatalogEntry[],
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of catalog) map[entry.id] = entry.exportName
  return map
}

export function findCatalogEntry(
  catalog: readonly SiteKitCatalogEntry[],
  componentId: string,
): SiteKitCatalogEntry | undefined {
  return catalog.find((e) => e.id === componentId)
}

/** Max override id length (API + disk filename). */
export const MAX_COMPOSITION_COMPONENT_ID_LEN = 80

/** Hex length of Collection fingerprint inside namespaced override ids. */
export const COMPOSITION_SCOPE_KEY_LEN = 16

/**
 * Stable Collection fingerprint for override ids (browser-safe FNV-1a 64-bit).
 * Spec: site-kit-collection-scope.md SK-S2 — `Composition~{scopeKey}~{ExportName}`.
 */
export function compositionScopeKey(platformProjectId: string): string {
  const s = platformProjectId.trim()
  let h = 0xcbf29ce484222325n
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i))
    h = BigInt.asUintN(64, h * 0x100000001b3n)
  }
  return h.toString(16).padStart(COMPOSITION_SCOPE_KEY_LEN, '0')
}

const LEGACY_COMPOSITION_ID_RE = /^Composition[A-Z][A-Za-z0-9]*$/
const NAMESPACED_COMPOSITION_ID_RE = /^Composition~[a-f0-9]{16}~[A-Z][A-Za-z0-9]*$/

export function isLegacyCompositionOverrideId(componentId: string): boolean {
  return LEGACY_COMPOSITION_ID_RE.test(componentId)
}

export function isNamespacedCompositionOverrideId(componentId: string): boolean {
  return NAMESPACED_COMPOSITION_ID_RE.test(componentId)
}

export function isCompositionOverrideId(componentId: string): boolean {
  return (
    isLegacyCompositionOverrideId(componentId) ||
    isNamespacedCompositionOverrideId(componentId)
  )
}

export type ParsedCompositionComponentId = {
  exportName: string
  /** Null for legacy `Composition{Name}`. */
  scopeKey: string | null
  legacy: boolean
}

export function parseCompositionComponentId(
  componentId: string,
): ParsedCompositionComponentId | null {
  const id = componentId.trim()
  if (isNamespacedCompositionOverrideId(id)) {
    const parts = id.split('~')
    if (parts.length !== 3) return null
    return {
      exportName: parts[2]!,
      scopeKey: parts[1]!,
      legacy: false,
    }
  }
  if (isLegacyCompositionOverrideId(id)) {
    return {
      exportName: id.slice('Composition'.length),
      scopeKey: null,
      legacy: true,
    }
  }
  return null
}

/**
 * Pattern override id.
 * - Bound Collection → `Composition~{scopeKey}~{ExportName}` (SK-S2)
 * - Unscoped / legacy → `Composition{ExportName}`
 */
export function compositionComponentId(
  exportName: string,
  platformProjectId?: string | null,
): string {
  const name = exportName.trim()
  const pid = platformProjectId?.trim()
  if (pid) {
    return `Composition~${compositionScopeKey(pid)}~${name}`
  }
  return `Composition${name}`
}

/** Catalog / list merge key — unique per Collection + export name. */
export function compositionCatalogKey(
  platformProjectId: string | null | undefined,
  exportName: string,
): string {
  return `${platformProjectId?.trim() || ''}::${exportName.trim()}`
}

export function compositionMasterSourceKey(exportName: string): string {
  return `Composition:${exportName}`
}

/** SK-S4 Collection atom fork: `Atom~{scopeKey}~{SiteType}` (seed remains bare `SiteButton`). */
const NAMESPACED_ATOM_ID_RE = /^Atom~[a-f0-9]{16}~Site[A-Z][A-Za-z0-9]*$/

export function isNamespacedAtomOverrideId(componentId: string): boolean {
  return NAMESPACED_ATOM_ID_RE.test(componentId.trim())
}

export type ParsedAtomOverrideId = {
  atomType: string
  scopeKey: string
}

export function parseAtomOverrideId(componentId: string): ParsedAtomOverrideId | null {
  const id = componentId.trim()
  if (!isNamespacedAtomOverrideId(id)) return null
  const parts = id.split('~')
  if (parts.length !== 3) return null
  return { scopeKey: parts[1]!, atomType: parts[2]! }
}

/** Collection-scoped atom override id (does not mutate global seed). */
export function atomForkComponentId(
  atomType: string,
  platformProjectId: string,
): string {
  const type = atomType.trim()
  const pid = platformProjectId.trim()
  return `Atom~${compositionScopeKey(pid)}~${type}`
}

/** Catalog atom type for seed or fork override ids. */
export function atomBaseTypeFromOverrideId(componentId: string): string | null {
  const id = componentId.trim()
  const fork = parseAtomOverrideId(id)
  if (fork) return fork.atomType
  if (/^Site[A-Z][A-Za-z0-9]*$/.test(id)) return id
  return null
}

/** Designer-friendly input → React composition export id (stricter than story ids). */
export function normalizeCompositionName(raw: string): string {
  const exportName = normalizeExportIdentifier(raw, '')
  if (!exportName || !COMPOSITION_NAME_RE.test(exportName)) return ''
  return exportName.slice(0, MAX_IDENTIFIER_LEN)
}

export function buildReservedExportNames(
  catalog: readonly SiteKitCatalogEntry[],
): Set<string> {
  return new Set(
    catalog.map((e) => e.exportName).concat(['CompositionPreview', 'SITE_KIT_CATALOG', 'Live']),
  )
}

export function validateCompositionName(
  raw: string,
  catalog: readonly SiteKitCatalogEntry[],
): { ok: true; exportName: string } | { ok: false; code: string; error: string } {
  const exportName = normalizeCompositionName(raw)
  if (!exportName || !COMPOSITION_NAME_RE.test(exportName)) {
    return {
      ok: false,
      code: 'invalid-name',
      error:
        'Name needs letters or numbers (e.g. test → Test, 3col → Col3, my hero → MyHero)',
    }
  }
  if (buildReservedExportNames(catalog).has(exportName)) {
    return {
      ok: false,
      code: 'reserved-name',
      error: `Name collides with atom export: ${exportName}`,
    }
  }
  return { ok: true, exportName }
}

export function compositionVariantStoryName(
  variantName: string,
  exportName: string,
): string {
  const base = storyExportName(variantName)
  if (base === exportName) return `${base}Variant`
  return base
}

function isAllowedPropValue(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true
  }
  if (Array.isArray(value)) {
    return value.every(
      (item) =>
        item === null ||
        typeof item === 'string' ||
        typeof item === 'number' ||
        typeof item === 'boolean',
    )
  }
  return false
}

function validateNodeProps(
  type: string,
  props: Record<string, unknown> | undefined,
): string | null {
  if (!props) return null
  if (typeof props !== 'object' || Array.isArray(props)) {
    return 'props must be an object'
  }
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      if (
        value != null &&
        typeof value !== 'string' &&
        typeof value !== 'number' &&
        !Array.isArray(value)
      ) {
        return `invalid children prop on ${type}`
      }
      continue
    }
    if (DENIED_PROP_KEYS.has(key)) {
      return `rejected prop key: ${key}`
    }
    if (SITE_KIT_PAINT_PROP_KEYS.has(key)) {
      return `paint key belongs in style, not props: ${key}`
    }
    if (!isAllowedSiteKitProp(type, key)) {
      return `unknown prop for ${type}: ${key}`
    }
    if (!isAllowedPropValue(value)) {
      return `invalid prop value for ${type}.${key}`
    }
  }
  return null
}

function validateNodeStyle(
  style: Record<string, string | number> | undefined,
): string | null {
  if (!style) return null
  if (typeof style !== 'object' || Array.isArray(style)) {
    return 'style must be an object'
  }
  for (const value of Object.values(style)) {
    if (typeof value !== 'string' && typeof value !== 'number') {
      return 'style values must be string or number'
    }
  }
  return null
}

type TreeLimitResult =
  | { ok: true; count: number }
  | { ok: false; reason: 'depth' | 'nodes'; count: number }

function measureTreeLimits(root: SiteKitCompositionNode): TreeLimitResult {
  let count = 0
  let depthExceeded = false
  let nodesExceeded = false

  const walk = (node: SiteKitCompositionNode, depth: number): void => {
    count += 1
    if (count > MAX_TREE_NODES) nodesExceeded = true
    if (depth > MAX_TREE_DEPTH) depthExceeded = true
    if (nodesExceeded || depthExceeded) return
    for (const child of node.children ?? []) walk(child, depth + 1)
  }

  walk(root, 1)
  if (nodesExceeded) return { ok: false, reason: 'nodes', count }
  if (depthExceeded) return { ok: false, reason: 'depth', count }
  return { ok: true, count }
}

function walkTree(
  root: SiteKitCompositionNode,
  catalog: readonly SiteKitCatalogEntry[],
  visit: (node: SiteKitCompositionNode) => string | null,
): string | null {
  const err = visit(root)
  if (err) return err
  for (const child of root.children ?? []) {
    const childErr = walkTree(child, catalog, visit)
    if (childErr) return childErr
  }
  return null
}

export function validateCompositionTree(
  root: SiteKitCompositionNode,
  catalog: readonly SiteKitCatalogEntry[],
): { ok: true } | { ok: false; code: string; error: string } {
  if (!root || typeof root !== 'object' || typeof root.type !== 'string') {
    return { ok: false, code: 'invalid-tree', error: 'root.type required' }
  }

  const limits = measureTreeLimits(root)
  if (!limits.ok) {
    if (limits.reason === 'nodes') {
      return {
        ok: false,
        code: 'invalid-tree',
        error: `Composition exceeds ${MAX_TREE_NODES} nodes`,
      }
    }
    return {
      ok: false,
      code: 'invalid-tree',
      error: `Composition exceeds max depth ${MAX_TREE_DEPTH}`,
    }
  }

  const treeError = walkTree(root, catalog, (node) => {
    if (node.type === 'Instance') {
      return 'Unresolved Instance nodes in tree — expand nested Masters before save'
    }
    if (!findCatalogEntry(catalog, node.type)) {
      return `Unknown or non–Site-Kit type: ${node.type}`
    }
    const propsErr = validateNodeProps(node.type, node.props)
    if (propsErr) return propsErr
    const styleErr = validateNodeStyle(node.style)
    if (styleErr) return styleErr
    return null
  })

  if (treeError?.includes('Instance')) {
    return { ok: false, code: 'invalid-tree', error: treeError }
  }
  if (treeError) {
    return { ok: false, code: 'invalid-tree', error: treeError }
  }
  return { ok: true }
}

export function validateNamedCompositionVariants(
  variants: CompositionNamedVariant[],
  exportName: string,
): { ok: true } | { ok: false; code: string; error: string } {
  if (variants.length < 2) {
    return {
      ok: false,
      code: 'invalid-variants',
      error: 'At least two named variants required',
    }
  }
  const storyNames = new Set<string>()
  for (const v of variants) {
    const storyName = compositionVariantStoryName(v.name, exportName)
    if (!EXPORT_IDENTIFIER_RE.test(storyName)) {
      return {
        ok: false,
        code: 'invalid-variant-name',
        error: `Variant name normalizes to invalid export: ${storyName}`,
      }
    }
    if (storyNames.has(storyName)) {
      return {
        ok: false,
        code: 'duplicate-variant-name',
        error: `Duplicate variant story name: ${storyName}`,
      }
    }
    storyNames.add(storyName)
  }
  return { ok: true }
}
