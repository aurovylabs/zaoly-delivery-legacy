import {
  EDITOR_PALETTE_GROUP_IDS,
  EDITOR_PALETTE_GROUP_TYPES,
  EDITOR_TOP_N_TYPES,
  WRAP_CONTAINER_TYPES,
} from '@zaoly/contracts'
import { defaultChildForType, isSceneContainerType } from './scene/ops'
import {
  SITE_KIT_PALETTE_IDS,
  isSiteKitContainerType,
  isSiteKitPaletteType,
  siteKitPaletteItems,
} from './scene/site-kit-palette'

export type EditorPaletteDefaultChildPolicy = 'token-enum-only' | 'fixture-arrays'

export type EditorPaletteCatalogType = {
  type: string
  label: string
  isContainer: boolean
  siteKit: boolean
  defaultChildPolicy: EditorPaletteDefaultChildPolicy
  /** Props from `defaultChildForType` — agents SHOULD override with real copy. */
  seedProps?: Record<string, unknown>
  /** Short agent hint for content-complete inserts. */
  contentHint?: string
}

export type EditorPaletteCatalogGroup = {
  id: (typeof EDITOR_PALETTE_GROUP_IDS)[number] | 'site-kit'
  label: string
  types: EditorPaletteCatalogType[]
}

export type EditorPaletteCatalog = {
  groups: EditorPaletteCatalogGroup[]
  wrapContainerTypes: string[]
  topNTypes: string[]
}

const GROUP_LABELS: Record<EditorPaletteCatalogGroup['id'], string> = {
  layout: 'Layout',
  forms: 'Forms',
  feedback: 'Feedback',
  lists: 'Lists',
  print: 'Print',
  'site-kit': 'Site Kit',
}

/** Prefer Site Kit for marketing/PDP pages; legacy types remain for forms chrome. */
const CONTENT_HINTS: Record<string, string> = {
  SiteButton: 'props.children = CTA label (e.g. "In den Warenkorb")',
  SiteText: 'props.role = display|title|body|label; props.children = copy',
  SiteLink: 'props.children = label; props.href = url',
  SiteInput: 'props.placeholder = field hint',
  SiteTextarea: 'props.placeholder = field hint',
  SiteSelect: 'props.placeholder + props.options as newline-separated labels',
  SiteCheckbox: 'props.children = checkbox label',
  SiteBadge: 'props.children = short badge text',
  SiteChart: 'props.variant + fixture props.data [{label,value}]; optional title/height',
  SiteGauge: 'props.value / min / max / label / unit / tone — fixture only',
  SiteImage: 'props.src = placeholder/url; props.alt = description',
  SiteStack: 'props.direction = column|row; props.gap = sm|md|lg',
  SiteGrid: 'props.columns = "1"|"2"|"3"|"4"; props.gap',
  SiteContainer: 'props.direction + gap; page section shell',
  MetricChip: 'props.label + value slot (children)',
  Meter: 'props.value / min / max as numbers; props.label',
  Chart: 'props.variant + fixture props.data [{label,value}]; optional title/height',
  Gauge: 'props.value / min / max / label / unit / tone — fixture only',
  Button: 'Label via child Text slot (or set_prop on label); props.variant',
  Input: 'props.placeholder; size via props.size when available',
  Select: 'props.options = [{value,label}]; props.placeholder; props.size',
  Textarea: 'props.placeholder; props.size',
  Image: 'props.src + props.alt (image placeholder)',
  Spacer: 'props.size = sm|md|lg; props.axis = x|y',
  Text: 'props.children = string; props.role',
  Link: 'props.children + props.href',
  Badge: 'label via child Text slot',
}

function defaultChildPolicyForType(type: string): EditorPaletteDefaultChildPolicy {
  try {
    const node = defaultChildForType(type)
    const props = node.props ?? {}
    for (const value of Object.values(props)) {
      if (Array.isArray(value)) return 'fixture-arrays'
    }
  } catch {
    // Site Kit and other types without palette defaults stay token-enum-only.
  }
  return 'token-enum-only'
}

function seedPropsForType(type: string): Record<string, unknown> | undefined {
  try {
    const props = defaultChildForType(type).props
    if (!props || !Object.keys(props).length) return undefined
    return { ...props }
  } catch {
    return undefined
  }
}

function catalogType(type: string, label?: string): EditorPaletteCatalogType {
  const siteKit = isSiteKitPaletteType(type)
  const seedProps = seedPropsForType(type)
  const contentHint = CONTENT_HINTS[type]
  return {
    type,
    label: label ?? type,
    isContainer: isSceneContainerType(type) || isSiteKitContainerType(type),
    siteKit,
    defaultChildPolicy: defaultChildPolicyForType(type),
    ...(seedProps ? { seedProps } : {}),
    ...(contentHint ? { contentHint } : {}),
  }
}

export function buildEditorPaletteCatalog(): EditorPaletteCatalog {
  const siteKitLabels = new Map(siteKitPaletteItems().map((item) => [item.insertType, item.label]))

  // Zaoly web design: omit print palette group (`print-out-of-scope-for-zaoly.md` · cleanup W4).
  const groups: EditorPaletteCatalogGroup[] = [
    ...EDITOR_PALETTE_GROUP_IDS.filter((id) => id !== 'print').map((id) => ({
      id,
      label: GROUP_LABELS[id],
      types: EDITOR_PALETTE_GROUP_TYPES[id].map((type) => catalogType(type)),
    })),
    {
      id: 'site-kit' as const,
      label: GROUP_LABELS['site-kit'],
      types: SITE_KIT_PALETTE_IDS.map((type) =>
        catalogType(type, siteKitLabels.get(type) ?? type.replace(/^Site/, '')),
      ),
    },
  ]

  return {
    groups,
    wrapContainerTypes: [...WRAP_CONTAINER_TYPES],
    topNTypes: [...EDITOR_TOP_N_TYPES],
  }
}
