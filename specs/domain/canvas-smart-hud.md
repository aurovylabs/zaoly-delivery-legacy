# Canvas Smart HUD — CREATION v3

**Status:** Accepted · **Web W1–W1.3 shipped** · **W3 Web shipped** · **W2 macOS shipped** · **W4 Web + macOS shipped** (pseudo-state HUD writes + Print families + Inspect cascade + opt-in telemetry; 2026-09-11) · typography + per-family host actions refined **2026-09-11**
**Product:** CREATION v3 digital editor (Web + macOS parity target)  
**Knowledge matrix:** `knowledge/canvas-smart-hud.md`  
**Control language (all families):** `knowledge/hud-control-language.md`  
**Depends:** `editor-workspace.md` · `editor-inspect.md` · `site-kit.md` · `site-table.md` · `composition-scene.md` · `editor-presence-collaboration.md` (soft-lock) · `composition-masters.md` (working root) · `scene-board.md` (page frames) · `canvas-spacing-overlay.md` (selection padding/margin hatch — not a property bar)  
**Non-goals (this document):** Storybook UI, AI-in-HUD, selection-rect property bars

## Purpose

Turn the bottom Canvas Floating HUD into a **context-ranked quick-edit** surface for **every Site Kit atom**: WHEN the designer selects a non-root node, the HUD MUST surface the nearest useful property, structure, and host-chrome controls for that atom’s craft (typography for text, Asset Library + fit/size for images, density/add-row for tables, …), within a strict slot budget. Inspect remains the full property SSOT.

This is **not** an Insert strip with a few extras. Insert collapses on non-root selection. The Smart lane is the primary craft editor for the selection.

Concept freeze covers **W1–W4 behaviors** so implementation does not invent policy mid-flight. Family matrices and the per-component intent table live in `knowledge/canvas-smart-hud.md`.

## Current anchors

| Surface | Path |
|---------|------|
| Web HUD | `apps/web/components/canvas-floating-hud.tsx` |
| Web chrome wire | `apps/web/components/editor/editor-canvas-chrome.tsx` |
| Registry | `apps/web/lib/inspect/hud-quick-slots.ts` |
| Resolver | `apps/web/lib/inspect/resolve-hud-model.ts` |
| macOS HUD | `apps/macos/.../NativeCanvas/NativeFloatingCanvasHUD.swift` |
| Site Kit inspect props | `apps/web/lib/inspect/site-kit-fields.ts` |
| Shared style keep-props | `packages/contracts` `SHARED_STYLE_PROPS` / `genericCatalogInspectProps()` |

## Lane model

```
Empty / working root:  [ Insert primitives ] [ optional artboard slots ]
Non-root single:       [ Smart edit ≤6 slots ] [ ⋯ Structure ]
Multi (≥2):            [ Align / Distribute ] [ Group ] [ ⋯ Structure ]
```

| Lane | Empty selection | Working root only | Non-root single | Multi (≥2) |
|------|-----------------|-------------------|-----------------|------------|
| Insert (F/T/B/I/G) | MUST show | MUST **show** | MUST **fully collapse** | MUST **fully collapse** |
| Smart edit | MUST NOT | MAY compact artboard subset | MUST ranked family ≤6 | MUST NOT per-type; P92 align/distribute |
| Structure | — | MAY in `⋯` | MUST behind `⋯` | Group + Align visible; rest in `⋯` |
| Zoom Fit / 100% | MUST NOT (minimap / shortcuts) | MUST NOT | MUST NOT | MUST NOT |

### Insert collapse (locked decision)

WHEN the primary selection is a **non-root** node (or multi-select), the Quick Primitives group MUST be completely hidden — not icon-compressed, not overflowed into `+` as a peer of Smart edit in wave 1. Insert remains available via:

- Left Components palette (Site Kit)
- Existing keyboard insert shortcuts (unchanged) — still active when Insert lane is hidden and focus is not inside a HUD control
- Optional later: Overflow `+` insert (W3) — MUST NOT reintroduce an always-visible insert peer lane

**Working-root exception (Escape / artboard):** WHEN `selectedIds` is empty **or** the sole primary id is the **working root** (active page root, or Master-edit working-root — see `editor-workspace.md` Escape rule), the Insert lane MUST **show**. Smart edit MAY show a compact **artboard** subset (`layoutStack` / fill) for that root, but MUST NOT hide Insert. Rationale: Escape selects root; treating root like a deep leaf would strand insert behind the palette.

WHEN the designer selects any non-root descendant, Insert MUST collapse immediately.

