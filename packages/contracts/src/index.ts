/** Stable domain contracts for CREATION v3. */

export type ProjectStatus = 'active' | 'archived' | 'pending_sync'
export type CapabilitySyncStatus = 'in_sync' | 'pending' | 'error'

/** Placeholder capability mirror under a Plexon Collection. */
export interface CreationCapabilityRef {
  platformProjectId: string
  capabilityStatus: CapabilitySyncStatus
}

export interface ProjectSummary {
  id: string
  name: string
  status: ProjectStatus
  /** Plexon collection / platform project id */
  platformProjectId: string
  capabilityStatus: CapabilitySyncStatus
  lastActivityAt: string | null
  compositionCount: number
  /** Creator / owner for access model B (list ACL). */
  ownerUserId?: string | null
}

export interface ProjectDetail extends ProjectSummary {
  description: string
  /** Plexon company used for outbound origin / re-sync (optional). */
  platformCompanyId?: string | null
  /** Optional domain hint from Collection upsert. */
  domain?: string | null
}

/** Create a local CREATION project (Plexon collection mirror). */
export interface CreateProjectInput {
  name: string
  description?: string
  /** When omitted, a local `plx-local-…` id is generated (or Plexon origin assigns one). */
  platformProjectId?: string
  /** Optional Plexon owner for outbound origin registration. */
  ownerUserId?: string
  /** Optional Plexon company for outbound origin registration. */
  platformCompanyId?: string
}

/** Patch editable project fields. */
export interface UpdateProjectInput {
  name?: string
  description?: string
}

/**
 * System bucket id reserved for future orphan reassignment.
 * Product UI archives via Plexon lifecycle (`status: archived`); hard-delete is ops/tests only.
 */
export const UNASSIGNED_PROJECT_ID = 'proj-unassigned' as const

/** Composition stub shown in magazine hubs / catalog API (from scene-store). */
export type CompositionStatus = 'draft' | 'ready' | 'archived'

export interface CompositionSummary {
  id: string
  name: string
  slug?: string
  projectId?: string | null
  platformProjectId?: string | null
  /** Creating viewer — standalone hub ACL. */
  ownerUserId?: string | null
  updatedAt: string
  status: CompositionStatus
  sourceHint?: string
  /** Page id for hub live thumbnail (`preview-html?pageId=`). */
  previewPageId?: string
}

export type LibraryLayer = 'atom' | 'molecule' | 'shell'

/** Curated WC/contract row for the library hub (fixture snapshot). */
export interface LibraryComponentSummary {
  tagName: string
  category: string
  layer: LibraryLayer
  contractVersion?: string
  description?: string
  propCount?: number
  tokenBindablePropCount?: number
}

export interface LibraryCatalogFixture {
  libraryVersion: string
  generatedAt?: string
  sourceNote: string
  items: LibraryComponentSummary[]
}

/** Composition scene node id. */
export type SceneNodeId = string

/** Artboard breakpoint id (OP-9) — optional on save for backward compat. */
export type SceneBreakpointId = 'mobile' | 'tablet' | 'desktop' | 'print'

/** Print artboard geometry preset (P85 / artboard-dimensions) — orthogonal to cascade. */
export type PrintPresetId =
  | 'slide-16-9'
  | 'a3-portrait'
  | 'a3-landscape'
  | 'a4-portrait'
  | 'a4-landscape'
  | 'a5-portrait'
  | 'a5-landscape'
  | 'a6-portrait'
  | 'a6-landscape'
  | 'letter-portrait'
  | 'letter-landscape'

export const PRINT_PRESET_IDS = [
  'slide-16-9',
  'a3-portrait',
  'a3-landscape',
  'a4-portrait',
  'a4-landscape',
  'a5-portrait',
  'a5-landscape',
  'a6-portrait',
  'a6-landscape',
  'letter-portrait',
  'letter-landscape',
] as const satisfies readonly PrintPresetId[]

export const DEFAULT_PRINT_PRESET: PrintPresetId = 'a4-portrait'

/** Per-breakpoint override (OP-9 Phase A). Token/enum only — never free CSS. */
export interface SceneBreakpointOverride {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
  /** Collection capability refs — `specs/domain/collection-data-bind.md`. */
  dataBindings?: Record<string, string>
  /**
   * Wave D — BP-scoped visibility (Figma Sites secondary hide).
   * When set, wins over `SceneNode.hidden` for that breakpoint in cascade paint.
   */
  hidden?: boolean
}

