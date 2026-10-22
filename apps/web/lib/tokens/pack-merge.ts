/**
 * Merge Inspect fixture catalog with local Token Studio overrides.
 * Spec: specs/domain/zaoly-token-studio.md
 */
import {
  INSPECT_TOKEN_CATALOG,
  type ZaolyPackLeaf,
  type InspectTokenOption,
} from '../inspect/token-catalog'
import { defaultArtboardPresetLeaves } from './artboard-presets'
import { defaultMediaBreakpointLeaves } from './media-breakpoints'

export type TokenOrigin = 'fixture' | 'local'

export type TokenPackFile = {
  version: 1
  updatedAt: string
  leaves: Record<string, { type: string; value: string }>
}

export function emptyTokenPackFile(): TokenPackFile {
  return { version: 1, updatedAt: new Date(0).toISOString(), leaves: {} }
}

export function stringifyTokenValue(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed
    return JSON.stringify({ digital: value })
  }
  return JSON.stringify(value ?? null)
}

export function catalogToPackLeaves(
  catalog: InspectTokenOption[] = INSPECT_TOKEN_CATALOG,
): ZaolyPackLeaf[] {
  const out: ZaolyPackLeaf[] = []
  for (const row of catalog) {
    if (!row.type || row.status === 'pending') continue
    out.push({
      path: row.path,
      type: row.type,
      value: stringifyTokenValue(row.value ?? row.preview),
      status: 'active',
    })
  }
  // Geometry + CSS media presets — not Inspect TokenPicker rows; seed via pack merge.
  out.push(...defaultArtboardPresetLeaves())
  out.push(...defaultMediaBreakpointLeaves())
  return out
}

export function mergeTokenPack(
  fixture: ZaolyPackLeaf[],
  overrides: ZaolyPackLeaf[],
): { tokens: ZaolyPackLeaf[]; origins: Record<string, TokenOrigin> } {
  const byPath = new Map<string, ZaolyPackLeaf>()
  const origins: Record<string, TokenOrigin> = {}
  for (const leaf of fixture) {
    if (!leaf.path?.trim()) continue
    byPath.set(leaf.path, { ...leaf, status: leaf.status ?? 'active' })
    origins[leaf.path] = 'fixture'
  }
  for (const leaf of overrides) {
    if (!leaf.path?.trim()) continue
    byPath.set(leaf.path, { ...leaf, status: leaf.status ?? 'active' })
    origins[leaf.path] = 'local'
  }
  return { tokens: Array.from(byPath.values()), origins }
}

export function overridesFromPackFile(file: TokenPackFile): ZaolyPackLeaf[] {
  return Object.entries(file.leaves).map(([path, leaf]) => ({
    path,
    type: leaf.type,
    value: leaf.value,
    status: 'active' as const,
  }))
}
