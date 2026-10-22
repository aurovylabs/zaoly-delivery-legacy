# Zaoly webdesign cleanup (waves)

**Status:** Accepted — 2026-10-10  
**Knowledge:** `knowledge/zaoly-webdesign-cleanup-plan.md`  
**Parent:** `zaoly-webdesign-product.md` · `print-out-of-scope-for-zaoly.md` · `media-breakpoints.md`

## Waves

### W1 — Media in code handoff

- Copy pack / eng handoff MUST include:
  - `--zaoly-media-*` custom properties from pack leaves
  - `@media (min-width: …)` stubs via `formatMediaBreakpointQueries`
- Sources: merged local pack leaves (same seeds as Token Studio).

### W2 — Print HTTP out of scope

- `POST /api/scenes/:id/pdf` (Magazin) MUST respond **410** `print_out_of_scope`.
- Magcloud board / publish routes MUST respond **410** `print_out_of_scope`.
- Error body MUST point at `knowledge/print-out-of-scope-for-zaoly.md`.

### W3 — Digital-only editor preview

- Boot + snapshot apply MUST coerce `activeBreakpoint: print` → `desktop`.
- `onBreakpointChange('print')` MUST coerce to `desktop`.
- Breakpoint compare remains digital tiles only (already `BREAKPOINT_COMPARE_BPS`).

### W4 — No print palette

- `buildEditorPaletteCatalog()` MUST omit group id `print` on Zaoly.

### W5 — Inventory

- Specs inventory MUST list this file + cleanup plan knowledge.

### W6 — Sibling macOS native IA

- Magazin PDF MUST NOT appear as an export CTA / format in `NativeExportPreviewSheet` / topbar Export menu.
- Add page MUST use digital presets (Desktop / Tablet / Mobile) or custom W×H via `NativeAddPageSheet` → `SceneOp.addPage(..., frameWidth, frameHeight, breakpoint)`.
- Legacy `activeBreakpoint: print` MUST coerce to `desktop` on workspace appear and breakpoint change.
- API client `exportPdf` MAY remain for compat; MUST NOT be wired to Zaoly product CTAs.

## Acceptance

Unit/API tests per wave; inventory green.
