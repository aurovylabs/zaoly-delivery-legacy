# Composition scene — CREATION v3

**Status:** Accepted (Wave E0/E4; **E6+ P16–P23 + P28 wrap + P29 clipboard + P30 forms + P31 drag-insert + P32 DS atoms + P33 molecules**; **P44–P53 atomic / print slots**; **P54 / W-SURFACE-EDIT**; **P55 / W-SURFACE-GRAIN**; **P56 / W-INSPECT-LIVE**; **P57 / W-PRINTCHIP-INSPECT**; **P58 / W-SURFACE-ALL**; **P59 / W-ATOM-REMAINING**; **P85 print cascade + presets**) — 2026-08-15  
**Contracts:** `@zaoly/contracts` · Spec program: `editor-migration.md` · Deferred: `knowledge/editor-parity-deferred-plan.md`

## Goal

Stable JSON tree for compositions edited in `/editor`. Canvas nodes map to `@zaoly/ui` primitives via `type` (catalog id / keep-tag mapping).

## Types (contracts)

```ts
type SceneNodeId = string
type SceneBreakpointId = 'mobile' | 'tablet' | 'desktop' | 'print'

/** Print / presentation artboard geometry only (P85 + artboard-dimensions) — not an OP-9 override key. */
type PrintPresetId =
  | 'slide-16-9'
  | 'a3-portrait' | 'a3-landscape'
  | 'a4-portrait' | 'a4-landscape'
  | 'a5-portrait' | 'a5-landscape'
  | 'a6-portrait' | 'a6-landscape'
  | 'letter-portrait' | 'letter-landscape'

/** Per-breakpoint override (OP-9). Token/enum props only — never free CSS. */
interface SceneBreakpointOverride {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
}

/** Root-only Instance overrides (see `composition-masters.md`). */
interface SceneInstanceOverrides {
  props?: Record<string, unknown>
  tokenBindings?: Record<string, string>
  style?: Record<string, string | number>
  name?: string
  hidden?: boolean
  locked?: boolean
}

/** Named Master variant / sparse cell (Phase 2 + 3) — `composition-masters.md`. */
interface SceneMasterVariant {
  id: string
  /** Designer-facing label (text field on Add/Rename). */
  name: string
  root: SceneNode
  /** Phase 3: axisId → value for this cell. */
  combination?: Record<string, string>
}

/** Phase 3 Component Set axis. */
interface SceneMasterAxis {
  id: string
  name: string
  values: string[]
}

interface SceneMaster {
  id: string
  name: string
  /**
   * Definition root. MVP: sole tree. Phase 2/3: MUST equal the default variant’s
   * `root` when `variants` is non-empty (`composition-masters.md`).
   */
  root: SceneNode
  /** Dedup key for palette hydrate: atom insertType or `Composition:{exportName}`. */
  sourceKey?: string
  /** Named variants / sparse cells. Omitted → MVP single `root`. */
  variants?: SceneMasterVariant[]
  /** Id in `variants`. Required when `variants` is non-empty. */
  defaultVariantId?: string
  /** Phase 3 Component Set axes. */
  axes?: SceneMasterAxis[]
}

interface SceneNode {
  id: SceneNodeId
  type: string // e.g. 'Button' | 'Stack' | 'Text' | 'Instance' | keep alias
  name?: string
  props?: Record<string, unknown>
  style?: Record<string, string | number>
  tokenBindings?: Record<string, string> // prop → Brandion token path (P39)
  /** OP-9 responsive map — cascade: base ← breakpoints[active]. */
  breakpoints?: Partial<Record<SceneBreakpointId, SceneBreakpointOverride>>
  /** Not painted / not hit-tested when true. */
  hidden?: boolean
  /** Rejects inspect/resize/reorder/delete when true (cascade to descendants). */
  locked?: boolean
  /** When `type === 'Instance'`: Master id on `CompositionScene.masters`. */
  instanceOf?: string
  /** When `type === 'Instance'`: Phase 2/3 cell id cache; omit → Master default / MVP `root`. */
  instanceVariantId?: string
  /** When `type === 'Instance'`: Phase 3 axis picks (`axisId → value`). */
  instanceVariantAxes?: Record<string, string>
  /** When `type === 'Instance'`: root-only merge onto expanded Master (variant) root. */
  instanceOverrides?: SceneInstanceOverrides
  children?: SceneNode[]
}

interface CompositionScene {
  id: string
  name: string
  version: 1
  platformProjectId?: string | null
  /** Artboard breakpoint (OP-9). Omitted on older saves → editor defaults to desktop. */
  activeBreakpoint?: SceneBreakpointId
  /**
   * Print / presentation page preset (P85 + artboard-dimensions). Orthogonal to
   * `activeBreakpoint` — only sets artboard WxH when `activeBreakpoint === 'print'`.
   * Catalog: `slide-16-9` (1920×1080) · DIN A3–A6 · US Letter. Omitted / unknown →
   * `a4-portrait`. Does not create per-format override lanes.
   */
  activePrintPreset?: PrintPresetId
  /**
   * Node-anchored comments (P82b). Persist with scene Save.
   * Not Zaoly sidefiles — scene JSON is the SoT. Orphan comments (missing nodeId) MUST be pruned on save.
   */
  comments?: SceneComment[]
  /** Scene-local Masters (MVP) — `specs/domain/composition-masters.md`. */
  masters?: SceneMaster[]
  /** Phase 1 multi-page artboards — `specs/domain/scene-pages.md` (P80). */
  pages?: ScenePage[]
  /** Active page when `pages` is non-empty. Omitted → implicit single page from `root`. */
  activePageId?: string
  root: SceneNode
  updatedAt: string
}

interface ScenePage {
  id: string
  name: string
  root: SceneNode
  /** Board placement (P81) — `specs/domain/scene-board.md`. Omitted → normalized on load. */
  frame?: ScenePageFrame
}

/** Board-space frame placement for one page (CSS px). */
interface ScenePageFrame {
  x: number
  y: number
  width?: number
}

interface SceneComment {
  id: string
  nodeId: SceneNodeId
  body: string
  author: string
  createdAt: string
  resolved: boolean
}
```

