/**
 * Resolve a Master cell from Storybook Controls / Catalog picks.
 * Spec: composition-masters.md · site-kit-write.md
 */
import type { KitMasterAxis, KitNamedVariantCell } from './types'

export function axisPicksFromArgs(
  axes: KitMasterAxis[] | undefined,
  args: Record<string, unknown>,
): Record<string, string> | null {
  if (!axes?.length) return null
  const picks: Record<string, string> = {}
  for (const axis of axes) {
    const raw = args[axis.id]
    if (typeof raw !== 'string' || !raw.trim()) return null
    if (!axis.values.includes(raw)) return null
    picks[axis.id] = raw
  }
  return picks
}

export function findVariantByAxisPicks<T extends KitNamedVariantCell>(
  variants: T[],
  axes: KitMasterAxis[],
  picks: Record<string, string>,
): T | null {
  if (!axes.length || !variants.length) return null
  return (
    variants.find((v) =>
      axes.every((axis) => (v.combination?.[axis.id] ?? '') === (picks[axis.id] ?? '')),
    ) ?? null
  )
}

export function defaultAxisPicks(
  axes: KitMasterAxis[] | undefined,
  defaultCell?: KitNamedVariantCell | null,
): Record<string, string> {
  const out: Record<string, string> = {}
  if (!axes?.length) return out
  for (const axis of axes) {
    const fromCell = defaultCell?.combination?.[axis.id]
    out[axis.id] =
      fromCell && axis.values.includes(fromCell) ? fromCell : (axis.values[0] ?? '')
  }
  return out
}

export function storyExportGuess(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return 'Variant'
  if (/^[A-Z][A-Za-z0-9]*$/.test(trimmed)) return trimmed.slice(0, 48)
  const parts = trimmed.split(/[^A-Za-z0-9]+/).filter(Boolean)
  if (!parts.length) return 'Variant'
  const named = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
    .slice(0, 48)
  return /^[A-Za-z]/.test(named) ? named : `V${named}`
}

export function findVariantByNameOrId<T extends KitNamedVariantCell>(
  variants: T[],
  preferred?: string | null,
): T | null {
  if (!variants.length) return null
  if (preferred) {
    const needle = preferred.trim().toLowerCase()
    const byName = variants.find((v) => v.name.trim().toLowerCase() === needle)
    if (byName) return byName
    const byId = variants.find((v) => v.id === preferred)
    if (byId) return byId
    const byExport = variants.find((v) => storyExportGuess(v.name) === preferred)
    if (byExport) return byExport
  }
  return variants[0] ?? null
}

export type ResolveMasterOverrideInput<T extends KitNamedVariantCell = KitNamedVariantCell> = {
  variants: T[]
  axes?: KitMasterAxis[]
  defaultVariantId?: string
  args: Record<string, unknown>
  storyName?: string
}

/** Prefer axis combination picks, then flat name/id, then default cell. */
export function resolveMasterOverrideVariant<T extends KitNamedVariantCell>(
  input: ResolveMasterOverrideInput<T>,
): T | null {
  const { variants, axes, args, storyName, defaultVariantId } = input
  if (variants.length < 2) return variants[0] ?? null

  if (axes?.length) {
    const picks = axisPicksFromArgs(axes, args)
    if (picks) {
      const byAxes = findVariantByAxisPicks(variants, axes, picks)
      if (byAxes) return byAxes
    }
  }

  if (typeof args.variant === 'string' && args.variant.trim()) {
    const byControl = findVariantByNameOrId(variants, args.variant)
    if (byControl) return byControl
  }
  if (typeof args.masterVariant === 'string' && args.masterVariant.trim()) {
    const byMaster = findVariantByNameOrId(variants, args.masterVariant)
    if (byMaster) return byMaster
  }
  if (typeof args.variantName === 'string' && args.variantName.trim()) {
    const byName = findVariantByNameOrId(variants, args.variantName)
    if (byName) return byName
  }
  if (storyName && storyName !== 'Docs') {
    const byStory = findVariantByNameOrId(variants, storyName)
    if (byStory) return byStory
  }
  if (defaultVariantId) {
    const def = variants.find((v) => v.id === defaultVariantId)
    if (def) return def
  }
  return variants[0] ?? null
}
