import { siteSvgMarkOptions } from '@zaoly/site-kit'

/**
 * Smart HUD family slot registry — ranks Inspect/contract keys for the floating HUD.
 * Spec: `specs/domain/canvas-smart-hud.md` · Knowledge: `knowledge/canvas-smart-hud.md`
 */
export type HudSlotSource = 'prop' | 'style' | 'tokenBinding' | 'structureOp' | 'hostAction'
export type HudSlotControl =
  | 'segmented'
  | 'stepper'
  | 'sizeMode'
  | 'swatch'
  | 'tokenColor'
  | 'tokenType'
  | 'tokenLength'
  | 'toggle'
  | 'action'
  | 'select'

/** @deprecated Style craft accordion removed — all Smart slots render on the HUD strip. */
export function isHudCraftDialogControl(control: HudSlotControl): boolean {
  return control === 'tokenLength' || control === 'sizeMode'
}

/** All ranked Smart slots for the floating HUD strip (no Style… popover). */
export function filterHudStripSlots(slots: HudQuickSlot[]): HudQuickSlot[] {
  return slots
}

/** @deprecated Prefer `filterHudStripSlots` — Style accordion retired 2026-09-11. */
export function filterHudCraftDialogSlots(slots: HudQuickSlot[]): HudQuickSlot[] {
  return slots.filter((slot) => isHudCraftDialogControl(slot.control))
}

/** Editor chrome actions that are not SceneOps (Asset Library, SVG deep-edit, …). */
export type HudHostActionId = 'openAssetLibrary' | 'openSvgDeepEdit'

export type HudGuardId =
  | 'headingLevel'
  | 'canUnwrap'
  | 'tableHasRemovableBodyRow'
  | 'tableHasRemovableColumn'
  | 'notLocked'
  | 'isWorkingRoot'
  | 'notInlineEditing'
  | 'pseudoStateDefault'
  | 'canMutate'
  | 'isFormInput'
  | 'isFormTextarea'
  | 'isFormSelect'
  | 'isFormCheckbox'
  | 'notFormCheckbox'
  /** Free tree only — sealed Master Instances cannot rewrite expand children. */
  | 'notInstance'

export type HudQuickSlot = {
  key: string
  source: HudSlotSource
  control: HudSlotControl
  rank: number
  when?: HudGuardId
  /** structureOp discriminant when source === structureOp */
  op?: 'table_add_row' | 'table_add_column' | 'table_remove_row' | 'table_remove_column'
  /** Chrome host action when source === hostAction */
  hostAction?: HudHostActionId
  /** Enum / segmented options */
  options?: { value: string; label: string }[]
  /** Token ladder for stepper/swatch */
  tokenLadder?: string[]
  label?: string
  /**
   * How `select` / option values are written:
   * - prop: set_prop string
   * - token: set_token_binding (option.value = token path)
   * - auto: token if value contains `.` and looks like a path, else prop
   */
  writeAs?: 'prop' | 'token' | 'auto'
}

export type HudFamilyId =
  | 'text'
  | 'textLink'
  | 'layoutStack'
  | 'layoutGrid'
  | 'media'
  | 'mediaSvg'
  | 'shape'
  | 'action'
  | 'actionBadge'
  | 'form'
  | 'table'
  | 'tableRow'
  | 'tableCell'
  | 'divider'
  | 'artboard'
  | 'printPage'
  | 'printShell'
  | 'printTextish'
  | 'printTable'
  | 'printChart'
  | 'dataViz'
  | 'fallback'

export type HudFamilyDef = {
  familyId: HudFamilyId
  matchTypes: string[]
  slots: HudQuickSlot[]
}

const DIR_OPTS = [
  { value: 'column', label: 'Col' },
  { value: 'row', label: 'Row' },
]
const ALIGN_OPTS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
]
const DENSITY_OPTS = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'comfortable', label: 'Comfort' },
]
const BORDER_OPTS = [
  { value: 'none', label: 'None' },
  { value: 'row', label: 'Row' },
  { value: 'all', label: 'All' },
]
const COL_OPTS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
]
const LEVEL_OPTS = [
  { value: '1', label: 'H1' },
  { value: '2', label: 'H2' },
  { value: '3', label: 'H3' },
]

/** Shared Pad + Margin icon boxes (`tokenLength`) — every family gets both. */
export function boxSpacingSlots(
  padRank: number,
  marginRank: number,
  when?: HudGuardId,
): HudQuickSlot[] {
  return [
    {
      key: 'padding',
      source: 'tokenBinding',
      control: 'tokenLength',
      rank: padRank,
      label: 'Pad',
      ...(when ? { when } : {}),
    },
    {
      key: 'margin',
      source: 'tokenBinding',
      control: 'tokenLength',
      rank: marginRank,
      label: 'Margin',
      ...(when ? { when } : {}),
    },
  ]
}

