# Scene board — CREATION v3 (P81)

**Status:** Accepted (Spec only — spatial board) — 2026-08-22  
**Parent:** `specs/domain/scene-pages.md` (P80) · `specs/domain/composition-scene.md` · **Editor:** `specs/domain/editor-workspace.md` · **Tasks:** `tasks/p81-scene-board-plan.md`  
**Precedent:** Master variant board (`buildMasterVariantBoard` in `master-variants.ts`) — ephemeral paint tree with positioned tiles; P81 applies the same *pattern* to scene pages, not the same ids.

## Goal

Designers see **all scene pages (Zeichenflächen) on one shared, pan/zoom canvas** — like Figma frames on an infinite board — instead of switching tabs where only one artboard is visible at a time (P80).

- **One board** per `CompositionScene`: pan, zoom, and place page frames in board space (`x`, `y`).
- **Active page** still drives Layers, Inspect, palette insert, and tree ops (same as P80).
- **New page** spawns as a **new frame on the board** (default: to the right of the active page), not as an invisible tab-only document.
- P80 data (`pages[]`, `activePageId`, per-page `root`, dual-write `root`) **remains**; P81 adds **frame placement** + **board paint/editing**.

## Non-goals (P81)

- Freeform vector layers, pen tool, boolean ops, arbitrary shapes on the board (not scene nodes). Opaque `SiteSvg` scene leaves are out of this Non-goal — see `site-svg.md`.
- Nested frames as first-class `SceneNode` types — page frame is **metadata on `ScenePage`**, not a user-authored Stack in the page tree.
- Per-page `activeBreakpoint` overrides (P81.1+).
- Multi-page PDF / export bundle (P81.1+ — see `composition-magazine-pdf.md`).
- Replacing Collection / scene list — still one composition document per `?sceneId=`.
- Board view during **Master-edit** — Master variant board stays separate (P78); exit Master-edit returns to scene board + active page frame.

## Relationship to P80

| P80 (shipped) | P81 (this spec) |
|---------------|-----------------|
| Tab strip switches visible artboard | Tabs **removed** when board ships; page list moves to **Pages** section (Layers rail) |
| Canvas paints **active page root** only | Canvas paints **all page frames** on one board surface |
| `add_page` appends page + activates | `add_page` also **auto-places** frame on board |
| No `x`/`y` | Each page has **`frame: { x, y, width? }`** |

P80 tab UX MAY remain behind a dev flag until P81 Wave 3 lands; production target is board-only for multi-page scenes.

## Model

Extend `ScenePage` (contracts + `scene-pages.md`):

```ts
/** Board-space placement for one page frame (CSS px). Not an OP-9 override. */
interface ScenePageFrame {
  /** Top-left of frame chrome on the infinite board. */
  x: number
  y: number
  /**
   * Optional persisted artboard width for this frame.
   * Omitted → derive from scene `activeBreakpoint` / print preset at paint time.
   */
  width?: number
  /**
   * Optional persisted artboard height (CSS px).
   * Omitted → measured (digital) or print preset height. Spec: `artboard-dimensions.md`.
   */
  height?: number
}

interface ScenePage {
  id: string
  name: string
  root: SceneNode
  /** Omitted on legacy P80 saves → normalized on load (see below). */
  frame?: ScenePageFrame
}
```

`CompositionScene` unchanged at top level except round-trip of `pages[].frame`. **`root` dual-write** (active page root) unchanged for P80 compat.

### Frame defaults & normalization

1. WENN `pages` is synthesized or a page lacks `frame`, DANN MUST `normalizeScenePages` assign board positions:
   - First page: `{ x: 0, y: 0 }`.
   - Subsequent pages in array order without `frame`: place in a **horizontal row** to the right of the previous frame:  
     `x = prev.x + prevWidth + BOARD_PAGE_GAP`, `y = prev.y` (same baseline).
