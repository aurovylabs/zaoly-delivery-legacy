/**
 * Catalog status for Token Studio cards (origin kind + unresolved compose).
 * Spec: specs/domain/zaoly-token-studio.md
 */
import { isStudioScalarType, readDigitalScalar } from '../inspect/digital-edit'
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import type { TokenOrigin } from './pack-merge'
import {
  looksLikeTokenExpr,
  resolveTokenExpr,
  type ResolveTokenCss,
} from './token-expr'

export type CatalogOriginKind = 'fixture' | 'override' | 'custom'

/** Exclusive catalog status filter (toolbar chips). */
export type CatalogStatusFilter = 'all' | 'unresolved' | 'override' | 'custom'

export type CatalogLeafStatus = {
  origin: TokenOrigin
  kind: CatalogOriginKind
  unresolved: boolean
}

export type CatalogStatusCounts = {
  unresolved: number
  override: number
  custom: number
}

/** Fixture path set from the inspect catalog (not local-only customs). */
export function fixturePathSet(fixtureLeaves: ZaolyPackLeaf[]): Set<string> {
  const set = new Set<string>()
  for (const leaf of fixtureLeaves) {
    if (leaf.path?.trim()) set.add(leaf.path)
  }
  return set
}

export function catalogOriginKind(
  origin: TokenOrigin,
  tokenPath: string,
  fixturePaths: Set<string>,
): CatalogOriginKind {
  if (origin !== 'local') return 'fixture'
  return fixturePaths.has(tokenPath) ? 'override' : 'custom'
}

/** True when a scalar digital expression cannot resolve against the pack. */
export function isUnresolvedComposeLeaf(
  leaf: ZaolyPackLeaf,
  resolveCss: ResolveTokenCss,
): boolean {
  if (!isStudioScalarType(leaf.type)) return false
  const raw = readDigitalScalar(leaf.type, leaf.value)
  if (!raw || !looksLikeTokenExpr(raw)) return false
  return resolveTokenExpr(raw, resolveCss) == null
}

export function catalogLeafStatus(
  leaf: ZaolyPackLeaf,
  origin: TokenOrigin,
  fixturePaths: Set<string>,
  resolveCss: ResolveTokenCss,
): CatalogLeafStatus {
  return {
    origin,
    kind: catalogOriginKind(origin, leaf.path, fixturePaths),
    unresolved: isUnresolvedComposeLeaf(leaf, resolveCss),
  }
}

/** Fixture catalog leaf for a path (null when the path is custom-only). */
export function fixtureBaselineForPath(
  tokenPath: string,
  fixtureLeaves: ZaolyPackLeaf[],
): ZaolyPackLeaf | null {
  const path = tokenPath.trim()
  if (!path) return null
  return fixtureLeaves.find((leaf) => leaf.path === path) ?? null
}

export function matchesCatalogStatusFilter(
  status: CatalogLeafStatus,
  filter: CatalogStatusFilter,
): boolean {
  if (filter === 'all') return true
  if (filter === 'unresolved') return status.unresolved
  if (filter === 'override') return status.kind === 'override'
  return status.kind === 'custom'
}

export function countCatalogStatuses(
  leaves: ZaolyPackLeaf[],
  origins: Record<string, TokenOrigin>,
  fixturePaths: Set<string>,
  resolveCss: ResolveTokenCss,
): CatalogStatusCounts {
  const counts: CatalogStatusCounts = { unresolved: 0, override: 0, custom: 0 }
  for (const leaf of leaves) {
    const status = catalogLeafStatus(
      leaf,
      origins[leaf.path] ?? 'fixture',
      fixturePaths,
      resolveCss,
    )
    if (status.unresolved) counts.unresolved += 1
    if (status.kind === 'override') counts.override += 1
    if (status.kind === 'custom') counts.custom += 1
  }
  return counts
}