/** Drop any existing pad/margin, then inject shared ranks (≤6 budget may demote Align/Level/…). */
export function withBoxSpacing(
  slots: HudQuickSlot[],
  padRank: number,
  marginRank: number,
  when?: HudGuardId,
): HudQuickSlot[] {
  return [
    ...slots.filter((s) => s.key !== 'padding' && s.key !== 'margin'),
    ...boxSpacingSlots(padRank, marginRank, when),
  ]
}

const HUD_FAMILIES_RAW: HudFamilyDef[] = [
  {
    familyId: 'text',
    matchTypes: ['SiteText', 'Text', 'Heading', 'Lede'],
    slots: [
      {
        key: 'fontFamily',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 1,
        label: 'Font',
      },
      {
        key: 'fontSize',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 2,
        label: 'Size',
      },
      {
        key: 'fontWeight',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 3,
        label: 'Weight',
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 4,
        label: 'Color',
      },
      {
        key: 'textAlign',
        source: 'prop',
        control: 'segmented',
        rank: 7,
        options: ALIGN_OPTS,
        label: 'Align',
      },
      {
        key: 'level',
        source: 'prop',
        control: 'segmented',
        rank: 8,
        when: 'headingLevel',
        options: LEVEL_OPTS,
        label: 'Level',
      },
    ],
  },
  {
    familyId: 'textLink',
    matchTypes: ['SiteLink', 'Link'],
    slots: [
      {
        key: 'fontFamily',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 1,
        label: 'Font',
      },
      {
        key: 'fontSize',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 2,
        label: 'Size',
      },
      {
        key: 'fontWeight',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 3,
        label: 'Weight',
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 4,
        label: 'Color',
      },
      {
        key: 'textAlign',
        source: 'prop',
        control: 'segmented',
        rank: 7,
        options: ALIGN_OPTS,
        label: 'Align',
      },
    ],
  },
  {
    familyId: 'layoutStack',
    matchTypes: [
      'SiteStack',
      'SiteContainer',
      'Stack',
      'Card',
      'Panel',
      'Container',
      'Box',
    ],
    // Flex axes (direction / justify / align / wrap) → Inspect Flex layout only.
    // knowledge/inspector-hud-layout-ownership.md
    slots: [
      {
        key: 'gap',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 1,
        label: 'Gap',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 2, label: 'Width' },
    ],
  },
  {
    familyId: 'layoutGrid',
    matchTypes: ['SiteGrid', 'Grid'],
    slots: [
      {
        key: 'columns',
        source: 'prop',
        control: 'segmented',
        rank: 1,
        options: COL_OPTS,
        label: 'Cols',
      },
      {
        key: 'gap',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 2,
        label: 'Gap',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 3, label: 'Width' },
    ],
  },
  {
    familyId: 'media',
    matchTypes: ['SiteImage', 'Image'],
    slots: [
      {
        key: 'openAssetLibrary',
        source: 'hostAction',
        control: 'action',
        rank: 1,
        hostAction: 'openAssetLibrary',
        label: 'Image…',
      },
      // objectFit (cover/contain/…) stays in Inspect — not first-craft for the HUD strip.
      { key: 'width', source: 'style', control: 'sizeMode', rank: 2, label: 'Width' },
      { key: 'height', source: 'style', control: 'sizeMode', rank: 3, label: 'Height' },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 4,
        label: 'Radius',
      },
    ],
  },
  {
    familyId: 'mediaSvg',
    matchTypes: ['SiteSvg'],
    slots: [
      {
        key: 'mark',
        source: 'prop',
        control: 'select',
        rank: 1,
        options: siteSvgMarkOptions().map((o) => ({ value: o.value, label: o.label })),
        writeAs: 'prop',
        label: 'Mark',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 2, label: 'Width' },
      { key: 'height', source: 'style', control: 'sizeMode', rank: 3, label: 'Height' },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 4,
        label: 'Color',
      },
      {
        key: 'openSvgDeepEdit',
        source: 'hostAction',
        control: 'action',
        rank: 7,
        hostAction: 'openSvgDeepEdit',
        label: 'Edit SVG…',
      },
    ],
  },
  {
    familyId: 'shape',
    matchTypes: ['SiteShape'],
    slots: [
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 1,
        label: 'Fill',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 2, label: 'Width' },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 3,
        label: 'Radius',
      },
    ],
  },
  {
    familyId: 'action',
    matchTypes: ['SiteButton', 'Button'],
    slots: [
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 1,
        label: 'Fill',
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 2,
        label: 'Color',
      },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 3,
        label: 'Radius',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 7, label: 'Width' },
    ],
  },
  {
    familyId: 'actionBadge',
    matchTypes: ['SiteBadge', 'Badge', 'Chip'],
    slots: [
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 1,
        label: 'Fill',
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 2,
        label: 'Color',
      },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 3,
        label: 'Radius',
      },
    ],
  },
  {
    familyId: 'form',
    matchTypes: [
      'SiteInput',
      'Input',
      'SiteTextarea',
      'Textarea',
      'SiteSelect',
      'Select',
      'SiteCheckbox',
      'Checkbox',
    ],
    slots: [
      {
        key: 'fontFamily',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 1,
        when: 'notFormCheckbox',
        label: 'Font',
      },
      {
        key: 'fontSize',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 2,
        when: 'notFormCheckbox',
        label: 'Size',
      },
      {
        key: 'fontWeight',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 3,
        when: 'notFormCheckbox',
        label: 'Weight',
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 4,
        label: 'Color',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 7, label: 'Width' },
      {
        key: 'height',
        source: 'style',
        control: 'sizeMode',
        rank: 8,
        when: 'isFormTextarea',
        label: 'Height',
      },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 9,
        when: 'notFormCheckbox',
        label: 'Radius',
      },
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 10,
        when: 'notFormCheckbox',
        label: 'Fill',
      },
    ],
  },
  {
    familyId: 'table',
    matchTypes: ['SiteTable', 'Table'],
    slots: [
      {
        key: 'density',
        source: 'prop',
        control: 'segmented',
        rank: 1,
        options: DENSITY_OPTS,
        label: 'Density',
      },
      {
        key: 'borders',
        source: 'prop',
        control: 'segmented',
        rank: 2,
        options: BORDER_OPTS,
        label: 'Borders',
      },
      {
        key: 'table_add_row',
        source: 'structureOp',
        control: 'action',
        rank: 3,
        op: 'table_add_row',
        when: 'notInstance',
        label: 'Add row',
      },
      {
        key: 'table_add_column',
        source: 'structureOp',
        control: 'action',
        rank: 4,
        op: 'table_add_column',
        when: 'notInstance',
        label: 'Add col',
      },
      { key: 'striped', source: 'prop', control: 'toggle', rank: 7, label: 'Striped' },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 8, label: 'Width' },
    ],
  },
  {
    familyId: 'tableRow',
    matchTypes: ['SiteTableRow'],
    slots: [{ key: 'header', source: 'prop', control: 'toggle', rank: 1, label: 'Header row' }],
  },
  {
    familyId: 'tableCell',
    matchTypes: ['SiteTableCell'],
    slots: [
      {
        key: 'align',
        source: 'prop',
        control: 'segmented',
        rank: 1,
        options: ALIGN_OPTS,
        label: 'Align',
      },
      { key: 'header', source: 'prop', control: 'toggle', rank: 2, label: 'Header cell' },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 3, label: 'Width' },
    ],
  },
  {
    familyId: 'divider',
    matchTypes: ['SiteDivider', 'Divider'],
    slots: [
      { key: 'width', source: 'style', control: 'sizeMode', rank: 1, label: 'Width' },
      {
        key: 'opacity',
        source: 'tokenBinding',
        control: 'stepper',
        rank: 2,
        tokenLadder: ['opacity.subtle', 'opacity.medium', 'opacity.strong'],
        label: 'Opacity',
      },
    ],
  },
  {
    familyId: 'artboard',
    matchTypes: ['__artboard__'],
    slots: [
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 1,
        label: 'Fill',
      },
      {
        key: 'gap',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 3,
        label: 'Gap',
      },
      {
        key: 'direction',
        source: 'prop',
        control: 'segmented',
        rank: 4,
        options: DIR_OPTS,
        label: 'Dir',
      },
    ],
  },
  {
    familyId: 'printPage',
    matchTypes: ['PrintPage'],
    slots: [
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 1,
        label: 'Fill',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 3, label: 'Width' },
    ],
  },
  {
    familyId: 'printShell',
    matchTypes: [
      'PrintCover',
      'PrintChapter',
      'PrintPersonaCard',
      'PrintTwoColumn',
      'PrintChipRow',
      'PrintRankedList',
      'PrintLedger',
      'PrintPersonaGrid',
    ],
    slots: [
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 1,
        label: 'Fill',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 2, label: 'Width' },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 3,
        label: 'Radius',
      },
    ],
  },
  {
    familyId: 'printTextish',
    matchTypes: ['PrintPullQuote', 'PrintCallout', 'PrintChip'],
    slots: [
      {
        key: 'fontSize',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 1,
        label: 'Size',
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 2,
        label: 'Color',
      },
      {
        key: 'fontWeight',
        source: 'tokenBinding',
        control: 'tokenType',
        rank: 3,
        label: 'Weight',
      },
    ],
  },
  {
    familyId: 'printTable',
    matchTypes: ['PrintTable'],
    slots: [
      { key: 'width', source: 'style', control: 'sizeMode', rank: 1, label: 'Width' },
      {
        key: 'gap',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 2,
        label: 'Gap',
      },
    ],
  },
  {
    familyId: 'printChart',
    matchTypes: ['PrintDonut', 'PrintScoreRing', 'PrintTraitBars'],
    slots: [
      {
        key: 'max',
        source: 'prop',
        control: 'select',
        rank: 1,
        label: 'Max',
        writeAs: 'prop',
        options: [
          { value: '100', label: '100' },
          { value: '10', label: '10' },
          { value: '5', label: '5' },
        ],
      },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 2,
        label: 'Color',
      },
      { key: 'width', source: 'style', control: 'sizeMode', rank: 3, label: 'Width' },
    ],
  },
  {
    familyId: 'dataViz',
    matchTypes: ['SiteChart', 'SiteGauge', 'Chart', 'Gauge'],
    slots: [
      { key: 'width', source: 'style', control: 'sizeMode', rank: 1, label: 'Width' },
      {
        key: 'color',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 2,
        label: 'Color',
      },
    ],
  },
  {
    familyId: 'fallback',
    matchTypes: ['*'],
    slots: [
      { key: 'width', source: 'style', control: 'sizeMode', rank: 1, label: 'Width' },
      {
        key: 'background',
        source: 'tokenBinding',
        control: 'tokenColor',
        rank: 4,
        label: 'Fill',
      },
      {
        key: 'radius',
        source: 'tokenBinding',
        control: 'tokenLength',
        rank: 5,
        label: 'Radius',
      },
    ],
  },
]

