/**
 * Digital-channel edit helpers for Token Studio (P75/P81a/P82a/CT-20).
 * Preserve print / non-digital siblings; never invent paths or types.
 * Field models mirror upstream token typed fields (digital channel only).
 * Zaoly local pack only. Expressions: `lib/tokens/token-expr.ts`.
 */
import { isValidCssColor, toPickerHex } from '../tokens/color-css'
import { looksLikeTokenExpr } from '../tokens/token-expr'

/** Scalar digital leaves (list edit + Add). */
export const STUDIO_SCALAR_TYPES = new Set([
  'color',
  'spacing',
  'radius',
  'opacity',
  'size',
])

/** Structured types with shared fixture digital objects. */
export const STUDIO_SHARED_STRUCTURED_TYPES = new Set(['typography', 'shadow', 'asset'])

/** Local pack only — hub administers. */
export const STUDIO_LOCAL_STRUCTURED_TYPES = new Set([
  'glow',
  'effect',
  'motion',
  'artboard',
  'media',
])

/** Structured types with shared or local digital objects. */
export const STUDIO_STRUCTURED_TYPES = new Set([
  ...STUDIO_SHARED_STRUCTURED_TYPES,
  ...STUDIO_LOCAL_STRUCTURED_TYPES,
])

/** All studio-writable types. */
export const STUDIO_EDITABLE_TYPES = new Set([
  ...STUDIO_SCALAR_TYPES,
  ...STUDIO_STRUCTURED_TYPES,
])

export function isStudioScalarType(type: string): boolean {
  return STUDIO_SCALAR_TYPES.has(type)
}

export function isStudioStructuredType(type: string): boolean {
  return STUDIO_STRUCTURED_TYPES.has(type)
}

export function isStudioEditableType(type: string): boolean {
  return STUDIO_EDITABLE_TYPES.has(type)
}

export function isStudioLocalType(type: string): boolean {
  return STUDIO_LOCAL_STRUCTURED_TYPES.has(type)
}

/** Shared fixture / structured types (excludes local-only glow/effect/motion). */
export function isStudioPackWritableType(type: string): boolean {
  return isStudioEditableType(type) && !isStudioLocalType(type)
}

/** @deprecated Use `isStudioPackWritableType`. */
export function isStudioSharedWritableType(type: string): boolean {
  return isStudioPackWritableType(type)
}

/** Pack path roots for studio types (asset uses logo.* | asset.*). */
const TYPE_PATH_ROOT: Record<string, string> = {
  color: 'color',
  spacing: 'spacing',
  radius: 'radius',
  opacity: 'opacity',
  size: 'size',
  typography: 'typography',
  shadow: 'shadow',
  glow: 'glow',
  effect: 'effect',
  motion: 'motion',
  artboard: 'artboard',
  media: 'media',
}

/**
 * Validate a new/edited leaf path for Token Studio.
 * Must be dotted pack grammar and root must match type.
 */
export function isValidStudioTokenPath(path: string, type: string): boolean {
  if (!isStudioEditableType(type)) return false
  const trimmed = path.trim()
  if (!/^[a-z][a-z0-9]*(\.[a-zA-Z0-9_-]+)+$/.test(trimmed)) return false
  if (type === 'asset') {
    return trimmed.startsWith('logo.') || trimmed.startsWith('asset.')
  }
  const root = TYPE_PATH_ROOT[type]
  return Boolean(root) && trimmed.startsWith(`${root}.`)
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function parseValue(raw: unknown): unknown {
  if (raw == null) return null
  if (typeof raw !== 'string') return raw
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      return trimmed
    }
  }
  return trimmed
}

function stringifyValue(parsed: unknown): string {
  return JSON.stringify(parsed)
}

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const WEIGHT_RE = /^\d{3}$|^[1-9]\d{0,2}$|^(normal|bold|bolder|lighter)$/i

export function isValidDigitalHex(value: string): boolean {
  return HEX_RE.test(value.trim())
}

