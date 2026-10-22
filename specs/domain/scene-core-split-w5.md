# Scene-core split — W5

**Status:** Accepted · **W5 slice P** 2026-09-12 (orchestrator domain hooks complete through scene-sync)  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Knowledge:** `knowledge/scene-core-split.md`

## Goal

Shrink the three god-files without behavior change, establish shared clone/tree helpers, and cut typed holes (`as any`) where cheap.

| File (before W5a) | Lines | Role |
|-------------------|------:|------|
| `lib/scene/ops.ts` | ~3348 | `applySceneOp` + tree/clone/defaults |
| `lib/scene/html-to-scene.ts` | ~2009 | HTML import mapper |
| `components/editor/use-editor-scene-state.ts` | ~2473 | Editor React state |

## W5a — landed

1. Extract **`scene-tree.ts`**: find node/parent, lock ancestry, `createSceneNodeId`, `findSceneNode` / `findSceneParent`.
2. Extract **`scene-clone.ts`**: `cloneScene`, `cloneSceneNodeWithNewIds` (SSOT for deep clone + id regen).
3. `ops.ts` MUST import these modules and MAY re-export for existing call sites.
4. `html-to-scene.ts` MUST import `createSceneNodeId` from `scene-tree` (not via `ops`).
5. Replace cheap `as any` on typed `SceneNode` instance fields (e.g. `master-impact.ts`).
6. Document follow-on slices in knowledge (defaults extract, clipboard module, html CSS parse, editor-state hooks, history patches).

## W5b — landed

1. Extract **`scene-insert-defaults.ts`**: `defaultChildForType`, `seedInsertChildTree`, SiteTable cell/row helpers, `applySiteTableStructureOp`.
2. `ops.ts` MUST import these and MAY re-export so existing `from './ops'` call sites keep working.
3. No behavior change to palette insert seeds or table structure ops.

## W5c — landed

1. Extract **`scene-drop-plan.ts`**: `SCENE_CONTAINER_TYPES` / `isSceneContainerType`, `paletteChildForInsert`, `dropEdgeFromPoint`, `planPaletteDrop`, `planLayerDrop`, `planCrossPageLayerDrop`, `crossPageLayerMoveIds`, `InsertPlan` types.
2. Extract **`scene-clipboard.ts`**: `EDITOR_CLIPBOARD_KIND` (via `paths.editorClipboardKind`), serialize/parse, `clipboardNodesFromSelection`, `planPasteInsert`.
3. `ops.ts` MUST import these and MAY re-export so existing `from './ops'` call sites keep working.
4. No behavior change to DnD/paste planning.

## W5d — landed

1. Extract **`html-css-parse.ts`**: `StyleMap`, stylesheet parse (`stripCssAtRules`, `parseClassRulesFromDocument`, pseudo hits), CSS vars, font shorthand, surface/box/border/overlay style maps.
2. `html-to-scene.ts` MUST import these and MAY re-export public helpers for existing tests/call sites.
3. DOM mapping (`mapElement`, inheritance, pseudo attach) stays in `html-to-scene.ts`.
4. No behavior change to HTML→scene import.

## W5e — landed

1. Extract **`use-editor-history.ts`**: history state, undo/redo/reset helpers.
2. Extract **`use-editor-selection.ts`**: selected ids + primary id + refs.
3. Extract **`use-editor-persistence.ts`**: dirty fingerprint, pending ops, save/autosave/beforeunload (P78).
4. `use-editor-scene-state.ts` MUST compose these hooks; public return shape stays compatible for `editor-workspace`.
5. No behavior change to save concurrency or selection.

## W5f (this wave) — MUST

1. Dirty checks MUST use mutation **revision** + breakpoint/print preset (`isSceneDirty`) — no full-scene `JSON.stringify` on pan/zoom/selection renders.
2. `use-editor-history` MUST bump/restore revision on push/undo/redo/reset/mutatePresent.
3. Full `sceneSaveFingerprint` MAY run only at save boundaries (P78 outbound/live compare for ops path still uses document fingerprints as needed).
4. `sceneDocumentFingerprint` SHOULD cache per scene object identity (WeakMap).
5. Full inverse-op / structural-sharing history stacks are **non-goals** for W5f — inverse-op history landed as **W7** (`specs/domain/scene-history-patches-w7.md`); structural sharing landed as **W8** (`specs/domain/scene-structural-sharing-w8.md`).
6. **Content mutations** (incl. comments, Master variant chrome, toolbar undo/redo) MUST go through `pushPresent` / `mutatePresent` / `undo` / `redo` / `resetPresent` (+ `applySceneSnapshot` for server restores). Raw `setHistory(pushHistory|undoHistory|…)` from `editor-workspace` (or other chrome) is forbidden — it desyncs revision dirty tracking.
7. `undo` / `redo` MUST apply the history entry **before** committing the restored revision; WHEN apply returns `null`, revision MUST NOT change.

