# Site Kit Collection scope & Storybook tenancy

**Status:** Accepted (concept) · **Date:** 2026-09-12  
**Product:** CREATION v3 · Isolation boundary = Plexon **Collection** (`platformProjectId`)  
**Related:** `specs/domain/site-kit.md` · `specs/domain/site-kit-compositions.md` · `specs/domain/site-kit-kit-pull.md` · `specs/domain/brand-token-consume.md` · `specs/api/site-kit-write.md`  
**Knowledge:** `knowledge/site-kit-collection-scope.md` · Coolify `knowledge/site-kit-storybook-coolify.md`

## Purpose

Make Site Kit **safe for many companies and Collections** on one CREATION / one Site Kit Storybook host:

- Project A (rounded, media gallery Patterns) MUST NOT see or fetch Project B’s Patterns, atom forks, or Storybook stories.
- Developers consuming A’s components MUST import without colliding with B’s symbols.
- Brand (colors, type, radius) stays **Brandion per Collection** — not a second Storybook deployment per project.

## Locked decisions

| Chosen | Not chosen |
|--------|------------|
| **One** Site Kit Storybook Coolify app + hard Collection ACL | One Coolify Storybook **deployment** per Collection (N apps) |
| Isolation key = `platformProjectId` (Collection) | Isolation key = CompositionScene id |
| Brand via Brandion active-pack per Collection | Baking brand by forking Storybook apps |
| Shared **atom seed** (`SiteButton`, …) global | Auto-fork every atom into every Collection on create |
| Collection-owned **Patterns** (+ optional later atom forks) | Global unique Pattern export names forever |
| Composition Storybook browse = Collection-gated (no world catalog) | Static CSF sidebar listing all tenants’ Patterns |
| Specs first; implement in waves **SK-S1…S5** below | Big-bang rewrite |

## Model (layers)

```text
Company
  └── Collection (platformProjectId)     ← isolation boundary
        ├── Brandion guideline (tokens)
        ├── CompositionScenes (draft Masters local)
        ├── Site Kit Patterns (published, Collection-owned)
        └── optional Collection atom forks (later)
Shared
  └── Site Kit atom seed (global catalog types)
  └── Zaoly-UI Storybook (product DS — out of scope here)
```

| Layer | Visibility | Publish / Save | Dev consume |
|-------|------------|----------------|-------------|
| Atom **seed** | All Collections (palette) | Kit-owner / shared lane only (SK-S4) | `@zaoly/site-kit` atoms |
| Pattern / Composition | **Only owning Collection** | Save as Site Kit / Publish Patterns | Namespaced module (SK-S2 / SK-S5) |
| Collection atom **fork** | Owning Collection only | Explicit fork + Publish (SK-S4) | Namespaced override id |
| Scene Masters (draft) | Scene only until Save/Publish | — | Not in Storybook |

## Gaps in current v1 (must close)

1. **Catalog leak:** `GET /api/site-kit/compositions` without filter can return **all** Patterns (public).
2. **Override leak:** `GET /api/site-kit/overrides/:id` is public by global `Composition{Name}` — knowing/guessing the id reveals another Collection’s tree.
3. **Storybook leak:** Hydrated CSF under `Compositions/{scope}/{Name}` is still **browsable** in one static Storybook if the build includes every Collection.
4. **Name clash:** Export names are **globally unique** — A and B cannot both own `Hero`.
5. **Atom Publish clash:** Atom overrides keyed only by `SiteButton` — Collection A Publish overwrites B’s atom paint.
6. **Flat package barrel:** `compositions/index.ts` exports all names into one namespace.

Sidebar scope segments (`Compositions/{slug}/…`) are **UX grouping only** today — not an access boundary.

## Target architecture

### Identity

- Pattern primary key MUST be `(platformProjectId, exportName)` — not `exportName` alone.
- Override / component id MUST encode Collection, e.g.  
  `Composition/{platformProjectId}/{ExportName}`  
  (stable, URL-safe; exact grammar fixed in SK-S2 implementation spec).
