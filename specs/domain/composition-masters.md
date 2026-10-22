# Scene Masters (MVP 1A + 2A + Palette Hydrate · Phase 2 Named Variants · Phase 3 Component Sets)

**Status:** Accepted (MVP shipped) · **Phase 2 Variants:** Accepted Spec / Implementation landed — 2026-08-21 · **Phase 3 Component Sets:** Accepted Spec — 2026-09-10  
**Parent:** `specs/domain/composition-scene.md` · **Editor:** `specs/domain/editor-workspace.md` · **Inspect:** `specs/domain/editor-inspect.md`  
**Reference (Zaoly, not port):** Spec 5 R77–R84 / R89 — React/Scene-JSON, not WC attrs.  
**Knowledge:** `knowledge/master-named-variants-phase2.md` · `knowledge/master-component-sets-phase3.md`

## Goal

Figma-like **Main components** that live in the open `CompositionScene`. Designers create a Master from a selection, insert **Instances**, edit the Master once, and see changes on every Instance. **Detach** turns an Instance into a free tree.

**Palette Hydrate (1B + 2A):** Site Kit atoms and Patterns insert as Instances of scene-local Masters. Kit disk/Storybook is **seed + export only** — not live Master SSOT; scene edits win.

**Kit Master Prefill:** On editor open, ensure a scene Master for every Site Kit palette atom (`sourceKey` = insert type). No canvas Instances are created by prefill — Insert still places Instances. User-saved Kit Patterns stay hydrate-on-insert only.

**Starter section Masters:** On editor open, also ensure scene Masters for the Zaoly landing sections (`sourceKey` = `Composition:LandingNav` / `LandingHero` / `LandingShowcase` / `LandingFeatures` / `LandingKitBand` / `LandingCta` / `LandingFooter` / `LandingCard`). These are **not** Site Kit package shells — they are scene-local compositions built from atoms. Prefill is list-only on blank canvases; the default landing page places Instances of them. Scene wins when a Master with that `sourceKey` already exists.

**Phase 2 — Named variants:** A Master MAY define multiple **named variants** (each with its own `root` tree). Master-Edit shows a compact variant **Select** plus **+** that opens a small dialog for add (name), rename, and delete. Instances pick which variant to expand.

**Phase 3 — Component Sets:** A Master MAY define **N string axes** (`axes[]`) and sparse **cells** (still stored as `variants[]` with `combination`). Master-Edit shows a matrix board (primary two axes) + axis filters; Instances pick one value per axis (`instanceVariantAxes`). Kit/Storybook export exposes axis controls.

## Non-goals

- Kit Live-Push / write-back on Master-Edit; other scenes after reload.
- Cross-scene / Collection-library Masters.
- Prefill **user-saved** Kit Pattern compositions on open (those hydrate on insert only). Starter landing section Masters (`Composition:Landing*`) ARE prefilled.
- Prefill canvas Instances (Masters list only).
- Zaoly WC / `data-zaoly-instance-of`.
- Auto-deriving Master axes/cells from Site Kit / registry **prop enums** (`props.variant` / P22) on Prefill — MUST NOT conflate the two systems.
- Syncing Master axis values into **DS contract enums** / P22 prop lists (Kit Storybook **axis export** is in scope — see Save as Site Kit below).
- Instance-swap / boolean Master component properties (Phase 3 axes are **string VARIANT axes only**).
- Hard-capping cell count (UI MUST warn when product of axis values ≥ 30; designer may still proceed sparse).

## Model

