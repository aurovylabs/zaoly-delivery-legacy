# Scene pages — CREATION v3 (P80)

**Status:** Accepted (Phase 1 tabs implemented — P80) — 2026-08-22  
**Parent:** `specs/domain/composition-scene.md` · **Editor:** `specs/domain/editor-workspace.md` · **Masters:** `specs/domain/composition-masters.md` · **Tasks:** `tasks/p80-scene-pages-plan.md`

## Goal

Designers work on **multiple pages (Zeichenflächen)** inside one persisted `CompositionScene` — e.g. Home, Pricing, Contact — without opening separate scene documents. Phase 1 is **tabbed pages** (one active artboard at a time), not a spatial Figma infinite canvas.

Shared scene chrome (Masters, brand tokens, Collection binding) stays **once per scene**. Each page owns its own page tree (`SiteStack` root + children).

## Non-goals (Phase 1)

- Spatial x/y frames on one infinite canvas (P81 board view — deferred).
- Freeform vector layers, pen tool, boolean ops (opaque `SiteSvg` leaves are a separate track — `site-svg.md`; not freeform board drawing).
- A second project / scene list inside the editor (Collection remains one composition document; multi-scene via `?sceneId=` stays a separate workflow).
- Per-page `platformProjectId` or per-page Masters libraries.
- Auto-routing / sitemap export to production URLs (future product).

## Model

| Concept | Definition |
|---------|------------|
| **Page** | `{ id, name, root: SceneNode }` on `CompositionScene.pages` |
| **Active page** | `activePageId` — which page the canvas, layers, and most ops target |
| **Cover page** | `coverPageId` — optional hub thumbnail page (Compositions hub / Figma-like cover). Invalid or missing → first page via `resolveCompositionCoverPageId` |
| **Legacy single page** | When `pages` is missing or empty, the editor MUST treat `root` as the sole page (MVP compat) |
| **Dual-write `root`** | When `pages` is non-empty, `root` MUST equal the active page’s `root` on every save (older readers / partial tooling) |

```ts
interface ScenePage {
  id: string          // stable, e.g. page-{nanoid}
  name: string        // designer label: "Home", "Pricing"
  root: SceneNode     // artboard tree; root.type SHOULD be SiteStack
  frame?: ScenePageFrame  // board placement — P81 `scene-board.md`
}

interface ScenePageFrame {
  x: number
  y: number
  width?: number
}

interface CompositionScene {
  // …existing fields…
  /** Phase 1 pages. Omitted → implicit single page from `root`. */
  pages?: ScenePage[]
  /** Required when `pages.length > 0`. Must reference a member id. */
  activePageId?: string
  /** Hub cover / thumbnail page. Optional; must reference a member id when set. */
  coverPageId?: string
  /** Dual-write: active page root when pages present; sole page root otherwise. */
  root: SceneNode
}
```

### Compatibility rules

1. WENN `pages` is missing, empty, or invalid on load, DANN MUST `normalizeScene` synthesize `pages: [{ id: 'page-default', name: 'Page 1', root }]` and set `activePageId: 'page-default'` (in memory only until next save, or persist on first upsert — implementation choice; MUST round-trip after save).
2. WENN `pages` is non-empty, DANN MUST `activePageId` identify a page in that list; unknown id → first page.
3. WENN `pages` is non-empty, DANN MUST `root` equal the active page’s `root` after normalize + before persist.
4. Node `id`s MUST be **unique across all pages** in one scene (clipboard / comments / save pruning).
5. WENN a page is deleted, DANN MUST comments whose `nodeId` is not in any remaining page tree be pruned on save (same rule as today, scene-wide).

### Shared vs per-page

| Field | Scope |
|-------|--------|
| `masters` | Scene — shared |
| `platformProjectId` | Scene — shared |
| `activeBreakpoint` | Scene — shared toolbar preview for the **active** page |
| `pages[].breakpoint` | Per page (P81.1) — optional frame width on board; omitted → scene `activeBreakpoint` |
| `activePrintPreset` | Scene — shared when `activeBreakpoint === 'print'` |
| `comments` | Scene — node ids must exist on some page |
| Page `root` tree | Per page |
| Selection / pan / zoom / undo | Session per editor boot; undo stack is scene-wide but ops only mutate active page tree (and shared masters) |

## Scene ops (validate-before-write)

New ops (append to `SceneOp` in `@zaoly/contracts`):

| Op | Effect |
|----|--------|
| `add_page` | Append page with empty `SiteStack` root (or optional `duplicatePageId` to clone). Name defaults to `Page N`. Set `activePageId` to new page. Optional create-time artboard: `breakpoint?`, `frameWidth?`, `frameHeight?` (ignored when `duplicatePageId` is set). See **Add page dialog** below. |
| `delete_page` | Remove page when `pages.length > 1`. Reject last page. Move `activePageId` to neighbor. Clear `coverPageId` when it referenced the deleted page. Prune comments on removed subtree. |
| `restore_page` | Undo companion for `delete_page` (W7c history). Re-insert a captured `ScenePage` at `index`; restore `activePageId` / `coverPageId`; re-append pruned comments by id. Reject duplicate page id. Not on the curated MCP/agent surface. |
| `rename_page` | Update `pages[id].name` |
| `duplicate_page` | Clone page root with fresh node ids; append as new page; activate it |
| `set_active_page` | Set `activePageId`; dual-write `root`; clear selection to new page root |
| `set_cover_page` | Set `coverPageId` to a member page id (hub thumbnail). Reject unknown page. |
| `reorder_pages` | Optional Phase 1.1 — move page index in `pages[]` |
| `move_node_to_page` | Remove `nodeId` from its source page tree; insert under `parentId` (default: destination page root) at `index` (default: end). Set `activePageId` to `toPageId`. Bypasses inactive-page guard. |