- Legacy `Composition{ExportName}` + `platformProjectId` field MUST migrate or resolve via compatibility map (SK-S2).

### Read ACL (fail closed)

1. WHEN listing Patterns, the system MUST require either:
   - `platformProjectId` the caller is allowed to view, or
   - session viewer’s allowed Collection set (intersection), or
   - explicit `unscoped=1` **only** for unbound DX / kit-admin (MUST NOT expose other Collections’ rows).
2. WHEN reading a Pattern override, the system MUST authorize the caller for that override’s `platformProjectId` (or reject).
3. Atom **seed** overrides (global) MAY stay readable for Storybook atom stories; Collection atom forks MUST use the same ACL as Patterns.
4. Unauthenticated world MUST NOT list or fetch another tenant’s Patterns. Storybook Live MUST obtain a **Collection-scoped** credential or signed launch (SK-S1 / SK-S3).

### Storybook

1. **Host:** Keep single Coolify app `creation-v3:site-kit-storybook` (`URL_SITE_KIT_STORYBOOK`).
2. **Atoms:** Static CSF for shared seed remains OK.
3. **Patterns:** MUST NOT ship a world-readable static sidebar of all Collections.
   - **SK-S3 preferred:** Pattern preview is **runtime Live/Catalog** with mandatory `platformProjectId` + authorized fetch; static image does not embed foreign Pattern CSF.
   - **Optional later:** Dedicated customer Storybook image with build-arg `STORYBOOK_PLATFORM_PROJECT_ID` (hydrate only that Collection) for isolated staging — still not the default multi-tenant path.
4. Editor “Open Storybook” MUST deep-link into the **active Collection** scope (never a global Pattern index).
5. Zaoly-UI Storybook (`URL_Zaoly_UI_STORYBOOK`) remains product DS — MUST NOT hold customer Patterns.

### Developer consume

1. Apps MUST import Collection Patterns from a **scoped path**:
   `@zaoly/site-kit/c/{scopeKey}/{ExportName}`
   (or Collection barrel `@zaoly/site-kit/c/{scopeKey}`).
   `scopeKey` = `compositionScopeKey(platformProjectId)`. Helpers in `composition-codegen` (SK-S5).
   Spec example using raw `platformProjectId` in the path is superseded — fingerprint keeps disk + package + override id aligned.
2. Same `ExportName` (`Hero`) MUST be allowed in Collection A and B without symbol clash.
3. Shared atoms remain `@zaoly/site-kit` / `SiteButton`.
4. Brand at runtime: app binds Brandion pack for that Collection (paths on nodes + CSS vars) — Storybook preview MUST paint with that Collection’s pack when showing A’s Patterns.

### Atom Publish policy (SK-S4)

| Action | Allowed |
|--------|---------|
| Edit atom Instance paint in a Scene | Always (scene-local / Instance overrides) |
| **Publish** atom Master → global seed override | Kit shared lane / elevated role only |
| Publish atom as **Collection fork** | Explicit “Fork atom for this Collection” then Publish to scoped id |
| Pull atom seed into Scene | Pull/Reset (existing kit-pull) |

Default designer path for “our button looks different”: **Composition / Master Pattern**, not mutating global `SiteButton`.

## Requirements (EARS)

1. WHERE a Pattern is stored, it MUST carry a non-null `platformProjectId` (bound Collection). Unscoped Patterns remain legacy/admin-only.
2. WHEN Collection A’s viewer opens Library / palette Patterns / Storybook Pattern Live, the system MUST NOT return or render Collection B’s Patterns.
3. WHEN two Collections save `exportName = Hero`, both MUST succeed and MUST resolve to distinct override ids and distinct import paths.
4. WHEN an unauthorized client requests another Collection’s Pattern override, the system MUST respond `404` or `403` without leaking existence details beyond product policy (prefer `404` for public surfaces).
5. WHEN Site Kit Storybook loads Pattern Live, it MUST send Collection scope; missing scope MUST NOT fall back to “all compositions”.
6. WHEN Publish writes atom seed overrides, the system MUST NOT silently overwrite another Collection’s fork; seed writes are shared-lane only (SK-S4).
7. Brandion token resolve for preview/codegen MUST use the Pattern’s Collection pack (CT-* unchanged).
8. Paths / Storybook FQDNs MUST stay in `knowledge/paths.md` / `lib/paths.ts` — no hardcoded Storybook hosts in app code.