/** Pad/Margin ranks per family — after primary craft, inside the ≤6 strip budget. */
const BOX_SPACING_RANKS: Record<HudFamilyId, { pad: number; margin: number; when?: HudGuardId }> = {
  text: { pad: 5, margin: 6 },
  textLink: { pad: 5, margin: 6 },
  layoutStack: { pad: 3, margin: 4 },
  layoutGrid: { pad: 4, margin: 5 },
  media: { pad: 5, margin: 6 },
  mediaSvg: { pad: 5, margin: 6 },
  shape: { pad: 4, margin: 5 },
  action: { pad: 4, margin: 5 },
  actionBadge: { pad: 4, margin: 5 },
  form: { pad: 5, margin: 6, when: 'notFormCheckbox' },
  table: { pad: 5, margin: 6 },
  tableRow: { pad: 2, margin: 3 },
  tableCell: { pad: 4, margin: 5 },
  divider: { pad: 3, margin: 4 },
  artboard: { pad: 2, margin: 5 },
  printPage: { pad: 2, margin: 4 },
  printShell: { pad: 4, margin: 5 },
  printTextish: { pad: 4, margin: 5 },
  printTable: { pad: 3, margin: 4 },
  printChart: { pad: 4, margin: 5 },
  dataViz: { pad: 4, margin: 5 },
  fallback: { pad: 2, margin: 3 },
}

export const HUD_FAMILIES: HudFamilyDef[] = HUD_FAMILIES_RAW.map((fam) => {
  const ranks = BOX_SPACING_RANKS[fam.familyId]
  return {
    ...fam,
    slots: withBoxSpacing(fam.slots, ranks.pad, ranks.margin, ranks.when),
  }
})

export const HUD_SLOT_BUDGET = 6

const TYPE_TO_FAMILY = new Map<string, HudFamilyId>()
for (const fam of HUD_FAMILIES) {
  if (fam.familyId === 'fallback') continue
  for (const t of fam.matchTypes) {
    TYPE_TO_FAMILY.set(t, fam.familyId)
  }
}

export function resolveFamilyId(type: string): HudFamilyId {
  if (type.startsWith('Print')) {
    return TYPE_TO_FAMILY.get(type) ?? 'printShell'
  }
  return TYPE_TO_FAMILY.get(type) ?? 'fallback'
}

export function familyDef(familyId: HudFamilyId): HudFamilyDef {
  return HUD_FAMILIES.find((f) => f.familyId === familyId) ?? HUD_FAMILIES[HUD_FAMILIES.length - 1]!
}
