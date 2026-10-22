/** Penpot-like inspect section ids — mirrors Zaoly `inspect-sections.ts`. */

export type InspectSectionId =
  | 'component'
  | 'layout'
  | 'constraints'
  | 'appearance'
  | 'typography'
  | 'fill'
  | 'semantics'
  | 'other'

export const INSPECT_SECTION_ORDER: InspectSectionId[] = [
  'component',
  'layout',
  'constraints',
  'appearance',
  'typography',
  'fill',
  'semantics',
  'other',
]

/** English fallbacks (tests / non-i18n callers). Prefer `inspectSectionI18nKey` + `t()`. */
export const INSPECT_SECTION_LABELS: Record<InspectSectionId, string> = {
  component: 'Component',
  layout: 'Flex layout',
  constraints: 'Constraints',
  appearance: 'Appearance',
  typography: 'Typography',
  fill: 'Fill & stroke',
  semantics: 'HTML Semantics & A11y',
  other: 'Other',
}

/** Locale keys under `editor.*` for Design panel section titles. */
export const INSPECT_SECTION_I18N_KEYS: Record<InspectSectionId, string> = {
  component: 'editor.inspectSectionComponent',
  layout: 'editor.inspectFlexLayout',
  constraints: 'editor.inspectSectionConstraints',
  appearance: 'editor.inspectSectionAppearance',
  typography: 'editor.inspectSectionTypography',
  fill: 'editor.inspectSectionFill',
  semantics: 'editor.inspectSectionSemantics',
  other: 'editor.inspectSectionOther',
}

export function layoutInspectSectionLabel(nodeType: string | undefined | null): string {
  if (nodeType === 'Grid' || nodeType === 'SiteGrid' || nodeType === 'PrintPersonaGrid') {
    return 'Grid layout'
  }
  return INSPECT_SECTION_LABELS.layout
}

export type InspectPropRef = { name: string; section?: InspectSectionId }

export type InspectSectionGroup<T extends InspectPropRef = InspectPropRef> = {
  id: InspectSectionId
  label: string
  props: T[]
}

export function groupPropsIntoInspectSections<T extends InspectPropRef>(
  props: T[],
): InspectSectionGroup<T>[] {
  const buckets = new Map<InspectSectionId, T[]>()
  for (const id of INSPECT_SECTION_ORDER) buckets.set(id, [])

  for (const prop of props) {
    const section = prop.section ?? 'other'
    buckets.get(section)!.push(prop)
  }

  return INSPECT_SECTION_ORDER.filter((id) => (buckets.get(id)?.length ?? 0) > 0).map((id) => ({
    id,
    label: INSPECT_SECTION_LABELS[id],
    props: buckets.get(id)!,
  }))
}
