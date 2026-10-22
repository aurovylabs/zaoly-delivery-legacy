# Reset secondary breakpoint overrides (Wave E)

**Status:** Accepted · 2026-10-10  
**Parent:** `responsive-breakpoint-primary-secondary.md` · OP-9  
**Operator:** `knowledge/responsive-breakpoint-reset.md`  
**Precedent:** Figma Sites “Reset all changes”

## Goal

On a **secondary** breakpoint (`tablet` / `mobile`), designers MAY clear all sparse overrides on the selection so those nodes inherit the primary (desktop) base again — including Wave D `hidden` on that lane.

## Behavior

| Active BP | Reset |
|-----------|--------|
| `desktop` / `print` | Action hidden / no-op (primary has no override lane to clear) |
| `tablet` / `mobile` | For each selected node that has `breakpoints[bp]`, emit `clear_breakpoint_override` for that entire lane |

Clearing the lane removes props, tokenBindings, dataBindings, and `hidden` for that BP only. Base `node.hidden` and other BP lanes stay.

## Surfaces

1. **Canvas / Layers context menu** — item “Reset breakpoint changes” when secondary + at least one selected node has a lane.
2. **Inspect** — compact action when Inspect targets a node with overrides on the active secondary BP (`data-testid="inspect-bp-reset"`).

## Non-goals

- Per-field reset (already via clear key / unset)
- Resetting all nodes on the page in one click
- Changing which BP is “primary”
- Print-lane reset chrome (print stays out of Compare; Inspect unset still works per field)

## Acceptance

1. Tablet overrides on gap/direction disappear after Reset; Desktop unchanged.
2. Context menu item disabled/absent on Desktop.
3. Spec inventory lists this file.
