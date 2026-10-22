# Scene history patch stacks — W7

**Status:** Accepted · **Date:** 2026-09-12 · **W7b** 2026-09-12 · **W7c** 2026-09-12 · **W7d** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Knowledge:** `knowledge/scene-core-split.md`  
**Related:** `specs/domain/scene-core-split-w5.md` · `specs/domain/scene-pages.md` · `specs/domain/composition-masters.md` · `apps/web/lib/scene/history.ts` · `apps/web/lib/scene/invert-scene-ops.ts` (`invertSceneOps`)

## Decision

Editor undo/redo MAY store **inverse-op entries** instead of a full previous `CompositionScene` when the committed mutation is invertible. Non-invertible mutations MUST fall back to **snapshot** entries (previous present), preserving current correctness.

| Chosen | Not chosen |
|--------|------------|
| `HistoryEntry` = `ops` \| `snapshot` | Full CRDT / OT merge (see W6) |
| Invert allowlist W7a–**W7d** (pages + masters) | Invert HTML import / SiteSvg mark side-patches |
| `present` remains a full scene | Checkpoint + replay-from-base only |
| W5f mutation revision dirty | Reintroduce render-time full JSON dirty |

## Entry kinds

```ts
type HistoryEntry =
  | { kind: 'ops'; forward: SceneOp[]; inverse: SceneOp[] }
  | { kind: 'snapshot'; scene: CompositionScene }
```

1. `pushHistory` with invertible `ops` + `before` MUST push `{ kind: 'ops', forward, inverse }` and set `present` to the already-applied `next` scene.
2. WHEN invert returns `null` OR ops omitted → MUST push `{ kind: 'snapshot', scene: previous present }`.
3. Undo of `ops` MUST apply `inverse` via `applySceneOpBatch`; redo MUST apply `forward`.
4. Undo/redo of `snapshot` MUST swap scenes as in the pre-W7 stack.
5. Stack limit remains **50** entries. Push clears the redo stack.

## Invert allowlist

### W7a

- `set_prop`, `set_style` (only when previous dimension is a finite number), `set_token_binding`, `clear_token_binding`
- `set_breakpoint_override`, `clear_breakpoint_override`
- `insert_child` → `remove_node` (by `child.id`)
- `remove_node` → `insert_child` (capture node + parentId + index from `before`)
- `move_node`, `reorder_node` (capture previous parent/index)

### W7b

- `set_state_override`, `clear_state_override`
- `set_flags` (restore previous hidden/locked, including Instance overrides)
- `wrap_nodes` → `unwrap_node` (by `containerId`); `unwrap_node` → `wrap_nodes` (capture children + type + id)
- `add_interaction` → `remove_interaction`; `remove_interaction` / `update_interaction` restore prior interaction payload from `before`
- `table_add_row` / `table_add_column` → matching `table_remove_*` (structure only)
- Page shell: `rename_page`, `set_active_page`, `set_cover_page`, `reorder_pages`, `move_page_frame`, `set_page_frame`, `set_page_breakpoint` (capture prior values from `before`)

### W7c

- `add_page` / `duplicate_page` → `delete_page` on the newly created page id (from **committed** post-apply scene) + `set_active_page` to prior active. History **forward** for redo is rewritten to `restore_page` (deterministic ids).
- `delete_page` → `restore_page` (captured `ScenePage` + index + active/cover + pruned comments)
- `move_node_to_page` → inverse `move_node_to_page` (prior page/parent/index) + `set_active_page` to prior active
- `table_remove_row` / `table_remove_column` → `insert_child` restoring the captured row / per-row last cells

### W7d

- Master graph mutations (`rename_master`, `bind_master_composition`, `update_master_root`, variant/axis CRUD, `upsert_master_variant_cell`, …) → `restore_master` of the pre-op master. Redo forward rewritten to `restore_master` of the post-op master.
- `delete_master` → `restore_master` (insert captured master)
- `create_master` → restore original node + `delete_master`; redo rewritten to `restore_master` + swap to Instance
- `ensure_palette_master` → `delete_master` when it created; no-op when master already existed (`[]`)
- `insert_instance` → `remove_node` (committed instance id); redo rewritten to `insert_child` of that Instance
- `detach_instance` → remove detached tree + re-insert captured Instance
- `set_instance_variant` / `set_instance_variant_axes` → restore prior picks (requires prior values)

`invertSceneOps(before, ops, committedAfter?)` MUST use `committedAfter` for id-minting ops (`add_page` / `duplicate_page` / `create_master` / `ensure_palette_master` / `insert_instance` / `add_master_variant` / `add_master_axis` / `upsert_master_variant_cell`). WHEN a minting op appears mid-batch (not sole/last), invert returns `null` (snapshot fallback).

Empty ops, SiteSvg `mark`/`markup` prop side-patches, HTML import, or unknown ops → `null` (snapshot fallback).

## Non-goals

- Structural sharing of `cloneScene` / `applySceneOp` — landed as **W8** (`scene-structural-sharing-w8.md`)
- Invert for HTML import (remain snapshot)
- Changing save / `enqueuePendingOp` semantics beyond soft-lock (W6)
- Adding `restore_page` / `restore_master` to the curated MCP/agent op surface

## Acceptance

1. Specs inventory lists this doc; backlog marks W7 **done** (incl. W7b + W7c + **W7d**).
2. Unit tests cover invert allowlist + history ops undo/redo + snapshot fallback for remaining non-invertible ops (HTML / SiteSvg mark / mid-batch mint).
3. `runOp` / `runOps` pass ops into `pushPresent`; comment / ad-hoc paths keep snapshot.
4. W5f revision dirty tests remain green.
