# Master-Edit Variants × Breakpoints matrix (Wave I)

**Status:** Accepted · 2026-10-10  
**Parent:** `master-edit-board-dimension.md` · `responsive-breakpoint-board.md`  
**Operator:** `knowledge/master-edit-variant-breakpoint-matrix.md`

## Goal

In Master-Edit, optionally paint **both** axes at once: one row per variant, each row a Desktop · Tablet · Mobile strip — reusing existing tile chrome (no new matrix widget).

## Model

| Dimension | Canvas |
|-----------|--------|
| **Variants** | Variant cell board (unchanged) |
| **Breakpoints** | BP Compare of **active** variant (unchanged) |
| **Matrix** | Nested board: outer variant chrome × inner BP tiles |

SSOT: Master-Edit bar third segment `data-testid="editor-master-edit-board-dimension"` value `matrix`.

### Active cell

Intersection of `editingVariantId` × digital `activeBreakpoint` keeps **persisted** ids. All other cells remap (`__mx-node:{variantId}:{bp}/{id}`).

### Interaction

| Click | Effect |
|-------|--------|
| BP tile in active variant row | Set write BP (same as Compare) |
| Any tile in another variant row | Activate that variant **and** set BP from column |
| Variant label / chrome | Activate variant (keep current BP) |

Ghosts (Wave B): only within the **active variant** row’s three BP columns.

### Limits

- Matrix mode for strip / single-axis Masters (same variant list as Phase-2 board).
- Phase-3 multi-axis matrix Masters: Matrix dimension falls back to **Breakpoints** of the active cell (avoid variants×axes×BP explosion), or shows the filtered strip only — document in knowledge.
- Variant **Add** tile stays on Variants dimension only.

## Non-goals

- Simultaneous multi-cell property write  
- Matrix outside Master-Edit  
- Persisting Matrix on the scene document  

## Acceptance

1. Bar exposes Variants \| Breakpoints \| Matrix on canvas and rail.  
2. Matrix paints nested chrome; active cell edits the working tree.  
3. Click switches variant and/or BP correctly.  
4. Specs inventory lists this file.
