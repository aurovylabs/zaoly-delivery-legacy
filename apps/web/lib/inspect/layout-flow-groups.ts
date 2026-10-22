import type { InspectFieldDef } from './field-catalog'

export const LAYOUT_FLOW_KEYS = ['direction', 'wrap'] as const

export const LAYOUT_ALIGN_KEYS = [
  'align',
  'alignItems',
  'justify',
  'justifyContent',
] as const

export const LAYOUT_FLOW_FIELD_NAMES = new Set<string>(LAYOUT_FLOW_KEYS)
export const LAYOUT_ALIGN_FIELD_NAMES = new Set<string>(LAYOUT_ALIGN_KEYS)

/** Catalog types that use Grid layout IA (P98). */
export const GRID_LAYOUT_TYPES = new Set([
  'Grid',
  'SiteGrid',
  'PrintPersonaGrid',
])

export function isGridLayoutType(type: string | undefined | null): boolean {
  if (!type) return false
  return GRID_LAYOUT_TYPES.has(type)
}

export function isLayoutFlowGroupedField(name: string): boolean {
  return LAYOUT_FLOW_FIELD_NAMES.has(name)
}

export function isLayoutAlignGroupedField(name: string): boolean {
  return LAYOUT_ALIGN_FIELD_NAMES.has(name)
}

export function isLayoutFlowOrAlignGroupedField(name: string): boolean {
  return isLayoutFlowGroupedField(name) || isLayoutAlignGroupedField(name)
}

export function partitionInspectLayoutFlowFields(fields: InspectFieldDef[]): {
  flow: InspectFieldDef[]
  align: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const flow: InspectFieldDef[] = []
  const align: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isLayoutFlowGroupedField(field.name)) flow.push(field)
    else if (isLayoutAlignGroupedField(field.name)) align.push(field)
    else rest.push(field)
  }
  return { flow, align, rest }
}

/** Prefer Stack `justify` / `align` over shared `justifyContent` / `alignItems`. */
export function pickJustifyField(fields: InspectFieldDef[]): InspectFieldDef | undefined {
  return fields.find((f) => f.name === 'justify') ?? fields.find((f) => f.name === 'justifyContent')
}

export function pickAlignField(fields: InspectFieldDef[]): InspectFieldDef | undefined {
  return fields.find((f) => f.name === 'align') ?? fields.find((f) => f.name === 'alignItems')
}

export type AlignAxisKeys = {
  justifyKey: 'justify' | 'justifyContent'
  alignKey: 'align' | 'alignItems'
}

/** Catalog-driven write keys for the Align matrix (P98). */
export function resolveAlignAxisKeys(fields: InspectFieldDef[]): AlignAxisKeys | null {
  const justify = pickJustifyField(fields)
  const align = pickAlignField(fields)
  if (!justify && !align) return null
  return {
    justifyKey: (justify?.name === 'justify' ? 'justify' : 'justifyContent') as AlignAxisKeys['justifyKey'],
    alignKey: (align?.name === 'align' ? 'align' : 'alignItems') as AlignAxisKeys['alignKey'],
  }
}

function cssAxisValue(raw: unknown): string {
  if (raw == null || raw === '') return ''
  const text = String(raw).trim()
  if (text === 'start') return 'flex-start'
  if (text === 'end') return 'flex-end'
  return text
}

/**
 * Read matrix axes from scene props using catalog keys, with legacy CSS-name fallback.
 */
export function readAlignAxisValues(
  props: Record<string, unknown> | undefined | null,
  fields: InspectFieldDef[],
): { justify: string; align: string } {
  const keys = resolveAlignAxisKeys(fields)
  const jcPrimary = keys ? cssAxisValue(props?.[keys.justifyKey]) : ''
  const aiPrimary = keys ? cssAxisValue(props?.[keys.alignKey]) : ''
  const jcFallback = cssAxisValue(props?.justifyContent) || cssAxisValue(props?.justify)
  const aiFallback = cssAxisValue(props?.alignItems) || cssAxisValue(props?.align)
  return {
    justify: jcPrimary || jcFallback || 'flex-start',
    align: aiPrimary || aiFallback || 'flex-start',
  }
}

export function shouldShowAlignContent(
  props: Record<string, unknown> | undefined,
): boolean {
  const wrap = props?.wrap
  return wrap === true || wrap === 'true'
}

export function filterAlignContentUnlessWrap(
  fields: InspectFieldDef[],
  props: Record<string, unknown> | undefined,
): InspectFieldDef[] {
  if (shouldShowAlignContent(props)) return fields
  return fields.filter((field) => field.name !== 'alignContent')
}