2. `prevWidth` = `frame.width` if set, else current breakpoint artboard width (same helper as editor artboard width).
3. `BOARD_PAGE_GAP` = **120** CSS px (constant in `scene-board.ts`; document in spec only until shipped).
4. WENN `frame.x` / `frame.y` are non-finite, DANN MUST re-run auto-placement for that page on load.
5. Node ids inside page trees MUST remain **unique across all pages** (P80 rule unchanged).

### Ephemeral board paint tree (not persisted)

The editor MUST compose a **virtual board root** for `CanvasViewport` (same idea as `MASTER_BOARD_ID` / `buildMasterVariantBoard`):

| Constant | Value | Role |
|----------|-------|------|
| `SCENE_BOARD_ID` | `__scene-board` | Virtual root; locked; not in `pages[]` |
| `SCENE_BOARD_FRAME_PREFIX` | `__page-frame:` | Frame chrome wrapper per page |

Each page frame tile:

- Wrapper id: `` `${SCENE_BOARD_FRAME_PREFIX}${pageId}` ``
- Label child: page `name` (meta Text or dedicated chrome — app paint)
- Body child: expanded **page `root`** (Instances expanded for paint)
- Wrapper `style`: `position: absolute; left: frame.x; top: frame.y; width: <derived>;` + frame chrome (white pad, border, optional shadow)
- **Active** frame: stronger border / `data-page-frame-active="true"`; inactive frames still visible but de-emphasized

The virtual board MUST NOT be written to `CompositionScene` on save.

### Shared vs per-page (P81 additions)

| Field | Scope |
|-------|--------|
| `pages[].frame` | Per page — persisted |
| Board pan / zoom | Session (existing `CanvasViewport` state) |
| Fit target | Session — **Shift+1** / default fit → **active frame**; toolbar fit button → **all frames** (P81.1 / Wave A) |
| Tree ops | Active page only (unchanged) |
| Frame drag | Updates `pages[pageId].frame` via op |

## Scene ops (validate-before-write)

Extend `SceneOp` in `@zaoly/contracts`:

| Op | Effect |
|----|--------|
| `move_page_frame` | Set `pages[pageId].frame.x` and `.frame.y` (finite numbers). Reject unknown `pageId`. |
| `set_page_frame` | Merge `{ x?, y?, width?, height? }` onto page frame. `clearWidth` / `clearHeight` remove size overrides. Reject non-finite / non-positive sizes. Spec: `artboard-dimensions.md`. |

**Updated P80 ops (behavior change when P81 shipped):**

| Op | P81 addition |
|----|----------------|
| `add_page` | After append, set `frame` via **auto-place right of active page** (or `{0,0}` if first page). Activate new page. |
| `duplicate_page` | Clone root + new id; **auto-place** frame to the right of source page frame. Activate duplicate. |
| `delete_page` | Unchanged — remove page + frame metadata together. |
| `set_active_page` | Unchanged — dual-write `root`; selection clears to new page root (inside frame). |

All tree ops (`set_prop`, `insert_child`, …) MUST still reject nodes outside the **active page** subtree (P80).  
Frame wrapper / board ids MUST NOT accept tree ops (`rejectIfBoardChrome`).

## Editor IA

### Canvas (primary change)

| Behavior | Rule |
|----------|------|
| Surface | Infinite board pad (existing pan/zoom); neutral grey like today’s artboard pad |
| Paint | All pages as frames simultaneously |
| Click frame chrome (label/border, not inner content) | `set_active_page`; select page frame id; Layers shows that page’s tree |
| Click node inside active frame | Normal selection within active page root |
| Click inside **inactive** frame | `set_active_page` for that page **then** select clicked node (Figma-like focus switch) |
| Double-click inactive frame background | Activate page only; selection = page root |
| Drag frame chrome | `move_page_frame` (undoable); **label bar** is primary grab target (`cursor: grab`); **Alt+drag** on empty page background moves frame; live preview while dragging; snap to **8px** grid on drop. Blocked while Space/Hand pan. Snap/align neighbors optional P81.1 |
| Space / middle-click pan | Pans board (unchanged; no Hand-tool button) |
| Breakpoint switch | Resizes **derived** frame width when `frame.width` omitted; does not move `x`/`y` |

