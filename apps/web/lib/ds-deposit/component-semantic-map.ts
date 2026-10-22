/**
 * DS-DEPOSIT D5 — copied consume map (no runtime upstream pack dependency).
 * Canonical sibling: ds-deposit-component-semantic-map.json (see knowledge/paths.md).
 * Sync: blobs must match (tests).
 */
import type { InspectFieldDef } from '../inspect/field-catalog'
import mapJson from './component-semantic-map.json'

export type ConsumeRef = {
  css: string | null
  path: string | null
  role: string
  aliasPath?: string
  note?: string
  literal?: string
}

export type ConsumeEntry = {
  component: string
  prop: string
  value: string
  source?: string
  consumes: ConsumeRef[]
  notes?: string[]
}

export type ConsumeMapDoc = {
  version: number
  wave: string
  defaults: Record<string, Record<string, string>>
  entries: ConsumeEntry[]
}

export const COMPONENT_SEMANTIC_MAP = mapJson as ConsumeMapDoc

const ROLE_TO_INSPECT_FIELD: Record<string, string> = {
  background: 'background',
  color: 'color',
  foreground: 'color',
  border: 'borderColor',
  'border-color': 'borderColor',
  gap: 'gap',
  radius: 'radius',
  padding: 'padding',
  margin: 'margin',
  'font-size': 'fontSize',
  'font-family': 'fontFamily',
  'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing',
}

function normalizePropValue(raw: unknown): string {
  if (raw === true || raw === 'true') return 'true'
  if (raw === false || raw === 'false') return 'false'
  if (raw == null || raw === '') return ''
  return String(raw)
}

export function lookupConsumeEntries(
  component: string,
  props: Record<string, unknown>,
  map: ConsumeMapDoc = COMPONENT_SEMANTIC_MAP,
): ConsumeEntry[] {
  const defaults = map.defaults[component] ?? {}
  return map.entries.filter((entry) => {
    if (entry.component !== component) return false
    if (entry.prop === '*' && entry.value === '*') return true
    const raw = props[entry.prop]
    const current = normalizePropValue(raw) || defaults[entry.prop] || ''
    return current === entry.value
  })
}

export function uniqueConsumePaths(entries: ConsumeEntry[]): ConsumeRef[] {
  const seen = new Set<string>()
  const out: ConsumeRef[] = []
  for (const entry of entries) {
    for (const ref of entry.consumes) {
      if (!ref.path) continue
      const key = `${ref.path}::${ref.role}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(ref)
    }
  }
  return out
}

export function lookupConsumePaths(
  component: string,
  props: Record<string, unknown>,
  map: ConsumeMapDoc = COMPONENT_SEMANTIC_MAP,
): ConsumeRef[] {
  return uniqueConsumePaths(lookupConsumeEntries(component, props, map))
}

export type SuggestedBind = {
  field: string
  path: string
  role: string
}

/** Read-only hint: matching inspect token fields. Never auto-writes tokenBindings. */
export function suggestedBinds(
  consumes: ConsumeRef[],
  fields: InspectFieldDef[],
  existingBindings: Record<string, string | undefined> = {},
): SuggestedBind[] {
  const byName = new Map(fields.filter((f) => f.kind === 'token').map((f) => [f.name, f]))
  const seen = new Set<string>()
  const out: SuggestedBind[] = []
  for (const ref of consumes) {
    if (!ref.path) continue
    const fieldName = ROLE_TO_INSPECT_FIELD[ref.role]
    if (!fieldName) continue
    const field = byName.get(fieldName)
    if (!field) continue
    if (existingBindings[fieldName]) continue
    const key = `${fieldName}::${ref.path}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ field: fieldName, path: ref.path, role: ref.role })
  }
  return out
}
