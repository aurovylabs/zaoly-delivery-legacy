import type { InspectFieldDef } from './field-catalog'

export const FILL_EXPANDED_KEY = 'creation-editor-inspect-fill-expanded'

/** Always shown in the compact Fill / Color / Stroke row. */
export const FILL_TRIPLET_KEYS = ['background', 'color', 'borderColor'] as const

/** Shown only when the fill group is expanded (or auto-expanded). */
export const FILL_EXPAND_KEYS = ['borderWidth', 'borderStyle', 'gradient'] as const

/** Background image and container media fill keys. */
export const FILL_MEDIA_KEYS = [
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundOverlay',
] as const

export const FILL_GROUP_KEYS = [...FILL_TRIPLET_KEYS, ...FILL_EXPAND_KEYS, ...FILL_MEDIA_KEYS] as const

export const FILL_FIELD_NAMES = new Set<string>(FILL_GROUP_KEYS)

export function compactFillLabel(name: string): string {
  const map: Record<string, string> = {
    background: 'Fill',
    color: 'Color',
    borderColor: 'Stroke',
    borderWidth: 'Width',
    borderStyle: 'Style',
    gradient: 'Grad',
    backgroundImage: 'Image',
    backgroundSize: 'Size',
    backgroundPosition: 'Pos',
    backgroundRepeat: 'Repeat',
    backgroundOverlay: 'Overlay',
  }
  return map[name] ?? name
}

export function isFillGroupedField(name: string): boolean {
  return FILL_FIELD_NAMES.has(name)
}

export function partitionInspectFillFields(fields: InspectFieldDef[]): {
  fill: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const fill: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isFillGroupedField(field.name)) fill.push(field)
    else rest.push(field)
  }
  return { fill, rest }
}

type FillSource = {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

function hasBinding(source: FillSource, key: string): boolean {
  const binding = source.tokenBindings?.[key]
  return typeof binding === 'string' && binding.length > 0
}

function hasLiteral(source: FillSource, key: string): boolean {
  const raw = source.props?.[key]
  return raw != null && String(raw).trim() !== ''
}

export function hasFillValue(source: FillSource, key: string): boolean {
  return hasBinding(source, key) || hasLiteral(source, key)
}

export function hasBackgroundMedia(source: FillSource): boolean {
  return hasFillValue(source, 'backgroundImage')
}

export function shouldAutoExpandFillGroup(source: FillSource): boolean {
  return FILL_EXPAND_KEYS.some((key) => hasFillValue(source, key)) || hasBackgroundMedia(source)
}

export function readFillExpanded(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(FILL_EXPANDED_KEY) === 'true'
  } catch {
    return false
  }
}

export function writeFillExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(FILL_EXPANDED_KEY, expanded ? 'true' : 'false')
  } catch {
    /* ignore quota / privacy mode */
  }
}