export function isValidCssLength(value: string): boolean {
  const v = value.trim()
  if (v === '0') return true
  return /^-?[\d.]+(px|rem|em|pt|pc|mm|cm|in|vw|vh|vmin|vmax|ch|ex|%)$/.test(v)
}

export function isValidOpacity(value: string): boolean {
  const n = Number(value.trim())
  return Number.isFinite(n) && n >= 0 && n <= 1
}

export type TypographyDigitalDraft = {
  family: string
  weight: string
  digitalSize: string
  lineHeight: string
}

/** @deprecated alias — Add uses the same draft shape (lineHeight optional). */
export type TypographyAddDraft = TypographyDigitalDraft

function isValidWeight(weight: string): boolean {
  if (!weight.trim()) return true
  return WEIGHT_RE.test(weight.trim())
}

/** Build typography pack leaf JSON (P82a / CT-20). Print omitted on create. */
export function buildTypographyValue(draft: TypographyDigitalDraft): string | null {
  const family = draft.family.trim()
  const weight = draft.weight.trim()
  const digitalSize = draft.digitalSize.trim()
  const lineHeight = draft.lineHeight.trim()
  if (!family || !isValidCssLength(digitalSize)) return null
  if (!isValidWeight(weight)) return null
  if (lineHeight && !isValidCssLength(lineHeight) && !/^[\d.]+$/.test(lineHeight)) return null
  const digital: Record<string, string> = { size: digitalSize }
  if (weight) digital.weight = weight
  if (lineHeight) digital.lineHeight = lineHeight
  const value: Record<string, unknown> = { family, digital }
  if (weight) value.weight = weight
  return stringifyValue(value)
}

/** Read digital typography fields for list-edit dialog (CT-20). */
export function readTypographyDigitalDraft(value: unknown): TypographyDigitalDraft {
  const parsed = parseValue(value)
  const rec = asRecord(parsed) ?? {}
  const dig = asRecord(rec.digital) ?? {}
  const family = typeof rec.family === 'string' ? rec.family : ''
  const sharedWeight = typeof rec.weight === 'string' ? rec.weight : ''
  const digWeight = typeof dig.weight === 'string' ? dig.weight : ''
  return {
    family,
    weight: digWeight || sharedWeight,
    digitalSize: typeof dig.size === 'string' ? dig.size : '',
    lineHeight: typeof dig.lineHeight === 'string' ? dig.lineHeight : '',
  }
}

/** Apply typography digital edit; preserve print / source siblings. */
export function applyTypographyDigital(
  existingValue: unknown,
  draft: TypographyDigitalDraft,
): string | null {
  const family = draft.family.trim()
  const weight = draft.weight.trim()
  const digitalSize = draft.digitalSize.trim()
  const lineHeight = draft.lineHeight.trim()
  if (!family || !isValidCssLength(digitalSize)) return null
  if (!isValidWeight(weight)) return null
  if (lineHeight && !isValidCssLength(lineHeight) && !/^[\d.]+$/.test(lineHeight)) return null

  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}
  const prevDigital = asRecord(base.digital) ?? {}
  const digital: Record<string, unknown> = { ...prevDigital, size: digitalSize }
  if (weight) digital.weight = weight
  else delete digital.weight
  if (lineHeight) digital.lineHeight = lineHeight
  else delete digital.lineHeight

  const next: Record<string, unknown> = { ...base, family, digital }
  if (weight) next.weight = weight
  else delete next.weight
  return stringifyValue(next)
}

/** Read-only summary for typography rows in the studio list. */
export function readTypographySummary(value: unknown): string | null {
  const draft = readTypographyDigitalDraft(value)
  if (!draft.family.trim()) return null
  return [draft.family, draft.weight, draft.digitalSize].filter(Boolean).join(' · ')
}

export type ShadowDigitalDraft = {
  offsetX: string
  offsetY: string
  blur: string
  spread: string
  color: string
  inset: boolean
}