### Slot budget

- Smart edit lane MUST expose **at most 6** visible slots.
- HUD is the fastest ~20% of edits; Inspect owns the rest.
- StructureOps **and** hostActions that appear as primary actions (e.g. `table_add_row`, `openAssetLibrary`) **count toward** the 6-slot budget.

## Selection resolution

1. **Primary node** = last id in `selectedIds` (same as Inspect / SelectionHandles). Empty selection → Insert only (no Smart lane). Zoom Fit/100% live outside the floating HUD (minimap / keyboard).
2. **Working root** = artboard exception above (Insert stays).
3. **Family** = resolve `node.type` through the alias map in `knowledge/canvas-smart-hud.md`, then pick `familyId`.
4. **Nested leaves:** HUD MUST follow the selected node (selecting `SiteText` inside a cell MUST use Text family, not Table).
5. **Master Instance:** MUST show the existing INSTANCE pill; property writes MUST use the same override / Inspect apply path as the right rail (no detached free tree writes).
6. **Locked node or soft-lock conflict:** Smart edit controls MUST be disabled or read-only with a short hint; structure mutations MUST remain rejected per soft-lock / locked rules.
7. **Unknown type:** MUST use `Fallback` family.
8. **Palette coverage:** Every `SITE_KIT_PALETTE_IDS` type MUST resolve to a non-`fallback` family.

## Write targets (Inspect parity)

HUD property writes MUST use the **same apply path** as Inspect for the primary node:

| Context | HUD write target (wave 1) |
|---------|---------------------------|
| Base / default | Node `props` / `style` / `tokenBindings` via existing ops |
| Active breakpoint with Inspect in override mode | Same as Inspect: `set_breakpoint_override` / clear for the **active** breakpoint; otherwise base |
| Interactive pseudo-state ≠ `default` | **W4:** Smart writes into the active state override map (`set_state_override` / clear) via shared Inspect state switcher; structureOps stay disabled while ≠ default |
| Master Instance | Instance override path (identical to Inspect) |
| Literal on key + token swatch change | Follow existing Inspect/token conflict rules |
| `hostAction` | Editor chrome (Asset Library, SVG deep-edit) — **not** a SceneOp |

HUD MUST NOT invent a third override layer.

## Interaction mutexes & editor modes

| Situation | HUD behavior |
|-----------|----------------|
| Canvas **inline text edit** open | Smart lane + structure mutations MUST be disabled until commit/cancel |
| Space-pan / middle-click pan | HUD stays interactive |
| **Marquee** in progress | No lane switch until marquee commits |
| **Comments** / Assistant drawer open | HUD stays; no AI slots |
| **Read-only** share / viewer | Mutating slots + structure disabled; viewport zoom via minimap / shortcuts only |
| **Soft-lock** on primary | Mutating controls disabled + presence hint |
| **Ancestor locked** | Same rejection as scene ops |
| Scene board: click **inactive page frame** | Activate page first; then resolve HUD |
| Master-edit variant board | Insert exception applies to **working** root only |
| Narrow canvas column | Single row; horizontal scroll inside toolbar — MUST NOT wrap to two rows |
| Selection family changes | Replace slots without growing past one toolbar row |
| Failed op (floor / validation) | Disable or no-op; MUST NOT toast-spam |
| Focus inside HUD control | Canvas insert letter shortcuts MUST NOT fire |
| Focus on canvas, Insert collapsed | Insert shortcuts still work |
| Asset Library / SVG deep-edit open | HUD stays behind modal (M08) |

## Field SSOT and registry shape

HUD MUST **rank** existing Inspect / contract fields and declared host actions. It MUST NOT invent a second prop vocabulary.

**Chosen schema:** a separate registry `hudQuickSlotsByFamily` in `apps/web/lib/inspect/hud-quick-slots.ts`. Do **not** add `hudRank` onto `ContractPropDef` in contracts — Inspect density stays independent of HUD priority.

Each family entry:

```text
familyId: string
matchTypes: string[]
slots: HudQuickSlot[]         # rank ascending; UI takes first 6 that pass `when`
structurePriority: string[]
```

Each slot:

```text
key: string
source: prop | style | tokenBinding | structureOp | hostAction
control: segmented | stepper | sizeMode | swatch | tokenColor | tokenType | tokenLength | toggle | action | select
rank: number
when?: guardId
op?: SceneOp discriminant     # when source = structureOp
hostAction?: openAssetLibrary | openSvgDeepEdit
writeAs?: prop | token | auto # select writes
```

### Ranking rules

