/**
 * Parse Kit Write / composition API bodies for axes + cells.
 * Spec: site-kit-write.md
 */
import type { KitMasterAxis, KitNamedVariantCell } from './types'
import { sanitizeKitAxes } from './validate-wire'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function parseKitAxesWire(raw: unknown): KitMasterAxis[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const axes: KitMasterAxis[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    if (typeof item.id !== 'string' || !item.id.trim()) continue
    if (typeof item.name !== 'string' || !item.name.trim()) continue
    if (!Array.isArray(item.values)) continue
    const values = item.values.filter((v): v is string => typeof v === 'string' && !!v.trim())
    if (!values.length) continue
    axes.push({ id: item.id, name: item.name, values })
  }
  return sanitizeKitAxes(axes)
}

export function parseKitCombinationWire(
  raw: unknown,
): Record<string, string> | undefined {
  if (!isRecord(raw)) return undefined
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k === 'string' && typeof v === 'string') out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

export function parseKitVariantsWire(
  raw: unknown,
): KitNamedVariantCell[] | undefined {
  if (!Array.isArray(raw) || raw.length < 2) return undefined
  const variants: KitNamedVariantCell[] = []
  for (const item of raw) {
    if (!isRecord(item)) continue
    if (typeof item.id !== 'string' || typeof item.name !== 'string') continue
    if (!isRecord(item.composition)) continue
    const combination = parseKitCombinationWire(item.combination)
    variants.push({
      id: item.id,
      name: item.name,
      composition: item.composition,
      ...(combination ? { combination } : {}),
    })
  }
  return variants.length >= 2 ? variants : undefined
}