/** Interactive pseudo-state id (hover, focus, active, disabled). */
export type SceneStateId = 'default' | 'hover' | 'focus' | 'active' | 'disabled'

export const SCENE_STATE_IDS: readonly SceneStateId[] = [
  'default',
  'hover',
  'focus',
  'active',
  'disabled',
]

/** Per-state override for pseudo-classes (:hover, :focus, :active, :disabled). */
export interface SceneStateOverride {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
  dataBindings?: Record<string, string>
  style?: Record<string, string | number>
}

export type SceneInteractionTrigger = 'click' | 'hover' | 'focus'
export type SceneInteractionAction = 'navigate' | 'scroll' | 'toggle' | 'modal'

export interface SceneInteraction {
  id: string
  trigger: SceneInteractionTrigger
  action: SceneInteractionAction
  target?: string
  url?: string
  newTab?: boolean
}

/** Instance overrides (`composition-masters.md`). Root keys apply to the expanded Master root. */
export interface SceneInstanceOverrides {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
  dataBindings?: Record<string, string>
  style?: Record<string, string | number>
  name?: string
  hidden?: boolean
  locked?: boolean
  /**
   * Nested Instance pick (expand suffix targets an Instance in the host Master tree).
   * Applied before nested expand so variant roots resolve correctly.
   */
  instanceVariantId?: string
  /** Nested Instance Phase-3 axis picks — same timing as `instanceVariantId`. */
  instanceVariantAxes?: Record<string, string>
  /**
   * Nested overrides keyed by expand suffix after the host Instance id
   * (`defId` or `defId::nestedDefId`). Same shape as root (without further nesting).
   */
  descendants?: Record<string, SceneInstanceOverrides>
}

/** Phase 3 Component Set axis — `composition-masters.md`. */
export interface SceneMasterAxis {
  id: string
  name: string
  /** Ordered string values for this axis. */
  values: string[]
}

/** Named Master variant / sparse cell (Phase 2 + 3) — `composition-masters.md`. */
export interface SceneMasterVariant {
  id: string
  /** Designer-facing label (text field on Add/Rename). */
  name: string
  root: SceneNode
  /** Phase 3: axisId → value for this cell. Omitted on legacy Phase-2 rows until migrate. */
  combination?: Record<string, string>
}

/** Scene-local Main component definition. */
export interface SceneMaster {
  id: string
  name: string
  /**
   * Definition root. MVP: sole tree. Phase 2/3: MUST equal the default variant’s
   * `root` when `variants` is non-empty (`composition-masters.md`).
   */
  root: SceneNode
  /** Palette hydrate dedup: atom `insertType` or `Composition:{exportName}`. */
  sourceKey?: string
  /** Named variants / sparse cells. Omitted → MVP single `root`. */
  variants?: SceneMasterVariant[]
  /** Id in `variants`. Required when `variants` is non-empty. */
  defaultVariantId?: string
  /** Phase 3 Component Set axes. Omitted / empty → Phase 2 single-list UX (until migrate). */
  axes?: SceneMasterAxis[]
  /** Last Site Kit Pull/Reset time (ISO). Spec: site-kit-kit-pull.md */
  pulledAt?: string
  /** Seed stamp after Pull/Reset (`override:{updatedAt}` or `catalog:{id}`). */
  kitRevision?: string
}

/** JSON tree node mapped to an `@zaoly/ui` primitive type. */
export interface SceneNode {
  id: SceneNodeId
  type: string
  name?: string
  props?: Record<string, unknown>
  style?: Record<string, string | number>
  tokenBindings?: Record<string, string>
  /**
   * Collection capability refs (Checkion / Metron) → prop keys.
   * Paths only — never resolved values. Spec: `collection-data-bind.md`.
   */
  dataBindings?: Record<string, string>
  /** OP-9 responsive map — cascade: base ← breakpoints[active]. */
  breakpoints?: Partial<Record<SceneBreakpointId, SceneBreakpointOverride>>
  states?: Partial<Record<Exclude<SceneStateId, 'default'>, SceneStateOverride>>
  interactions?: SceneInteraction[]
  /** Not painted / not hit-tested when true. */
  hidden?: boolean
  /** Rejects inspect/resize/reorder/delete when true (ancestor cascade). */
  locked?: boolean
  /** When `type === 'Instance'`: Master id on `CompositionScene.masters`. */
  instanceOf?: string
  /** When `type === 'Instance'`: Phase 2/3 cell id cache; omit → Master default / MVP `root`. */
  instanceVariantId?: string
  /** When `type === 'Instance'`: Phase 3 axis picks (`axisId → value`). Prefer over id when Master has axes. */
  instanceVariantAxes?: Record<string, string>
  /** When `type === 'Instance'`: merge onto expanded Master (variant) root + optional descendants. */
  instanceOverrides?: SceneInstanceOverrides
  children?: SceneNode[]
}

