/**
 * Harden Kit Component Set wire (axes + combinations) before override/CSF.
 * Spec: site-kit-write.md · knowledge/kit-master-axes-export.md
 */
import type { KitMasterAxis, KitNamedVariantCell } from './types'

export const MAX_KIT_AXES = 8
export const MAX_KIT_AXIS_VALUES = 32
export const MAX_KIT_AXIS_ID_LEN = 64
export const MAX_KIT_AXIS_NAME_LEN = 64
export const MAX_KIT_AXIS_VALUE_LEN = 64
/** Cap named cells on the Kit wire / override. */
export const MAX_KIT_VARIANTS = 64

/** Safe axis id for CSF arg keys (quoted or bare). */
export const KIT_AXIS_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/

/** Must not collide with Storybook / live-override control args. */
export const RESERVED_KIT_AXIS_IDS = new Set([
  'variant',
  'masterVariant',
  'variantName',
  'componentId',
  'args',
  'argTypes',
  'parameters',
  'render',
  'decorators',
  'name',
  'title',
  '__proto__',
  'constructor',
  'prototype',
])

export type KitComponentSetValidation =
  | {
      ok: true
      variants: KitNamedVariantCell[]
      axes?: KitMasterAxis[]
    }
  | { ok: false; code: 'invalid-axes' | 'invalid-variants'; error: string }

function trimStr(value: string, max: number): string {
  return value.trim().slice(0, max)
}

/** Sanitize axes for persist/CSF — drops illegal ids; returns null if none remain. */
export function sanitizeKitAxes(raw: KitMasterAxis[] | undefined): KitMasterAxis[] | undefined {
  if (!raw?.length) return undefined
  const seen = new Set<string>()
  const out: KitMasterAxis[] = []
  for (const axis of raw) {
    if (out.length >= MAX_KIT_AXES) break
    if (!axis || typeof axis.id !== 'string' || typeof axis.name !== 'string') continue
    const id = trimStr(axis.id, MAX_KIT_AXIS_ID_LEN)
    if (!KIT_AXIS_ID_RE.test(id)) continue
    if (RESERVED_KIT_AXIS_IDS.has(id)) continue
    if (seen.has(id)) continue
    const name = trimStr(axis.name, MAX_KIT_AXIS_NAME_LEN)
    if (!name) continue
    const values: string[] = []
    const valueSeen = new Set<string>()
    for (const v of axis.values ?? []) {
      if (typeof v !== 'string') continue
      const value = trimStr(v, MAX_KIT_AXIS_VALUE_LEN)
      if (!value || valueSeen.has(value)) continue
      valueSeen.add(value)
      values.push(value)
      if (values.length >= MAX_KIT_AXIS_VALUES) break
    }
    if (!values.length) continue
    seen.add(id)
    out.push({ id, name, values })
  }
  return out.length ? out : undefined
}

function combinationKey(
  axes: KitMasterAxis[],
  combination: Record<string, string>,
): string {
  return axes.map((a) => `${a.id}=${combination[a.id] ?? ''}`).join('\0')
}

/**
 * Validate named variants + optional axes before Kit write/save.
 * WHEN axes present, every cell MUST carry a full valid combination; combinations MUST be unique.
 */
export function validateKitComponentSetPayload(
  variants: KitNamedVariantCell[] | undefined,
  axesRaw: KitMasterAxis[] | undefined,
): KitComponentSetValidation {
  if (!variants || variants.length < 2) {
    return { ok: true, variants: variants ?? [] }
  }
  if (variants.length > MAX_KIT_VARIANTS) {
    return {
      ok: false,
      code: 'invalid-variants',
      error: `At most ${MAX_KIT_VARIANTS} named variants allowed`,
    }
  }

  const ids = new Set<string>()
  for (const v of variants) {
    if (!v.id?.trim() || !v.name?.trim()) {
      return { ok: false, code: 'invalid-variants', error: 'Variant id and name required' }
    }
    if (ids.has(v.id)) {
      return { ok: false, code: 'invalid-variants', error: `Duplicate variant id: ${v.id}` }
    }
    ids.add(v.id)
  }

  if (!axesRaw?.length) {
    return {
      ok: true,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        composition: v.composition,
        // Drop orphan combinations when Master has no axes on the wire.
      })),
    }
  }

  const axes = sanitizeKitAxes(axesRaw)
  if (!axes || axes.length !== axesRaw.length) {
    return {
      ok: false,
      code: 'invalid-axes',
      error:
        'Invalid Component Set axes (id format, reserved name, empty values, or over limits)',
    }
  }

  const comboSeen = new Set<string>()
  const nextVariants: KitNamedVariantCell[] = []
  for (const v of variants) {
    const combo = v.combination
    if (!combo || typeof combo !== 'object') {
      return {
        ok: false,
        code: 'invalid-variants',
        error: `Variant "${v.name}" missing combination for Component Set axes`,
      }
    }
    const cleaned: Record<string, string> = {}
    for (const axis of axes) {
      const pick = combo[axis.id]
      if (typeof pick !== 'string' || !axis.values.includes(pick)) {
        return {
          ok: false,
          code: 'invalid-variants',
          error: `Variant "${v.name}" has invalid value for axis ${axis.name}`,
        }
      }
      cleaned[axis.id] = pick
    }
    const key = combinationKey(axes, cleaned)
    if (comboSeen.has(key)) {
      return {
        ok: false,
        code: 'invalid-variants',
        error: `Duplicate combination for variant "${v.name}"`,
      }
    }
    comboSeen.add(key)
    nextVariants.push({
      id: v.id,
      name: v.name,
      composition: v.composition,
      combination: cleaned,
    })
  }

  return { ok: true, variants: nextVariants, axes }
}

