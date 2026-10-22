import type { InspectFieldDef } from './field-catalog'

/** Token / length stack shown with compact labels. */
export const TYPE_STACK_KEYS = [
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
] as const

/** Bare icon ToggleGroups in the text chrome bar. */
export const TYPE_CHROME_KEYS = ['textAlign', 'textDecoration', 'textTransform'] as const

export const TYPE_GROUP_KEYS = [...TYPE_STACK_KEYS, ...TYPE_CHROME_KEYS] as const

export const TYPE_FIELD_NAMES = new Set<string>(TYPE_GROUP_KEYS)

export function compactTypeLabel(name: string): string {
  const map: Record<string, string> = {
    fontFamily: 'Font',
    fontSize: 'Size',
    fontWeight: 'Wt',
    lineHeight: 'LH',
    letterSpacing: 'Track',
  }
  return map[name] ?? name
}

export function isTypographyGroupedField(name: string): boolean {
  return TYPE_FIELD_NAMES.has(name)
}

export function partitionInspectTypographyFields(fields: InspectFieldDef[]): {
  typeStack: InspectFieldDef[]
  typeChrome: InspectFieldDef[]
  rest: InspectFieldDef[]
} {
  const typeStack: InspectFieldDef[] = []
  const typeChrome: InspectFieldDef[] = []
  const rest: InspectFieldDef[] = []
  for (const field of fields) {
    if ((TYPE_STACK_KEYS as readonly string[]).includes(field.name)) typeStack.push(field)
    else if ((TYPE_CHROME_KEYS as readonly string[]).includes(field.name)) typeChrome.push(field)
    else rest.push(field)
  }
  return { typeStack, typeChrome, rest }
}