/** Tabbed artboard page (P80) — `specs/domain/scene-pages.md` · `artboard-dimensions.md`. */
export interface ScenePageFrame {
  /** Top-left of frame chrome on the infinite board (CSS px). */
  x: number
  y: number
  /** Optional persisted artboard width; omitted → breakpoint/print default at paint. */
  width?: number
  /** Optional persisted artboard height; omitted → measured (digital) or print preset height. */
  height?: number
}

/** Tabbed artboard page (P80) — `specs/domain/scene-pages.md`. */
export interface ScenePage {
  id: string
  name: string
  root: SceneNode
  /** Board placement (P81) — `specs/domain/scene-board.md`. */
  frame?: ScenePageFrame
  /** Optional artboard breakpoint for frame width on the board (P81.1). Omitted → scene `activeBreakpoint`. */
  breakpoint?: SceneBreakpointId
  /** Last HTML passed to `import-html` for this page (debug / preview). Omitted when never imported. */
  importSourceHtml?: string
  /** ISO timestamp when `importSourceHtml` was last set. */
  importSourceHtmlAt?: string
  /** Craft debug snapshot after last HTML import — `specs/domain/craft-debug.md`. */
  craftDebug?: SceneCraftDebugBundle
  /** ISO timestamp when `craftDebug` was last set. */
  craftDebugAt?: string
}

/** Soft craft diagnostics from HTML→Scene import / live craft-debug. */
export type SceneCraftDebugFlag = {
  code:
    | 'craft-thin'
    | 'craft-no-grid'
    | 'craft-small-type'
    | 'craft-few-surfaces'
    | 'craft-no-hero-media'
    | 'craft-loose-display-leading'
  message: string
}

export type SceneCraftDebugSpirionMeta = {
  captureIds?: string[]
  lookContractSummary?: Record<string, unknown>
  pageRhythmSummary?: Record<string, unknown>
  avoid?: string[]
}

export type SceneCraftDebugBundle = {
  schemaVersion: '1'
  builtAt: string
  pageId: string
  designSystem: {
    colors: string[]
    fonts: string[]
    spacings: string[]
  }
  sceneStats: {
    nodeCount: number
    siteGridCount: number
    siteStackCount: number
    maxFontSizePx: number | null
    uniqueBackgrounds: string[]
    uniqueColors: string[]
    hasLargeDisplay: boolean
    hasHeroMedia: boolean
    /** True when ≥48px type has missing or body-like lineHeight (>1.25). */
    hasLooseDisplayLeading?: boolean
  }
  craftFlags: SceneCraftDebugFlag[]
  importWarnings?: Array<{ code: string; message: string }>
  importHtmlBytes?: number
  hasImportSourceHtml: boolean
  importSourceHtmlAt?: string
  spirion?: SceneCraftDebugSpirionMeta
}

/** Thread reply for a scene comment (P103). */
export interface SceneCommentReply {
  id: string
  body: string
  author: string
  createdAt: string
}

/** Node-anchored or canvas spatial comment thread (P82b / P103). Persists on scene JSON with Save. */
export interface SceneComment {
  id: string
  nodeId?: SceneNodeId
  body: string
  author: string
  createdAt: string
  resolved: boolean
  pinX?: number
  pinY?: number
  replies?: SceneCommentReply[]
}

