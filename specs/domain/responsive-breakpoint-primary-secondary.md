# Responsive primary / secondary insert–delete (Wave D)

**Status:** Accepted · 2026-10-10  
**Parent:** `responsive-breakpoint-board.md` · OP-9 cascade  
**Operator:** `knowledge/responsive-breakpoint-primary-secondary.md`  
**Precedent:** Figma Sites primary/secondary breakpoints

## Goal

Map Figma Sites “edit across breakpoints” insert/delete onto Zaoly’s **single tree + sparse OP-9** model:

| Role | Breakpoints | Insert | Delete |
|------|-------------|--------|--------|
| **Primary** | `desktop` (and `print`) | Node joins the shared tree → visible on all BPs | `remove_node` (gone everywhere) |
| **Secondary** | `tablet` · `mobile` | Node joins the tree but is **base-hidden** and **shown only** on the active secondary BP | Hide on that BP only (`breakpoints[bp].hidden: true`); hard-remove if that would leave the node invisible on every digital BP |

## Model

Extend `SceneBreakpointOverride` with optional `hidden?: boolean`.

Effective visibility:

```
cascadeHidden(node, bp) =
  bp override has hidden? → that value
  else → Boolean(node.hidden)
```

Paint (`SceneNodeView`) and Layers eye MUST use `cascadeHidden` for the paint / active BP — not raw `node.hidden` alone.

## Writes

| Action | Ops |
|--------|-----|
| Secondary delete | `set_breakpoint_override { hidden: true }` — or `remove_node` when invisible on desktop+tablet+mobile after |
| Secondary insert (after insert_*) | `set_flags { hidden: true }` + `set_breakpoint_override { hidden: false }` on active BP |
| Secondary Layers eye toggle | `set_breakpoint_override { hidden: !current }` |
| Primary delete / insert / eye | Unchanged (`remove_node` / plain insert / `set_flags`) |

`set_breakpoint_override` MAY set `hidden` alone (no props/tokens required). Property merges MUST preserve an existing lane `hidden` unless the op sets it.

## Non-goals

- Print as secondary hide lane (print stays primary-style remove)
- Multi-select cross-tile edit
- Persisting Compare mode

**Follow-up shipped:** secondary reorder / reparent / wrap lock → `responsive-breakpoint-structure-lock.md` (Wave F).

## Acceptance

1. Delete while Tablet active hides the node on Tablet only; Desktop still shows it.
2. Insert while Mobile active: node visible on Mobile, hidden on Desktop/Tablet.
3. Delete of a Mobile-only insert removes the node from the tree.
4. Compare board inactive tiles respect per-tile `cascadeHidden`.
5. Spec inventory lists this file.