## W5g — landed

1. Extract **`use-editor-integrations.ts`**: Site Kit publish/pull, PDF download, Collection bind, related busy/status state.
2. `use-editor-scene-state.ts` MUST compose this hook; public return shape stays compatible for `editor-workspace`.
3. No behavior change to Site Kit pull merge (`mergeSiteKitPullIntoScene`) or P73 open-collection sync.

## W5h — landed

1. Extract **`use-editor-structure.ts`**: clipboard + structural selection / layer actions (remove/duplicate/copy/paste/cut/wrap/unwrap/nudge/reorder/cross-page/nest/flags).
2. `use-editor-scene-state.ts` MUST compose this hook; public return shape stays compatible for `editor-workspace`.
3. Mutation primitives (`applyMutatingOp` / `runOp` / `runOps` / `workingRoot`) remain in the orchestrator for this slice — extracted in **W5i**.

## W5i — landed

1. Extract **`use-editor-mutations.ts`**: `rejectMutation`, `applyMutatingOp`, `workingRoot`, `runOp`, `runOps` (soft-lock + master-edit apply routing).
2. `use-editor-scene-state.ts` MUST compose this hook; public return shape stays compatible for `editor-workspace`.
3. No behavior change to soft-lock rejection or Master-Edit op routing.

## W5j — landed

1. Extract **`use-editor-palette.ts`**: palette query/catalog/groups, Site Kit pattern list, hydrate insert (`onAdd` / `onPaletteDrop`), token drop.
2. `use-editor-scene-state.ts` MUST compose this hook; public return shape stays compatible for `editor-workspace`.
3. No behavior change to palette hydrate PUT-only masters or token-bind planning.

## W5k — landed

1. Extract **`use-editor-pointer.ts`**: pan, marquee, resize-handle drag, page-frame drag (`beginFrameDrag` / canvas pointer / `endPan` / `onHandlePointerDown`).
2. `use-editor-scene-state.ts` MUST compose this hook; public return shape stays compatible for `editor-workspace`.
3. Session refs (`panOrigin` / `resizeSession` / marquee / frame-drag) MAY remain in the orchestrator so selection-bounds refresh can skip mid-resize.

## W5l — landed

1. Extract **`use-editor-board-nav.ts`**: fit-to-frame / fit-all-frames, activate/cycle board page, fit refs for keyboard shortcuts.
2. `use-editor-scene-state.ts` MUST compose this hook; public return shape stays compatible for `editor-workspace`.
3. No behavior change to page activation selection or post-activate fit.

## W5m — landed

1. Extract **`use-editor-master-edit.ts`**: master-edit state + enter/exit/activate/upsert board cell.
2. Orchestrator composes this hook; public return shape stays compatible.

## W5n — landed

1. Extract **`use-editor-node-select.ts`**: `selectNode` (master-board + scene-board + additive selection).
2. Orchestrator composes this hook; public return shape stays compatible.

## W5o — landed

1. Extract **`use-editor-context-menu.ts`**: context menu state, open/close/canvas handlers, item model.
2. Orchestrator composes this hook; public return shape stays compatible.

## W5p — landed

1. Extract **`use-editor-scene-sync.ts`**: breakpoint/print preset changes, `applySceneSnapshot` / `reloadSceneFromServer`, remote SSE.
2. Orchestrator composes this hook; public return shape stays compatible.

## Clone performance

- `applySceneOp` continues to deep-clone the working scene once per op (correctness first).
- Clone helper remains centralized for a later structural-sharing swap.
- Dirty path no longer serializes the full document each React render.

## Acceptance (W5a)

1. Specs inventory lists this doc + knowledge.
2. Unit tests cover `scene-tree` + `scene-clone` (+ existing `scene-ops` still green).
3. `ops.ts` line count drops (tree/clone bodies removed).
4. `master-impact` no longer uses `as any` for instance fields.