1. Family-specific **primary craft** ranks above shared style keys (text → type; image → Asset Library; table → density/structure).
2. Token-bound **color / fill** keys (`tokenColor`): MUST use Inspect-parity `@zaoly/ui` **TokenPicker** (`browser` + `allowLiteral` + `previewKind="color"`). Writes `set_token_binding` / `set_prop` + `clear_token_binding` via Inspect conflict rules.
3. Token-bound **typography** keys (`fontFamily` / `fontSize` / `fontWeight` via `tokenType`): MUST use the same TokenPicker pattern — Brandion **type roles** that expose the field’s facet (family / size / weight), Google Faces scope on family, free literals (`px` / weight / family name). Size / Weight menus MAY also list short CSS quick-picks that write literals (not Brandion `fontSize.*` / `fontWeight.*` paths — see `knowledge/token-layers.md`).
4. Other length keys (`tokenLength` gap/pad/radius) and `sizeMode` (width/height Fixed): same TokenPicker / size-dim pattern with free CSS lengths + ±.
5. **Typography on strip (locked):** `tokenType` (Font · Size · Weight) and `tokenColor` MUST render as compact HUD chips that show the current value; click opens a TokenPicker popover for that property only. `tokenLength` / `sizeMode` MUST also render on the strip (no Style… accordion). MUST NOT be a centered modal.
6. **Size / Weight chip summary:** when bound to a typography role, the chip / menu head MUST prefer the resolved **facet** (e.g. `0.78rem` / `400`), not `0.78rem · Body`. List rows MUST use short role labels (Body / H1) with sample styling — no color/space junk, no `valueLabel · role` concatenation.
6. Literals for enum / boolean / short segmented values stay on Select/segmented in the HUD strip; type + paint literals go through the chip TokenPicker; length literals go through the craft accordion TokenPicker when craft slots remain.
7. StructureOps and hostActions count toward the visible HUD slot budget.
8. Guards (`when`) MUST hide or disable slots that would fail validation (e.g. unwrap without children; `table_remove_row` when only one body row remains; form type biases).

### Control types

| Control | Typical keys | Surface |
|---------|----------------|---------|
| `segmented` | direction, density, borders, align, columns | Floating HUD strip |
| `select` | mark — **`Field` + `Select`** (`@zaoly/ui`) | Floating HUD strip |
| `tokenType` | fontFamily, fontSize, fontWeight | **HUD strip chip → property menu** |
| `tokenColor` | color, background, fill | **HUD strip chip → property menu** |
| `tokenLength` | gap, padding, radius | HUD strip icon → TokenPicker (presets + roles) |
| `sizeMode` | width, height | HUD strip icon → Hug/Fill/Fixed menu |
| `swatch` | legacy ladder affordance (prefer `tokenColor` for paint) | HUD chip or popover |
| `toggle` | wrap, striped, header | Floating HUD strip |
| `action` | table_add_row/column **or** hostAction (`Image…`, `Edit SVG…`) | Floating HUD strip |

**Field + Select (locked for enums):** enum / ladder Smart slots MUST use `@zaoly/ui` `Field` + `Select` — MUST NOT use OS/browser `<select>` chrome. Tiny enums (≤4) MAY remain segmented.

**TokenPicker:** `tokenType` / `tokenColor` / `tokenLength` / `sizeMode` render as compact HUD strip **icon** controls (click → property popover). MUST NOT use a Style… craft accordion. `tokenLength` menus MUST follow the typography pattern: CSS presets (`ln:…`) → Brandion roles → free literal ±; menu head shows the resolved length facet only. `sizeMode` MUST use icon strip → Hug/Fill/Fixed menu (Fixed: frame presets + free ±); MUST NOT show Field+Select on the strip. See `knowledge/hud-tokenpicker.md` · `knowledge/hud-control-language.md`.

Long strings (caption, href, markup, placeholder copy, raw `src`) MUST stay in Inspect, canvas inline edit, or host dialogs — not HUD text fields.

## Structure overflow (`⋯`)

Default single-selection overflow order (family MAY reorder via `structurePriority`):

1. Wrap Stack  
2. Wrap Grid  
3. Unwrap (when allowed)  
4. Bring forward / Send backward  
5. Duplicate  
6. Create Master / Detach Instance  
7. Delete  

Multi-select: **Group** stays visible; Align/Distribute stay visible (P92); remaining items in `⋯`.

## Families (normative list)

Full slot matrices + **per-component intent table** live in `knowledge/canvas-smart-hud.md`. Spec requires coverage of every Site Kit palette insertable:

