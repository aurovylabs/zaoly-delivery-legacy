# Site Kit → CREATION pull (kit hydrate)

**Status:** Accepted · **Date:** 2026-08-21  
**Product:** CREATION v3  
**Depends on:** `specs/domain/site-kit.md` · `specs/domain/composition-masters.md` · `specs/api/site-kit-write.md`  
**Knowledge:** `knowledge/site-kit-kit-pull.md`  
**Non-goal sibling:** Storybook Controls write-back (explicitly out of scope)

## Purpose

Close the **developer → designer** gap without inventing bidirectional live editing.

- **Publish** = CREATION Masters → overrides → Storybook rebuild.
- **Runtime** = canvas mounts `@zaoly/site-kit` (behavior updates without Pull).
- **Pull** = explicit hydrate of scene Master trees from kit seed (schema-safe or Reset).

## Locked decisions

1. **Not both-ways live sync.** No Storybook Control → Scene. No auto-merge on every kit deploy.
2. **React kit** = developer SSOT for implementation. **Scene Masters** = designer SSOT for authored look until Pull/Reset.
3. **Pull is explicit**, symmetric to Publish.
4. **Default Pull = schema-safe:** add missing props / tokenBindings / style keys from seed; preserve designer paint and named variants.
5. **Reset** replaces Master tree from kit seed; **variant remaps by name**, else snap Instance to Master `defaultVariantId` and report `remapped`.
6. Masters MUST persist `pulledAt` (ISO) and `kitRevision` (seed stamp) after Pull/Reset for stale awareness.
7. **Compositions** use `Composition:{exportName}` → override id `Composition{Name}`.
8. Pull MUST NOT schedule Storybook rebuild.
9. WENN Reset remaps / returns an updated `sceneRoot`, DANN MUST the editor write that root onto the **active page** via `persistActivePageRoot` (multi-page boards MUST NOT leave `pages[].root` drifted from `scene.root`).

## Modes

### A — Pull (safe, default)

1. Resolve seed: override composition (+ variants) else catalog `defaultChildForType`.
2. Preserve designer props/style/tokenBindings/variants that exist.
3. Soft-fill missing props, tokenBindings, style keys from seed (and per named-variant root).
4. MUST NOT delete designer named variants.
5. Set `pulledAt` + `kitRevision`.

### B — Reset from Kit (destructive, confirm)

1. Replace Master `root` / `variants` from seed; keep Master `id` + Instance `instanceOf`.
2. Map Instance `instanceVariantId` by **variant name**; unmatched → Master default; include remaps in status.
3. Set `pulledAt` + `kitRevision`.

## Requirements (EARS)

1. WHEN the designer clicks **Pull from Site Kit**, the system MUST hydrate Site Kit Masters using mode A unless Reset is confirmed.
2. WHERE `sourceKey` is `Composition:{exportName}`, Pull MUST use that composition override.
3. WHERE root `type` is a Site Kit atom and no `sourceKey`, Pull MUST use `type` as kit id.
4. MUST NOT mutate Masters from Storybook Controls.
5. WHEN Pull/Reset completes, the system MUST NOT schedule a Storybook rebuild.
6. WHEN Reset remaps variants, the system MUST map by name when possible and MUST fall back to `defaultVariantId` otherwise.
7. AFTER Pull or Reset, the Master MUST store `pulledAt` and `kitRevision`.

## API

| Method | Path | Auth | Role |
|--------|------|------|------|
| GET | `/api/site-kit/seed/:componentId` | Session | Seed tree + optional variants + `kitRevision` |
| POST | `/api/site-kit/seed-revisions` | Session | Batch `{ componentIds }` → `{ revisions: { componentId, kitRevision }[] }` (drift probe) |
| POST | `/api/site-kit/pull` | Session | Apply mode A/B to Masters (+ Instance remaps for Reset) |

`kitRevision` = `override:{updatedAt}` when override exists, else `catalog:{componentId}`.

## UI

- Top bar: **Pull from Site Kit** next to Publish; Reset via confirm.
- Status: updated / unchanged / reset / remapped counts.
- WHEN any pullable Master’s stored `kitRevision` **differs** from the latest seed revision (`kit-newer`), the editor MUST show a **Kit drift** notice (`data-testid="editor-kit-drift-banner"`) listing those Masters and MUST offer **Pull** (mode A) and **Reset** (mode B confirm) — best-effort; network failure MUST fail closed (no false “synced”).
- Masters with **no** `kitRevision` (`never-pulled`) MUST NOT open the drift banner by themselves — that is the default for in-scene / starter Masters until an intentional Pull stamps a revision. Classify them for probes/diagnostics only.
- Drift probe MUST use seed **revisions only** (`POST /api/site-kit/seed-revisions`) — MUST NOT download full seed trees for the banner.
- Designers MAY dismiss the notice for the current revision fingerprint (session); a newer remote revision MUST resurface the notice.

## Acceptance

- Seed returns composition when override exists.
- Pull mode A adds missing prop without wiping style / variants.
- Reset remaps Instance variants by name.
- No Storybook redeploy on Pull.
- Unit tests for soft-fill + reset remap.