export const DEFAULT_SHADOW_DIGITAL: ShadowDigitalDraft = {
  offsetX: '0',
  offsetY: '4px',
  blur: '12px',
  spread: '0',
  color: 'rgba(0, 0, 0, 0.15)',
  inset: false,
}

export function readShadowDigitalDraft(value: unknown): ShadowDigitalDraft {
  const parsed = parseValue(value)
  const rec = asRecord(parsed) ?? {}
  const dig = asRecord(rec.digital) ?? {}
  return {
    offsetX: typeof dig.offsetX === 'string' ? dig.offsetX : DEFAULT_SHADOW_DIGITAL.offsetX,
    offsetY: typeof dig.offsetY === 'string' ? dig.offsetY : DEFAULT_SHADOW_DIGITAL.offsetY,
    blur: typeof dig.blur === 'string' ? dig.blur : DEFAULT_SHADOW_DIGITAL.blur,
    spread: typeof dig.spread === 'string' ? dig.spread : DEFAULT_SHADOW_DIGITAL.spread,
    color: typeof dig.color === 'string' ? dig.color : DEFAULT_SHADOW_DIGITAL.color,
    inset: dig.inset === true,
  }
}

function shadowDigitalObject(draft: ShadowDigitalDraft): Record<string, unknown> | null {
  const offsetX = draft.offsetX.trim()
  const offsetY = draft.offsetY.trim()
  const blur = draft.blur.trim()
  const spread = draft.spread.trim()
  const color = draft.color.trim()
  if (!offsetY || !blur || !color) return null
  const digital: Record<string, unknown> = {
    offsetX: offsetX || '0',
    offsetY,
    blur,
    spread: spread || '0',
    color,
  }
  if (draft.inset) digital.inset = true
  return digital
}

export function buildShadowValue(draft: ShadowDigitalDraft): string | null {
  const digital = shadowDigitalObject(draft)
  if (!digital) return null
  return stringifyValue({ digital })
}

export function applyShadowDigital(
  existingValue: unknown,
  draft: ShadowDigitalDraft,
): string | null {
  const digital = shadowDigitalObject(draft)
  if (!digital) return null
  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}
  return stringifyValue({ ...base, digital })
}

export function readShadowSummary(value: unknown): string {
  const d = readShadowDigitalDraft(value)
  const inset = d.inset ? 'inset ' : ''
  return `${inset}${d.offsetX} ${d.offsetY} ${d.blur} ${d.spread} ${d.color}`.trim()
}

export type GlowDigitalDraft = {
  offsetX: string
  offsetY: string
  color: string
  blur: string
  spread: string
}

export const DEFAULT_GLOW_DIGITAL: GlowDigitalDraft = {
  offsetX: '0',
  offsetY: '0',
  color: 'rgba(31, 68, 255, 0.85)',
  blur: '24px',
  spread: '2px',
}

export function readGlowDigitalDraft(value: unknown): GlowDigitalDraft {
  const parsed = parseValue(value)
  const rec = asRecord(parsed) ?? {}
  const dig = asRecord(rec.digital) ?? {}
  return {
    offsetX: typeof dig.offsetX === 'string' ? dig.offsetX : DEFAULT_GLOW_DIGITAL.offsetX,
    offsetY: typeof dig.offsetY === 'string' ? dig.offsetY : DEFAULT_GLOW_DIGITAL.offsetY,
    color: typeof dig.color === 'string' ? dig.color : DEFAULT_GLOW_DIGITAL.color,
    blur: typeof dig.blur === 'string' ? dig.blur : DEFAULT_GLOW_DIGITAL.blur,
    spread: typeof dig.spread === 'string' ? dig.spread : DEFAULT_GLOW_DIGITAL.spread,
  }
}

