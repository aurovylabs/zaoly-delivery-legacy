/**
 * DTCG JSON → Zaoly local pack import (parse, convert, diff).
 * Spec: specs/api/zaoly-tokens.md · specs/domain/zaoly-token-studio.md
 */
import {
  applyDigitalScalar,
  isStudioEditableType,
  isStudioScalarType,
  isValidStudioTokenPath,
} from '../inspect/digital-edit'
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import { paths } from '../paths'
import {
  buildResolveCssFromLeaves,
  validateStudioLeafWrite,
  type PackValidateError,
} from './pack-validate'

export type ImportedStudioLeaf = {
  path: string
  type: string
  value: string
}

export type PackImportInvalid = {
  path: string
  error: PackValidateError | 'invalid_json' | 'missing_studio_extension' | 'unknown_path'
}

export type PackImportDiff = {
  create: string[]
  update: string[]
  unchanged: string[]
  invalid: PackImportInvalid[]
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function studioTypeFromPath(tokenPath: string): string | null {
  const root = tokenPath.split('.')[0] ?? ''
  if (root === 'logo' || root === 'asset') return 'asset'
  if (
    root === 'color' ||
    root === 'spacing' ||
    root === 'radius' ||
    root === 'opacity' ||
    root === 'size' ||
    root === 'typography' ||
    root === 'shadow' ||
    root === 'glow' ||
    root === 'effect' ||
    root === 'motion'
  ) {
    return root
  }
  return null
}

function readStudioExtension(node: Record<string, unknown>): { type: string; value: string } | null {
  const extensions = asRecord(node.$extensions)
  if (!extensions) return null
  const studio = asRecord(extensions[paths.tokenPackStudioExtensionKey])
  if (!studio) return null
  const type = typeof studio.type === 'string' ? studio.type.trim() : ''
  const value = typeof studio.value === 'string' ? studio.value : ''
  if (!type || !value) return null
  return { type, value }
}

function walkDtcg(
  node: unknown,
  prefix: string[],
  out: Array<{ path: string; node: Record<string, unknown> }>,
): void {
  const rec = asRecord(node)
  if (!rec) return
  if ('$value' in rec) {
    if (prefix.length >= 2) {
      out.push({ path: prefix.join('.'), node: rec })
    }
    return
  }
  for (const [key, child] of Object.entries(rec)) {
    if (key.startsWith('$')) continue
    walkDtcg(child, [...prefix, key], out)
  }
}

/** Parse nested DTCG JSON into candidate studio leaves. */
export function parseDtcgTokenPack(jsonText: string): {
  leaves: ImportedStudioLeaf[]
  invalid: PackImportInvalid[]
} {
  let root: unknown
  try {
    root = JSON.parse(jsonText) as unknown
  } catch {
    return { leaves: [], invalid: [{ path: '', error: 'invalid_json' }] }
  }
  if (!asRecord(root)) {
    return { leaves: [], invalid: [{ path: '', error: 'invalid_json' }] }
  }

  const entries: Array<{ path: string; node: Record<string, unknown> }> = []
  walkDtcg(root, [], entries)

  const leaves: ImportedStudioLeaf[] = []
  const invalid: PackImportInvalid[] = []

  for (const { path: tokenPath, node } of entries) {
    const ext = readStudioExtension(node)
    if (ext) {
      if (!isStudioEditableType(ext.type) || !isValidStudioTokenPath(tokenPath, ext.type)) {
        invalid.push({ path: tokenPath, error: 'invalid_path' })
        continue
      }
      leaves.push({ path: tokenPath, type: ext.type, value: ext.value })
      continue
    }

    const type = studioTypeFromPath(tokenPath)
    if (!type || !isValidStudioTokenPath(tokenPath, type)) {
      invalid.push({ path: tokenPath, error: 'unknown_path' })
      continue
    }
    if (!isStudioScalarType(type)) {
      invalid.push({ path: tokenPath, error: 'missing_studio_extension' })
      continue
    }
    const cssValue = typeof node.$value === 'string' ? node.$value.trim() : ''
    if (!cssValue) {
      invalid.push({ path: tokenPath, error: 'invalid_value' })
      continue
    }
    const value = applyDigitalScalar(type, null, cssValue)
    if (!value) {
      invalid.push({ path: tokenPath, error: 'invalid_value' })
      continue
    }
    leaves.push({ path: tokenPath, type, value })
  }

  return { leaves, invalid }
}

/** Diff imported leaves against the current merged pack. */
export function diffTokenPackImport(
  incoming: ImportedStudioLeaf[],
  current: ZaolyPackLeaf[],
  parseInvalid: PackImportInvalid[] = [],
): PackImportDiff {
  const byPath = new Map(current.map((leaf) => [leaf.path, leaf]))
  const resolveCss = buildResolveCssFromLeaves(current)
  const create: string[] = []
  const update: string[] = []
  const unchanged: string[] = []
  const invalid: PackImportInvalid[] = [...parseInvalid]

  for (const leaf of incoming) {
    const validated = validateStudioLeafWrite({
      path: leaf.path,
      type: leaf.type,
      value: leaf.value,
      resolveCss,
      maxValueBytes: paths.tokenPackMaxValueBytes,
    })
    if (!validated.ok) {
      invalid.push({ path: leaf.path, error: validated.error })
      continue
    }
    const existing = byPath.get(leaf.path)
    if (!existing) {
      create.push(leaf.path)
      continue
    }
    if (existing.type === leaf.type && existing.value === leaf.value) {
      unchanged.push(leaf.path)
    } else {
      update.push(leaf.path)
    }
  }

  create.sort()
  update.sort()
  unchanged.sort()
  return { create, update, unchanged, invalid }
}

/** Leaves that would be written on apply (create + update only). */
export function leavesForImportApply(
  incoming: ImportedStudioLeaf[],
  diff: PackImportDiff,
): ImportedStudioLeaf[] {
  const write = new Set([...diff.create, ...diff.update])
  return incoming.filter((leaf) => write.has(leaf.path))
}