/** Persisted composition scene (CREATION editor SoT). */
export interface CompositionScene {
  id: string
  name: string
  version: 1
  platformProjectId?: string | null
  /** Creating viewer id — standalone ownership / hub list ACL. */
  ownerUserId?: string | null
  /** Active artboard breakpoint; omitted on older saves → editor defaults to desktop. */
  activeBreakpoint?: SceneBreakpointId
  /**
   * OP-9 cascade base (Wave H). Digital only — omitted → `desktop`.
   * Rematerialized by `set_primary_breakpoint`.
   */
  primaryBreakpoint?: Exclude<SceneBreakpointId, 'print'>
  /** Print page preset (P85); omitted / unknown → a4-portrait. Geometry only when activeBreakpoint is print. */
  activePrintPreset?: PrintPresetId
  /** Optional node comments (P82b). Pruned when node ids disappear. */
  comments?: SceneComment[]
  /** Scene-local Masters (MVP) — `specs/domain/composition-masters.md`. */
  masters?: SceneMaster[]
  /** Tabbed pages (P80). Omitted → implicit single page from `root`. */
  pages?: ScenePage[]
  /** Active artboard when `pages.length > 0`. */
  activePageId?: string
  /** Hub cover / thumbnail page (optional). Must reference a member of `pages` when set. */
  coverPageId?: string
  root: SceneNode
  updatedAt: string
}

/** Style keys that may be written as numbers (never free CSS strings). */
export type SceneStyleDimensionKey = 'width' | 'height'

/** Containers allowed by `wrap_nodes` / `unwrap_node` (Zaoly OP-7 / OP-15). */
export const WRAP_CONTAINER_TYPES = ['Stack', 'Grid', 'SiteStack', 'SiteGrid'] as const
export type WrapContainerType = (typeof WRAP_CONTAINER_TYPES)[number]