## Non-goals

- One Coolify Storybook app UUID per Collection as the default architecture.
- Isolating by CompositionScene id (too granular; Masters stay scene-local until Save).
- Putting customer Patterns into `ds.projects-a.plygrnd.tech`.
- CRDT merge of Patterns across Collections.
- Changing Brandion SSOT or inventing a CREATION token store.

## Implementation waves

| Wave | Focus | Outcome | Status |
|------|--------|---------|--------|
| **SK-S1** | Fail-closed reads | Catalog + override GET authorize by Collection; no unfiltered public dump; Storybook launch carries scope | **done** |
| **SK-S2** | Namespaced ids | `(platformProjectId, exportName)` PK; new override id grammar; migrate legacy `Composition{Name}`; allow duplicate names across Collections | **done** |
| **SK-S3** | Storybook tenancy UX | No cross-Collection Pattern CSF browse; Live gated; editor deep-links scoped; document optional single-Collection image | **done** |
| **SK-S4** | Atom Publish policy | Shared seed vs Collection fork; Publish UI copy + API guards | **done** |
| **SK-S5** | Dev package exports | Scoped import paths / barrel generation; consumer docs | **done** |

Each wave: update this spec’s wave status → API/domain deltas → tests → knowledge → inventory. **Do not implement multiple waves in one PR without need.**

## SK-S1 design notes (locked)

1. **View token (reusable HMAC):** `POST /api/site-kit/storybook-view-token` mints a short-lived signed token for one `platformProjectId`. Storybook Live/Catalog pass it as header `X-Zaoly-Site-Kit-View` (or query `zaolyViewToken`). Not one-time (polling). TTL via `paths.siteKitViewTokenTtlSeconds`.
2. **Compositions GET:** Unauthenticated unfiltered list MUST return `401`. Allowed principals: session/service (Collection ACL), view token (exact Collection), provisioning service secret (hydrate/admin dump — CSF bake remains SK-S3).
3. **Overrides GET:** Atom seed ids (`Site*`) MAY stay public. `Composition*` MUST authorize owning Collection (session/service/view token) or return **`404`** (no existence leak). Legacy unscoped Patterns: session/service only.
4. **Editor:** Catalog/palette MUST query with `?platformProjectId=` or `?unscoped=1` under session. Storybook deep-links MUST attach view token + Collection when opening Pattern Live.
5. **Local DX:** When Plexon auth is not configured, session Collection checks soft-allow (same spirit as unbound scenes).

## SK-S2 design notes (locked)

1. **Override id grammar:** `Composition~{scopeKey}~{ExportName}` where `scopeKey` is a 16-hex FNV-1a fingerprint of `platformProjectId` (`compositionScopeKey`). Max length ≤ 80. Single path segment (safe for Next `[componentId]` + `.json` files).
2. **Legacy:** `Composition{ExportName}` (no `~`) remains readable; when a namespaced id misses, resolve legacy row **only if** `body.platformProjectId` hashes to the same `scopeKey`.
3. **Catalog PK:** list/merge by `(platformProjectId, exportName)` — two Collections MAY both own `Hero`.
4. **Disk modules:** write under `src/compositions/c/{scopeKey}/` (no flat barrel clash). Flat package barrel deferred to **SK-S5**.
5. **CSF:** generated stories set `args.componentId` to the namespaced id for Live paint.

## SK-S3 design notes (locked)

