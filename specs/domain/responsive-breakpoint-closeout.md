# Responsive breakpoint stack closeout (Wave G)

**Status:** Accepted · Complete · 2026-10-10  
**Parent:** `responsive-breakpoint-board.md` · Waves A–F  
**Operator:** `knowledge/responsive-breakpoint-closeout.md`

## Goal

Close the **enterprise responsive** program for Zaoly’s OP-9 + Compare board model. Waves A–F remain the shipped behavior; Wave G adds closeout polish and freezes permanent non-goals.

## Wave G polish

| Item | Behavior |
|------|----------|
| Primary badge | Compare Desktop tile label includes localized **Primary** marker (`data-breakpoint-primary="true"`) |
| Persist Compare | `localStorage` via `paths.breakpointCompareStorageKey`; restore **after mount** (`useEffect` + `comparePrefsReady` gate), not in `useState` (SSR hydration / no board flash) |
| Inventory | Specs + knowledge + acceptance test enumerate Waves A–G |

## Shipped waves (frozen)

| Wave | Spec / knowledge |
|------|------------------|
| A | Compare board |
| B | Cross-tile ghost + Inspect elsewhere chips |
| C | Fluid kit layout |
| C′ | Site Kit responsive soft-fill defaults |
| D | Primary/secondary insert–delete |
| E | Reset secondary overrides |
| F | Secondary structure lock |
| G | This closeout |

## Permanent non-goals

These stay **out of scope** for Zaoly (not deferred waves):

1. **Forked trees per breakpoint** — one page root only  
2. ~~**Set-as-primary remapping**~~ — **Superseded by Wave H** (`responsive-breakpoint-set-primary.md`)  
3. **Multi-BP matrix in Site Kit publish** — flatten active BP  
4. **Persisting Compare on the scene document** — device prefs only  
5. **Print in the Compare row** — Print stays a separate lane  
6. **Cross-tile multi-select editing** — selection is shared ids + ghosts, not multi-BP simultaneous property write  

### Follow-on waves (not Wave G)

| Wave | Spec |
|------|------|
| H | `responsive-breakpoint-set-primary.md` — OP-9 base remapping |
| I | `master-edit-variant-breakpoint-matrix.md` — Variants × Breakpoints nested board |

## Acceptance

1. Desktop Compare tile exposes `data-breakpoint-primary="true"`.  
2. Toggling Compare writes `paths.breakpointCompareStorageKey`.  
3. Spec inventory lists this file.  
4. Knowledge board status reads **Complete (A–G)**.