export type SceneOp =
  | { op: 'set_prop'; nodeId: SceneNodeId; key: string; value: unknown }
  | { op: 'set_token_binding'; nodeId: SceneNodeId; key: string; tokenPath: string }
  | { op: 'clear_token_binding'; nodeId: SceneNodeId; key: string }
  | { op: 'set_data_binding'; nodeId: SceneNodeId; key: string; dataRef: string }
  | { op: 'clear_data_binding'; nodeId: SceneNodeId; key: string }
  | {
      op: 'set_style'
      nodeId: SceneNodeId
      key: SceneStyleDimensionKey
      /** CSS px number only — strings / free CSS are rejected. */
      value: number
    }
  | {
      op: 'set_breakpoint_override'
      nodeId: SceneNodeId
      breakpoint: SceneBreakpointId
      props?: Record<string, unknown>
      tokenBindings?: Record<string, string>
      /** Wave D — BP-scoped hide; may be set without props/tokens. */
      hidden?: boolean
    }
  | {
      op: 'clear_breakpoint_override'
      nodeId: SceneNodeId
      breakpoint: SceneBreakpointId
      /** When omitted, clears the entire override for this BP. */
      keys?: string[]
      /** Clear token bindings (default true when keys provided). */
      clearTokens?: boolean
      /** Clear props (default true when keys provided). */
      clearProps?: boolean
      /** Clear BP-scoped hidden (Wave D). */
      clearHidden?: boolean
    }
  | {
      /** Wave H — promote a digital BP to OP-9 base (rematerialize all roots). */
      op: 'set_primary_breakpoint'
      breakpoint: Exclude<SceneBreakpointId, 'print'>
    }
  | {
      op: 'set_state_override'
      nodeId: SceneNodeId
      state: Exclude<SceneStateId, 'default'>
      props?: Record<string, unknown>
      tokenBindings?: Record<string, string>
      style?: Record<string, string | number>
    }
  | {
      op: 'clear_state_override'
      nodeId: SceneNodeId
      state: Exclude<SceneStateId, 'default'>
      keys?: string[]
      clearTokens?: boolean
      clearProps?: boolean
      clearStyle?: boolean
    }
  | { op: 'add_interaction'; nodeId: SceneNodeId; interaction: SceneInteraction }
  | { op: 'remove_interaction'; nodeId: SceneNodeId; interactionId: string }
  | { op: 'update_interaction'; nodeId: SceneNodeId; interaction: SceneInteraction }
  | {
      op: 'set_flags'
      nodeId: SceneNodeId
      /** Omit to leave unchanged. */
      hidden?: boolean
      locked?: boolean
    }
  | { op: 'insert_child'; parentId: SceneNodeId; child: SceneNode; index?: number }
  | { op: 'remove_node'; nodeId: SceneNodeId }
  | {
      op: 'reorder_node'
      nodeId: SceneNodeId
      /** Sibling index after move (clamped to parent children). */
      index: number
    }
  | {
      op: 'move_node'
      nodeId: SceneNodeId
      /** Destination container (must accept children). */
      parentId: SceneNodeId
      /** Sibling index under parent after move (clamped). */
      index: number
    }
  | {
      op: 'wrap_nodes'
      nodeIds: SceneNodeId[]
      containerType: WrapContainerType
      containerId: SceneNodeId
    }
  | { op: 'unwrap_node'; nodeId: SceneNodeId }
  | { op: 'select'; nodeId: SceneNodeId | null }
  | {
      op: 'create_master'
      /** Selection to convert (non-root). */
      nodeId: SceneNodeId
      /** Optional display name; defaults to node name/type. */
      name?: string
    }
  | {
      op: 'ensure_palette_master'
      /** Stable dedup key (atom type or `Composition:{exportName}`). */
      sourceKey: string
      /** Template root when creating; ignored if Master already exists. */
      root: SceneNode
      name?: string
    }
  | { op: 'rename_master'; masterId: string; name: string }
  | { op: 'delete_master'; masterId: string }
  | {
      /**
       * Undo companion for master graph mutations (W7d) — upsert by `master.id`.
       * Inserts at `index` when missing; replaces in place when present.
       * Not part of the curated agent/MCP surface.
       */
      op: 'restore_master'
      master: SceneMaster
      /** Insertion index when the master id is absent (clamped). */
      index?: number
    }
  | {
      op: 'insert_instance'
      masterId: string
      parentId: SceneNodeId
      index?: number
      /** Optional display name on the Instance node. */
      name?: string
      /**
       * Prop overrides applied as `instanceOverrides.props` (same as set_prop on Instance).
       * Agents MUST pass page-specific copy here (CTA, options, placeholders) — bare
       * insert_instance keeps Master seed text ("Get started", "Option A", …).
       */
      props?: Record<string, unknown>
    }
  | { op: 'detach_instance'; nodeId: SceneNodeId }
  | {
      op: 'update_master_root'
      masterId: string
      root: SceneNode
    }
  | {
      op: 'add_master_variant'
      masterId: string
      /** Designer-facing name (required, non-empty). */
      name: string
      /** Clone source; omit → active/default variant. */
      fromVariantId?: string
    }
  | {
      op: 'rename_master_variant'
      masterId: string
      variantId: string
      name: string
    }
  | {
      op: 'delete_master_variant'
      masterId: string
      variantId: string
    }
  | {
      op: 'set_master_default_variant'
      masterId: string
      variantId: string
    }
  | {
      op: 'set_instance_variant'
      nodeId: SceneNodeId
      variantId: string
    }
  | {
      op: 'update_master_variant_root'
      masterId: string
      variantId: string
      root: SceneNode
    }
  | {
      op: 'add_master_axis'
      masterId: string
      name: string
      /** Initial values (default `["Default"]` when omitted/empty). */
      values?: string[]
    }
  | {
      op: 'rename_master_axis'
      masterId: string
      axisId: string
      name: string
    }
  | {
      op: 'delete_master_axis'
      masterId: string
      axisId: string
    }
  | {
      op: 'add_master_axis_value'
      masterId: string
      axisId: string
      value: string
    }
  | {
      op: 'rename_master_axis_value'
      masterId: string
      axisId: string
      fromValue: string
      toValue: string
    }
  | {
      op: 'delete_master_axis_value'
      masterId: string
      axisId: string
      value: string
    }
  | {
      op: 'set_instance_variant_axes'
      nodeId: SceneNodeId
      /** Full axis pick map (axisId → value). */
      axes: Record<string, string>
    }
  | {
      op: 'upsert_master_variant_cell'
      masterId: string
      combination: Record<string, string>
      /** Clone source cell; omit → default / active template. */
      fromVariantId?: string
      /** Optional display name; default derived from combination values. */
      name?: string
    }
  | {
      op: 'bind_master_composition'
      masterId: string
      /** PascalCase export name (sets `sourceKey` = `Composition:{exportName}`). */
      exportName: string
    }
  | {
      op: 'add_page'
      name?: string
      duplicatePageId?: string
      /** Optional artboard breakpoint at create (ignored when `duplicatePageId` is set). */
      breakpoint?: SceneBreakpointId
      /** Optional artboard width at create (ignored when `duplicatePageId` is set). */
      frameWidth?: number
      /** Optional artboard height at create (ignored when `duplicatePageId` is set). */
      frameHeight?: number
    }
  | { op: 'delete_page'; pageId: string }
  | {
      /**
       * Undo companion for `delete_page` (W7c) — re-insert a captured page.
       * Not part of the curated agent/MCP surface.
       */
      op: 'restore_page'
      page: ScenePage
      /** Insertion index in `pages[]` (clamped). */
      index: number
      /** Restore `activePageId` after insert. */
      activePageId?: string
      /**
       * Restore cover: string sets, `null` clears, omit leaves unchanged.
       */
      coverPageId?: string | null
      /** Comments pruned with the deleted page subtree (re-append by id). */
      comments?: SceneComment[]
    }
  | { op: 'rename_page'; pageId: string; name: string }
  | { op: 'duplicate_page'; pageId: string; name?: string }
  | { op: 'set_active_page'; pageId: string }
  | { op: 'set_cover_page'; pageId: string }
  | { op: 'reorder_pages'; pageIds: string[] }
  | { op: 'move_page_frame'; pageId: string; x: number; y: number }
  | {
      op: 'set_page_frame'
      pageId: string
      x?: number
      y?: number
      width?: number
      height?: number
      /** When true, remove persisted `frame.width` (derive from breakpoint/preset). */
      clearWidth?: boolean
      /** When true, remove persisted `frame.height`. */
      clearHeight?: boolean
    }
  | {
      op: 'set_page_breakpoint'
      pageId: string
      /** Omit or `null` to clear per-page override. */
      breakpoint?: SceneBreakpointId | null
    }
  | {
      op: 'move_node_to_page'
      nodeId: SceneNodeId
      toPageId: string
      /** Destination container; default destination page root. */
      parentId?: SceneNodeId
      /** Sibling index under parent; default append. */
      index?: number
    }
  | { op: 'table_add_row'; nodeId: SceneNodeId }
  | { op: 'table_add_column'; nodeId: SceneNodeId }
  | { op: 'table_remove_row'; nodeId: SceneNodeId }
  | { op: 'table_remove_column'; nodeId: SceneNodeId }

