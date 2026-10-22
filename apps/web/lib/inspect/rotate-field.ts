import type { InspectFieldDef } from './field-catalog'

export const ROTATE_FIELD_NAME = 'rotate'

export function compactRotateLabel(_name: string = ROTATE_FIELD_NAME): string {
  return '°'
}

export function isRotateField(name: string): boolean {
  return name === ROTATE_FIELD_NAME
}

export function partitionInspectRotateFields(fields: InspectFieldDef[]): {
  rotate: InspectFieldDef | null
  rest: InspectFieldDef[]
} {
  let rotate: InspectFieldDef | null = null
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if (isRotateField(field.name)) rotate = field
    else rest.push(field)
  }
  return { rotate, rest }
}
