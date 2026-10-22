# Projects API — CREATION v3

## Status
Accepted (Wave 3 + **P71 / W-COLLECTION-PICKER** + **P73 / picker-sync**) — 2026-08-14

## Routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/projects` | `{ items: ProjectSummary[] }` — **access model B**: session required; only creator/owner or Plexon-accessible Collections |
| GET | `/api/projects?platformProjectId=` | `ProjectDetail` or 404 / 403 if viewer lacks access |
| POST | `/api/projects` | Create; optional sync/origin when federation live |
| GET | `/api/projects/collections` | **P71** — list Plexon Collections the signed-in user can see (BFF → Plexon `GET …/accessible-collections`). Live mode. Dummy → `503 federation_mode_dummy` |
| POST | `/api/projects/open-collection` | **P71/P73** — upsert/open CREATION mirror for `{ platformProjectId, name, platformCompanyId? }`, then best-effort sibling sync via Plexon `POST …/provisioning/projects/:id/sync`. Live mode |
| GET | `/api/projects/:id` | Detail |
| PATCH | `/api/projects/:id` | Name / description |
| POST | `/api/projects/:id/archive` | Archive Collection via Plexon when bound; local `status: archived` → `ProjectDetail` |
| DELETE | `/api/projects/:id` | **Alias of archive** (204) — no hard-delete of Collection mirrors |
| POST | `/api/projects/:id/sync-plexon` | Outbound origin + bind (`ZAOLY_FEDERATION_MODE=live` required; else `503 federation_mode_dummy`) |
| POST | `/api/projects/sync-from-plexon` | Ask Plexon to upsert CREATION mirrors for **all Collections the user can see** (live mode) |
| PUT | `/api/platform/provisioning/projects/:id` | Plexon → CREATION upsert |
| GET | `/api/platform/provisioning/projects/:id` | Dashboard summary |

## Create body
```ts
{ name: string; description?: string; platformProjectId?: string; ownerPlexonUserId?: string; platformCompanyId?: string }
```
- When `platformProjectId` is a real Collection UUID → bind locally, skip origin
- Otherwise generate `plx-local-…` and call origin when `ZAOLY_FEDERATION_MODE=live`

## Archive (global)
When `ZAOLY_FEDERATION_MODE=live` and the project has a real Collection UUID, archive calls Plexon `PATCH /api/platform/provisioning/projects/:platformProjectId` with service secret + `X-Actor-User-Id` (`{ status: 'archived' }`). Fan-out upserts archived to sibling products. Unbound / dummy: local archive only. Restore via Plexon hub. Hard-delete of local rows remains store/ops only.

## Contract shapes
`@zaoly/contracts` — `ProjectSummary`, `ProjectDetail`, `CreateProjectInput`, `UpdateProjectInput`.

## EARS
- WHEN Plexon PUTs a Collection upsert with valid secret + contract THEN the CREATION mirror MUST be applied and return `externalProjectId`
- WHEN `/projects?platformProjectId=` matches a bound mirror THEN the app MUST redirect to `/projects/{id}`
- WHEN create uses a non-UUID platform id and federation is live THEN CREATION MUST call `creation-project-origin` and persist the returned UUID
- WHEN federation mode is `dummy` and the user calls Sync to Plexon THEN CREATION MUST respond `503` with `federation_mode_dummy` (not an opaque 502)
- WHEN federation is live and the user calls Sync Collections from Plexon THEN CREATION MUST call Plexon `POST …/provisioning/sync-capability-mirrors` with `productIds: ['creation']` and refresh the local list
- WHEN federation is live and the hub/editor picker prefetches THEN CREATION MUST call Plexon `GET …/provisioning/accessible-collections` (same `listAccessiblePlatformProjectsForUser` as Sync) and MUST NOT invent a second catalog
- WHEN a signed-in user lists `/api/projects` or `/projects` THEN CREATION MUST return only mirrors the user may see (creator/`ownerPlexonUserId` or Collection in that accessible set — access model B; company membership alone MUST NOT grant visibility)
- WHEN the user selects a Collection in the hub picker THEN CREATION MUST upsert the local capability mirror for that `platformProjectId`, MUST best-effort call Plexon `POST …/provisioning/projects/:platformProjectId/sync` (sibling mirrors; open still succeeds if sync fails), and navigate to `/projects/{id}`
- WHEN the editor bind picker selects a Collection THEN CREATION MUST PATCH the scene `platformProjectId` and MAY call `POST /api/projects/open-collection` so sibling mirrors stay aligned
- WHEN federation mode is `dummy` THEN `GET /api/projects/collections` and `POST /api/projects/open-collection` MUST respond `503` with `federation_mode_dummy` and the picker MUST be disabled with that reason
- WHEN the user archives a project THEN CREATION MUST call `POST /api/projects/:id/archive` (Plexon lifecycle when bound) and hide the mirror from default lists (`status: archived`)
- WHEN the user edits a project THEN CREATION MUST call `PATCH /api/projects/:id` with `{ name?, description? }` and persist on the CREATION mirror when the viewer has access
- WHEN `PATCH /api/projects/:id` is called without a session THEN CREATION MUST respond `401`
- WHEN `PATCH /api/projects/:id` is called for a project the viewer cannot access THEN CREATION MUST respond `403`