All existing tree ops (`insert_child`, `set_prop`, …) MUST target nodes under the **active page root** (or shared masters during Master-edit). Reject ops on nodes that belong to inactive pages. **`move_node_to_page`** is the sole tree op that may mutate an inactive page tree (cross-page layer move).

Master-edit (`editingMasterId` set) unchanged — working tree is the Master variant root, not a page root.

## Editor IA (Phase 1)

| Zone | Behavior |
|------|----------|
| **Page strip** | Horizontal tabs (or compact list) in editor chrome — **not** in the P70 single-line tool row if it would wrap; prefer a dedicated strip under topbar or left-rail header |
| Tab | Page name; click → `set_active_page` |
| **+** | Opens **Add page dialog** (not a silent `add_page`) — name + size (Desktop / Tablet / Mobile presets or custom W×H), then `add_page` with optional `breakpoint` / `frameWidth` / `frameHeight` |
| Context / overflow | **Visible** overflow (⋯) and/or context menu: Rename (inline edit), Duplicate, **Set as cover**, Delete (disabled when only one page). Cover row shows a badge. Do not rely on `window.prompt`. |
| Pages list visibility | Layers rail shows the pages list whenever pages exist (including a single page) so rename/add remain reachable |
| Canvas | Renders **active page root** only (same `CanvasViewport` as today) |
| Layers | Tree rooted at active page root |
| Save | Full scene PUT unchanged; fingerprint includes `pages`, `activePageId`, and all page roots |
| Master-edit exit | Selection returns to **active page root** id, not legacy `scene.root.id` if they differ |
| **Breakpoint chrome** | Topbar MUST NOT host a global BreakpointSwitcher for page artboard size. Page width/height is chosen at create time (and editable via page frame inspect). Scene `activeBreakpoint` still drives cascade/overrides; when activating a page that has `pages[].breakpoint`, the editor SHOULD sync `activeBreakpoint` to that page. Breakpoint **compare** remains available for side-by-side preview. |

### Add page dialog

**Knowledge:** `knowledge/editor-add-page-dialog.md`

| Field | Behavior |
|-------|----------|
| Name | Optional; empty → `Page N` |
| Size mode | **Preset** (Desktop / Tablet / Mobile) or **Custom** |
| Preset | From local pack `artboard.preset.*` (`artboard-presets.md`); sets optional `breakpoint` lane + `frameWidth` / `frameHeight` |
| Custom | Requires positive finite `frameWidth` and `frameHeight`; leaves `breakpoint` unset (scene active BP for cascade) |
| Confirm | Single `add_page` op with optional size fields; sync scene `activeBreakpoint` when a preset breakpoint was chosen |

Keyboard (when focus not in editable field):

- Optional Phase 1.1: `⌘⌥]` / `⌘⌥[` cycle pages (document in `knowledge/editor-keys-wave.md` when shipped).

## Persistence

- **HTTP:** unchanged `PUT /api/scenes/:id` body shape — new optional fields on `CompositionScene`.
- **Postgres:** add columns `pages JSONB`, `active_page_id TEXT` on `scenes` (mirror `masters` / `comments` pattern). `root JSONB` remains dual-write.
- **JSON file store:** fields live in scene JSON only.
- **Load:** `normalizeScene` + `scene-normalize.ts` owns migration from legacy single-root saves.

## Site Kit & export (Phase 1 scope)

- **Save as Site Kit component** exports the selection on the **active page** only (unchanged save-root rules).
- **Publish / Pull** remain scene-wide Masters — no change.
- **PDF / Magazine** (`composition-magazine-pdf.md`): Phase 1 exports **active page only**; multi-page PDF is Phase 1.1+ (spec gap — do not block P80 on it).

## Demo / seed data

- `createDemoScene()` SHOULD migrate to **two pages** for staging UX:
  - **Home** — hero + features + footer pattern blocks (today’s vertical stack split logically).
  - **Contact** — form pattern block only (or empty `SiteStack` for “add your second page” demo).
- `createEmptyArtboardScene()` → single page “Untitled”.

## Acceptance (Phase 1)

1. Editor shows ≥2 page tabs; switching tabs changes canvas + layers without losing the other page’s tree.
2. Add / rename / duplicate / delete page ops persist across reload (`PUT` + `GET`).
3. Legacy saves without `pages` open unchanged (single implicit page).
4. Masters inserted on page A appear on page B when the same Master Instance is used (shared Masters list).
5. Save dirty state covers page switches (editing page B marks scene dirty; saving persists both pages).
6. `delete_page` cannot remove the last page.
7. Unit tests: normalize legacy → pages, ops, active root resolution, comment prune on page delete.
8. Spec inventory / contract tests updated.

## Phase 2 — Spatial board (P81)

**Spec:** `specs/domain/scene-board.md` — Figma-like infinite canvas with all page frames visible; replaces tab-only navigation. Frame placement (`pages[].frame`), board paint, frame drag, Pages list in Layers rail.
