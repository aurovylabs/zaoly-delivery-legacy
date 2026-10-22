# Artboard presets (pack-backed page sizes)

**Status:** Accepted — 2026-10-10  
**Product:** Zaoly  
**Related:** `scene-pages.md` · `artboard-dimensions.md` · `zaoly-token-studio.md` · `zaoly-tokens.md`  
**Knowledge:** `knowledge/artboard-presets.md` · `knowledge/editor-add-page-dialog.md`

## Goal

Designers centrally author **artboard size presets** (Desktop / Tablet / Mobile and custom devices) in the local brand token pack. The Add page dialog and future frame tools consume that catalog. OP-9 cascade lanes stay fixed.

## Locked decisions

1. **Two axes stay separate** (`artboard-dimensions.md`): pack presets are **geometry suggestions** (+ optional cascade `lane`). They do **not** invent new OP-9 override keys.
2. **Storage:** local pack leaves with `type: "artboard"` and path `artboard.preset.{id}` (Token Studio / `PATCH /api/tokens`).
3. **Value shape** (digital channel object):

```ts
{
  digital: {
    width: number    // CSS px, positive finite
    height: number   // CSS px, positive finite
    lane?: 'mobile' | 'tablet' | 'desktop'  // optional OP-9 sync on create
    label?: string   // display label; omit → last path segment
  }
}
```

4. **Seed:** fixture pack includes Desktop / Tablet / Mobile defaults (same widths as `EDITOR_BREAKPOINT_WIDTHS`, suggested heights 900 / 1024 / 844). Local overrides win.
5. **Not CSS tokens:** artboard leaves MUST NOT emit `--zaoly-*` in Token Studio CSS export (geometry metadata only).
6. **Inspect TokenPicker:** artboard leaves are omitted from node `tokenBindings` catalogs (`groupForPackLeaf` → null).
7. **UI:** Token Studio type filter `artboard`; Add page dialog lists merged pack presets + Custom W×H.
8. **Page frame Inspect:** when a page frame is selected, designers MUST be able to apply a pack preset (same catalog) — sets `frame.width` / `frame.height` and optional `pages[].breakpoint` from `lane`.

## EARS

1. WHEN the merged pack has ≥1 valid `artboard` leaf under `artboard.preset.*`, the Add page dialog MUST list those presets (label, W×H).
2. WHEN the pack has none, the dialog MUST fall back to the three seed defaults.
3. WHEN a preset with `lane` is confirmed, `add_page` MUST set `breakpoint` + frame size and sync scene `activeBreakpoint`.
4. WHEN a preset has no `lane`, `add_page` MUST set frame size only.
5. WHEN an admin edits an artboard leaf in Token Studio, PATCH MUST validate path/type/value via `pack-validate`.
6. WHEN a pack preset is applied from page frame Inspect, the editor MUST write `set_page_frame` (W×H) and, if the preset has a lane, `set_page_breakpoint` for that page.

## Acceptance

- Unit tests: parse/build leaf, presets-from-pack, fallback seeds, pack-validate artboard, `planApplyArtboardPresetToPage`.
- Dialog + page-frame inspector tests use pack-provided presets.
- Specs inventory lists this file.