export * from './component-contracts'

export type SceneOpResult =
  | { ok: true; scene: CompositionScene }
  | { ok: false; reason: string }

/** Top-N types for in-app editor beta. */
export const EDITOR_TOP_N_TYPES = [
  'Stack',
  'Button',
  'Text',
  'Input',
  'Card',
  'Image',
] as const

export type EditorTopNType = (typeof EDITOR_TOP_N_TYPES)[number]

/** Extended palette (Top-N + additional @zaoly/ui primitives). */
export const EDITOR_PALETTE_TYPES = [
  ...EDITOR_TOP_N_TYPES,
  'Heading',
  'Grid',
  'Link',
  'Badge',
  'Spacer',
  'Checkbox',
  'Select',
  'Switch',
  'Textarea',
  'Chip',
  'Divider',
  'Avatar',
  'Alert',
  'Hint',
  'Spinner',
  'StatusDot',
  'EmptyState',
  'Slider',
  'Field',
  'Panel',
  'Tabs',
  'Accordion',
  'LoadingText',
  'PageTitle',
  'AddTile',
  'TagInput',
  'ToggleGroup',
  'MetricChip',
  'Meter',
  'Chart',
  'Gauge',
  'Lede',
  'ScrollArea',
  'FormSection',
  'CardActions',
  'FilterRow',
  'SectionChrome',
  'RankedRow',
  'RankedList',
  'TopStatus',
  'EventFooter',
  'ChannelStack',
  'ChannelLane',
  'StepStrip',
  'KpiStrip',
  'DivergingBar',
  'EntityCard',
  'PrintPage',
  'PrintChapter',
  'PrintCover',
  'PrintPullQuote',
  'PrintCallout',
  'PrintSteps',
  'PrintScoreRing',
  'PrintChip',
  'PrintChipRow',
  'PrintTwoColumn',
  'PrintDonut',
  'PrintRankedList',
  'PrintLedger',
  'PrintTraitBars',
  'PrintTable',
  'PrintPersonaCard',
  'PrintPersonaGrid',
] as const

export type EditorPaletteType = (typeof EDITOR_PALETTE_TYPES)[number]

/** Palette group ids for the in-app editor (P35). */
export const EDITOR_PALETTE_GROUP_IDS = ['layout', 'forms', 'feedback', 'lists', 'print'] as const

export type EditorPaletteGroupId = (typeof EDITOR_PALETTE_GROUP_IDS)[number]

/**
 * Partition of `EDITOR_PALETTE_TYPES` — each type appears in exactly one group.
 * Workspace composes one `ComponentPalette` per non-empty group.
 */
