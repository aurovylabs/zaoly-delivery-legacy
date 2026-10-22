# Artboard dimensions (custom W×H + print presets)

**Status:** Accepted · **Date:** 2026-09-16 · **Slide 16:9** 2026-10-02  
**Product:** CREATION v3  
**Related:** `scene-board.md` · `composition-scene.md` · `editor-workspace.md` · P85 `knowledge/creation-p85.md` · `magcloud-slide-handoff.md`  
**Knowledge:** `knowledge/artboard-dimensions.md`

## Goal

Zeichenflächen are **Figma-like frames**: Mobile / Tablet / Desktop / Print remain cascade lanes, but **geometry** (width × height) is editable per page — including expanded print paper sizes (DIN A3–A6, Letter, …) and a **PowerPoint-style Slide 16:9** artboard (1920×1080).

## Locked decisions

1. **Two axes stay separate:** `activeBreakpoint` / OP-9 cascade ≠ artboard geometry.
2. **Defaults** stay in `apps/web/lib/scene/breakpoints.ts`:
   - Digital widths: mobile 390 · tablet 768 · desktop **1440** (content height measured when no override).
   - Print: named presets → fixed CSS W×H @ 96dpi via `mmToCssPx` (paper) or locked CSS px (slides).
3. **Per-page override:** `ScenePage.frame.width?` and `ScenePage.frame.height?` (CSS px). Omitted → derive from breakpoint / print preset.
4. **Print catalog** expands beyond A4/A5 (A3, A6, US Letter, landscape twins) plus presentation preset `slide-16-9` (1920×1080 CSS px). Mag PDF page size remains DIN-A4 kit unless a later Mag wave binds presets (P85 unchanged).
5. **UI:** Page frame Inspect exposes Width + Height (placeholder = derived). Toolbar print `<select>` lists the expanded catalog (slides first, then paper). No new OP-9 lane per paper size.
6. Paths/URLs: document helpers in `knowledge/paths.md` / `knowledge/artboard-dimensions.md` — do not hardcode mm tables in UI components.
7. **Slide 16:9** is an artboard geometry preset under the Print lane (same as paper) — not a Magcloud-only path. Magazin PDF kit stays A4.

## EARS

1. WHEN `frame.width` is a positive finite number, paint MUST use it instead of breakpoint/preset width.
2. WHEN `frame.height` is a positive finite number, paint MUST use it instead of measured / preset height.
3. WHEN `clearWidth` / `clearHeight` is set on `set_page_frame`, the system MUST remove that override.
4. WHEN Print preset changes and the page has **no** width/height override, artboard CSS size MUST follow the preset.
5. WHEN an unknown `activePrintPreset` is loaded, normalize MUST drop it (fail soft → default A4 portrait on resolve).
6. WHEN `activePrintPreset` is `slide-16-9` and breakpoint is `print` without frame overrides, artboard MUST be **1920×1080** CSS px.

## Acceptance

- Unit tests: expanded presets + `slide-16-9` → 1920×1080 + `resolvePageArtboardHeight` + `set_page_frame` height/clearHeight.
- Page frame Inspect shows height field (`data-testid="editor-page-frame-height"`).
- Specs inventory lists this file; knowledge documents operator flow + Slide 16:9.