`SiteButton`, `SiteText`, `SiteLink`, `SiteInput`, `SiteTextarea`, `SiteSelect`, `SiteCheckbox`, `SiteBadge`, `SiteImage`, `SiteSvg`, `SiteShape`, `SiteContainer`, `SiteStack`, `SiteGrid`, `SiteDivider`, `SiteTable`, `SiteTableRow`, `SiteTableCell`

Plus legacy aliases (`Stack`, `Text`, `Heading`, `Button`, `Image`, `Grid`, `Card`, `Table`, …) mapped into those families.

| familyId | Primary craft (Dialog lead; HUD keeps segmented/actions) |
|----------|--------------------------|
| `text` | Font · Size · Weight · Color (+ Align / Level in HUD when segmented) |
| `textLink` | Same type controls (no href field) |
| `layoutStack` | Gap · width · pad · margin in HUD; Direction / justify / align / wrap → Inspect Flex layout only (`knowledge/inspector-hud-layout-ownership.md`) |
| `layoutGrid` | Gap, width in Dialog; Columns in HUD |
| `media` | Size · Radius in Dialog; **Image…** in HUD; Fit (`objectFit`) Inspect-only |
| `mediaSvg` | Size · Color in Dialog; Mark · **Edit SVG…** in HUD |
| `action` | Fill, label color, radius, width in Dialog |
| `actionBadge` | Fill, color, radius in Dialog |
| `form` | Width + pad/radius/fill/height in Dialog |
| `table` | Density, borders, add row/column in HUD |
| `tableRow` | Header row toggle |
| `tableCell` | Align, header cell |
| `divider` | Width / opacity |
| `shape` | Fill, radius, size in Dialog |
| `artboard` | Fill/pad in Dialog for working root |
| `fallback` | width, padding, fill in Dialog |

## Multi-select (P92 + mixed families)

### W1 (ship)

WHEN `selectedCount > 1`:

- Insert MUST stay collapsed.
- Smart **per-type** slots MUST NOT appear.
- **Mixed-family intersection editing** MUST NOT appear in W1.
- Align (6) and Distribute (H/V when ≥3) MUST remain available.
- Group MUST remain available.
- Other structure actions MUST move behind `⋯`.
- Primary for Inspect remains last id; HUD MUST NOT show that primary’s Smart lane while multi is active.

### W3 (shipped Web — see knowledge)

WHEN `selectedCount > 1` and intersection Smart is enabled:

- Compute `intersectSlots(selectedNodes)` per knowledge rules (same `familyId` **or** shared allowlisted keys only).
- Show ≤6 intersection slots **instead of** Align-only emptiness; Align/Distribute/Group remain visible.
- Writes MUST batch one op per selected id (single undo step) via `fanOutHudOpsToSelection`, and abort the batch with no partial commit if any target is locked (fail closed). Soft-lock disables mutating Smart for the multi model.
- Structure overflow MUST expose Insert primitives while the peer Insert lane stays collapsed.

## Presence & collaboration

StructureOps and property writes from the HUD MUST honor the same soft-lock and locked-node rejection as Inspect / canvas ops. Soft-lock target ids for table structure ops remain the table node id (`site-table.md` / presence soft-lock).

Peer soft-lock on a **descendant** while parent is selected: follow scene-op rejection rules for the op’s target ids.

## Accessibility

- Toolbar `role="toolbar"` / accessible name retained (`Canvas Quick Actions` or updated to `Canvas smart actions` in implementation wave).
- Every control MUST have `aria-label` from locales (`editor.hud.*` / reused `editor.*`). Icon-only HUD controls MUST use `@zaoly/ui` `Tooltip` via `ChromeTip` (**P104**). Do not rely on English hardcodes or native `title` alone — see `knowledge/chrome-tooltips.md`.
- Disabled soft-lock / locked / read-only / inline-edit / pseudo-state state MUST be announced, not only color-coded.
- Focus order: Smart slots → Structure overflow; Left/Right arrow within toolbar when focused.

## Situations catalog

Normative decisions above; exhaustive situation → behavior matrix, algorithms (`resolveFamily` / `resolveHudModel` / `intersectSlots`), W3/W4 designs, and W1 test ids: `knowledge/canvas-smart-hud.md`.

## Non-goals (never / other products)