function glowDigitalObject(draft: GlowDigitalDraft): Record<string, unknown> | null {
  const offsetX = (draft.offsetX ?? DEFAULT_GLOW_DIGITAL.offsetX).trim() || '0'
  const offsetY = (draft.offsetY ?? DEFAULT_GLOW_DIGITAL.offsetY).trim() || '0'
  const color = draft.color.trim()
  const blur = draft.blur.trim()
  const spread = (draft.spread ?? DEFAULT_GLOW_DIGITAL.spread).trim() || '0'
  if (!color || !blur) return null
  return { offsetX, offsetY, color, blur, spread }
}

export function buildGlowValue(draft: GlowDigitalDraft): string | null {
  const digital = glowDigitalObject(draft)
  if (!digital) return null
  return stringifyValue({ digital })
}

export function applyGlowDigital(existingValue: unknown, draft: GlowDigitalDraft): string | null {
  const digital = glowDigitalObject(draft)
  if (!digital) return null
  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}
  return stringifyValue({ ...base, digital })
}

export function readGlowSummary(value: unknown): string {
  const d = readGlowDigitalDraft(value)
  return `${d.offsetX} ${d.offsetY} ${d.blur} ${d.spread} ${d.color}`.trim()
}

export const EFFECT_KINDS = ['blur', 'brightness', 'saturate', 'contrast', 'grayscale'] as const
export type EffectKind = (typeof EFFECT_KINDS)[number]

export type EffectDigitalDraft = {
  kind: EffectKind
  amount: string
}

export const DEFAULT_EFFECT_DIGITAL: EffectDigitalDraft = {
  kind: 'blur',
  amount: '8px',
}

function asEffectKind(value: unknown): EffectKind | null {
  return typeof value === 'string' && (EFFECT_KINDS as readonly string[]).includes(value)
    ? (value as EffectKind)
    : null
}

export function readEffectDigitalDraft(value: unknown): EffectDigitalDraft {
  const parsed = parseValue(value)
  const rec = asRecord(parsed) ?? {}
  const dig = asRecord(rec.digital) ?? {}
  return {
    kind: asEffectKind(dig.kind) ?? DEFAULT_EFFECT_DIGITAL.kind,
    amount: typeof dig.amount === 'string' ? dig.amount : DEFAULT_EFFECT_DIGITAL.amount,
  }
}

function effectDigitalObject(draft: EffectDigitalDraft): Record<string, unknown> | null {
  const kind = asEffectKind(draft.kind)
  const amount = draft.amount.trim()
  if (!kind || !amount) return null
  return { kind, amount }
}

export function buildEffectValue(draft: EffectDigitalDraft): string | null {
  const digital = effectDigitalObject(draft)
  if (!digital) return null
  return stringifyValue({ digital })
}

export function applyEffectDigital(
  existingValue: unknown,
  draft: EffectDigitalDraft,
): string | null {
  const digital = effectDigitalObject(draft)
  if (!digital) return null
  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}
  return stringifyValue({ ...base, digital })
}

export function readEffectSummary(value: unknown): string {
  const d = readEffectDigitalDraft(value)
  return `${d.kind}(${d.amount})`
}

export type MotionDigitalDraft = {
  duration: string
  easing: string
}

export const DEFAULT_MOTION_DIGITAL: MotionDigitalDraft = {
  duration: '240ms',
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
}

export function readMotionDigitalDraft(value: unknown): MotionDigitalDraft {
  const parsed = parseValue(value)
  const rec = asRecord(parsed) ?? {}
  const dig = asRecord(rec.digital) ?? {}
  return {
    duration: typeof dig.duration === 'string' ? dig.duration : DEFAULT_MOTION_DIGITAL.duration,
    easing: typeof dig.easing === 'string' ? dig.easing : DEFAULT_MOTION_DIGITAL.easing,
  }
}

function motionDigitalObject(draft: MotionDigitalDraft): Record<string, unknown> | null {
  const duration = draft.duration.trim()
  const easing = draft.easing.trim()
  if (!duration || !easing) return null
  return { duration, easing }
}

export function buildMotionValue(draft: MotionDigitalDraft): string | null {
  const digital = motionDigitalObject(draft)
  if (!digital) return null
  return stringifyValue({ digital })
}

