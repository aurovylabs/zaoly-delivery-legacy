/**
 * Display-only path family + compound cluster for Token Studio cards.
 * Paths stay flat (`color.action.linkHover`); groups do not rename grammar.
 * Spec: `specs/domain/zaoly-token-studio.md` · knowledge/zaoly-token-studio.md
 */

/** Longest-first facet suffixes peeled from the leaf segment for cluster keys. */
const FACET_SUFFIXES = [
  'DisabledForeground',
  'Foreground',
  'Disabled',
  'Hover',
  'Active',
  'Visited',
  'Subtle',
  'Border',
  'Offset',
  'Muted',
  'Secondary',
  'Inverse',
  'Strong',
  'Focus',
] as const

const FAMILY_SLUG_RE = /^[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*$/

function pathParts(tokenPath: string): string[] {
  return tokenPath
    .trim()
    .split('.')
    .map((p) => p.trim())
    .filter(Boolean)
}

function peelFacetBase(leafSegment: string): string {
  for (const suffix of FACET_SUFFIXES) {
    if (leafSegment.length > suffix.length && leafSegment.endsWith(suffix)) {
      return leafSegment.slice(0, -suffix.length)
    }
  }
  return leafSegment
}

/** Title-case a segment for chrome headings. */
export function formatPathGroupLabel(segment: string): string {
  const s = segment.trim()
  if (!s) return s
  if (s === 'ladder') return 'Ladder'
  if (s.includes('.')) {
    return s
      .split('.')
      .map((part) => formatPathGroupLabel(part))
      .join(' · ')
  }
  if (/^\d+$/.test(s)) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Path family within a type (2nd segment; palette ladders keep the hue name).
 * Two-segment roles peel facets so `color.inkMuted` joins `color.ink` under `ink`.
 * `color.action.primary` → `action`
 * `color.palette.cobalt.500` → `palette.cobalt`
 */
export function tokenPathFamily(tokenPath: string): string {
  const parts = pathParts(tokenPath)
  if (parts.length <= 1) return parts[0] ?? tokenPath.trim()
  if (parts[1] === 'palette' && parts.length >= 3) {
    return `palette.${parts[2]}`
  }
  if (parts.length === 2) {
    return peelFacetBase(parts[1]!)
  }
  return parts[1]!
}

/**
 * Compound cluster key: peel state/pair facets from the leaf segment.
 * `color.action.linkHover` → `link`
 * `color.action.primaryDisabledForeground` → `primary`
 * `color.palette.cobalt.500` → `ladder`
 */
export function tokenPathCluster(tokenPath: string): string {
  const parts = pathParts(tokenPath)
  const leaf = parts[parts.length - 1] ?? tokenPath.trim()
  if (/^\d+$/.test(leaf)) return 'ladder'
  return peelFacetBase(leaf)
}

/** Card title inside a family/cluster — last path segment (full path stays on test id). */
export function tokenPathCardLabel(tokenPath: string): string {
  const parts = pathParts(tokenPath)
  return parts[parts.length - 1] ?? tokenPath.trim()
}

/** Stable create-card anchor key for dock measure (`create:color:action`). */
export function createCardKey(type: string, family: string): string {
  return `create:${type}:${family}`
}

/** Prefill path when adding inside a family — trailing `.` invites the leaf segment. */
export function suggestGroupTokenPath(type: string, family: string): string {
  const t = type.trim()
  const f = family.trim()
  if (!t) return ''
  if (!f) return `${t}.`
  return `${t}.${f}.`
}

/** Normalize + validate a user-entered family slug (`action`, `palette.cobalt`). */
export function normalizeFamilySlug(raw: string): string | null {
  const slug = raw.trim().replace(/\s+/g, '')
  if (!FAMILY_SLUG_RE.test(slug)) return null
  return slug
}

export type EmptyPathFamily = {
  type: string
  family: string
}

export type PackPathClusterGroup<T> = {
  cluster: string
  label: string
  leaves: T[]
}

export type PackPathFamilyGroup<T> = {
  family: string
  label: string
  clusters: PackPathClusterGroup<T>[]
}

export type PackPathTypeGroup<T> = {
  type: string
  families: PackPathFamilyGroup<T>[]
}

/**
 * Nest leaves: type → family → cluster.
 * `typeOrder` preserves studio filter chip order when provided.
 */
export function groupLeavesByPathFamily<T extends { path: string; type: string }>(
  leaves: readonly T[],
  typeOrder?: readonly string[],
): PackPathTypeGroup<T>[] {
  const byType = new Map<string, T[]>()
  for (const leaf of leaves) {
    const list = byType.get(leaf.type) ?? []
    list.push(leaf)
    byType.set(leaf.type, list)
  }

  const types =
    typeOrder && typeOrder.length
      ? typeOrder.filter((id) => id !== 'all' && byType.has(id))
      : [...byType.keys()].sort((a, b) => a.localeCompare(b))

  return types.map((type) => {
    const typeLeaves = [...(byType.get(type) ?? [])].sort((a, b) =>
      a.path.localeCompare(b.path),
    )
    const byFamily = new Map<string, T[]>()
    for (const leaf of typeLeaves) {
      const family = tokenPathFamily(leaf.path)
      const list = byFamily.get(family) ?? []
      list.push(leaf)
      byFamily.set(family, list)
    }
    const families = [...byFamily.keys()]
      .sort((a, b) => a.localeCompare(b))
      .map((family) => {
        const familyLeaves = byFamily.get(family) ?? []
        const byCluster = new Map<string, T[]>()
        for (const leaf of familyLeaves) {
          const cluster = tokenPathCluster(leaf.path)
          const list = byCluster.get(cluster) ?? []
          list.push(leaf)
          byCluster.set(cluster, list)
        }
        const clusters = [...byCluster.keys()]
          .sort((a, b) => a.localeCompare(b))
          .map((cluster) => ({
            cluster,
            label: formatPathGroupLabel(cluster),
            leaves: (byCluster.get(cluster) ?? []).sort((a, b) => a.path.localeCompare(b.path)),
          }))
        return {
          family,
          label: formatPathGroupLabel(family),
          clusters,
        }
      })
    return { type, families }
  })
}

/**
 * Merge admin-created empty family shells into the catalog groups.
 * Existing families are left untouched; empty shells sort alphabetically with peers.
 */
export function withEmptyPathFamilies<T extends { path: string; type: string }>(
  groups: readonly PackPathTypeGroup<T>[],
  emptyFamilies: readonly EmptyPathFamily[],
  typeOrder?: readonly string[],
): PackPathTypeGroup<T>[] {
  if (!emptyFamilies.length) return [...groups]

  const byType = new Map<string, PackPathFamilyGroup<T>[]>()
  for (const group of groups) {
    byType.set(
      group.type,
      group.families.map((family) => ({
        ...family,
        clusters: family.clusters.map((cluster) => ({
          ...cluster,
          leaves: [...cluster.leaves],
        })),
      })),
    )
  }

  for (const shell of emptyFamilies) {
    const type = shell.type.trim()
    const family = shell.family.trim()
    if (!type || !family) continue
    const families = byType.get(type) ?? []
    if (families.some((f) => f.family === family)) {
      byType.set(type, families)
      continue
    }
    families.push({
      family,
      label: formatPathGroupLabel(family),
      clusters: [],
    })
    byType.set(type, families)
  }

  const types =
    typeOrder && typeOrder.length
      ? [
          ...typeOrder.filter((id) => id !== 'all' && byType.has(id)),
          ...[...byType.keys()]
            .filter((id) => !(typeOrder as readonly string[]).includes(id))
            .sort((a, b) => a.localeCompare(b)),
        ]
      : [...byType.keys()].sort((a, b) => a.localeCompare(b))

  return types.map((type) => ({
    type,
    families: [...(byType.get(type) ?? [])].sort((a, b) => a.family.localeCompare(b.family)),
  }))
}
