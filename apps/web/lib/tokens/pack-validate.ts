/**
 * Server-side validation for Token Studio PATCH writes.
 * Spec: specs/api/zaoly-tokens.md · specs/domain/zaoly-token-studio.md
 */
import {
  applyDigitalScalar,
  buildAssetValue,
  buildEffectValue,
  buildGlowValue,
  buildMotionValue,
  buildShadowValue,
  buildTypographyValue,
  isStudioEditableType,
  isStudioScalarType,
  isValidStudioTokenPath,
  readAssetDigitalDraft,
  readDigitalScalar,
  readEffectDigitalDraft,
  readGlowDigitalDraft,
  readMotionDigitalDraft,
  readShadowDigitalDraft,
  readTypographyDigitalDraft,
} from '../inspect/digital-edit'
import { buildArtboardValue, readArtboardDigitalDraft } from './artboard-presets'
import { buildMediaValue, readMediaDigitalDraft } from './media-breakpoints'
import type { ZaolyPackLeaf } from '../inspect/token-catalog'
import { paths } from '../paths'
import {
  looksLikeTokenExpr,
  type ResolveTokenCss,
  wouldCreateCycle,
} from './token-expr'

export type PackValidateError =
  | 'invalid_path'
  | 'invalid_type'
  | 'invalid_value'
  | 'value_too_large'
  | 'expr_cycle'

export type PackValidateResult = { ok: true } | { ok: false; error: PackValidateError }

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function parseLeafObject(value: string): Record<string, unknown> | null {
  try {
    return asRecord(JSON.parse(value))
  } catch {
    return null
  }
}

function digitalRecord(rec: Record<string, unknown>): Record<string, unknown> | null {
  return asRecord(rec.digital)
}

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

/** Resolve pack digital scalars for compose cycle checks. */
export function buildResolveCssFromLeaves(leaves: ZaolyPackLeaf[]): ResolveTokenCss {
  const byPath = new Map<string, ZaolyPackLeaf>()
  for (const leaf of leaves) {
    if (leaf.path?.trim()) byPath.set(leaf.path, leaf)
  }
  return (tokenPath) => {
    const leaf = byPath.get(tokenPath)
    if (!leaf) return null
    return readDigitalScalar(leaf.type, leaf.value)
  }
}

function validateStructuredShape(type: string, value: string): boolean {
  const rec = parseLeafObject(value)
  if (!rec) return false
  const dig = digitalRecord(rec)

  if (type === 'typography') {
    if (typeof rec.family !== 'string' || !rec.family.trim()) return false
    if (!dig || typeof dig.size !== 'string' || !dig.size.trim()) return false
    return buildTypographyValue(readTypographyDigitalDraft(value)) != null
  }
  if (type === 'shadow') {
    if (!dig) return false
    if (typeof dig.offsetY !== 'string' || !dig.offsetY.trim()) return false
    if (typeof dig.blur !== 'string' || !dig.blur.trim()) return false
    if (typeof dig.color !== 'string' || !dig.color.trim()) return false
    return buildShadowValue(readShadowDigitalDraft(value)) != null
  }
  if (type === 'glow') {
    if (!dig) return false
    if (typeof dig.blur !== 'string' || !dig.blur.trim()) return false
    if (typeof dig.color !== 'string' || !dig.color.trim()) return false
    return buildGlowValue(readGlowDigitalDraft(value)) != null
  }
  if (type === 'effect') {
    if (!dig) return false
    if (typeof dig.kind !== 'string' || !dig.kind.trim()) return false
    if (typeof dig.amount !== 'string' || !dig.amount.trim()) return false
    return buildEffectValue(readEffectDigitalDraft(value)) != null
  }
  if (type === 'motion') {
    if (!dig) return false
    if (typeof dig.duration !== 'string' || !dig.duration.trim()) return false
    if (typeof dig.easing !== 'string' || !dig.easing.trim()) return false
    return buildMotionValue(readMotionDigitalDraft(value)) != null
  }
  if (type === 'asset') {
    if (!dig || typeof dig.src !== 'string' || !dig.src.trim()) return false
    return buildAssetValue(readAssetDigitalDraft(value)) != null
  }
  if (type === 'artboard') {
    if (!dig) return false
    if (typeof dig.width !== 'number' || typeof dig.height !== 'number') return false
    return buildArtboardValue(readArtboardDigitalDraft(value)) != null
  }
  if (type === 'media') {
    if (!dig) return false
    if (typeof dig.minWidth !== 'number') return false
    return buildMediaValue(readMediaDigitalDraft(value)) != null
  }
  return false
}

function validateScalarShape(type: string, value: string): string | null {
  const scalar = readDigitalScalar(type, value)
  if (!scalar) return null
  if (applyDigitalScalar(type, value, scalar) == null) return null
  return scalar
}

/**
 * Validate a Token Studio leaf write (path, type, value, compose cycles).
 * Does not persist — call before upsert/rename.
 */
export function validateStudioLeafWrite(opts: {
  path: string
  type: string
  value: string
  resolveCss: ResolveTokenCss
  maxValueBytes?: number
}): PackValidateResult {
  const tokenPath = opts.path.trim()
  const type = opts.type.trim()
  const value = opts.value
  const maxBytes = opts.maxValueBytes ?? paths.tokenPackMaxValueBytes

  if (!isStudioEditableType(type)) return { ok: false, error: 'invalid_type' }
  if (!isValidStudioTokenPath(tokenPath, type)) return { ok: false, error: 'invalid_path' }
  if (typeof value !== 'string') return { ok: false, error: 'invalid_value' }
  if (utf8ByteLength(value) > maxBytes) return { ok: false, error: 'value_too_large' }

  if (isStudioScalarType(type)) {
    const scalar = validateScalarShape(type, value)
    if (!scalar) return { ok: false, error: 'invalid_value' }
    if (looksLikeTokenExpr(scalar) && wouldCreateCycle(tokenPath, scalar, opts.resolveCss)) {
      return { ok: false, error: 'expr_cycle' }
    }
    return { ok: true }
  }

  if (!validateStructuredShape(type, value)) {
    return { ok: false, error: 'invalid_value' }
  }
  return { ok: true }
}