| Concept | Definition |
|---------|------------|
| Master | `{ id, name, root, sourceKey?, variants?, defaultVariantId?, axes?, pulledAt?, kitRevision? }` on `CompositionScene.masters` |
| `sourceKey` | Stable dedup key: atom `insertType` (e.g. `SiteButton`) or `Composition:{exportName}` |
| `pulledAt` / `kitRevision` | Set by **Pull from Site Kit** / Reset (`site-kit-kit-pull.md`) |
| Axis (Phase 3) | `{ id, name, values: string[] }` — ordered string values; Master MAY have 0..N axes |
| Variant / cell | `{ id, name, root, combination? }` — Phase 2 `name` remains; Phase 3 `combination` maps `axisId → value` |
| Default variant | `defaultVariantId` MUST point at a member of `variants` when variants exist |
| Instance | Scene node `type: 'Instance'` with `instanceOf`, optional `instanceVariantId`, optional `instanceVariantAxes`, optional `instanceOverrides` |
| Root overrides | Merge onto expanded Master **variant** root: `props`, `tokenBindings`, `style`, `name`, `hidden`, `locked` |
| Nested overrides | `instanceOverrides.descendants[defPath]` — `defPath` is the expand suffix after the host Instance id (`::`-joined definition ids). Same override keys as root, plus optional `instanceVariantId` / `instanceVariantAxes` when `defPath` is a nested Instance. |
| Expand | Paint/Layers/hit-test see chosen cell `root` + root overrides + descendant overrides; Instance root `id` stays stable; **descendant expand ids MUST be deterministic** |

### MVP ↔ Phase 2 ↔ Phase 3 compatibility

- WENN `variants` is missing or empty, DANN MUST the system treat `root` as the sole definition (MVP behavior). Expand MUST use `root`.
- WENN `variants` is present and non-empty, DANN MUST `defaultVariantId` identify a variant in that list, and MUST `root` equal that default variant’s `root` (dual-write for older readers / Prefill).
- WENN an Instance omits `instanceVariantId` / `instanceVariantAxes`, DANN MUST expand use the Master’s default variant (or MVP `root`).
- WENN `instanceVariantId` is set but missing on the Master, DANN MUST expand fall back to the default variant (MUST NOT crash).
- WENN `axes` is missing or empty and variants have no `combination`, DANN MUST Phase 2 single-list UX remain (one Select by `name`).
- WENN load/normalize finds Phase-2 variants without `axes`, DANN MUST the system **materialize** a single axis `{ id: "axis-variant", name: "Variant", values: unique variant names }` and set each cell’s `combination` to `{ "axis-variant": name }` (idempotent). Existing `instanceVariantId` MUST continue to resolve; on next Instance write, MAY also persist `instanceVariantAxes`.
- WENN `axes` is non-empty, DANN MUST Instance pick use `instanceVariantAxes` (one value per axis). Resolve: find cell whose `combination` matches all axes; else default cell. `instanceVariantId` MAY remain as cache of the resolved cell id.

Persisted JSON stores Masters + Instance refs — **not** the expanded tree. `instanceOf` is always the Master **id**, never `sourceKey`. Scene save MUST round-trip `masters` (incl. `variants` / `defaultVariantId` / `axes` / `combination`) and Instance `instanceVariantId` / `instanceVariantAxes` with `root`.

### Master variants vs Inspect prop enums (P22)

| | **Master named variants / Component Sets** | **Prop enums (P22 / Site Kit)** |
|--|--------------------------------------------|----------------------------------|
| What | Separate definition trees under one Master (1D list or N-axis cells) | Fixed option lists on a node (`props.variant`, `size`, …) |
| UI | Variant board / matrix + axis Selects | Segmented ToggleGroup (often icons) |
| Stored | `masters[].variants[]` + `axes` + Instance picks | `props` / `instanceOverrides.props` |
| Scope | Structural component set | Contract/Kit chrome on one tree |

MUST NOT treat P22 icon chips as the way to create Master axes/cells. MUST NOT hide P22 enums when Master variants exist — they remain available on the active variant tree where the registry defines them.

## EARS

### Create Master (Convert)

WENN the designer invokes **Create Master** on a single selected non-root, non-Instance node, DANN MUST the system:

1. Clone the subtree into `masters[]` with a new `masterId` and a name (selection `name` or `type`).
2. Replace the selection with an `Instance` node (`instanceOf`, same parent index, stable new instance id).
3. Clear Instance `children` on the ref (structure lives only on the Master).
4. MAY omit `variants` (MVP single-root). WENN Phase 2 materialization runs, DANN MUST seed one variant `{ name: "Default", root }` and set `defaultVariantId`.

WENN selection is root, multi, locked, or already an Instance, DANN MUST the op reject.

### Ensure Palette Master + Insert Instance

WENN the designer inserts a Site Kit atom or Pattern from the palette, DANN MUST the system:

