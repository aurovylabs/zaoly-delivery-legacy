# Project workspace — CREATION v3

## Status
Accepted (Wave 3 bindings + **P71 / W-COLLECTION-PICKER** + **Scenes as Compositions** 2026-08-29)

## Model
A CREATION project is the **local capability record** for the same Collection as in Plexon — not a second product-only project system:

| Identity | Field | Role |
|----------|-------|------|
| CREATION | `id` | Primary key in routes (`/projects/:id`) |
| Plexon | `platformProjectId` | Collection binding / deep-link |
| Sync | `capabilityStatus` | Federation mirror health (`in_sync` \| `pending` \| `error`) |

A project MAY contain **many compositions** (`CompositionScene` rows with that `platformProjectId`).

## Administration (`/projects`)
Magazine collection hub:

- List local capability projects (**Postgres** when `ZAOLY_DATABASE_URL` is set; otherwise in-memory)
- **P71 Collection picker:** Select/combobox from `@zaoly/ui` lists Plexon Collections the signed-in user can see (same set as Sync). Selecting one upserts/opens the CREATION mirror (`platformProjectId`) and navigates to `/projects/:id`. No `?platformProjectId=` required.
- Prefetch uses Plexon `GET /api/platform/provisioning/accessible-collections` (same `listAccessiblePlatformProjectsForUser` as `sync-capability-mirrors`). Do not invent a second catalog.
- Pin the Zaoly Collection id (`paths.zaolyDepositPlatformProjectId`) when present — **label from Plexon**, not a hardcoded name.
- **No freeform project create** — Collections only (picker or deep-link open)
- Deep-link: `/projects?platformProjectId=` → detail when bound; else open/bind via `open-collection` (Ops / Plexon launch; picker is the in-app path)
- Empty list after DS-DEPOSIT is expected until CREATION mirror is provisioned/synced — see `knowledge/empty-projects-after-ds-deposit.md`
- **Sync Collections from Plexon** upserts CREATION mirrors for every Collection the signed-in user can see (Phase 1 — all Collections get CREATION capability)
- Sync CTA (per row) when placeholder platform id or capability not `in_sync` (outbound origin; requires live federation)
- **Edit** CTA (per row + detail) → Dialog (name + description) → `PATCH /api/projects/:id`
- **Archive** CTA (per row + detail) → `POST /api/projects/:id/archive` (Plexon lifecycle when bound; local `status: archived`)
- WENN federation mode is `dummy`, DANN the picker MUST be disabled and show the existing dummy failure copy (`federation_mode_dummy`)
- `compositionCount` on list rows MAY be enriched at read time from scene counts per `platformProjectId` (no required DB backfill)

## Detail (`/projects/:id`)
Workspace for one Collection capability:

- Name, Collection id, capability chip
- **Edit** Collection name/description (same Dialog as hub)
- **Archive** Collection (same Confirm as hub)
- **Compositions list** for `project.platformProjectId` (`listScenes`) — Open with `?sceneId=` (+ `platformProjectId`)
- **Create composition** (name) → blank `CompositionScene` via `POST /api/scenes` → editor redirect
- Fallback **Open editor** without `sceneId` (boot resolves latest / default for Collection)

## Edit semantics
UI **Edit** calls `PATCH /api/projects/:id` with `{ name?, description? }` (viewer must have access). Updates the CREATION capability mirror only in this wave — Collection display name SSOT in Plexon hub remains authoritative when mirrors re-sync.

## Archive semantics
UI **Archive** calls `POST /api/projects/:id/archive` → Plexon `PATCH …/provisioning/projects/:platformProjectId` `{ status: archived }` when bound, then local mirror `status: archived` (hidden from default lists). Unbound / dummy: local archive only. Hard-delete remains Plexon global-admin / ops only.

## Compositions / Library
- `/compositions` — scene magazine + create/open — see `compositions-hub.md`, `editor-launch.md`
- `/library` — Site Kit compositions + atom catalog — see `library-hub.md`

## API
See `specs/api/projects.md` · scenes `specs/api/scenes.md`.

## Non-goals
- Editor embed / iframe in AppShell
- Second project type outside Collections
- Freeform / name-only project create (dropped — Collection picker + deep-link only)
- Porting Vite editor into Next
- Full scene edit (canvas/ops) inside Next hubs — canvas stays `/editor`