## Ops (validate-before-write)

| Op | Effect |
|----|--------|
| `set_prop` | Update `props[key]` on node (`name` updates node.name). When editor scopes to active BP ≠ desktop, prefer `set_breakpoint_override`. |
| `set_token_binding` | Update `tokenBindings[key]` → token path; clears conflicting `style.width`/`style.height` when key is width/height |
| `clear_token_binding` | Remove `tokenBindings[key]` |
| `set_style` | Set `style.width` or `style.height` to a **finite non-negative number** (CSS px). Rejects strings / free CSS. Clears matching token binding. |
| `set_breakpoint_override` | Merge `props` / `tokenBindings` into `node.breakpoints[bp]` |
| `clear_breakpoint_override` | Remove key(s) or entire override for `bp` |
| `set_flags` | Set `hidden` and/or `locked` on node (omit = leave unchanged) |
| `insert_child` | Insert child under parent |
| `remove_node` | Remove node (not root) |
| `reorder_node` | Move node among siblings to index `index` (clamped). Rejects root. |
| `move_node` | Reparent live node to `parentId` at sibling `index` (clamped). Rejects root, cycles (into own descendant), locked node/destination, non-container parent. Same-parent moves adjust index after detach. |
| `create_master` | Clone selection into `masters[]`; replace with `Instance` — `composition-masters.md` |
| `ensure_palette_master` | Find-or-create Master by `sourceKey` + template root (no overwrite) |
| `rename_master` | Rename `masters[id].name` |
| `delete_master` | Remove Master when no Instances reference it |
| `insert_instance` | Insert `Instance` ref under parent |
| `detach_instance` | Expand Instance (resolved variant) to free tree |
| `update_master_root` | Replace `masters[id].root` (Master-edit persist; sync default variant when present) |
| `add_master_variant` | Phase 2 — append named variant (clone active/default root) — `composition-masters.md` |
| `rename_master_variant` | Phase 2 — rename `variants[id].name` |
| `delete_master_variant` | Phase 2 — remove when unused and not last |
| `set_master_default_variant` | Phase 2 — set `defaultVariantId` + sync `root` |
| `set_instance_variant` | Phase 2 — set Instance `instanceVariantId` |
| `update_master_variant_root` | Phase 2 — replace one variant’s `root` |
| `add_master_axis` | Phase 3 — append axis |
| `rename_master_axis` | Phase 3 — rename axis |
| `delete_master_axis` | Phase 3 — remove axis |
| `add_master_axis_value` | Phase 3 — append axis value (sparse) |
| `rename_master_axis_value` | Phase 3 — rename value across axis + cells |
| `delete_master_axis_value` | Phase 3 — remove value when unused |
| `set_instance_variant_axes` | Phase 3 — set Instance axis picks |
| `upsert_master_variant_cell` | Phase 3 — ensure cell for combination |
| `wrap_nodes` | Wrap sibling nodes in a new `Stack` or `Grid` (Zaoly OP-7). |
| `unwrap_node` | Promote children of a `Stack`/`Grid` and remove the container (Zaoly OP-15). |
| `add_page` | Append page with empty or duplicated artboard — `specs/domain/scene-pages.md` (P80); auto frame placement — `scene-board.md` (P81) |
| `delete_page` | Remove page when more than one remain (P80) |
| `rename_page` | Rename page label (P80) |
| `duplicate_page` | Clone page tree with fresh node ids (P80); auto frame placement (P81) |
| `set_active_page` | Switch active artboard; dual-write `root` (P80) |
| `reorder_pages` | Reorder `pages[]` (P80 Phase 1.1, optional) |
| `move_page_frame` | Set board `frame.x` / `frame.y` (P81) |
| `set_page_frame` | Merge board frame fields (P81) |
| `select` | UI-only selection (not persisted) |

