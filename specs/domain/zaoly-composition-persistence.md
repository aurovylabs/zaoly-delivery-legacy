# Zaoly composition persistence

**Status:** Accepted — 2026-10-03  
**Product:** Zaoly standalone  
**Related:** `specs/api/scenes.md` · `knowledge/zaoly-postgres.md` · `knowledge/scene-store.md`

## Intent

Compositions are durable `CompositionScene` documents. Production / staging / local durable SoT is **Postgres**. JSON file store remains a Dev/Test fallback when `ZAOLY_DATABASE_URL` is unset.

## Document contract

- HTTP and editor continue to exchange `CompositionScene` JSON (`@zaoly/contracts`).
- Optional `ownerUserId` records the creating viewer (standalone ACL).
- Optional `platformProjectId` remains for federation / Collection binding — **not** required to create or edit in standalone.

## Backends

| Condition | Backend | Path |
|-----------|---------|------|
| `ZAOLY_DATABASE_URL` set | Postgres | `apps/web/lib/scene/pg-store.ts` · table `scenes` |
| Env unset | JSON + memory | `apps/web/lib/scene/scene-store.ts` · `paths.sceneStoreRelPath` |

Facade: `apps/web/lib/scene/scene-store.ts` (`sceneStoreBackend()`). Health: `GET /api/health` → `sceneStore: "postgres" | "json"` (no secrets).

## Schema (`scenes`)

| Column | Maps to |
|--------|---------|
| `id` | `id` |
| `name` | `name` |
| `version` | `version` |
| `platform_project_id` | `platformProjectId` |
| `owner_user_id` | `ownerUserId` |
| `active_breakpoint` | `activeBreakpoint` |
| `active_print_preset` | `activePrintPreset` |
| `root` JSONB | `root` |
| `masters` JSONB | `masters` |
| `comments` JSONB | `comments` |
| `pages` JSONB | `pages` |
| `active_page_id` | `activePageId` |
| `cover_page_id` | `coverPageId` |
| `updated_at` | `updatedAt` |

Indexes: `(owner_user_id, updated_at DESC)`, `(platform_project_id, updated_at DESC)`.

Sibling tables on the same pool: `scene_versions`, `projects`, `site_kit_overrides`, **`users`**, **`user_invites`**, **`scene_members`** (`zaoly-user-management.md` · `zaoly-scene-share.md`).

## Ownership / ACL

### Zaoly local users (default)

1. `POST /api/scenes` MUST set `ownerUserId` from the authenticated / bypass viewer id.
2. List/get MUST include scenes owned by the viewer **or** listed in `scene_members` for that viewer.
3. Write ops require owner or `editor` membership (`zaoly-scene-share.md`).
4. Create MUST NOT require `platformProjectId`.
5. Legacy scenes without `ownerUserId` MAY remain visible only under auth bypass / unbound DX.

### Legacy federation adapters

Plexon Collection ACL paths are **out of product** for Zaoly auth. If leftover env is present, local user ACL still wins for scene membership.

## Non-goals

- Separate composition microservice or second document store
- Sharing CREATION Coolify Postgres with Zaoly
- Brandion / token storage in this database
- Automatic migration of CREATION production data into Zaoly

## Acceptance

- [ ] Cover + owner roundtrip through Postgres upsert/read
- [ ] Standalone hub create without a Collection project
- [ ] `docker compose up -d` provides local Postgres for `ZAOLY_DATABASE_URL`
- [ ] Specs inventory includes this file + `knowledge/zaoly-postgres.md`
