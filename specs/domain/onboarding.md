# Editor onboarding — Zaoly

## Status

**Accepted** — 2026-10-12 (revised micro-steps **v3** — 12 tips). Hybrid coach for first-run + empty boards on `/editor`.  
**Pattern notes (private engineering only):** `knowledge/onboarding-pattern-notes.md` — not a product relationship.

## Goal

New users learn editor moves in **small reaction steps** — each tip asks for one action, the next tip explains what just opened or what to do next (e.g. open Tokens → pick a color → bind it). Locale follows product `de`/`en` (default `en`).

## Surfaces

| Surface | When | Dismiss |
|---------|------|---------|
| **Welcome** | Once per browser (`localStorage`) after `/editor` | Open sample / Explore alone / Esc |
| **Empty coach** | Welcome seen + active page root has **zero children** + not session-skipped; skipped while Welcome open or guided tip is showing | **Let's start** → load default landing + tour; **Later** → session skip then tour if incomplete; auto-hide when children appear |
| **Guided tour** | After Welcome, if tour not `done` | Action / Next; Skip ends without Done |
| **Done screen** | After last tour step (auto-advance or Done) | CTA / Esc — ephemeral |

## Empty definition

Board is empty iff `activePageRoot(scene).children?.length === 0` (empty artboard spirit).

## Sample composition

Pedagogical starter = **`createZaolyDefaultLandingScene()`** (existing factory).  
Welcome / Empty-coach **Open sample** / **Let's start** MUST replace the working scene via `applySceneSnapshot`, preserving the current scene `id` / `platformProjectId` when present.

## Guided tour

Progress `1 / 12` … `12 / 12`. Auto-advance on matching action; **Next** fallback where noted; last = **Done**.

| # | Id | Intent | Completes when |
|---|-----|--------|----------------|
| 1 | `select` | Click a canvas element | `select` |
| 2 | `openComponents` | Open the Components tab | `openComponents` or Next (auto-skip if tab already open) |
| 3 | `insert` | Insert a kit atom from the palette | `insert` |
| 4 | `inlineText` | Double-click the **just-inserted** label (or any text/button) → edit → commit | `inlineText` — spotlight prefers `rememberOnboardingInsertNodeId` |
| 5 | `focusInspect` | Notice the right Inspector for the selection | **Next** only |
| 6 | `inspect` | Change a field in the Inspector | `inspect` or Next |
| 7 | `openTokens` | Open the Tokens tab | `tokens` / `openTokens` (auto-skip if tab already open) |
| 8 | `tokenPick` | Click a **color** near the top of Local Pack (host prepares `color` filter) | `tokenPick` or Next |
| 9 | `tokenBind` | Bind that color (drag onto canvas or Inspect bind) | `tokenBind` or Next |
| 10 | `breakpoints` | Toggle Breakpoint Compare | `breakpoints` or Next |
| 11 | `activateBreakpoint` | Click the **Tablet** or **Mobile** tile | `activateBreakpoint` or Next |
| 12 | `preview` | Open Preview / Export handoff | `preview` or Next |

Highlights MUST target **granular** nodes (palette row, text leaf, inspect field, token row, BP tile) — not whole artboards/panels. Spec helpers: `pickGranularHighlightTargets`.

**Insert drop guide:** WENN the guided tip is `insert` and the designer **picks up** a palette atom (pointerdown / dragstart on a Components palette row), DANN MUST the host spotlight the **active page frame / artboard** as the drop zone (`resolveInsertDropZoneTargets`) with the veil highlight — so the canvas reads as the place to release. Cancel / dragend without insert restores the palette-row spotlight.

Tips are **draggable** (grip on the progress row). Default placement for left-rail anchors (e.g. Token Studio rows) is **beside** the target — not over it — via `computeTipPosition`; users can drag further with `clampTipDragPosition`.

## Done screen

After all steps (not Skip): brand panel + short line + primary CTA.

## Storage

| Key | Store | Meaning |
|-----|-------|---------|
| `zaoly-onboarding-welcome-v1` | localStorage | Welcome done |
| `zaoly-onboarding-empty-skip` | sessionStorage | Empty coach skipped |
| `zaoly-onboarding-tour-v3` | localStorage | Step index `0..11` or `done` (v3 = 12 micro-steps; supersedes v2) |

Keys live in `paths.onboarding.*`.

## Query flags

| Query | Effect |
|-------|--------|
| `?onboarding=1` / `reset` | Clear flags + force Welcome |

## Signals

`zaoly:composition-changed` `{ rootCount }` (`paths.onboarding.compositionChangedEvent`).  
`zaoly:onboarding-action` `{ action }` (`paths.onboarding.actionEvent`):  
`select` \| `openComponents` \| `insert` \| `inlineText` \| `focusInspect` \| `inspect` \| `tokens` \| `openTokens` \| `tokenPick` \| `tokenBind` \| `breakpoints` \| `activateBreakpoint` \| `preview`.

`tokens` and `openTokens` both complete the **openTokens** step.

## Locale

| Surface | Module |
|---------|--------|
| Welcome / empty / tour / done | `onboardingCopy` via `resolveOnboardingCopy()` in `lib/editor/onboarding.ts` |
| Tip button names | Interpolated from live chrome i18n where quoted |

## Out of scope

Server-persisted completion; PPTX import; presentation takeover; separate Welcome board factory; macOS native coach.