1. Resolve `sourceKey` (`SiteButton` or `Composition:{exportName}`).
2. WENN no Master with that `sourceKey` exists, DANN MUST create one: `root` = default atom tree or fetched Pattern tree; `name` = atom label or exportName; set `sourceKey`.
3. WENN a Master with that `sourceKey` already exists, DANN MUST reuse it and MUST NOT overwrite `root` / variants (scene wins).
4. Insert an `Instance` (`instanceOf` = that Master id) at the drop/parent target — never write the free atom/pattern tree into the page root. Omitted `instanceVariantId` → default variant.

WENN Print auto-wrap applies (`paletteChildForInsert`), DANN MUST the wrap contain the **Instance** node (not expanded children).

### Nested Instance overrides (canvas)

WENN the designer selects an expanded descendant that is itself an Instance (palette atom inside a section Master) and is **not** persisted on the page root, DANN MUST selection keep that expand id (`{hostId}::{defPath}`).

WENN Inspect / HUD / `set_prop` / `set_token_binding` / `set_style` targets that expand id, DANN MUST the system write `instanceOverrides.descendants[defPath]` on the **host** Instance. MUST NOT mutate the Master definition. Other Instances of the same Master MUST keep their own copy until they have their own descendants.

WENN the designer selects a non-Instance expanded layout node (scaffold Stack/Grid inside the Master), DANN MUST selection map to the nearest Instance ancestor (nested Instance if present, else the persisted host).

WENN Detach runs, DANN MUST descendant overrides be merged into the detached free tree.

### Kit Master Prefill (editor open)

WENN the editor opens a scene, DANN MUST the system ensure a Master exists for every Site Kit palette atom (`SITE_KIT_PALETTE_IDS`), with `sourceKey` = insert type and `root` = `defaultChildForType(type)`.

WENN `defaultChildForType` builds a Site Kit atom/layout root, DANN MUST it include canonical Brandion-path `tokenBindings` (fixture vocabulary) so Inspect shows bound values out of the box.

WENN a Master with that `sourceKey` already exists, DANN MUST the system leave its `props` / structure / variants unchanged (scene wins). WENN that Master's `root.tokenBindings` is missing keys present on `defaultChildForType(type)`, DANN MUST Prefill **soft-fill** only those missing binding keys (existing keys win). WENN interactive `states` keys are missing, DANN MUST Prefill soft-fill those state overrides (`zaoly-starter-token-pack.md`). WENN the Master has no Phase-3 `axes` and is missing starter named variants for that `sourceKey` (Button: Secondary / Accent / Destructive; Badge: Ok / Warn / Danger), DANN MUST Prefill **append** those variants with deterministic ids — MUST NOT rename or replace an existing variant of the same name.

WENN Prefill runs, DANN MUST it NOT insert Instances onto the page root / canvas.

User-saved Patterns (`Composition:{exportName}` from Kit disk) MUST NOT be prefilled — only hydrate on insert.

WENN Prefill runs, DANN MUST it also ensure a Master for every starter landing section (`Composition:LandingNav` … `Composition:LandingCard`) whose `root` is the factory tree from `zaoly-default-landing-scene.ts`. WENN a Master with that `sourceKey` already exists, DANN MUST Prefill leave it unchanged (scene wins). MUST NOT insert those section Instances onto a blank canvas — only the default landing factory places them on the page.

### Insert Instance

WENN the designer inserts from the **Components → Insert** section (Site Kit palette atom with a Kit Master), DANN MUST the system insert an `Instance` (`instanceOf`) at the drop/parent target. WENN the Master has variants, DANN MUST the Instance default to `defaultVariantId` (or omit and resolve at expand). The **In this scene** Masters list does **not** offer Insert — use Insert for placement.

### Master Edit (MVP single root)

WENN the designer opens a Master from **Components → In this scene** and the Master has no `variants` (or a single default only), DANN MUST the canvas show that Master's working `root` tree and MUST mutations (`set_prop`, structure ops, …) write to `masters[id].root` (and the matching default variant when materialized).

WENN Master Edit exits, DANN MUST the canvas return to the scene root with Instances re-expanded.