Invalid ops MUST be rejected with a reason — never guessed.

Server-side application (P90): `POST /api/scenes/:id/ops` MUST use this op vocabulary via `applySceneOp` — see `specs/domain/scene-agent-editing.md`.

### Lock enforcement

- WENN node **or any ancestor** has `locked === true`, DANN mutating ops (`set_*`, `remove_node`, `reorder_node`, `move_node`, `insert_child` into locked parent, `wrap_nodes`, `unwrap_node`) MUST be rejected.
- `set_flags` unlocking the node itself is allowed when only that node is locked (not when an ancestor is locked).

### Duplicate (editor helper, not a persisted meta-op)

- Duplicate = deep-clone selected node(s) with **fresh ids** for the subtree, then `insert_child` after the source among siblings (or as last child of parent).
- Copies `hidden` / `locked` / `breakpoints` when present.
- Root MUST NOT be duplicated via this path.
- Keyboard: ⌘D / Ctrl+D (when focus is not in an editable field). Multi-select duplicates each non-root member.

## Contract notes — clipboard (P29)

Session clipboard (in-memory JSON scene nodes). OS clipboard is optional; paste MUST validate-before-write.

- **Copy** (⌘C / Ctrl+C): deep-clone selected **non-root** nodes (keep subtree props / bindings / flags). Empty selection / root-only is a no-op (does not clear an existing clipboard).
- **Paste** (⌘V / Ctrl+V): insert clones with **fresh ids** via `insert_child`. Target:
  - WENN the primary selection is a container (`Stack` | `Grid` | `Card` | `Field` | `Panel` | `ScrollArea` | `FormSection` | `CardActions` | `FilterRow` | `RankedList` | `StepStrip` | `ChannelStack` | `ChannelLane` | `EventFooter`), DANN MUSS paste append as last children of that container.
  - SONST insert after the primary selection among siblings.
- **Cut** (⌘X / Ctrl+X): copy then `remove_node` for each selected non-root **unlocked** node (skip locked; never root).
- WENN clipboard is empty, DANN paste MUST be rejected.
- WENN the paste parent (or an ancestor) is locked, DANN paste MUST be rejected.
- Invalid JSON / missing `id`+`type` trees MUST be rejected — never guessed. Clipboard paste always inserts **clones** (fresh ids). Live reparent uses `move_node` (Layers DnD), not clipboard.

