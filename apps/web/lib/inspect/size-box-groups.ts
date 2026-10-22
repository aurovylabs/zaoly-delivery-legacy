import type { InspectFieldDef } from './field-catalog'

export const SIZE_BOX_EXPANDED_KEY = 'creation-editor-inspect-size-expanded'

export const SIZE_BOX_GROUP_KEYS = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
] as const

export const SIZE_BOX_FIELD_NAMES = new Set<string>(SIZE_BOX_GROUP_KEYS)

const MIN_MAX_KEYS = ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'] as const

export function compactSizeLabel(name: string): string {
  const map: Record<string, string> = {
    width: 'W',
    height: 'H',
    minWidth: 'minW',
    maxWidth: 'maxW',
    minHeight: 'minH',
    maxHeight: 'maxH',
  }
  return map[name] ?? name
}

export function isSizeBoxGroupedField(name: string): boolean {
  return SIZE_BOX_FIELD_NAMES.has(name)
}

export function partitionInspectSizeBoxFields(fields: InspectFieldDef[]): {
  sizeBox: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const sizeBox: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isSizeBoxGroupedField(field.name)) sizeBox.push(field)
    else rest.push(field)
  }
  return { sizeBox, rest }
}

export type SizeBoxSource = {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

function hasBinding(source: SizeBoxSource, key: string): boolean {
  const binding = source.tokenBindings?.[key]
  return typeof binding === 'string' && binding.length > 0
}

function hasLiteral(source: SizeBoxSource, key: string): boolean {
  const raw = source.props?.[key]
  return raw != null && String(raw).trim() !== ''
}

export function hasSizeValue(source: SizeBoxSource, key: string): boolean {
  return hasBinding(source, key) || hasLiteral(source, key)
}

export function constraintAxisMode(
  source: SizeBoxSource,
  axis: 'width' | 'height',
): 'hug' | 'fixed' {
  return hasSizeValue(source, axis) ? 'fixed' : 'hug'
}

export function constraintsSummaryBadge(source: SizeBoxSource): string {
  const w = constraintAxisMode(source, 'width')
  const h = constraintAxisMode(source, 'height')
  const label = (mode: 'hug' | 'fixed') => (mode === 'hug' ? 'Hug' : 'Fixed')
  return `W ${label(w)} · H ${label(h)}`
}

export function shouldAutoExpandSizeBox(source: SizeBoxSource): boolean {
  return MIN_MAX_KEYS.some((key) => hasSizeValue(source, key))
}

export function readSizeExpanded(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(SIZE_BOX_EXPANDED_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeSizeExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(SIZE_BOX_EXPANDED_KEY, expanded ? 'true' : 'false')
  } catch {
    /* ignore quota / privacy mode */
  }
}