SOLANGE Master-Edit is active, MUST the editor show an always-visible **Master-Edit bar** with a primary **Back to scene** control that exits Master-Edit:
1. **Layers rail** (primary — enter switches the left tab to Layers)
2. **Canvas column top** (same exit + active variant chip)

The left rail / Layers wrap MUST be lightly tinted / edged so Master-Edit is not confused with the scene board. Layers title MAY read `Master · {name}`. The Components → In this scene banner exit MAY remain as a secondary affordance.

Master-Edit MUST NOT write back to Site Kit disk/Storybook.

### Master Edit — nested palette insert (section vs atom)

WENN Master-Edit is active on a **Site Kit palette atom** Master (`sourceKey` ∈ `SITE_KIT_PALETTE_IDS`, e.g. `SiteButton`), DANN MUST palette Insert / canvas drop be **rejected** (sealed shell — edit props/structure of that atom only via existing children if any).

WENN Master-Edit is active on a **section / composition** Master (`sourceKey` starts with `Composition:`, e.g. `Composition:LandingHero`) or a freeform Master without an atom `sourceKey`, DANN MUST palette Insert / drop hydrate into the **active variant working root** (ensure Kit Master on the scene, then `insert_instance` / free `insert_child` via `applyMasterEditOp`). MUST NOT insert into the page tree using Master-local parent ids.

WENN the drop target is Master-board chrome (tile frame / label / body wrapper) for the **active** variant, DANN MUST the planner remap to the working-root id. Drops on inactive tiles / add / placeholder MUST NOT insert into the active root.

### Master Edit — working root is the sole edit scope (P78)

SOLANGE Master-Edit is active, MUST **all** canvas/Layers/keyboard planning helpers that walk or target a tree use the **working root** (active variant `root`), not `scene.root`:

- Escape / empty marquee → select working-root id
- Marquee hit-test / visible-node walk
- Clipboard copy from selection
- Paste / palette-drop / layer-drop insert plans
- Wrap / unwrap gates (`canWrapSelection` / `canUnwrapSelection`)
- Layers hide/lock toggle node lookup
- Nest / unnest parent walks

WENN Master-Edit is inactive, DANN MUST those helpers use `scene.root` as today.

Mutations continue via `applyMasterEditOp`. The temporary scene used for that apply MUST **omit `pages` / `activePageId` / `coverPageId`** so `alignActivePageRoot` cannot replace the variant working root with a page artboard (multi-page boards).

### Master Edit — variant board (Phase 2)

WENN the designer opens a Master for edit, DANN MUST the canvas show a **variant board**: every variant’s root painted together (horizontal strip **or** vertical stack — one composition, shared artboard chrome). Layout MAY wrap; MUST remain readable at default zoom.

WENN the board is shown, DANN MUST each variant (and Phase-3 placeholder cell) paint as its own **tile chrome**: dashed outline, padding, and a distinct **variant title** label above the definition root — so cell boundaries read clearly (Figma component-set style; brand stroke, not a flat side-by-side stack). The **active** tile MUST be visually emphasized as the current edit scope (solid acid stroke + glow, `Editing · {name}` label, body outline) while inactive tiles MUST be clearly de-emphasized (lower opacity) so the designer always sees which variant they are editing. The Master-Edit bar MUST also show the active variant name.

WENN the board is shown, DANN MUST exactly one variant be **active** (selection chrome). Mutations MUST write only to the active variant’s `root` (and sync Master `root` when the active variant is the default).

WENN the designer activates another variant (click board tile / strip), DANN MUST Inspect and Layers scope to that variant’s tree without leaving Master-Edit.

WENN the Master still has only the MVP single `root` (no `variants` array), DANN MUST the board show one tile labeled **Default** (or the Master name) so the UX matches multi-variant Masters.

WENN the board is a Phase-2 / single-axis strip (`axes` empty or length 1), DANN MUST the board include a trailing **Add variant** tile (`+`). Activating it MUST create a new named variant (unique auto name such as `Variant 2`, clone of the active cell) via `add_master_variant`, then activate the new cell. Multi-axis matrices keep sparse **placeholder** tiles for missing combinations instead of a free-form `+`.

### Add Master variant (Phase 2)

