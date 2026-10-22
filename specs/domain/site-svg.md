# SiteSvg — opaque vector assets in the composition scene

**Status:** Accepted · **Phase 0–4 implemented** (opaque · paint · kit marks · deep-edit · vector Draw) — 2026-09-10  
**Product:** CREATION v3 · Site Kit atom  
**Depends:** `site-kit.md` · `composition-scene.md` · `html-scene-import.md` · `editor-inspect.md` · `brand-token-consume.md` · `surface-clip-slant.md` (Phase D `SiteShape` reuses the same isolated vector surface)  
**Knowledge:** `knowledge/site-svg.md` · keep/drop: `knowledge/keep-drop-backlog.md`  
**Related Non-goals (unchanged):** Freeform pen / boolean / board vectors remain out of `scene-pages.md` / `scene-board.md` — those ban *drawing tools*, not opaque `SiteSvg` leaves.

## Purpose

Agent landings and brand craft ship **inline SVG** (logos, seals, icons, simple marks). Today HTML→Scene **drops** `<svg>` and only paints raster `SiteImage` (`src` + `alt`). Designers cannot keep craft without leaving CREATION.

`SiteSvg` is a **Site Kit leaf** that stores **sanitized SVG markup** as an opaque asset: place, size, and (later) recolor — **not** a path editor inside the canvas.

## Locked decisions

1. **Opaque first.** Phase 0 stores markup + viewBox + a11y; no explode into Path/Rect SceneNodes.
2. **Site Kit owns the atom** (`SiteSvg`), not `@zaoly/ui` product chrome.
3. **Sanitize on write.** Scripts, foreignObject handlers, and external entity tricks MUST be stripped before persist.
4. **Composition canvas stays layout.** Pen, boolean ops, and bezier handles are **Phase 3+** and MUST live in an **isolated** vector surface (modal / deep-edit), writing markup back — never as default board tools.
5. **Do not invent Brandion tokens from SVG fills** on import (same rule as HTML color literals).

## Phases

| Phase | Name | Ships |
|-------|------|--------|
| **0** | Opaque vector | `SiteSvg` type · palette · canvas paint · Inspect size/alt · HTML import maps `<svg>` · preview/codegen emit inline SVG · Publish/Pull like other atoms |
| **1** | Brand-aware paint | Recolor via `currentColor` / Inspect `color` token binding · optional **Promote to currentColor** on markup (explicit) |
| **2** | Kit marks | Curated icon/mark compositions or atom variants in Storybook (not free draw) |
| **3** | Deep edit | Isolated markup editor (Inspect → Dialog → `set_prop markup`); live preview + sanitize on apply |
| **4** | Vector deep-edit | Same isolated dialog gains Pen / Bezier tools; draft serializes to SVG markup → existing sanitize; markup tab remains escape hatch |

## Model (Phase 0)

```ts
// SceneNode.type === 'SiteSvg'
type SiteSvgProps = {
  /** Kit mark id (Phase 2); selecting a curated mark snapshots markup/viewBox/alt. Import/Replace → `custom`. */
  mark?: 'triangle' | 'seal' | 'check' | 'arrow' | 'star' | 'plus' | 'diamond' | 'custom'
  /** Sanitized outer <svg>…</svg> (or inner markup + implied root — pick one in impl; prefer full outer svg). */
  markup: string
  /** From source viewBox when present; else derived from width/height attrs. */
  viewBox?: string
  /** Accessible name (maps to aria-label / title). */
  alt?: string
  title?: string
}
```

- Leaf: **no** `children` in the scene tree (SVG DOM stays inside `markup`).
- Layout size uses existing Appearance / size Inspect (`width` / `height` / constraints) — same path as `SiteImage`.
- `SiteImage` remains for **raster** and for `img[src]` that is not inlined; Phase 0 MAY leave `img[src$=.svg]` as `SiteImage` (remote URL) **or** fetch/inline later (document choice in knowledge when implementing).

## Requirements (EARS)

### Phase 0 — Opaque

1. WHERE the Site Kit catalog is listed, the system MUST include `SiteSvg` with a CSF story under `packages/site-kit`.
2. WHEN the designer inserts `SiteSvg` from the palette, the scene MUST create a leaf with default placeholder markup (simple mark) and non-empty `alt`.
3. WHEN the canvas paints `SiteSvg`, the system MUST render the sanitized markup (inline SVG), NOT an `<img>` of a rasterized bitmap.
4. WHEN Inspect selects a `SiteSvg`, the system MUST expose at least: size (existing Appearance), `alt` / `title`, and a **Replace SVG** control (paste/upload markup or file) — MUST NOT expose path point editors.
5. WHEN HTML→Scene maps an element `<svg>`, the system MUST create `SiteSvg` with sanitized outer markup and MUST NOT silently drop the element (MAY emit a warning if markup was truncated or attrs stripped).
6. WHEN preview / PDF / composition codegen encounters `SiteSvg`, the system MUST emit inline SVG (sanitized), not a broken empty slot.
7. WHEN Publish to Storybook runs for a Master whose root type is `SiteSvg`, the system MUST write the atom override like other catalog atoms.
8. WHERE `markup` fails sanitization, the system MUST reject the write with a machine- and human-readable reason (no partial script retention).