## Acceptance (W5b)

1. Specs inventory lists `scene-insert-defaults.ts` + W5b notes.
2. Unit tests cover insert defaults (+ existing scene/table/palette tests still green).
3. `ops.ts` no longer defines `defaultChildForType` / `seedInsertChildTree` bodies.
4. `ops.ts` re-exports keep `from './ops'` imports working.

## Acceptance (W5c)

1. Specs inventory lists `scene-drop-plan.ts` + `scene-clipboard.ts` + W5c notes.
2. Unit tests cover drop/clipboard planners (+ existing scene-ops / canvas-drag / pages tests still green).
3. `ops.ts` no longer defines drop/clipboard planner bodies.
4. `paths.editorClipboardKind` is the SSOT for the clipboard JSON kind string.

## Acceptance (W5d)

1. Specs inventory lists `html-css-parse.ts` + W5d notes.
2. Unit tests cover CSS helpers (+ existing `html-to-scene` suite still green).
3. `html-to-scene.ts` no longer defines stylesheet parse / `boxStyleFromMap` bodies.
4. Public CSS helpers remain importable from `html-to-scene` via re-export.

## Acceptance (W5e)

1. Specs inventory lists the three editor hooks + W5e notes.
2. Unit tests cover history/selection/persistence hooks (+ existing editor workspace smoke still green).
3. `use-editor-scene-state.ts` composes the hooks (no inline undo/redo history store; no inline autosave timer).
4. Save concurrency P78 behavior remains in `use-editor-persistence` (documented in knowledge).

## Acceptance (W5f)

1. Specs inventory lists `scene-save-fingerprint.ts` + W5f notes.
2. Unit tests cover `isSceneDirty` / revision restore (+ dirty/autosave editor tests still meaningful).
3. `use-editor-persistence` dirty path MUST NOT call `sceneSaveFingerprint` for the per-render boolean.
4. Knowledge documents dirty revision identity; patch history is **W7** (`scene-history-patches-w7.md`).

## Acceptance (W5g)

1. Specs inventory lists `use-editor-integrations.ts` + W5g notes.
2. Unit tests cover integrations hook smoke (+ Site Kit pull merge tests remain green).
3. `use-editor-scene-state.ts` composes the integrations hook (no inline Site Kit publish/pull/PDF/bind bodies).

## Acceptance (W5h)

1. Specs inventory lists `use-editor-structure.ts` + W5h notes.
2. Unit tests cover structure hook smoke (+ existing clipboard/wrap/layer tests remain green).
3. `use-editor-scene-state.ts` composes the structure hook (no inline remove/duplicate/clipboard/wrap/layer-drop bodies).

## Acceptance (W5i)

1. Specs inventory lists `use-editor-mutations.ts` + W5i notes.
2. Unit tests cover mutations hook smoke (runOp soft-lock / select / apply routing).
3. `use-editor-scene-state.ts` composes the mutations hook (no inline `applyMutatingOp` / `runOp` / `runOps` / `workingRoot` bodies).

## Acceptance (W5j)

1. Specs inventory lists `use-editor-palette.ts` + W5j notes.
2. Unit tests cover palette hook smoke (+ palette hydrate masters tests remain green).
3. `use-editor-scene-state.ts` composes the palette hook (no inline hydrate/onAdd/onPaletteDrop/onTokenDrop bodies).

## Acceptance (W5k)

1. Specs inventory lists `use-editor-pointer.ts` + W5k notes.
2. Unit tests cover pointer hook smoke (pan begin / marquee skip / frame-drag noop).
3. `use-editor-scene-state.ts` composes the pointer hook (no inline canvas pointer / handle / frame-drag bodies).

## Acceptance (W5l)

1. Specs inventory lists `use-editor-board-nav.ts` + W5l notes.
2. Unit tests cover board-nav hook smoke (cycle no-op / activate enqueues set_active_page).
3. `use-editor-scene-state.ts` composes the board-nav hook (no inline fit/activate/cycle bodies).

## Acceptance (W5m–W5p)

1. Specs inventory lists master-edit / node-select / context-menu / scene-sync modules + W5m–W5p notes.
2. Unit tests cover hook smoke for each extract.
3. Orchestrator composes all four hooks (no inline enterMasterEdit / selectNode / context-menu / snapshot-reload bodies).