WENN the designer invokes **Add variant** from Inspect `variant-axes` (Master-Edit), DANN MUST the UI require a **text name** (trimmed, non-empty). Icon-only or P22 enum pickers MUST NOT be the primary create path.

WENN the name is valid, DANN MUST the system:

1. Materialize `variants` from MVP `root` if missing (seed Default).
2. Clone the **active** variant’s `root` (or default) into a new variant with a new `id` and the given `name`.
3. Append to `variants` and set the new variant active.

WENN the name is empty or whitespace-only, DANN MUST the op reject with a human-readable reason.

WENN the name collides with an existing variant name (case-insensitive), DANN MUST the op reject (designer renames or chooses another name).

### Rename Master variant (Phase 2)

WENN `rename_master_variant`, DANN MUST only that variant’s `name` change. Instance refs keep `instanceVariantId`. Empty / colliding names MUST reject.

### Delete Master variant (Phase 2)

WENN `variants.length === 1`, DANN MUST delete reject (Master always keeps ≥1 definition).

WENN any Instance references the variant via `instanceVariantId`, DANN MUST delete reject until those Instances are reassigned, detached, or removed.

WENN delete succeeds on the default variant, DANN MUST the system pick another remaining variant as `defaultVariantId` and sync `root`.

### Set default variant (Phase 2)

WENN `set_master_default_variant`, DANN MUST `defaultVariantId` update and MUST `root` sync to that variant’s `root`.

### Instance variant selection (Phase 2)

WENN an Instance is selected outside Master-Edit, DANN MUST Inspect display the resolved Master variant definition (root ⊕ `instanceOverrides`) for field values and type catalog — not the empty Instance stub. Writes MUST still target `instanceOverrides` / `instanceVariantId` on the Instance id.

WENN HUD/Inspect writes a **literal** over a key that is only bound on the Master (no `instanceOverrides.tokenBindings[key]`), DANN MUST `clear_token_binding` on the Instance id be an **idempotent success** (no-op) so the accompanying `set_prop` batch still commits. Paint already prefers override props over Master token resolve. HUD chips MUST prefer an explicit prop/style literal over an inherited Master binding for that key.

WENN expand merges Master `style` (baked deposit snapshot) with Instance `instanceOverrides.props`, DANN MUST `resolveNodePaintStyle` apply **props over bindings over baked style** so HUD literals (`fontWeight` / `fontSize` / `fontFamily` / …) paint on the canvas. Baked Master `style.fontWeight: "400"` MUST NOT pin Instance weight after a HUD write.

WENN an Instance is selected and its Master has ≥2 variants, DANN MUST Inspect expose a **Variant** control listing variant **names** (Select or text-capable list — not P22 icon chips for Master variants).

WENN the designer picks a variant, DANN MUST `instanceVariantId` update and expand MUST use that variant’s `root` (+ overrides).

WENN the selection id is an **expand id** (`hostId::defPath`) targeting a nested Instance inside a host Master, DANN MUST `set_instance_variant` / `set_instance_variant_axes` write `instanceOverrides.descendants[defPath].instanceVariantId` (and axes) on the **host** Instance — MUST NOT reject with `Unknown node`. Expand MUST stamp those picks onto **every** matching nested Instance in the host expand subtree (including under Stack/Frame wrappers) **before** nested Instance expand.

### Propagation

SOLANGE an Instance references a Master, MUST paint/Layers use the current Master variant `root` resolved for that Instance (plus root overrides). Edits to a variant MUST appear on all Instances that resolve to that variant without rewriting Instance JSON children.

### Sealed Instance

WENN the selected node is an Instance (or a descendant only visible via expand), DANN MUST structure ops that would rewrite Instance children (`insert_child` into instance interior, `reorder` of expand children, …) reject on the persisted Instance ref. Root-level overrides via Inspect (`set_prop` / token / style on the Instance root id) MUST write `instanceOverrides`.

**Page-mode palette drop into section Instances (transparent Master write):** WENN Master-Edit is **inactive** and the designer drops a palette type `into` / beside an **expanded** container inside a **Composition section** Instance (or `into` the Instance shell itself), DANN MUST the planner route the hydrate to that section Master’s active/default variant working root (`applyPaletteHydrateInsertIntoMaster`) — same outcome as Master-Edit insert. Atom Masters stay sealed. Sibling `before`/`after` on the **persisted** Instance id (page band reorder) MUST continue to insert under the page root. Token bind remains override-based (CT-19), not a structure rewrite.

