import type { InspectFieldDef } from './field-catalog'

export const ALIGN_SELF_FIELD_NAME = 'alignSelf'

export type AlignSelfValue =
  | 'auto'
  | 'stretch'
  | 'flex-start'
  | 'center'
  | 'flex-end'

export type AlignSelfPinRow = 'start' | 'center' | 'end'

/** 3×3 cells: each cell belongs to a pin row that maps to alignSelf. */
export const ALIGN_SELF_PIN_CELLS: Array<{
  id: string
  row: AlignSelfPinRow
  col: 'left' | 'mid' | 'right'
  value: AlignSelfValue
}> = [
  { id: 'tl', row: 'start', col: 'left', value: 'flex-start' },
  { id: 'tc', row: 'start', col: 'mid', value: 'flex-start' },
  { id: 'tr', row: 'start', col: 'right', value: 'flex-start' },
  { id: 'ml', row: 'center', col: 'left', value: 'center' },
  { id: 'mc', row: 'center', col: 'mid', value: 'center' },
  { id: 'mr', row: 'center', col: 'right', value: 'center' },
  { id: 'bl', row: 'end', col: 'left', value: 'flex-end' },
  { id: 'bc', row: 'end', col: 'mid', value: 'flex-end' },
  { id: 'br', row: 'end', col: 'right', value: 'flex-end' },
]

export function isAlignSelfField(name: string): boolean {
  return name === ALIGN_SELF_FIELD_NAME
}

export function partitionInspectAlignSelfFields(fields: InspectFieldDef[]): {
  alignSelf: InspectFieldDef | null
  rest: InspectFieldDef[]
} {
  let alignSelf: InspectFieldDef | null = null
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isAlignSelfField(field.name)) alignSelf = field
    else rest.push(field)
  }
  return { alignSelf, rest }
}

export function normalizeAlignSelfValue(raw: string): AlignSelfValue | '' {
  const v = raw.trim()
  if (
    v === 'auto' ||
    v === 'stretch' ||
    v === 'flex-start' ||
    v === 'center' ||
    v === 'flex-end'
  ) {
    return v
  }
  if (v === 'start') return 'flex-start'
  if (v === 'end') return 'flex-end'
  return ''
}

export function alignSelfPinRow(value: AlignSelfValue | ''): AlignSelfPinRow | null {
  if (value === 'flex-start') return 'start'
  if (value === 'center') return 'center'
  if (value === 'flex-end') return 'end'
  return null
}

/** Toggle: clicking the active pin/mode again clears to auto. */
export function nextAlignSelfValue(
  current: AlignSelfValue | '',
  next: AlignSelfValue,
): AlignSelfValue {
  if (current === next) return 'auto'
  return next
}
