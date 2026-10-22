# Secondary breakpoint structure lock (Wave F)

**Status:** Accepted · 2026-10-10  
**Parent:** `responsive-breakpoint-primary-secondary.md`  
**Operator:** `knowledge/responsive-breakpoint-structure-lock.md`  
**Precedent:** Figma Sites — no reparent / group / frame from secondary

## Goal

Keep the **layer tree identical** across breakpoints. On secondary BPs (`tablet` / `mobile`), designers MAY change paint props and visibility, but MUST NOT change tree topology.

## Blocked on secondary

| Action | Examples |
|--------|----------|
| Reorder siblings | Layers ↑↓, `reorder_node` |
| Reparent / move | Drag reorder into other parent, `move_node`, nest / unnest |
| Wrap / unwrap | Wrap in Stack/Grid, Unwrap |
| Cross-page move | Layer drop onto another page |

Editor MUST refuse with a localized hint (`editor.secondaryStructureLocked`) and MUST NOT apply the op.

## Still allowed on secondary

- Prop / token / style overrides (Inspect, resize, nudge size)
- Insert / duplicate / paste (Wave D visibility)
- Delete → hide (Wave D)
- Reset overrides (Wave E)
- Hide eye toggle (Wave D)
- Canvas pan/zoom, Compare, selection

## Non-goals

- Blocking at `applySceneOp` for service/API batches (editor-only lock)
- Print as secondary
- Changing primary BP

## Acceptance

1. Tablet active → Wrap Stack is disabled / no-ops with hint.
2. Tablet active → Layers reorder drop does not move the node.
3. Desktop active → wrap / reorder work as before.
4. Spec inventory lists this file.