WENN the designer double-clicks an **expanded descendant** text leaf (expand id `hostId::defPath`), DANN MUST canvas inline edit commit `set_prop` `children` via `instanceOverrides.descendants[defPath]` on the host Instance — same write path as Inspect/HUD. MUST NOT silent-no-op expand ids that `resolveDescendantWriteTarget` accepts. Free (non-Instance) Text/Heading/SiteText and persisted Instance roots whose expanded type is editable text remain allowed.

### Expand id stability (P78)

WENN expand clones a Master (variant) definition under an Instance, DANN MUST each descendant expand id be a **stable function** of `(instance.id, definitionNode.id)` (e.g. `instanceId::definitionId`). Re-expanding the same Instance + definition MUST yield the same descendant ids. The expanded root id MUST remain the Instance’s persisted id.

WENN Detach expands to a free tree, DANN MUST that clone use fresh ids (detach is a write, not paint expand).

### Detach

WENN the designer detaches an Instance, DANN MUST the system replace it with an expanded free clone of the **resolved variant** root (fresh ids under the root, no `instanceOf` / `instanceOverrides` / `instanceVariantId`) at the same parent index.

### Delete Master

WENN any Instance still references the Master, DANN MUST `delete_master` reject (designer must detach or remove Instances first).

### Rename Master

WENN `rename_master`, DANN MUST only `masters[id].name` change; Instances keep `instanceOf`.

### Save as Site Kit

WENN the designer saves a selection as a Site Kit component, DANN MUST that publish Kit/Storybook only — MUST NOT change Master `sourceKey` bindings or sync other scenes.

WENN the selection is an Instance of a Master **or** Master-Edit is active, and that Master has **≥2** named variants, DANN MUST Save export **every** named variant’s definition `root` (serialized like a composition tree) into the composition override as `variants[{ id, name, composition, combination? }]` plus `defaultVariantId`. WENN the Master has Phase-3 `axes`, DANN MUST the override **also** store `axes` and each cell’s `combination`. Primary `composition` MUST be the default variant root (or the Instance’s resolved variant when saving from an Instance). Storybook Live/Catalog MUST expose **axis Selects** when `axes` is present (else a flat **Variant** control). Disk CSF (when writable) MUST emit one story export per named variant and MUST wire axis `argTypes` when axes exist. MUST NOT map Master variant names onto atom `props.variant` / P22 enums.

## Left rail

Left tabs: Palette ‖ Layers ‖ Tokens ‖ **Masters**. Masters lists scene Masters in compact rows (display name + icon actions: Open, Delete). Optional meta: `sourceKey` / variant count via title and badge.

## Inspect

- Instance selected (page mode): Inspect MUST show the **resolved Master definition** (variant root + root overrides) for field values / variant axes — same catalog as editing that component type — while writes still target `instanceOverrides` on the Instance id. Banner “Instance of {name}”, actions **Edit Master** + **Detach**.
- Instance + Master with ≥2 variants: **Variant** control in Inspect section `variant-axes` (names) → `instanceVariantId`.
- Free selection: **Create Master** as the first control in Inspect section **`component`** (full-width outlined button) when Convert is valid (not when `instanceOf` is set).
- **Master-Edit:** named-variant manage (active select, rename, **Add** via text field, delete) lives in the right Inspect **`variant-axes`** section — not the left Masters list. P22 prop-enum chips MAY appear in the same section for the active variant root; they MUST NOT create Master variants.

## Ops (contracts)