## Contract notes — palette forms (P30)

- Palette types include DS form primitives already in `@zaoly/ui`: `Checkbox`, `Select`, `Switch`, `Textarea` (plus existing Heading/Grid/Link/Badge/Spacer).
- `defaultChildForType` MUST seed token/enum/boolean defaults only — never free `px` / `#hex`.
- `Select` default options are fixture enum pairs (`value`/`label`); inspect does not invent a free-form options CSS editor.

## Contract notes — palette DS atoms (P32)

- Additional `@zaoly/ui` composition primitives: `Chip`, `Divider`, `Avatar`, `Alert`, `Hint`, `Spinner`, `StatusDot`, `EmptyState`, `Slider`, `Field`, `Panel`, `Tabs`, `Accordion`.
- Token/enum/boolean/string defaults only — never free `px` / `#hex`. Skip `Skeleton` (free width/height).
- `Field` and `Panel` are drop containers (with `Stack`/`Grid`/`Card`). `Tabs` / `Accordion` use fixture items A/B; inspect does not freely edit item arrays.
- Product organisms (Chat*, FlowBoard*, AppFrame, NavRail) stay out of the palette. **P36:** Print magazine twins are on the palette (see below).

## Contract notes — palette molecules (P33)

- Additional composition molecules: `LoadingText`, `PageTitle`, `AddTile`, `TagInput`, `ToggleGroup`, `MetricChip`, `Meter`, `Lede`, `ScrollArea`, `FormSection`, `CardActions`, `FilterRow`.
- `ScrollArea`, `FormSection`, `CardActions`, `FilterRow` are drop containers. `TagInput` / `ToggleGroup` use fixture tags/options; inspect does not freely edit arrays.
- P34 list/layout: `SectionChrome`, `RankedRow`, `RankedList`, `TopStatus`, `EventFooter`, `ChannelStack`, `ChannelLane`, `StepStrip`, `KpiStrip`, `DivergingBar`.
- `RankedList`, `StepStrip`, `ChannelStack`, `ChannelLane`, `EventFooter`, **`EntityCard` (P43)**, **`KpiStrip` (P48)**, **`DivergingBar` / `PrintRankedList` / `PrintLedger` / `PrintTraitBars` (P49)**, **`PrintPersonaGrid` / `PrintTable` (P50)**, **`PrintPersonaCard` (P51)** are drop containers. Palette search filters the type list (substring on id/label). **P35:** `EDITOR_PALETTE_GROUP_TYPES` partitions every palette type into Layout / Forms / Feedback / Lists (exactly one group each).
- **P43 EntityCard / P44–P53 atomic slots:** Inner chrome is slotted **children** (`props.slot`). Omitted → body. MUST NOT flatten chrome that the designer should edit to parent strings. **P44:** EntityCard. **P45:** Field (`label`/`hint`/`error`), FormSection (`title`), FilterRow (`label`), EventFooter (`summary`), ChannelLane (`label`), Lede (`value`/`label`/`unit`), TopStatus (`primary`/`secondary`), MetricChip (`label`/`value`), RankedRow (`label`/`value`/`secondary`), SectionChrome (`title`/`meta`; title extracted because DS is `string`). **P46:** PrintPullQuote / PrintChip / PrintScoreRing / PrintCover / PrintChapter / PrintPersonaCard identity copy is slotted children. **P53 / W-PRINT-IDENTITY:** canvas paints those identity `slotKids` (and PrintPage folio / PrintDonut center) so a click hits the Text, not a closed DS string. PrintChip feeds slotted label kids into DS `children` (ReactNode). Pinned DS Cover/Chapter/quote/ring/page/donut regions stay strings — compose locally; do **not** bump DS. PrintChapter unslotted body still drops. **P51:** PrintPersonaCard is a drop-container **shell** of existing print primitives (ChipRow / TraitBars / RankedList / TwoColumn) — not a second persona type; canvas composes those children (do not paint the closed DS `persona` blob). **P47:** Alert / Hint / EmptyState / LoadingText / PageTitle / AddTile copy is slotted children; canvas paints `slotKids` (DS ReactNode). Chip / Button / Badge stay parent-string `children`. **P48:** PrintDonut center (`value`/`label`) + PrintPage folio (`label`/`footer`) are slotted; **P53** paints those kids in the folio/center regions. KpiStrip `items` explode to Lede body children. PrintPage / KpiStrip are drop containers. Do not paint PrintPage folio Text as body. **P49:** PrintRankedList / PrintLedger / PrintTraitBars / DivergingBar 1D arrays explode to selectable body children. Shell inspect keeps PrintRankedList `columns`/`compact`/`startIndex` and PrintLedger `max`. **P50:** PrintPersonaGrid `personas` explode to existing `PrintPersonaCard` body children (no second persona tree); PrintCover `kpis` explode to Lede body children (Cover is **not** a free drop container); PrintTable `rows` explode to row children (`columns` stay on the parent). **P51:** PrintPersonaGrid paints those card children (grid / two-col pairing; single card → spread), not closed DS `PrintPersonaGrid` cards. **P52 / W-ROW-HITTEST:** pinned DS list/table/cover primitives still take `items`/`traits`/`rows`/`kpis` arrays — canvas MUST NOT extract those blobs when that blocks hit-test. Paint body RankedRow (and Cover/KpiStrip Lede) children with matching `zaoly-print-*` / `ds-diverging-*` / `kpi-*` classes so each row has `data-node-id` and a canvas click selects the row, not only the parent list. Inner label/value Text may stay layers-only this wave (DS RankedRow string regions). Body containers wrap in `Stack` + shell `gap` except Field (control wiring). Lede/TopStatus/MetricChip/RankedRow/SectionChrome/print leaves (except PrintChapter / PrintPage body / PrintPersonaGrid / PrintTable / PrintPersonaCard) and P47 copy leaves / PrintDonut / PrintCover are **not** drop containers. Skip `DataTable`, `MagazineContentsNav`, `PrintQuickCheck`. Spec: `knowledge/editor-atomic-slots.md`.
- **P54 / W-SURFACE-EDIT — surface completeness before nesting:** A selected palette node MUST expose instance geometry and chrome **on that node** (width / height, border width / color / style, border radius, fill / ink, plus variants/states **only if the pinned DS primitive already has them**) **before** inner composition is the completeness criterion. Inner slot explode (P44–P53) stays landed; it is **not** the next gate. Do **not** claim atom-edit complete. Proving ground this wave: **PrintChip** (include in `SURFACE_TYPES` / color / background; shell inspect proxies `children` onto `slot === 'label'` Text). Variants/states come next **per type from DS** — PrintChip has none in the pinned DS (`PrintChip({ children })` only); do not invent them. Catalog rolls out type-by-type (Cover/Chapter wrap styles would break magazine layout). Digital Chip `/^Chip$/i` stays flattened parent-string `children` with existing `size` / `selected`.
- Skip `SwatchStrip` (free hex), overlays (`Tooltip` / `InfoTip` / `Flyout` / `Dialog`), and product chrome (Chat*, AppFrame).
- **P36 print:** `PrintPage`, `PrintChapter`, `PrintCover`, `PrintPullQuote`, `PrintScoreRing`, `PrintChip`, `PrintChipRow`, `PrintTwoColumn`, `PrintDonut`, `PrintRankedList`, `PrintLedger`, `PrintTraitBars`, `PrintTable`. `PrintPage` / `PrintChapter` / `PrintChipRow` / `PrintTwoColumn` / **`PrintRankedList` / `PrintLedger` / `PrintTraitBars` (P49)** / **`PrintTable` (P50)** / **`PrintPersonaCard` (P51)** are drop containers (`PrintTwoColumn` maps children[0]/[1] to left/right). PrintDonut center + PrintPage folio are slotted (P48) and canvas-selectable (P53). Ranked / ledger / traits / DivergingBar rows are children (P49) and **canvas-selectable (P52)**. Cover kpis + table rows + persona grid cards are children (P50); Cover KPI Ledes and table rows paint as body children (P52). Cover/Chapter/quote/chip/ring identity copy paints as `slotKids` (P53). Donut `slices` stay fixtures. Cover is not a free drop container.
- **P37 personas:** **P51:** `PrintPersonaCard` is a drop-container shell of existing print primitives (title/summary slots + ChipRow + TraitBars + TwoColumn/lists). **P50:** `PrintPersonaGrid` is a drop container whose body children **are** those same `PrintPersonaCard` shells (reuse the card; no second persona type). Canvas paints the card children, not closed DS grid cards. Shell inspect: `confidence` / `spread`. MUST NOT invent a second persona node type. Skip `PrintQuickCheck`.
- **P38 print surface:** WENN a palette print type other than `PrintPage` is inserted into a parent with no `PrintPage` ancestor, DANN MUSS the editor wrap it in a `PrintPage` (magazine paper / `--print-*` tokens / folio). Dropping into an existing `PrintPage` (or descendant) MUST insert the type as-is. Canvas MUST paint orphan print nodes (already in the tree without a page) inside a visual `PrintPage` so tokens still resolve. Skip remapping print CSS onto screen `--color-*` / `--space-*`.
- **P39 token vocabulary:** WENN `set_token_binding` writes a path, DANN MUSS that path use Brandion grammar (`color.action.primary`, `spacing.static.medium`, `typography.heading.h1`, …) — not CREATION-invented `space.md` / `color.ink` / `fontSize.xl`. Persist paths only (never resolved CSS). Spec: `brand-token-consume.md`.
- **P42 print channel:** WENN a node is inside a `PrintPage` (incl. visual wrap for orphan `Print*`), DANN MUSS canvas resolve Brandion-backed bindings from the **print** channel (`mm`/`pt` when CSS-paintable). Screen nodes keep digital. MUST NOT persist resolved print CSS. Spec CT-6.

