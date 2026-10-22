import {
  contractPropsForType,
  extendablePrimitiveProps,
  genericCatalogInspectProps,
  getComponentContract,
  sharedStylePropsForType,
  type ContractPropDef,
} from '@zaoly/contracts'
import type { InspectSectionId } from './sections'
import type { TokenGroupId } from './token-catalog'
import { hasSiteKitContract, siteKitContractProps } from './site-kit-fields'

export type InspectFieldKind = 'string' | 'enum' | 'boolean' | 'token' | 'readonly'

export type InspectFieldControl = 'select' | 'segmented'

export type InspectFieldDef = {
  name: string
  label: string
  kind: InspectFieldKind
  section: InspectSectionId
  /** Node types that expose this field; `*` = all Top-N */
  appliesTo: string[] | '*'
  options?: Array<{ value: string; label: string }>
  tokenGroup?: TokenGroupId
  /** Default prop value hint when unset */
  defaultValue?: string
  /** P22: variant-axis enum from registry (variant / size / tone / …). */
  variantAxis?: boolean
  /** P23: short axes use ToggleGroup. */
  control?: InspectFieldControl
}

/** Adjacent token/enum pairs rendered as a 2-col inspect row (Penpot density). */
export const INSPECT_FIELD_PAIRS: Array<[string, string]> = [
  ['width', 'height'],
  ['minWidth', 'maxWidth'],
  ['minHeight', 'maxHeight'],
  ['paddingTop', 'paddingBottom'],
  ['paddingLeft', 'paddingRight'],
  ['paddingBlock', 'paddingInline'],
  ['marginTop', 'marginBottom'],
  ['marginLeft', 'marginRight'],
  ['marginBlock', 'marginInline'],
  ['rowGap', 'columnGap'],
  ['justifyContent', 'alignItems'],
  ['fontSize', 'fontWeight'],
  ['lineHeight', 'letterSpacing'],
  ['clipInsetTopLeftX', 'clipInsetTopLeftY'],
  ['clipInsetTopRightX', 'clipInsetTopRightY'],
  ['clipInsetBottomRightX', 'clipInsetBottomRightY'],
  ['clipInsetBottomLeftX', 'clipInsetBottomLeftY'],
]

export type InspectFieldRow = InspectFieldDef | [InspectFieldDef, InspectFieldDef]

/** Unset surface fields show this placeholder and still accept input (P56). */
export const INSPECT_UNSET_PLACEHOLDER = '—'

/**
 * P57: DESIGN length fields stay typable literals (escape hatch).
 * P76: TokenPicker is restored for these groups (Zaoly recommendations) —
 * previously bypassed because empty TokenPicker strips swallowed keys.
 * Kept as documentation of which groups pair literal + picker.
 */
export const INSPECT_LENGTH_TOKEN_GROUPS: TokenGroupId[] = [
  'size',
  'space',
  'radius',
  'opacity',
  'blur',
  'rotate',
]

/** @deprecated P76 — use INSPECT_LENGTH_TOKEN_GROUPS; no longer hides the picker. */
export const INSPECT_LITERAL_TOKEN_GROUPS = INSPECT_LENGTH_TOKEN_GROUPS

/** Every token group with catalog options shows TokenPicker (P76); literals live in the same strip (`allowLiteral`). */
export function inspectUsesTokenPicker(group: TokenGroupId | undefined): boolean {
  return Boolean(group)
}

export function isLengthTokenGroup(group: TokenGroupId | undefined): boolean {
  if (!group) return false
  return (INSPECT_LENGTH_TOKEN_GROUPS as readonly string[]).includes(group)
}

export function pairInspectFields(fields: InspectFieldDef[]): InspectFieldRow[] {
  const byName = new Map(fields.map((f) => [f.name, f]))
  const used = new Set<string>()
  const rows: InspectFieldRow[] = []

  for (const field of fields) {
    if (used.has(field.name)) continue
    const pair = INSPECT_FIELD_PAIRS.find(([a, b]) => a === field.name || b === field.name)
    if (pair) {
      const left = byName.get(pair[0])
      const right = byName.get(pair[1])
      if (left && right && !used.has(left.name) && !used.has(right.name)) {
        used.add(left.name)
        used.add(right.name)
        rows.push([left, right])
        continue
      }
    }
    used.add(field.name)
    rows.push(field)
  }

  return rows
}

/** Variant UX lite axes — registry enums only (P22). */
export const VARIANT_AXIS_NAMES = [
  'variant',
  'size',
  'tone',
  'shape',
  'role',
  'level',
  'direction',
  'axis',
] as const

export type VariantAxisName = (typeof VARIANT_AXIS_NAMES)[number]

export function isVariantAxisName(name: string): name is VariantAxisName {
  return (VARIANT_AXIS_NAMES as readonly string[]).includes(name)
}

function fromContractProp(prop: ContractPropDef, type: string): InspectFieldDef {
  return {
    name: prop.name,
    label: prop.label,
    kind: prop.kind,
    section: prop.section,
    appliesTo: [type],
    options: prop.options,
    tokenGroup: prop.tokenGroup as TokenGroupId | undefined,
    defaultValue: prop.defaultValue,
    variantAxis: prop.kind === 'enum' && isVariantAxisName(prop.name),
    control: prop.control,
  }
}