/** Escape user strings embedded in generated CSF source. */
export function csfStringLiteral(value: string): string {
  return JSON.stringify(value)
}

/** Block-comment safe (strip closing delimiter). */
export function sanitizeCsfBlockComment(raw: string, fallback: string): string {
  const cleaned = raw.replace(/\*\//g, '* /').trim()
  return cleaned || fallback
}

export type KitOverrideComponentSetSlice = {
  variants?: KitNamedVariantCell[]
  axes?: KitMasterAxis[]
  defaultVariantId?: string
}

/**
 * Soft-sanitize override Component Set fields for **read** / hydrate.
 * Drops illegal axes; falls back to flat named variants when combinations are incomplete.
 * Never throws — Storybook must keep painting.
 */
export function sanitizeKitOverrideComponentSet(
  input: KitOverrideComponentSetSlice,
): KitOverrideComponentSetSlice {
  const rawVariants = Array.isArray(input.variants) ? input.variants : undefined
  if (!rawVariants?.length) {
    return { defaultVariantId: input.defaultVariantId }
  }

  const variants = rawVariants
    .filter(
      (v) =>
        v &&
        typeof v.id === 'string' &&
        typeof v.name === 'string' &&
        v.id.trim() &&
        v.name.trim(),
    )
    .slice(0, MAX_KIT_VARIANTS)
    .map((v) => ({
      id: v.id.trim(),
      name: v.name.trim(),
      composition: v.composition,
      ...(v.combination && typeof v.combination === 'object'
        ? { combination: { ...v.combination } }
        : {}),
    }))

  if (variants.length < 2) {
    return {
      variants: variants.length ? variants : undefined,
      defaultVariantId: input.defaultVariantId,
    }
  }

  const axes = sanitizeKitAxes(input.axes)
  if (!axes) {
    return {
      variants: variants.map(({ id, name, composition }) => ({ id, name, composition })),
      defaultVariantId:
        input.defaultVariantId && variants.some((v) => v.id === input.defaultVariantId)
          ? input.defaultVariantId
          : variants[0]?.id,
    }
  }

  const kept: KitNamedVariantCell[] = []
  const comboSeen = new Set<string>()
  for (const v of variants) {
    const combo = v.combination
    if (!combo) continue
    const cleaned: Record<string, string> = {}
    let ok = true
    for (const axis of axes) {
      const pick = combo[axis.id]
      if (typeof pick !== 'string' || !axis.values.includes(pick)) {
        ok = false
        break
      }
      cleaned[axis.id] = pick
    }
    if (!ok) continue
    const key = combinationKey(axes, cleaned)
    if (comboSeen.has(key)) continue
    comboSeen.add(key)
    kept.push({
      id: v.id,
      name: v.name,
      composition: v.composition,
      combination: cleaned,
    })
  }

  if (kept.length < 2) {
    return {
      variants: variants.map(({ id, name, composition }) => ({ id, name, composition })),
      defaultVariantId:
        input.defaultVariantId && variants.some((v) => v.id === input.defaultVariantId)
          ? input.defaultVariantId
          : variants[0]?.id,
    }
  }

  const defaultVariantId =
    input.defaultVariantId && kept.some((v) => v.id === input.defaultVariantId)
      ? input.defaultVariantId
      : kept[0]?.id

  return { variants: kept, axes, defaultVariantId }
}