1. **Default Storybook image:** MUST NOT bake Pattern CSF for all Collections. `hydrate-composition-stories` bakes Patterns **only** when `STORYBOOK_PLATFORM_PROJECT_ID` is set (optional single-Collection staging image). Otherwise hydrate exits with 0 Pattern CSF — Live/Catalog + view token only.
2. **Catalog / Live:** Pattern list/preview REQUIRES Collection view token (`zaolyViewToken`). Without token, Catalog shows a gate message and MUST NOT call unscoped list APIs. No “All Collections” filter in Catalog.
3. **Editor:** Storybook deep-links (dialog + Open) MUST open Catalog/Live with view credentials for the active Collection — never bare Storybook origin as the Pattern entry point.
4. **Atoms:** Static `Site/*` CSF remains world-browsable (shared seed).

## SK-S4 design notes (locked)

1. **Override id grammar:** Seed remains catalog id (`SiteButton`). Collection fork = `Atom~{scopeKey}~{SiteType}` (same `compositionScopeKey` FNV as Patterns). Max length ≤ 80.
2. **Default Write/Publish:** When `platformProjectId` is set, atom Publish writes the **fork** id and stamps `platformProjectId` on the override. Does **not** patch shared `*.stories.tsx`.
3. **Shared seed lane:** `publishLane: 'seed'` (or default without Collection) writes bare `Site*` **only** when `ZAOLY_SITE_KIT_SHARED_SEED_WRITE=1` (`paths.envSiteKitSharedSeedWrite`). Otherwise `403` `seed-write-forbidden`. Seed writes MUST NOT touch `Atom~*` rows.
4. **Reads:** `Atom~*` overrides use the same ACL as Pattern overrides (session/view token/provisioning). Seed `Site*` MAY stay public.
5. **Pull:** Prefer Collection fork override; if missing, fall back to global seed / catalog defaults.
6. **Product copy:** Designer default for “our button looks different” remains **Save as Pattern**; Publish atoms = Collection fork; shared seed = kit-owner only.

## SK-S5 design notes (locked)

1. **Package imports:** Collection Patterns MUST be imported via scoped subpaths — never a flat `@zaoly/site-kit` re-export of `Hero`.
   - Module: `@zaoly/site-kit/c/{scopeKey}/{ExportName}`
   - Collection barrel: `@zaoly/site-kit/c/{scopeKey}`
   - `scopeKey` = `compositionScopeKey(platformProjectId)` (same fingerprint as override ids / disk).
2. **Helpers:** `compositionPackageImportPath` / `compositionPackageCollectionImportPath` / `generateCompositionCollectionBarrel` in `@zaoly/site-kit/composition-codegen`. Package name constant `SITE_KIT_PACKAGE_NAME` (also `paths.siteKitPackageName`).
3. **package.json exports:** `./c/*/*` → `src/compositions/c/*/*.tsx`; `./c/*` → `src/compositions/c/*/index.ts`. Atoms remain root package exports.
4. **Save / hydrate:** After writing `src/compositions/c/{scopeKey}/{Name}.tsx`, regenerate that scope’s `index.ts` barrel. Root `src/compositions/index.ts` MUST stay empty of Pattern re-exports.
5. **Consumer rule:** resolve `platformProjectId` → scopeKey via helper; do not hardcode Storybook hosts or invent parallel barrels in apps.

## Acceptance (concept)

1. This doc is listed in specs inventory; `knowledge/site-kit-collection-scope.md` summarizes operator rules.
2. Parent `site-kit.md` / `site-kit-compositions.md` / `site-kit-write.md` link here and mark v1 gaps as superseded by SK-S*.
3. Product agrees: Collection = tenancy boundary; one Storybook host; Patterns gated; atoms shared seed by default.
4. Implementation starts at **SK-S1** only after this concept is accepted (this doc).

## Open points (post SK-S5)

- Optional dedicated single-Collection Storybook image remains optional staging (SK-S3), not default multi-tenant.
