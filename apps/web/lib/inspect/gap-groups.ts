import type { InspectFieldDef } from './field-catalog'

export type GapWriteMode = 'uniform' | 'axis'

export type GapGroupMode = 'empty' | 'uniform' | 'axis' | 'mixed'

export const GAP_EXPANDED_KEY = 'creation-editor-inspect-gap-expanded'

export const GAP_GROUP_KEYS = ['gap', 'rowGap', 'columnGap'] as const

export const GAP_FIELD_NAMES = new Set<string>(GAP_GROUP_KEYS)

export function isGapGroupedField(name: string): boolean {
  return GAP_FIELD_NAMES.has(name)
}

export function partitionInspectGapFields(fields: InspectFieldDef[]): {
  gap: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const gap: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isGapGroupedField(field.name)) gap.push(field)
    else rest.push(field)
  }
  return { gap, rest }
}

type GapSource = {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

function hasBinding(source: GapSource, key: string): boolean {
  const binding = source.tokenBindings?.[key]
  return typeof binding === 'string' && binding.length > 0
}

function hasLiteral(source: GapSource, key: string): boolean {
  const raw = source.props?.[key]
  return raw != null && String(raw).trim() !== ''
}

function hasValue(source: GapSource, key: string): boolean {
  return hasBinding(source, key) || hasLiteral(source, key)
}

function displayValue(source: GapSource, key: string): string {
  if (hasBinding(source, key)) return source.tokenBindings![key]!
  if (hasLiteral(source, key)) return String(source.props![key])
  return ''
}

export function gapGroupMode(source: GapSource): GapGroupMode {
  const uniform = hasValue(source, 'gap')
  const setAxis = (['rowGap', 'columnGap'] as const).filter((key) => hasValue(source, key))

  if (setAxis.length > 0) {
    if (uniform) return 'mixed'
    const axisValues = [...new Set(setAxis.map((key) => displayValue(source, key)).filter(Boolean))]
    if (axisValues.length > 1) return 'mixed'
    return 'axis'
  }

  if (uniform) return 'uniform'
  return 'empty'
}

export function shouldAutoExpandGapGroup(mode: GapGroupMode): boolean {
  return mode === 'axis' || mode === 'mixed'
}

/** Uniform write clears axes; axis write clears uniform `gap` only. */
export function gapSiblingKeysToClear(writeMode: GapWriteMode, writtenKey: string): string[] {
  if (writeMode === 'uniform') {
    return GAP_GROUP_KEYS.filter((key) => key !== writtenKey)
  }
  return writtenKey === 'gap' ? [] : ['gap']
}

export function readGapExpanded(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(GAP_EXPANDED_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeGapExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(GAP_EXPANDED_KEY, expanded ? 'true' : 'false')
  } catch {
    /* ignore quota / privacy mode */
  }
}