- Second property system or free CSS editing in the HUD
- SiteTable sort/filter/virtualization (content table only)
- **AI suggestions inside the HUD** (Assistant drawer only — permanent)
- **Property bar docked to the selection rect** (bottom HUD remains the host — permanent unless a new spec replaces this one). Editor-only padding/margin **hatch bands** (`canvas-spacing-overlay.md`) are layout chrome, not a property bar, and MUST leave the HUD host unchanged.
- CSV/Sheets paste as a **HUD control** (lives in SiteTable editor backlog / paste pipeline — not a Smart slot)

## Designed later waves (concept-complete, not TBD)

These are fully specified in `knowledge/canvas-smart-hud.md` § Designed later waves. Implementation order:

| Wave | Scope |
|------|--------|
| **Concept (this)** | Spec + family matrix + situations + later-wave designs frozen |
| **W1 Web** | Registry, Smart lane, Insert collapse + root exception, mutexes, tests |
| **W2 macOS** | Parity `NativeFloatingCanvasHUD` |
| **W3** | Overflow `+` insert · multi-select intersection Smart lane · optional telemetry · keyboard polish |
| **W4** | Pseudo-state-aware HUD writes · Print* family matrices |

W1 MUST NOT implement W3/W4 UI, but W1 code SHOULD keep extension points (`resolveHudModel(selection, ctx)`) so later waves do not fork the lane model.

## Implementation roadmap

| Wave | Scope | Status |
|------|--------|--------|
| **Concept** | Spec + knowledge matrix + situations + later-wave designs | **done** |
| **W1 Web** | Registry + Smart lane + Insert collapse + tests | **done** (2026-09-11) |
| **W1.1** | Typography selects · media Asset Library · SVG mark/deep-edit · form guards · docs sync | **done** (2026-09-11) |
| **W1.2** | Color/fill → compact Inspect TokenPicker (catalog + `#hex`) | **done** (2026-09-11) |
| **W1.3** | Wave C density/borders icons · Wave D form matrix sync · hostAction icons | **done** (2026-09-11) |
| **W2 macOS** | Parity in `NativeFloatingCanvasHUD` | **shipped** (2026-09-11): `HudResolveModel` + lane/Smart/overflow Insert; TokenPicker craft polish follow-up — see `knowledge/canvas-smart-hud-macos.md` |
| **W3** | `+` insert overflow, multi intersection Smart, telemetry | **Web shipped** (2026-09-11): intersection Smart + overflow Insert; telemetry opt-in shipped with W4b |
| **W4** | Pseudo-state HUD writes, Print families | **Web + macOS shipped** (2026-09-11): Inspect state bar + HUD `:state` writes + Print* + cascade display + opt-in telemetry (`knowledge/canvas-smart-hud-w4.md`) |

## Acceptance criteria

### Concept wave (docs) — freeze gate

1. Lanes, Insert collapse **with working-root exception**, budget, selection resolution, write targets, mutexes, ranking, guards, multi/lock/instance.
2. Every `SITE_KIT_PALETTE_IDS` type mapped with a **primary craft** intent; situations catalog covers selection, locks, modes, board, a11y, and **designed** W3/W4 behaviors (not open TBDs).
3. Algorithms `resolveFamily` / `resolveHudModel` / empty-slot / stale-selection documented.
4. `editor-workspace.md` and `editor-inspect.md` reference this spec; Inspect remains SSOT.
5. Permanent non-goals (AI-in-HUD, selection-rect bar) explicit.
6. Host actions (`openAssetLibrary`, `openSvgDeepEdit`) specified for media families.

### W1 / W1.1 / W1.2 (implementation)

7. Selecting `SiteText` (non-root) collapses Insert and shows Font · Size · Weight · Color TokenPickers (Brandion catalog + free `#hex`).
8. Selecting working root keeps Insert visible.
9. Selecting `SiteStack` / `SiteTable` / `SiteImage` matches family matrices within ≤6 slots (Image includes Asset Library action).
10. Locked / soft-locked / inline-edit / non-default pseudo-state disables mutating HUD controls.
11. Stale selection (deleted node) falls back per algorithm.
12. Color / fill Smart slots use compact Inspect-parity TokenPicker — not a curated Select ladder.
12. Tests: collapse, root exception, empty Smart fallback, palette coverage, ≥ one family per major group (text, layout, media, table).

## Related

- Workspace IA: `specs/domain/editor-workspace.md`
- Inspect density: `specs/domain/editor-inspect.md` · `knowledge/editor-inspect-density.md`
- Site Kit: `specs/domain/site-kit.md`
- SiteTable: `specs/domain/site-table.md` · `knowledge/site-table.md`
- Paths index: `knowledge/paths.md`
- Situations + later waves: `knowledge/canvas-smart-hud.md`