| Op | Effect |
|----|--------|
| `create_master` | Clone node → masters; replace with Instance |
| `ensure_palette_master` | Find-or-create Master by `sourceKey` + template `root`; does not overwrite existing |
| `update_master_root` | Replace `masters[id].root` (and default variant root when variants exist) |
| `rename_master` | Rename |
| `delete_master` | Remove if no Instances |
| `restore_master` | Undo companion (W7d) — upsert `SceneMaster` by id (insert at `index` when missing). Not on curated MCP/agent surface. |
| `insert_instance` | Insert Instance ref; optional `name` + `props` → `instanceOverrides.props` (page-specific copy) |
| `detach_instance` | Expand resolved variant to free tree |
| `add_master_variant` | Phase 2 — name + cloned root |
| `rename_master_variant` | Phase 2 — rename by `variantId` |
| `delete_master_variant` | Phase 2 — remove when unused and not last |
| `set_master_default_variant` | Phase 2 — default + sync `root` |
| `set_instance_variant` | Phase 2 — set `instanceVariantId` |
| `update_master_variant_root` | Phase 2 — replace one variant’s `root` (Master-edit persist for non-default) |
| `add_master_axis` | Phase 3 — append axis `{ name, values }` |
| `rename_master_axis` | Phase 3 — rename axis |
| `delete_master_axis` | Phase 3 — remove axis; strip key from all `combination`s; reject if would leave ambiguous cells |
| `add_master_axis_value` | Phase 3 — append value; MAY clone a template cell for new combinations (sparse: only when designer creates cell) |
| `rename_master_axis_value` | Phase 3 — rename value across axis + combinations |
| `delete_master_axis_value` | Phase 3 — remove value; reject if live Instances resolve to cells using it (or reassign) |
| `set_instance_variant_axes` | Phase 3 — set `instanceVariantAxes` (+ sync `instanceVariantId` to resolved cell) |
| `upsert_master_variant_cell` | Phase 3 — ensure cell for `combination` (clone template root) |

Master-edit MAY reuse normal node ops against a **working tree** that is the active variant’s `root` (editor mode), then persist via `update_master_root` / `update_master_variant_root` — validate-before-write still applies.

WENN the designer opens a Master for edit, DANN MUST Inspect select the active variant root and MUST allow prop / token / style edits on that root and its descendants. The Master working-tree root MUST NOT be treated as a locked page artboard root.

### Phase 3 — Component Sets (EARS)

WENN `axes.length ≥ 1`, DANN MUST Master-Edit show a **matrix board**: rows/columns for the first two axes; additional axes use filter Selects. Empty sparse combinations MAY show placeholder tiles that create a cell on activate (clone default/template root).

WENN the product of axis value counts is ≥ 30, DANN MUST Inspect show a non-blocking warning recommending split / fewer values (MUST NOT block save).

WENN an Instance is selected and Master has `axes`, DANN MUST Inspect expose one Select per axis → `set_instance_variant_axes`.

WENN Save as Site Kit runs for a Master with axes, DANN MUST export axis metadata + every cell composition; Storybook MUST expose axis controls (not only a flat Variant list).

## Acceptance

### MVP (shipped)

- Convert → one Master + one Instance; second Insert from Masters panel shares Master.
- Two palette inserts of `SiteButton` → one Master (`sourceKey: SiteButton`), two Instances; Master-Edit propagates.
- Two Pattern inserts of the same composition → one Master; Detach one → free tree.
- Editor open → Masters lists all Site Kit palette atoms; canvas has no prefilled Instances.
- Prefill must not overwrite an existing Master root for the same `sourceKey`.
- Edit Master text/prop → both Instances update on canvas.
- Delete Master with live Instances → reject.
- Scene save/load round-trips `masters` (incl. `sourceKey`) + Instance refs.

### Phase 2 (shipped)

- Open Master-Edit → canvas variant board; **named-variant manage in Inspect `variant-axes`** (not left Masters list).
- Add variant with text name in Inspect → new definition; active edits do not mutate other variants’ roots.
- Rename / delete variant follow reject rules above.
- Instance Variant control in Inspect `variant-axes` switches expand target; Detach clones the resolved variant.
- Save/load round-trips `variants`, `defaultVariantId`, `instanceVariantId`.
- P22 prop-enum chips remain for registry enums and MUST NOT create Master variants.

### Phase 3 (Component Sets)

- Normalize migrates Phase-2 named lists to a single `Variant` axis + combinations.
- Add/rename/delete axes and values; sparse cells; Instance multi-axis pick resolves expand.
- Matrix board + filters in Master-Edit; ≥30 warning.
- Kit/Storybook export includes axes + cells.
- Dual-ship Web + macOS; unit + UI smoke; knowledge `master-component-sets-phase3.md`.