## Contract notes — palette drag-insert (P31 · Zaoly OP-1)

- Drag a palette type onto a container (`Stack` | `Grid` | `Card` | `EntityCard` | `Field` | `Panel` | `ScrollArea` | `FormSection` | `CardActions` | `FilterRow` | `KpiStrip` | `DivergingBar` | `PrintRankedList` | `PrintLedger` | `PrintTraitBars` | `PrintPersonaGrid` | `PrintTable` | `PrintPersonaCard`) or between siblings → `insert_child` at the drop index (fresh `defaultChildForType`).
- Drop **into** a container appends (or uses the computed child index). Drop **before** / **after** a sibling inserts among that parent’s children.
- WENN the drop parent is locked, not a container (for `into`), or the target is unknown, DANN the drop MUST be rejected.
- Click-insert remains; drag is additive. Validate-before-write via `insert_child`.

## Contract notes — wrap / unwrap (P28 · Zaoly OP-7 / OP-15)

- `wrap_nodes`: `nodeIds` MUST be non-empty siblings (same parent), MUST NOT include root, MUST NOT include a locked node or a node under a locked ancestor. `containerType` is `Stack` or `Grid` only. `containerId` MUST be a fresh id.
- WENN gültig, DANN MUSS das System die Nodes (sibling order) in einen neuen Container am Index des ersten gewrappten Kindes legen.
- `unwrap_node`: target MUST be `Stack` or `Grid`, MUST NOT be root, MUST NOT be locked. Children are spliced into the parent at the container index; the container is removed. Empty containers unwrap to deletion.
- Cross-parent wrap / nest-into-arbitrary-slot / free X/Y remain non-goals.
- Keyboard: ⌘G / Ctrl+G wraps selection in `Stack`; ⌘⇧G / Ctrl+⇧G unwraps a selected Stack/Grid.

