# Master-Edit board dimension (unified Compare UX)

**Status:** Accepted · 2026-10-10 · Hardened · Matrix (Wave I)  
**Parent:** `responsive-breakpoint-board.md` · `composition-masters.md`  
**Operator:** `knowledge/master-edit-board-dimension.md`  
**Matrix:** `specs/domain/master-edit-variant-breakpoint-matrix.md`

## Goal

In Master-Edit, designers compare **one or both axes** on the same board chrome — not two competing boards and not a hidden chip-only fallback.

## Model

| Dimension | Canvas | Secondary chrome |
|-----------|--------|------------------|
| **Variants** | Master variant cell board (existing) | Active variant name; BreakpointSwitcher still sets write BP for single-frame edits |
| **Breakpoints** | Breakpoint Compare of the **active variant** root | Variant chip strip (canvas); structure tip |
| **Matrix** | Nested variant rows × BP tiles (Wave I) | Structure tip; no chip strip |

SSOT for the dimension: Master-Edit bar segmented control (`data-testid="editor-master-edit-board-dimension"`) on **canvas and Layers rail**.  

| Dimension | Runtime |
|-----------|---------|
| Variants | `!breakpointCompareMode && !masterMatrixMode` |
| Breakpoints | `breakpointCompareMode && !masterMatrixMode` |
| Matrix | `masterMatrixMode` |

Dimension writes MUST call absolute setters (`setBreakpointCompareEnabled` / `setMasterMatrixMode`), not flip toggles.

## Toolbar

While Master-Edit is active, the topbar **Compare** icon is **hidden** (same action lives in the bar). On the page scene, Compare stays in the toolbar.

## Prefs / hydration

Device Compare pref restores after mount behind `comparePrefsReady` so the first paint does not flash Scene-board → Compare (or variant board → Compare). Matrix is Master-Edit UI-only (not persisted on the scene).

## Non-goals

- Persisting dimension on the Master document (device Compare pref still applies when entering Breakpoints)
- Matrix outside Master-Edit

## Acceptance

1. Master-Edit bar (canvas **and** rail) exposes Variants | Breakpoints | Matrix.  
2. Choosing Breakpoints paints BP Compare of the active variant and shows the variant chip strip on canvas.  
3. Choosing Variants restores the variant cell board and hides the chip strip.  
4. Choosing Matrix paints the nested board (Wave I).  
5. Toolbar Compare is absent while `editingMasterId` is set.  
6. Dimension change uses absolute enable/disable (no toggle flip).