/** Flex/grid shells — hide typography Align chrome that collides with layout Align. */
const SITE_KIT_FLEX_SHELLS = new Set(['SiteStack', 'SiteContainer', 'SiteGrid'])
const SITE_KIT_DROP_ON_SHELL = new Set(['textAlign', 'textDecoration', 'textTransform'])
/** Leaves — keep textAlign; drop parent flex Align/Justify (avoid duplicate "Align"). */
const SITE_KIT_DROP_ON_LEAF = new Set([
  'alignItems',
  'justifyContent',
  'align',
  'justify',
  'alignContent',
])

/**
 * Map Site Kit atoms onto typed catalog cousins so SHARED_APPLIES filters apply
 * (no full generic dump → no Grid chrome on Stack / Image).
 * Knowledge: `knowledge/inspector-uniformity.md`
 */
export const SITE_KIT_TYPED_ALIAS: Record<string, string> = {
  SiteStack: 'Stack',
  SiteContainer: 'Stack',
  SiteGrid: 'Grid',
  SiteImage: 'Image',
  SiteButton: 'Button',
  SiteText: 'Text',
  SiteLink: 'Link',
  SiteBadge: 'Badge',
  SiteInput: 'Input',
  SiteTextarea: 'Textarea',
  SiteSelect: 'Select',
  SiteCheckbox: 'Checkbox',
  SiteDivider: 'Divider',
  SiteSvg: 'Image',
  SiteShape: 'Image',
  SiteChart: 'Card',
  SiteGauge: 'Card',
  SiteTable: 'Card',
  SiteTableRow: 'Card',
  SiteTableCell: 'Text',
}

/** Deduplicate confusing Align/Justify surfaces for Site Kit inspect. */
export function filterSiteKitSharedFields(
  type: string,
  fields: InspectFieldDef[],
): InspectFieldDef[] {
  if (SITE_KIT_FLEX_SHELLS.has(type)) {
    return fields.filter((f) => !SITE_KIT_DROP_ON_SHELL.has(f.name))
  }
  return fields.filter((f) => !SITE_KIT_DROP_ON_LEAF.has(f.name))
}

/** Stack-parity flex axis extras (typed Stack owns these; shared applies does not). */
function siteKitFlexAlignExtras(type: string): ContractPropDef[] {
  if (type !== 'SiteStack' && type !== 'SiteContainer') return []
  return extendablePrimitiveProps().filter((p) =>
    p.name === 'align' || p.name === 'justify' || p.name === 'alignContent',
  )
}

/**
 * Fields for a scene node type.
 * Prefer typed `component-contracts` registry (P16); fixture fallback for unmapped types.
 */
export function inspectFieldsForType(type: string): InspectFieldDef[] {
  const fromRegistry = contractPropsForType(type)
  if (fromRegistry.length) {
    return fromRegistry.map((p) => fromContractProp(p, type))
  }
  const fromSiteKit = siteKitContractProps(type)
  if (hasSiteKitContract(type)) {
    const alias = SITE_KIT_TYPED_ALIAS[type] ?? 'Stack'
    const sharedRaw = [
      ...sharedStylePropsForType(alias),
      ...siteKitFlexAlignExtras(type),
    ]
    const seen = new Set<string>()
    const sharedDeduped = sharedRaw.filter((p) => {
      if (seen.has(p.name)) return false
      seen.add(p.name)
      return true
    })
    const shared = filterSiteKitSharedFields(
      type,
      sharedDeduped.map((p) => fromContractProp(p, type)),
    )
    // SiteChart `chartType` is the chart kind — never a Master variant axis.
    const siteFields = fromSiteKit.map((p) => {
      const field = fromContractProp(p, type)
      if (type === 'SiteChart' && (field.name === 'variant' || field.name === 'chartType')) {
        return { ...field, variantAxis: false }
      }
      return field
    })
    // Site Kit type props win over shared aliases (e.g. SiteImage src/alt/fit).
    const siteNames = new Set(siteFields.map((f) => f.name))
    return [
      ...FALLBACK_FIELDS.filter((f) => f.appliesTo === '*' || f.appliesTo.includes(type)),
      ...siteFields,
      ...shared.filter((f) => !siteNames.has(f.name)),
    ]
  }
  return [
    ...FALLBACK_FIELDS.filter((f) => f.appliesTo === '*' || f.appliesTo.includes(type)),
    ...genericCatalogInspectProps().map((p) => fromContractProp(p, type)),
  ]
}

/** Registry-driven variant-axis enums for Component section (P22). */
export function variantAxisFieldsForType(type: string): InspectFieldDef[] {
  return inspectFieldsForType(type).filter(
    (f) => f.variantAxis && f.kind === 'enum' && f.section === 'component',
  )
}

export function hasComponentContract(type: string): boolean {
  return Boolean(getComponentContract(type)) || hasSiteKitContract(type)
}

/** Minimal fallback when type is not in the registry. */
const FALLBACK_FIELDS: InspectFieldDef[] = [
  {
    name: 'type',
    label: 'Type',
    kind: 'readonly',
    section: 'component',
    appliesTo: '*',
  },
  {
    name: 'id',
    label: 'Id',
    kind: 'readonly',
    section: 'component',
    appliesTo: '*',
  },
  {
    name: 'name',
    label: 'Name',
    kind: 'string',
    section: 'component',
    appliesTo: '*',
  },
]