### Phase 1 — Paint

9. WHEN the designer sets a recolor / `color` binding on `SiteSvg`, fills/strokes that use `currentColor` (or an allowlisted override map) MUST follow Brandion token resolution rules (`brand-token-consume.md`).
10. WHEN imported SVG uses hard-coded hex fills, Phase 1 MUST leave literals unless the designer opts into “promote to currentColor” (explicit op — no silent rewrite of complex SVGs).

### Phase 2 — Kit marks

13. WHERE Site Kit ships `SiteSvg`, the system MUST expose a closed catalog of curated marks (Storybook stories + inspect preset), each with sanitized `currentColor` markup and a stable id.
14. WHEN the designer selects a kit mark on a `SiteSvg` node, the system MUST write that mark’s `markup` / `viewBox` / default `alt` onto the node (opaque snapshot) and MUST NOT invent a second SceneNode type per mark.
15. WHEN HTML import or Replace SVG supplies custom markup, the system MUST leave the mark id unset or `custom` — MUST NOT silently overwrite imported craft with a kit preset.

### Phase 3 — Deep edit

11. WHEN deep-edit opens, the system MUST edit **one** `SiteSvg` node in isolation and MUST write back a single sanitized `markup` string via a normal scene op (`set_prop` → existing sanitize pipeline).
12. Deep-edit MUST NOT add freeform vectors onto the scene board outside a `SiteSvg` node.
12a. WHEN Inspect shows a single unlocked `SiteSvg`, DANN MUST a **Edit SVG** control open an isolated dialog with markup draft + sanitized live preview; Apply MUST call the same write path as Replace; Cancel MUST discard the draft.
12b. Phase 3 MVP is **markup textarea + preview** (not a bezier/pen surface). Vector-lib deep tools remain optional later inside the same isolated dialog — never as board tools.

### Phase 4 — Vector deep-edit

16. WHEN deep-edit opens on `SiteSvg`, the system MUST offer a **Draw** mode (Pen + optional Bezier handles) **and** a **Markup** tab (Phase 3 escape hatch) inside the same isolated dialog — MUST NOT add tools to the artboard or board chrome.
17. WHEN the designer draws or edits paths in Draw mode, the system MUST keep a session-only vector draft and MUST serialize that draft to SVG markup on Apply (then run the existing sanitize pipeline via `set_prop markup`). Cancel MUST discard the draft.
18. WHEN Markup mode edits the textarea, switching to Draw MUST parse path-bearing elements from the draft markup best-effort; unparseable markup MUST remain editable only in Markup mode (MUST NOT silently destroy craft).
19. The shared vector surface MUST be reusable by `SiteShape` deep-edit (`surface-clip-slant.md` Phase D) without inventing a second path model.
20. Dual-ship: Web dialog + macOS deep-edit sheet MUST expose Draw + Markup parity.

## Non-goals (all phases unless explicitly scheduled)

- Freeform pen / pencil on the artboard or board.
- Boolean geometry ops as first-class scene ops.
- Exploding SVG into hundreds of `SitePath` / `SiteRect` SceneNodes as SoT.
- Embedding a full Illustrator/Penpot clone as the default editor chrome.
- Auto-tokenizing every SVG fill into Brandion on import.
- Animations / SMIL / scripted SVG interactivity as editable scene features (strip or freeze on sanitize).

## Keep / drop (product)

| Keep | Drop / defer |
|------|----------------|
| Inline SVG as craft asset in landings | Path-level canvas editing in Phase 0 |
| Sanitize + opaque `markup` | `dangerouslySetInnerHTML` without sanitize |
| Site Kit atom + Storybook | Second vector SoT in `@zaoly/ui` |
| Recolor / tokens (Phase 1) | Boolean / pen on board (still Non-goal in pages/board) |
| Isolated deep-edit later | Explode-to-nodes SoT |

## Acceptance (Phase 0–3)

- [x] Spec implemented in contracts + site-kit + palette + paint + inspect + import + preview tests.
- [x] Import maps inline `<svg>` to `SiteSvg` (not drop).
- [x] No pen/boolean UI in topbar or board.
- [x] Knowledge `site-svg.md` marks Phase 0 **shipped**.
- [x] Phase 1: Inspect `color` token binding paints `currentColor` fills; Promote is explicit.
- [x] Phase 2: Curated marks catalog + Storybook stories + Inspect mark preset.
- [x] Phase 3: Isolated Edit SVG dialog → sanitized `markup` write-back (no board tools).

## Acceptance (Phase 4)

- [x] Draw mode in SiteSvg deep-edit (Web + macOS); Apply → sanitize → `set_prop markup`.
- [x] Markup tab retained; unparseable craft not destroyed by Draw parse.
- [x] Shared draft serialize helpers covered by unit tests.
- [x] Knowledge `site-svg.md` marks Phase 4 shipped.

## Out of scope cross-links

Clarify existing Non-goals: “Freeform vector layers, pen tool, boolean ops” in `scene-pages.md` / `scene-board.md` continue to mean **drawing tools and non-node board shapes**. Opaque `SiteSvg` **scene leaves** are in scope of **this** spec once Phase 0 ships.