export function applyMotionDigital(
  existingValue: unknown,
  draft: MotionDigitalDraft,
): string | null {
  const digital = motionDigitalObject(draft)
  if (!digital) return null
  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}
  return stringifyValue({ ...base, digital })
}

export function readMotionSummary(value: unknown): string {
  const d = readMotionDigitalDraft(value)
  return `${d.duration} ${d.easing}`.trim()
}

export type AssetDigitalDraft = {
  label: string
  src: string
  format: string
  minWidth: string
}

export function readAssetDigitalDraft(value: unknown): AssetDigitalDraft {
  const parsed = parseValue(value)
  const rec = asRecord(parsed) ?? {}
  const dig = asRecord(rec.digital) ?? {}
  return {
    label: typeof rec.label === 'string' ? rec.label : '',
    src: typeof dig.src === 'string' ? dig.src : '',
    format: typeof dig.format === 'string' ? dig.format : '',
    minWidth: typeof dig.minWidth === 'string' ? dig.minWidth : '',
  }
}

function assetDigitalObject(draft: AssetDigitalDraft): {
  label?: string
  digital: Record<string, string>
} | null {
  const src = draft.src.trim()
  if (!src) return null
  const digital: Record<string, string> = { src }
  const format = draft.format.trim()
  const minWidth = draft.minWidth.trim()
  if (format) digital.format = format
  if (minWidth) {
    if (!isValidCssLength(minWidth)) return null
    digital.minWidth = minWidth
  }
  const label = draft.label.trim()
  return label ? { label, digital } : { digital }
}

export function buildAssetValue(draft: AssetDigitalDraft): string | null {
  const built = assetDigitalObject(draft)
  if (!built) return null
  return stringifyValue(built)
}

export function applyAssetDigital(
  existingValue: unknown,
  draft: AssetDigitalDraft,
): string | null {
  const built = assetDigitalObject(draft)
  if (!built) return null
  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}
  const prevDigital = asRecord(base.digital) ?? {}
  const digital: Record<string, unknown> = { ...prevDigital, ...built.digital }
  if (!draft.format.trim()) delete digital.format
  if (!draft.minWidth.trim()) delete digital.minWidth
  const next: Record<string, unknown> = { ...base, digital }
  if (built.label) next.label = built.label
  else if (!draft.label.trim()) delete next.label
  return stringifyValue(next)
}

export function readAssetSummary(value: unknown): string {
  const d = readAssetDigitalDraft(value)
  return [d.label, d.src].filter(Boolean).join(' · ') || '—'
}

/** Read the editable digital scalar for the studio input. */
export function readDigitalScalar(type: string, value: unknown): string | null {
  if (!isStudioScalarType(type)) return null
  const parsed = parseValue(value)
  const rec = asRecord(parsed)
  const digital = rec && 'digital' in rec ? rec.digital : parsed

  if (type === 'color') {
    if (typeof digital === 'string' && digital.trim()) {
      const v = digital.trim()
      if (isValidCssColor(v) || looksLikeTokenExpr(v)) return v
      return null
    }
    const dig = asRecord(digital)
    if (!dig) return null
    for (const key of ['css', 'hex', 'rgba', 'rgb', 'hsl', 'oklch'] as const) {
      const raw = dig[key]
      if (typeof raw === 'string' && raw.trim()) {
        const v = raw.trim()
        if (isValidCssColor(v) || looksLikeTokenExpr(v)) return v
      }
    }
    return null
  }

  if (type === 'spacing' || type === 'radius' || type === 'opacity') {
    if (typeof digital === 'string' && digital.trim()) return digital.trim()
    if (typeof digital === 'number' && Number.isFinite(digital)) return String(digital)
    return null
  }

  if (type === 'size') {
    if (typeof digital === 'string' && digital.trim()) {
      const v = digital.trim()
      if (isValidCssLength(v) || looksLikeTokenExpr(v)) return v
    }
    const dig = asRecord(digital)
    if (!dig) return null
    for (const key of ['preferred', 'min', 'max'] as const) {
      const v = dig[key]
      if (typeof v === 'string' && v.trim()) return v.trim()
    }
    return null
  }

  return null
}