Keep `clear_token_binding` stable for implementers already shipping E4.1.

## Contract notes — undo (E6)

- **Prefer session history** in the editor (stack of `CompositionScene` after successful ops), not a persisted `undo` / `redo` `SceneOp`.
- Undo restores the previous accepted scene snapshot; redo restores the forward stack.
- Do **not** invent reverse ops that bypass validate-before-write.
- If a future agent adds contract-level `undo`/`redo` meta-ops, amend this spec + `packages/contracts` in the **same** change and keep them non-persisted (strip on PUT `/api/scenes/:id`).

## Contract notes — breakpoints (OP-9 Phase A + P85 print)

- **Artboard cascade:** optional `CompositionScene.activeBreakpoint` (`mobile` | `tablet` | `desktop` | `print`).
- Older saves without the field remain valid; editor resolves missing / unknown → `desktop`.
- **Two axes (P85):**
  - Cascade lane = `activeBreakpoint` (including one `print` lane for digital-vs-print overrides).
  - Geometry = optional `activePrintPreset` (`slide-16-9` | DIN A3–A6 | US Letter). Presets are **not** override keys. Catalog SSOT: `artboard-dimensions.md`.
- Digital artboard width follows BP map (`mobile` 390 / `tablet` 768 / `desktop` 1440); height is content-based — see `lib/scene/breakpoints.ts`.
- Print artboard: fixed CSS px from preset (paper: 96dpi `round(mm × 96 / 25.4)`; `slide-16-9` → 1920×1080). Default preset `a4-portrait` (210×297 mm → 794×1123). Unknown preset → default.
- **Per-node overrides:** `SceneNode.breakpoints` as above (key `print` allowed).
- Cascade for canvas / CSS peek / Mag materialize: `resolvedProps = { ...base.props, ...override.props }`, same for `tokenBindings`. Missing BP key inherits base. Desktop uses base only; `print` / `tablet` / `mobile` merge overrides.
- Editing while `activeBreakpoint !== 'desktop'` writes via `set_breakpoint_override` (base props stay for desktop).
- Overrides are token/enum only — never free CSS.
- Store MUST round-trip `activeBreakpoint`, `activePrintPreset`, and node `breakpoints` / `hidden` / `locked` when present; MUST ignore unknown top-level keys without failing; MUST coerce unknown breakpoint / preset ids to defaults (omit bp / default preset).

