# Set as primary (Wave H) — OP-9 base remapping

**Status:** Accepted · 2026-10-10  
**Parent:** `responsive-breakpoint-closeout.md` (amends permanent non-goal #2)  
**Operator:** `knowledge/responsive-breakpoint-set-primary.md`

## Goal

Allow designers to promote **Tablet** or **Mobile** (or restore **Desktop**) as the OP-9 cascade **base**, with a rematerialize that keeps cascaded paint identical across digital breakpoints.

## Model

| Field | Shape |
|-------|--------|
| `CompositionScene.primaryBreakpoint` | `'desktop' \| 'tablet' \| 'mobile'` — omitted → `desktop` |
| Op | `{ op: 'set_primary_breakpoint', breakpoint }` |

**Print** cannot be primary (geometry lane only).

### Cascade

- `bp === primary` → base `props` / bindings / `hidden`
- else → merge `node.breakpoints[bp]` (incl. former Desktop when primary ≠ desktop)

### Rematerialize

On `set_primary_breakpoint` when `breakpoint ≠ current primary`:

1. For every node in page roots **and** Master variant roots, compute effective view at each digital BP (+ print) under the **old** primary.
2. Write `effective(newPrimary)` into base.
3. Store sparse deltas `effective(bp) − newBase` on other lanes; clear the new-primary lane.
4. Set `scene.primaryBreakpoint`.

Invert for undo = rematerialize back to the previous primary.

### Secondary rules (Waves D–F)

| Rule | After remap |
|------|-------------|
| Secondary (hide-on-delete, structure lock) | Any digital BP ≠ primary (Print stays non-secondary) |
| Compare **Primary** badge | Tile whose `bp === scene.primaryBreakpoint` |
| Reset | Clears override lane on active secondary BP (unchanged semantics) |

## UI

| Surface | Action |
|---------|--------|
| Context menu | **Set as primary** when active digital BP ≠ primary |
| Inspect | Same control next to Reset (when not already primary) |

Confirm via toast: primary label changed.

## Non-goals

- Print as primary  
- Per-page primary (scene-wide only)  
- Auto mobile-first migration of existing scenes without explicit action  

## Acceptance

1. Promoting Tablet rematerializes; Desktop/Tablet/Mobile paint unchanged; undo restores.  
2. Structure lock / secondary delete follow the new primary.  
3. Compare badge marks the configured primary.  
4. Specs inventory lists this file; closeout non-goal #2 is superseded by this wave.