export const EDITOR_PALETTE_GROUP_TYPES: Record<
  EditorPaletteGroupId,
  readonly EditorPaletteType[]
> = {
  layout: [
    'Stack',
    'Grid',
    'Card',
    'Panel',
    'Spacer',
    'Divider',
    'ScrollArea',
    'FormSection',
    'CardActions',
    'FilterRow',
    'ChannelStack',
    'ChannelLane',
    'Image',
  ],
  forms: [
    'Button',
    'Input',
    'Textarea',
    'Checkbox',
    'Switch',
    'Select',
    'Field',
    'TagInput',
    'Slider',
    'Meter',
    'ToggleGroup',
    'Tabs',
    'Accordion',
    'Chip',
    'Badge',
    'AddTile',
    'Avatar',
  ],
  feedback: [
    'Text',
    'Heading',
    'PageTitle',
    'LoadingText',
    'Link',
    'Alert',
    'Hint',
    'Spinner',
    'StatusDot',
    'EmptyState',
    'Lede',
    'SectionChrome',
    'TopStatus',
    'MetricChip',
    'Chart',
    'Gauge',
    'EventFooter',
  ],
  lists: ['RankedRow', 'RankedList', 'StepStrip', 'KpiStrip', 'DivergingBar', 'EntityCard'],
  print: [
    'PrintPage',
    'PrintChapter',
    'PrintCover',
    'PrintPullQuote',
    'PrintCallout',
    'PrintSteps',
    'PrintScoreRing',
    'PrintChip',
    'PrintChipRow',
    'PrintTwoColumn',
    'PrintDonut',
    'PrintRankedList',
    'PrintLedger',
    'PrintTraitBars',
    'PrintTable',
    'PrintPersonaCard',
    'PrintPersonaGrid',
  ],
}

/** Magazine template wire compat (Phase 4 publish). */
export const MAGAZINE_TEMPLATE_COMPAT_VERSION = '2026-08-magazine-template-v1' as const

/** Default consumer role for Plexon Quick Scan Mag PDF. */
export const MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK = 'quick-check-magazine' as const

export type MagazineTemplateStatus = 'draft' | 'published'

export type MagazineTemplateRole = typeof MAGAZINE_TEMPLATE_ROLE_QUICK_CHECK | (string & {})

/**
 * Consumer data-binding target on a Print* shell.
 * Distinct from layout chrome `props.slot` (title/label/…).
 */
export interface MagazineTemplateSlotDef {
  dataSlot: string
  nodeId: SceneNodeId
  nodeType: string
}