## Contract notes — resize (E6)

- SelectionHandles drag commits via `set_token_binding` (size tokens, preferred when snapping / already bound) or `set_style` (numeric px only).
- Never write free CSS strings into `style` or attrs.
- Locked nodes MUST NOT resize.

## Contract notes — keyboard nudge (E6)

- Free X/Y positioning remains a non-goal (flow layout only).
- Arrow keys nudge **size** on the primary selected non-root unlocked node: ←/→ width, ↑/↓ height.
- Prefer cycling the size-token ladder when the axis is already token-bound (or snaps); otherwise `set_style` ± step (8 CSS px, min 24).
- No-op when selection is root or missing.

## Contract notes — typed component registry (P16)

- `@zaoly/contracts` exports a hand-maintained `component-contracts` registry (Top-N + palette types) mirroring `@zaoly/ui` prop surfaces.
- Inspect field catalog **reads the registry** (fixture fallback for unmapped types).
- Bridge until live CEM — do **not** parse Stencil `custom-elements.json`.

## Surface completeness before nesting (P54 / W-SURFACE-EDIT + P55 / W-SURFACE-GRAIN + P56 / W-INSPECT-LIVE + P57 / W-PRINTCHIP-INSPECT + P58 / W-SURFACE-ALL + P59 / W-ATOM-REMAINING + P60 / W-SCORERING-TEXT)

