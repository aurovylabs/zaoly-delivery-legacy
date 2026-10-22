import type { InspectFieldDef } from './field-catalog'

export type BoxModelKind = 'padding' | 'margin' | 'radius'

export type BoxModelWriteMode = 'uniform' | 'axis' | 'sides' | 'corners'

export type BoxModelGroupMode = 'empty' | 'uniform' | 'axis' | 'sides' | 'corners' | 'mixed'

export const BOX_MODEL_EXPANDED_KEY = 'creation-editor-inspect-box-expanded'

export const PADDING_GROUP_KEYS = [
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'paddingBlock',
  'paddingInline',
] as const

export const MARGIN_GROUP_KEYS = [
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'marginBlock',
  'marginInline',
] as const

export const RADIUS_GROUP_KEYS = [
  'radius',
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomRight',
  'radiusBottomLeft',
] as const

export const BOX_MODEL_FIELD_NAMES = new Set<string>([
  ...PADDING_GROUP_KEYS,
  ...MARGIN_GROUP_KEYS,
  ...RADIUS_GROUP_KEYS,
])

const SIDE_KEYS: Record<'padding' | 'margin', readonly string[]> = {
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
}

const AXIS_KEYS: Record<'padding' | 'margin', readonly string[]> = {
  padding: ['paddingBlock', 'paddingInline'],
  margin: ['marginBlock', 'marginInline'],
}

const CORNER_KEYS = [
  'radiusTopLeft',
  'radiusTopRight',
  'radiusBottomRight',
  'radiusBottomLeft',
] as const

export function boxModelGroupKeys(kind: BoxModelKind): readonly string[] {
  if (kind === 'padding') return PADDING_GROUP_KEYS
  if (kind === 'margin') return MARGIN_GROUP_KEYS
  return RADIUS_GROUP_KEYS
}

export function isBoxModelGroupedField(name: string): boolean {
  return BOX_MODEL_FIELD_NAMES.has(name)
}

export function partitionInspectBoxModelFields(fields: InspectFieldDef[]): {
  padding: InspectFieldDef[]
  margin: InspectFieldDef[]
  radius: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const padding: InspectFieldDef[] = []
  const margin: InspectFieldDef[] = []
  const radius: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if ((PADDING_GROUP_KEYS as readonly string[]).includes(field.name)) padding.push(field)
    else if ((MARGIN_GROUP_KEYS as readonly string[]).includes(field.name)) margin.push(field)
    else if ((RADIUS_GROUP_KEYS as readonly string[]).includes(field.name)) radius.push(field)
    else rest.push(field)
  }
  return { padding, margin, radius, rest }
}

type BoxModelSource = {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

function hasBinding(source: BoxModelSource, key: string): boolean {
  const binding = source.tokenBindings?.[key]
  return typeof binding === 'string' && binding.length > 0
}

function hasLiteral(source: BoxModelSource, key: string): boolean {
  const raw = source.props?.[key]
  return raw != null && String(raw).trim() !== ''
}

function hasValue(source: BoxModelSource, key: string): boolean {
  return hasBinding(source, key) || hasLiteral(source, key)
}

function displayValue(source: BoxModelSource, key: string): string {
  if (hasBinding(source, key)) return source.tokenBindings![key]!
  if (hasLiteral(source, key)) return String(source.props![key])
  return ''
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.filter((v) => v.length > 0))]
}

export function boxModelGroupMode(
  source: BoxModelSource,
  kind: BoxModelKind,
): BoxModelGroupMode {
  if (kind === 'radius') {
    const uniform = hasValue(source, 'radius')
    const setCorners = CORNER_KEYS.filter((key) => hasValue(source, key))
    if (setCorners.length === 0) return uniform ? 'uniform' : 'empty'
    if (uniform) return 'mixed'
    const cornerValues = uniqueNonEmpty(setCorners.map((key) => displayValue(source, key)))
    if (cornerValues.length > 1) return 'mixed'
    if (setCorners.length === 4 && cornerValues.length === 1) return 'uniform'
    return 'corners'
  }

  const uniformKey = kind
  const sideKeys = SIDE_KEYS[kind]
  const axisKeys = AXIS_KEYS[kind]
  const uniform = hasValue(source, uniformKey)
  const setSides = sideKeys.filter((key) => hasValue(source, key))
  const setAxis = axisKeys.filter((key) => hasValue(source, key))

  if (setSides.length > 0) {
    if (uniform || setAxis.length > 0) return 'mixed'
    const sideValues = uniqueNonEmpty(setSides.map((key) => displayValue(source, key)))
    if (sideValues.length > 1) return 'mixed'
    if (setSides.length === 4 && sideValues.length === 1) return 'uniform'
    return 'sides'
  }

  if (setAxis.length > 0) {
    if (uniform) return 'mixed'
    return 'axis'
  }

  if (uniform) return 'uniform'
  return 'empty'
}

export function shouldAutoExpandBoxGroup(mode: BoxModelGroupMode): boolean {
  return mode === 'sides' || mode === 'corners' || mode === 'mixed'
}

export function siblingKeysToClear(
  kind: BoxModelKind,
  writeMode: BoxModelWriteMode,
  writtenKey: string,
): string[] {
  const all = boxModelGroupKeys(kind)
  if (writeMode === 'uniform') {
    return all.filter((key) => key !== writtenKey)
  }
  if (writeMode === 'axis') {
    const keep = new Set<string>(AXIS_KEYS[kind as 'padding' | 'margin'])
    keep.add(writtenKey)
    return all.filter((key) => !keep.has(key))
  }
  if (writeMode === 'sides') {
    const keep = new Set<string>(SIDE_KEYS[kind as 'padding' | 'margin'])
    keep.add(writtenKey)
    return all.filter((key) => !keep.has(key))
  }
  const keep = new Set<string>(CORNER_KEYS)
  keep.add(writtenKey)
  return all.filter((key) => !keep.has(key))
}

export function compactWriteModeForKey(
  kind: BoxModelKind,
  key: string,
  expanded: boolean,
): BoxModelWriteMode {
  if (kind === 'radius') {
    return key === 'radius' ? 'uniform' : 'corners'
  }
  if (key === kind) return 'uniform'
  if (expanded || (SIDE_KEYS[kind] as readonly string[]).includes(key)) return 'sides'
  return 'axis'
}

export type BoxExpandedMap = Partial<Record<BoxModelKind, boolean>>

export function readBoxExpanded(): BoxExpandedMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(BOX_MODEL_EXPANDED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as BoxExpandedMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writeBoxExpanded(kind: BoxModelKind, expanded: boolean): void {
  if (typeof window === 'undefined') return
  try {
    const prev = readBoxExpanded()
    window.sessionStorage.setItem(
      BOX_MODEL_EXPANDED_KEY,
      JSON.stringify({ ...prev, [kind]: expanded }),
    )
  } catch {
    /* ignore quota / privacy mode */
  }
}