### Page navigation (replaces P80 tabs)

| Zone | Behavior |
|------|----------|
| **Pages list** | Section at top of **Layers** left rail (or dedicated sub-tab): page name rows, active highlight, context rename/duplicate/delete, **+** → `add_page` |
| **EditorPageTabs** | **Removed** from canvas chrome when P81 ships |
| Keyboard | P81.1: **⌘⌥]** / **⌘⌥[** cycle `activePageId` + fit active frame into view (Wave C) |

### Layers

- Tree rooted at **active page `root`** (unchanged).
- Optional: when page frame selected (not a deep node), Inspect shows **Page** section: name, frame X/Y, width override.
- **Cross-page layer move (P82 / Phase 1.1):** Drag a layer row (`LAYERS_PANEL_DND_MIME`) **or a canvas node** onto a **Pages list** row, another page’s frame (label/body), or a node inside that frame → `move_node_to_page`; destination page becomes active; moved node(s) stay selected. Same-page drops continue to use `move_node`. Locked nodes, page roots, and board chrome are not canvas-draggable.
- **Multi-select cross-page (P82 Wave A):** When the dragged node is part of the current canvas/layers selection, **all selected movable nodes** (excluding page roots, locked, and nested descendants of another selected node) move together; relative order is preserved.
- **Canvas drop feedback (P82 Wave A):** Layer/canvas drags on the board MUST show the same green/red drop chrome as palette drops (`planCrossPageLayerDrop` validity).

### Save / fingerprint

- `sceneSaveFingerprint()` MUST include every `pages[].frame`.
- Dirty when frame moves or page content edits.

### Master-edit

- Unchanged: variant board replaces scene board while `editingMasterId` set.
- On exit: restore scene board paint + selection on **active page root** inside its frame.

## Persistence

- **HTTP:** `PUT /api/scenes/:id` — `pages[].frame` round-trips inside existing `pages` JSONB column (no new PG column).
- **Load:** `normalizeScenePages` assigns missing frames before editor paint.
- **Legacy:** P80 saves without `frame` open on board after normalize (single page at origin; multi-page row layout).

## Demo / seed data

- `createDemoScene()` MUST assign frames so **Home** and **Contact** appear **side-by-side** on the board (e.g. Home `{0,0}`, Contact `{ homeWidth + GAP, 0 }`), not tab-exclusive positions.
- `createEmptyArtboardScene()` → single page at `{ x: 0, y: 0 }`.

## Site Kit & export

- **Save as Site Kit component:** unchanged — selection on **active page** only.
- **Export / PDF:** Magazin PDF = Print* only (`composition-magazine-pdf.md`). WYSIWYG any artboard = Surface export PNG/PDF (`scene-surface-export.md`).

## Acceptance (P81)

1. `/editor` with ≥2 pages shows **both frames on one board**; pan/zoom moves the board, not a single artboard swap.
2. Adding a page creates a **visible new frame** on the board (default placement right of active).
3. Dragging a frame persists `x`/`y` across Save + reload.
4. Clicking content in another frame activates that page and selects the node; Layers/Inspect follow active page.
5. Tree ops on inactive page nodes are rejected; frame/board ids are not mutable via `set_prop`.
6. P80 legacy saves without `frame` normalize to a sensible row layout without data loss.
7. Master-edit regression: variant board still works; exit returns to scene board.
8. Unit tests: normalize frames, auto-place on `add_page`, `move_page_frame`, board paint id mapping, hit-test maps frame chrome → page id.
9. Spec inventory updated; `editor-workspace.md` acceptance row P81; demo spatial Home+Contact.

## Phase 1.1 (optional follow-ups — not blocking P81)

- **P82 — Cross-page layer drag** (Layers → Pages list or canvas page frame) via `move_node_to_page`.
- Snap grid / align frames to neighbors.
- ~~Toolbar **Fit all frames** vs **Fit active frame**.~~ **Shipped (Wave A):** Shift+1 = active frame; toolbar = all frames.
- ~~Snap grid / align frames to neighbors.~~ **Shipped (Wave C):** magnetic neighbor align during frame drag (`snapPageFramePosition`).

## Phase 1.2 — Board performance (Wave B)

- **Full inactive paint (default):** `buildSceneBoardForPaint` paints **full content for every page frame**. Active frame keeps stronger chrome (`data-page-frame-active`); inactive frames stay fully visible (not collapsed/placeholder).
- **Lazy inactive paint (opt-in):** Callers may pass `lazyInactivePages: true` for placeholder-only inactive frames (`data-page-frame-placeholder`). The in-app editor keeps lazy **off** so multi-page boards show every artboard at once.
- **Placeholder activation:** When lazy mode is on, clicking the inactive placeholder activates that page and selects its persisted `page.root.id` (not the ephemeral placeholder id).
- **Instance expand:** `expandSceneBoardForPaint` skips placeholder bodies.
- **Frame drag preview:** Session-only position updates via `syncBoardFrameDragPreviewDom` / `clearBoardFrameDragPreviewDom` on the painted frame chrome — no board tree rebuild per pointer move.
- **`SceneNodeView` memo:** `React.memo` with stable `node` reference + **`selectedIds` reference** compare (WS-2). Per-node selection-only compare on ancestors is insufficient — when selection moves between descendants, ancestors that are themselves unselected MUST still re-render so children receive the new `selectedIds`. `listPaint` base object SHOULD be memoized per parent node so unchanged branches can skip when only siblings mutate.

## Phase 1.3 — Board polish (Wave C / P81.1)

- **Page cycle shortcuts:** **⌘⌥]** / **⌘⌥[** cycle `activePageId` in `pages[]` order (wrap); after switch, **fit active frame** into view.
- **Double-click inactive frame body:** Activates that page and selects **page root only** (no deep node selection).
- **Neighbor snap:** While dragging a frame, edges/centers snap to other frames within `BOARD_FRAME_ALIGN_THRESHOLD` (12px), then to the 8px grid on drop.

## Phase 1.4 — Board backlog (shipped)

- **Page frame Inspector:** When page frame chrome is selected (`__page-frame:*`), Inspect shows **Page** section: name, frame X/Y, width override, optional per-page breakpoint.
- **Per-page breakpoint:** `ScenePage.breakpoint` overrides frame width derivation on the board; scene toolbar `activeBreakpoint` still drives edit cascade for the active page.
- **Multi-page PDF:** Mag export walks every scene page in `pages[]` order and concatenates `PrintPage` nodes from each page root.
- **Board minimap:** When ≥2 pages, a thumbnail rail shows all frame rects + viewport; click a frame to activate + fit.
  - **Fit bounds:** Layout scale fits the **union** of page-frame bounds and the camera world rect (`viewportSize / zoom`, origin from pan). Zooming out shrinks page thumbs so the viewport overlay stays inside the widget (no overflow).
  - **Overflow:** Minimap root MUST clip (`overflow: hidden`); viewport overlay MUST NOT paint outside the widget.

## Phase 1.1 backlog (not yet shipped)

_None — items above complete P81.1 board backlog._

## Risks

- **Hit-testing:** frame chrome vs inner nodes — reuse Master board tile patterns; map selection ids through `resolveBoardSelection`.
- **Performance:** many pages → prefer memoized `SceneNodeView`; optional `lazyInactivePages: true` for placeholder-only inactive frames; default paints all page trees.
- **Breakpoint width changes** reflow overlap — auto “pack row” on BP change is optional; Phase 1 accepts manual frame drag to fix overlaps.
- **Client bundle:** board helpers stay pure TS; no pg/fs in client graph.