A selected palette node MUST expose instance geometry and chrome on **that** node first: width / height (existing layout), border width / color / style, radius, fill / ink, **alignment** (`textAlign`, `alignSelf`, flex `justifyContent` / `alignItems`), padding, plus variants/states **only if the pinned DS primitive already has them**. Inner **atomic slots** (P44–P53) stay landed; they are not the next completeness criterion. Do not claim atom-edit complete. **P54 PrintChip** remains the proving ground for label proxy + stroke override. **P55** rolls remaining `Print*` into the shared apply maps (paint-safe; defaults unset) so a selected ChipRow / TwoColumn / PersonaCard / Cover / … can set alignment instead of an empty inspect. Wrap paints `text-align` / `justify-content` / `align-items`; magazine inner flex/copy honors CSS vars on `creation-scene-node--print-surface` when the DS class would swallow wrap. PrintChip `textAlign` → inner `.zaoly-print-chip`; `alignSelf` stays on the wrap. Stack keeps `align` / `justify`. Do not invent PrintChip variants.

**P56 / W-INSPECT-LIVE:** DESIGN fields that paint can honor MUST be live controls, not dead dashes. Unset may show placeholder `—` **only if** the designer can type or select a value and `set_prop` persists. Token-only pickers without a literal input looked locked (PrintChip W/H/radius/opacity). Shared apply map `resolveNodePaintStyle` paints **token bindings, then props literals, then node.style**. Optional enums stay unset (no fake stretch default). Empty optional catalog fields stay visible. Layer name writes `SceneNode.name`. Digital Chip `/^Chip$/i` stays flattened; Grid `/^Grid$/i` stays columns-only.

**P57 / W-PRINTCHIP-INSPECT:** Length DESIGN fields (W/H, radius, opacity, padding, border width) are typable `<input>`s. TokenPicker is bypassed for those groups because its empty strip is a button showing `—` that swallows keys. Color/type keep an optional TokenPicker beside the literal.

**P58 / W-SURFACE-ALL:** The same typable DESIGN chrome applies to every selected palette type (not PrintChip-only). Alignment is visible per shell kind. Variants/states come only from pinned DS props in `component-contracts.ts` — PrintChip has none; digital Chip keeps `size`/`selected`; Button keeps `variant`/`size`. Stack `align`/`justify` stay unset until picked (no fake stretch). `resolveNodePaintStyle` honors literals; PrintChip inner CSS vars stay.

**P59 / W-ATOM-REMAINING:** Remaining atom-edit holes close so instance chrome has matching selectable children. PrintDonut `slices` explode to RankedRow body children `${parentId}__slice_${key}` (legend paints those kids). PrintTable `columns` explode to slotted Text `${parentId}__col_${index}` (rows stay RankedRow). PrintPersonaCard lists get `slot: label` Text “Ziele” / “Pain Points”. RankedRow / Lede / Chip paint `slotKids` so a glyph click selects the Text. Double-click Text/Heading opens inline `contenteditable` and `set_prop` `children` on blur. Digital Chip / Button / Badge string `children` lift to slotted label Text; palette `/^Chip$/i` stays.

**P60 / W-SCORERING-TEXT:** PrintScoreRing value digit is a selectable Text child (`slot=value`, `${parentId}__value`). Hydrate lifts numeric `props.value` once. Paint value slotKids in `.zaoly-print-ring__value`; ring fill parses the Text (fallback props). Max stays shell inspect. Secondary: Button contract enums match pinned DS (`variant` + `shape`). Skips: full variant matrix, W-TOKEN-PUSH, live CEM. Leftover is Product cutover only.

## Persistence

- Wave E5: in-memory store via `/api/scenes` (`specs/api/scenes.md`).
- E6 / P13: durable-enough JSON under `paths.sceneStoreRelPath` (or `ZAOLY_SCENE_STORE_PATH`); same `CompositionScene` shape; no format fork.
- **Postgres (P18) = Phase B landed** — Coolify `creation-v3-postgres` + `ZAOLY_DATABASE_URL` (`paths.envDatabaseUrl`). JSON fallback when unset. Same `CompositionScene` shape; no dual-write. See `knowledge/creation-postgres.md`.

## Non-goals

- Span-accurate `*.zaoly.html` round-trip as SoT
- Live CEM parse
- Persisting pan/zoom/selection/undo stacks on the scene document
- Free X/Y positioning (flow layout only)
- Nest/wrap multi-select bar (Zaoly OP-7) — **P28 ships wrap/unwrap ops**; no extra nest chrome bar
