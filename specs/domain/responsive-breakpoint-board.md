# Responsive Breakpoint Board (Wave A + Wave B chrome)

**Status:** Accepted · **Complete A–G** · closeout → `responsive-breakpoint-closeout.md`  
**Date:** 2026-10-10  
**Parent:** `specs/domain/editor-workspace.md` · OP-9 cascade · Operator: `knowledge/responsive-breakpoint-board.md`  
**Precedent:** Master variant board · Scene board (P81)

## Goal

Designers MAY toggle a **Compare board** that paints Desktop / Tablet / Mobile of the **active page** side-by-side on one pan/zoom canvas, so cascade overrides are visible without flipping the toolbar chip.

## Model (no new persistence Wave A)

- Document model unchanged: one page root + sparse `node.breakpoints` (OP-9).
- Compare mode is **editor UI state** (not a scene field).
- Print is out of the compare row — enabling compare while Print is active MUST switch to Desktop (or leave Print and disable compare).

## Paint tree

Ephemeral board (locked chrome):

| Id / prefix | Role |
|-------------|------|
| `__breakpoint-board__` | Board root |
| `__bp-tile:{bp}` | Tile chrome (label + body) |
| `__bp-node:{bp}/…` | Remapped node ids inside **inactive** tiles |

Active tile body uses **persisted** node ids (editable). Inactive tiles clone the page root with remapped ids so DOM/`data-node-id` stays unique.

Each tile body (and descendants for paint) MUST cascade with that tile’s breakpoint via `data-breakpoint-paint` / SceneNodeView paint override — not only the scene `activeBreakpoint`.

Tile widths MUST use `EDITOR_BREAKPOINT_WIDTHS` (`390` / `768` / `1440`).

## Interaction

| Action | Result |
|--------|--------|
| Toggle Compare on | Leave scene page board paint; show BP board for active page **or** Master-Edit active variant root; **fit viewport** so Desktop · Tablet · Mobile tiles are all visible (`fitAllFrames` / board canvas bounds) |
| Toggle Compare off | Restore scene board / Master variant board / single artboard |
| Click inactive tile / remapped node | Set `activeBreakpoint` to that tile’s BP; if remapped node → select original id |
| Click in active tile | Normal select (same as today) |
| Master-Edit + Compare | Paint Compare of the **active named variant** working root (mutually exclusive with the Master variant cell board). OP-9 writes still target that Master tree. |
| BreakpointSwitcher | Still writes `activeBreakpoint`; active tile chrome follows |

## Writes

Unchanged OP-9: non-desktop `activeBreakpoint` → `set_breakpoint_override`. Compare does not invent new ops.

## Wave B — Cross-tile selection chrome

WENN Compare is on and the designer selects a node (persisted id) in the active tile, DANN MUST the matching remapped nodes in the **inactive** tiles paint a dashed ghost outline (`creation-scene-node--bp-compare-ghost`, `data-bp-compare-ghost="true"`). Ghost ids are `__bp-node:{bp}/{selectedId}` for every compare BP ≠ active digital BP. Ghosts MUST NOT enter `selectedIds`, drive Inspect, or show selection handles. Clearing selection or leaving Compare MUST clear ghosts.

## Non-goals (Wave A / B)

- Cross-tile multi-select (Wave D covers insert/delete primary/secondary — see sibling spec)
- Persisting compare mode on the scene
- Print in the compare row
- Multi-BP matrix in Site Kit publish
- Replacing the scene page board

## Acceptance

1. Toolbar exposes Compare toggle (localized tip); `data-testid="editor-breakpoint-compare"`.
2. With Compare on, canvas shows three labeled tiles Desktop · Tablet · Mobile.
3. Clicking Tablet tile sets `activeBreakpoint` to `tablet` and emphasizes that tile.
4. Edits while Tablet is active still use existing override write path.
5. Wave B: selecting a node ghosts the same node in the other two tiles.
6. Master-Edit + Compare paints the active variant root (not the page root); variant cell board is hidden while Compare is on.
7. Spec inventory lists this file.
