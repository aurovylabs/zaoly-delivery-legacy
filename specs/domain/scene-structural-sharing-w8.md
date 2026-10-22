# Scene structural sharing — W8

**Status:** Accepted · **Date:** 2026-09-12 · **W8b–W8f** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Knowledge:** `knowledge/scene-core-split.md`  
**Related:** `specs/domain/scene-core-split-w5.md` · `specs/domain/scene-history-patches-w7.md` · `apps/web/lib/scene/scene-clone.ts` · `apps/web/lib/scene/scene-pages.ts`

## Decision

`applySceneOp` MUST use **path-copy structural sharing** for the allowlisted ops below. Unknown ops still fail closed. **No Immer / Immutable.js.**

| Chosen | Not chosen |
|--------|------------|
| Path-copy via `updateNodeById` / `mapParentChildren` / page+master hot paths | Immer `produce` rewrite of `ops.ts` |
| Hot-path W8a–**f** (leaf/tree/wrap/table/interaction/pages/masters + `set_flags`) | — |
| Share inactive page roots via `persistActivePageRoot` / `commitScenePages` | Deep-clone every page on each `touch` / `touchPages` |

## Hot-path allowlist

### W8a

- `set_prop`, `set_style`, `set_token_binding`, `clear_token_binding`

### W8b

- `set_breakpoint_override`, `clear_breakpoint_override`, `set_state_override`, `clear_state_override`

### W8c

- `insert_child`, `remove_node`, `reorder_node`, `move_node`

### W8d

- `wrap_nodes`, `unwrap_node`
- `add_interaction`, `remove_interaction`, `update_interaction`
- `table_add_row`, `table_add_column`, `table_remove_row`, `table_remove_column`

### W8e

**Pages:** `add_page`, `delete_page`, `restore_page`, `rename_page`, `duplicate_page`, `set_active_page`, `set_cover_page`, `reorder_pages`, `move_page_frame`, `set_page_frame`, `set_page_breakpoint`, `move_node_to_page`

**Masters:** `create_master`, `ensure_palette_master`, `rename_master`, `bind_master_composition`, `delete_master`, `restore_master`, `insert_instance`, `detach_instance`, `update_master_root`, `add_master_variant`, `rename_master_variant`, `delete_master_variant`, `set_master_default_variant`, `set_instance_variant`, `update_master_variant_root`, `add_master_axis`, `rename_master_axis`, `delete_master_axis`, `add_master_axis_value`, `rename_master_axis_value`, `delete_master_axis_value`, `set_instance_variant_axes`, `upsert_master_variant_cell`

### W8f

- `set_flags`

Leaf/override/interaction/table ops use `updateNodeById` (table ops MUST detach `children` before `applySiteTableStructureOp`). Tree/wrap ops use `mapParentChildren`. Page ops use shallow page maps + `commitScenePages`. Master ops path-copy the masters array (share untouched masters; clone only the targeted master when mutating nested variant/axis state). `set_flags` uses `updateNodeById` with unlock-self lock rules.

These MUST NOT call `cloneScene` at entry. They MUST:

1. Align active page root **by reference** (`alignActivePageRoot`) where tree ops apply.
2. Run the same lock / board / active-page checks as the slow path.
3. Apply the mutation through path-copy helpers.
4. Commit via `withUpdatedActiveRoot` + `touch` / `persistActivePageRoot` / `commitScenePages` without deep-cloning inactive pages.

## Persist / align

- `alignActivePageRoot` MUST set `scene.root` to the active page root by reference (no `structuredClone`).
- `persistActivePageRoot` MUST shallow-map `pages` and assign `scene.root` onto the active entry; MUST NOT `structuredClone(scene.pages)` or re-clone `root`.
- `commitScenePages` MUST dual-write active root by reference (hot `touchPages`). `syncScenePagesRoot` MAY deep-clone for persist/import isolation.
- Callers that mutate MUST already own a fresh path (`cloneScene` or path-copy).

## Residual cold path

`applySceneOp` keeps `alignActivePageRoot(cloneScene(scene))` as a **fail-closed safety net** for any future SceneOp not yet on the W8 allowlist. Current contracts cover leaf/tree/flags/pages/masters — inventory tests SHOULD keep asserting those families stay off `cloneScene` at entry.

## Non-goals

- Changing W7 history entry kinds
- Structural sharing for `cloneSceneNodeWithNewIds`
- Removing the cold-path `cloneScene` safety net entirely

## Acceptance

1. Specs inventory lists this doc; backlog marks W8 **done** (incl. W8b–f).
2. Unit tests assert sibling / inactive-page / unrelated-master reference sharing for hot-path ops including W8e–f.
3. Hot-path ops do not mutate the input scene.
4. Existing scene-ops / pages / masters / history / dirty tests remain green.