/** Immutable published (or draft) magazine template. */
export interface MagazineTemplate {
  templateId: string
  version: number
  status: MagazineTemplateStatus
  role: MagazineTemplateRole
  platformProjectId: string
  name: string
  sceneSnapshot: CompositionScene
  sourceSceneId?: string | null
  /** Library SHA the authoring app was pinned to (round-trip). */
  zaolyUiSource?: string | null
  slotSchema: MagazineTemplateSlotDef[]
  compatVersion: typeof MAGAZINE_TEMPLATE_COMPAT_VERSION | string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

/** List row without full scene snapshot. */
export interface MagazineTemplateSummary {
  templateId: string
  version: number
  status: MagazineTemplateStatus
  role: MagazineTemplateRole
  platformProjectId: string
  name: string
  sourceSceneId?: string | null
  slotKeys: string[]
  compatVersion: string
  publishedAt: string | null
  zaolyUiSource?: string | null
  createdAt: string
  updatedAt: string
}

export type MagazineTemplateValidationIssue = {
  code: string
  message: string
  nodeId?: string
}

// -----------------------------------------------------------------------------
// P114: Real-Time Presence & Collaboration Contracts
// Spec: specs/domain/editor-presence-collaboration.md · specs/api/scene-presence.md
// -----------------------------------------------------------------------------

export interface SceneUserCursor {
  x: number
  y: number
  pageId?: string
  lastActiveAt: string
}

export interface ScenePresenceUser {
  userId: string
  name: string
  avatarUrl?: string
  color: string
  pageId: string
  cursor?: SceneUserCursor
  selectedIds: string[]
  viewport?: {
    zoom: number
    panX: number
    panY: number
  }
  isIdle: boolean
  lastSeenAt: string
}

export interface ScenePresenceState {
  sceneId: string
  users: ScenePresenceUser[]
}

/** SSE `presence-updated` payload (Wave B). Heartbeat HTTP still returns full users. */
export type PresenceUpdatedMode = 'snapshot' | 'delta'

export interface PresenceUpdatedPayload {
  type: 'presence-updated'
  sceneId: string
  mode: PresenceUpdatedMode
  /** Full replace — snapshot mode (and legacy frames without mode treated as snapshot). */
  users?: ScenePresenceUser[]
  /** Partial upserts — delta mode. */
  upserts?: ScenePresenceUser[]
  /** Removals — delta mode. */
  removedUserIds?: string[]
  activeUsersCount: number
}

// -----------------------------------------------------------------------------
// P116: Scene Version History & Milestones Contracts
// Spec: specs/domain/editor-version-history.md · specs/api/scene-versions.md
// -----------------------------------------------------------------------------

export interface SceneVersionAuthor {
  id: string
  name: string
  avatarUrl?: string
}

export interface SceneVersionSummary {
  id: string
  sceneId: string
  versionNumber: number
  name: string
  description?: string
  isAutoSave: boolean
  author: SceneVersionAuthor
  pageCount: number
  nodeCount: number
  createdAt: string
}

export interface SceneVersionCheckpoint extends SceneVersionSummary {
  snapshot: CompositionScene
}

export interface CreateSceneVersionInput {
  name: string
  description?: string
  isAutoSave?: boolean
}

// -----------------------------------------------------------------------------
// P117: Visual Version Diffing & Change Summary Contracts
// Spec: specs/domain/editor-version-diff.md
// -----------------------------------------------------------------------------

export type NodeDiffKind = 'added' | 'removed' | 'modified' | 'unchanged'

export interface PropertyDiff {
  key: string
  kind: 'prop' | 'style' | 'tokenBinding'
  oldValue: unknown
  newValue: unknown
}

export interface SceneNodeDiff {
  nodeId: string
  type: string
  name?: string
  kind: NodeDiffKind
  propertyDiffs: PropertyDiff[]
}

export interface PageDiffSummary {
  pageId: string
  pageName: string
  addedCount: number
  removedCount: number
  modifiedCount: number
  nodeDiffs: SceneNodeDiff[]
}

export interface SceneDiffResult {
  baseSceneId: string
  targetSceneId: string
  totalAdded: number
  totalRemoved: number
  totalModified: number
  pages: PageDiffSummary[]
}

// -----------------------------------------------------------------------------
// P118: Master Component Usage Impact & Instance Analytics
// Spec: specs/domain/composition-masters-analytics.md
// -----------------------------------------------------------------------------

export interface MasterInstanceRef {
  instanceNodeId: string
  pageId: string
  pageName: string
  parentNodeId?: string
  variantId?: string
  hasOverrides: boolean
  overrideKeys: string[]
}

export interface MasterImpactReport {
  masterId: string
  masterName: string
  totalInstances: number
  pageCount: number
  instances: MasterInstanceRef[]
}

// -----------------------------------------------------------------------------
// P122: Editor Pre-Flight & Accessibility Engine
// Spec: specs/domain/editor-preflight-a11y.md
// -----------------------------------------------------------------------------

export type A11yIssueSeverity = 'error' | 'warning' | 'info'

export type A11yIssueCategory =
  | 'contrast'
  | 'touch-target'
  | 'accessible-name'
  | 'focus-order'
  | 'typography'

export interface A11yPreFlightIssue {
  id: string
  nodeId: string
  pageId?: string
  category: A11yIssueCategory
  severity: A11yIssueSeverity
  ruleId: string
  title: string
  description: string
  wcagCriterion?: string
  fixAction?: {
    type: 'set-style' | 'set-prop'
    key: string
    value: string
  }
}

export interface TabOrderEntry {
  nodeId: string
  tabIndex: number
  orderIndex: number
  label: string
}

export interface A11yPreFlightReport {
  score: number
  issues: A11yPreFlightIssue[]
  tabOrder: TabOrderEntry[]
  summary: {
    errorsCount: number
    warningsCount: number
    passedChecksCount: number
  }
}

// -----------------------------------------------------------------------------
// P123: Internationalization & RTL Layout Stress-Testing
// Spec: specs/domain/editor-i18n-stress-test.md
// -----------------------------------------------------------------------------

export type CanvasLayoutDirection = 'ltr' | 'rtl'

export interface I18nStressTestConfig {
  pseudoLocalization: boolean
  expansionMultiplier?: number
  direction: CanvasLayoutDirection
  bracketEnclosure?: boolean
}