/**
 * Apply a digital scalar edit. Returns JSON string for pack leaf `value`, or null if invalid.
 */
export function applyDigitalScalar(
  type: string,
  existingValue: unknown,
  nextScalar: string,
): string | null {
  if (!isStudioScalarType(type)) return null
  const scalar = nextScalar.trim()
  if (!scalar) return null

  const parsed = parseValue(existingValue)
  const base = asRecord(parsed) ? { ...(parsed as Record<string, unknown>) } : {}

  if (type === 'color') {
    if (looksLikeTokenExpr(scalar)) {
      return stringifyValue({ ...base, digital: scalar })
    }
    if (!isValidCssColor(scalar)) return null
    const prevDigital = { ...(asRecord(base.digital) ?? {}) }
    // Legacy hex-only shape when the value is opaque 3/6-digit hex; else keep css + picker hex.
    if (isValidDigitalHex(scalar) && scalar.length <= 7) {
      delete prevDigital.css
      delete prevDigital.rgba
      delete prevDigital.rgb
      delete prevDigital.hsl
      delete prevDigital.oklch
      return stringifyValue({ ...base, digital: { ...prevDigital, hex: scalar } })
    }
    return stringifyValue({
      ...base,
      digital: {
        ...prevDigital,
        css: scalar,
        hex: toPickerHex(scalar),
      },
    })
  }

  if (type === 'spacing' || type === 'radius') {
    if (!isValidCssLength(scalar) && !looksLikeTokenExpr(scalar)) return null
    return stringifyValue({ ...base, digital: scalar })
  }

  if (type === 'opacity') {
    if (!isValidOpacity(scalar) && !looksLikeTokenExpr(scalar)) return null
    return stringifyValue({ ...base, digital: scalar })
  }

  if (type === 'size') {
    if (!isValidCssLength(scalar) && !looksLikeTokenExpr(scalar)) return null
    if (looksLikeTokenExpr(scalar)) {
      return stringifyValue({ ...base, digital: scalar })
    }
    const prevDigital = asRecord(base.digital) ?? {}
    const key =
      typeof prevDigital.preferred === 'string'
        ? 'preferred'
        : typeof prevDigital.min === 'string'
          ? 'min'
          : 'preferred'
    return stringifyValue({ ...base, digital: { ...prevDigital, [key]: scalar } })
  }

  return null
}

export function studioInputKind(
  type: string,
): 'color' | 'length' | 'opacity' | null {
  if (type === 'color') return 'color'
  if (type === 'spacing' || type === 'radius' || type === 'size') return 'length'
  if (type === 'opacity') return 'opacity'
  return null
}

/** Inspect TokenPicker group → studio scalar type (CT-18). */
export function studioTypeForInspectGroup(group: string): string | null {
  if (group === 'space') return 'spacing'
  if (group === 'color' || group === 'radius' || group === 'opacity' || group === 'size') {
    return group
  }
  return null
}

/** Whether a freeform inspect literal can be promoted to a pack leaf. */
export function isPromotableLiteral(type: string, literal: string): boolean {
  if (!isStudioScalarType(type)) return false
  const v = literal.trim()
  if (!v) return false
  if (type === 'color') return isValidCssColor(v)
  if (type === 'opacity') return isValidOpacity(v)
  return isValidCssLength(v)
}

/**
 * Suggest a pack path under `{type}.custom.*` from a literal (CT-18).
 * Leaf segment is a slug of the value; designer may edit before save.
 */
export function suggestPromoteTokenPath(type: string, literal: string): string {
  const root = type === 'asset' ? 'logo' : (TYPE_PATH_ROOT[type] ?? type)
  const slug =
    literal
      .trim()
      .replace(/^#/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'value'
  return `${root}.custom.${slug}`
}
