# Scenes API — Zaoly

**Status:** Accepted (Wave E5+ / P13; **P18**) — 2026-08-12 · **Auth hardened** 2026-08-22 · **Collection ACL** 2026-08-29 · **Zaoly ownership** 2026-10-03  
**Store:** JSON file when `ZAOLY_DATABASE_URL` unset (`lib/scene/scene-store.ts`); Postgres when set (`lib/scene/pg-store.ts`). Default JSON `paths.sceneStoreRelPath` / env `ZAOLY_SCENE_STORE_PATH`.  
**Postgres:** local Compose or dedicated Coolify `zaoly-postgres` · env `ZAOLY_DATABASE_URL` (`paths.envDatabaseUrl`) runtime-only. See `knowledge/zaoly-postgres.md` · `specs/domain/zaoly-composition-persistence.md`.

## Auth

WENN Plexon-Auth konfiguriert ist (`ZAOLY_FEDERATION_AUTH_URL` + `ZAOLY_SERVICE_SECRET`), DANN MUSS jede Route unter `/api/scenes*` eine gültige Session (oder Federation-Service-Auth mit `X-Actor-User-Id`) haben.

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/scenes` | Session / service required |
| POST | `/api/scenes` | Session required |
| GET | `/api/scenes/:id` | Session / service required |
| PUT | `/api/scenes/:id` | Session required |
| PATCH | `/api/scenes/:id` | Session required |
| POST | `/api/scenes/:id/pdf` | Session required (see `composition-magazine-pdf.md`) |
| POST | `/api/scenes/:id/ops` | Session / service required |
| GET | `/api/scenes/:id/*` (tree, preview, events, …) | Session / service required |

- Ohne Session/Service: `401` `{ "error": "unauthorized" }` (JSON; kein Login-Redirect für API-Clients).
- Ohne konfigurierte Plexon-Auth (lokaler Dev-Bypass): bestehendes Verhalten bleibt offen.
- Ungültige oder fehlende Scene-IDs DÜRFEN einem unauthentifizierten Caller nicht verraten werden — Antwort ist `401`, nicht `404`.

Defense in depth: Middleware blockt unauthentifizierte `/api/scenes*`-Aufrufe; Route-Handler prüfen zusätzlich via `requireSceneApiAccess()` / `requireApiSession()`.

## Object-level ACL

Nach erfolgreicher Authentifizierung MUSS der Viewer Zugriff auf die Scene haben (`lib/require-scene-collection-access.ts`).

### Standalone (Plexon-Auth **nicht** konfiguriert)

- `POST` MUSS `ownerUserId` auf die Viewer-Id setzen (Body-Wert DARF überschrieben werden).
- Unbound Create (`platformProjectId` fehlt) ist erlaubt.
- `GET /api/scenes` listet Scenes mit `ownerUserId === viewerId`, plus `scene_members`, plus **orphan** Scenes ohne Owner (unbound oder Collection des Viewers) — siehe `zaoly-scene-share.md` Orphan claim.
- Erster Write auf eine Orphan-Scene setzt `ownerUserId` auf die Viewer-Id.

### Federated (Plexon-Auth konfiguriert)

- WENN eine Scene an `platformProjectId` gebunden ist UND der Viewer keinen Zugriff auf diese Collection hat, DANN MUSS die Route mit `403` `{ "error": "forbidden" }` antworten (nach `404` wenn die Scene fehlt).
- WENN die Scene unbound ist (`platformProjectId` fehlt/leer), DANN MUSS die Route mit `403` `{ "error": "forbidden", "reason": "unbound-scene" }` antworten (**W4** fail-closed · `specs/domain/observability-and-unbound-w4.md`).
- WENN `GET /api/scenes` ohne Filter aufgerufen wird, DANN MUSS die Liste auf Scenes der für den Viewer sichtbaren Collections beschränkt sein.
- WENN `GET /api/scenes?platformProjectId=` gesetzt ist UND der Viewer keinen Zugriff auf diese Collection hat, DANN MUSS die Antwort `403` sein.
- WENN `POST`/`PUT`/`PATCH` eine Collection bindet oder ändert, DANN MUSS sowohl die aktuelle als auch die Ziel-Collection für den Viewer erlaubt sein.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/scenes` | Optional `?platformProjectId=` |
| POST | `/api/scenes` | Body: `CompositionScene` — hubs create blank scenes via `createBlankScene` then POST (no separate create endpoint) |
| GET | `/api/scenes/:id` | |
| PUT | `/api/scenes/:id` | Upsert full scene; requires `baseUpdatedAt` optimistic lock (P90 Phase 3) |
| PATCH | `/api/scenes/:id` | `{ name? }` rename and/or `{ platformProjectId? }` Collection bind — at least one field required |
| DELETE | `/api/scenes/:id` | Hard-delete scene (ACL same as GET); versions removed when Postgres |
| POST | `/api/scenes/:id/ops` | **P90** Apply `SceneOp[]` batch — `specs/api/scene-ops.md` |
| GET | `/api/scenes/:id/tree` | **P90** Structural node index for agents |
| GET | `/api/editor/palette` | **P90** Insertable palette catalog |

Contract shapes: `@zaoly/contracts` · Spec `composition-scene.md` · Agent editing `specs/domain/scene-agent-editing.md`.

## Persistence fields

- Round-trip `CompositionScene` including optional `activeBreakpoint` when present (P9).
- Round-trip optional `editorChrome` when product enables persist (P21).
- Round-trip per-node `breakpoints` override maps when present (P17).
- Round-trip optional `pages` + `activePageId` when present (P80); optional `pages[].frame` when present (P81); legacy saves without `pages` remain valid single-page documents.
- Stale unknown top-level keys on disk are stripped on load so save never fails.
- Selection / pan / zoom / undo stacks are **not** part of the PUT body.

## PUT optimistic lock (P90 Phase 3)

- Body: full `CompositionScene` plus required `baseUpdatedAt` (ISO string matching `scene.updatedAt` at load time).
- Missing `baseUpdatedAt`: `400` `{ "error": "missing-base-updated-at" }`.
- Lock mismatch (scene changed elsewhere): `409` `{ "error": "stale-scene", "scene": { "id", "updatedAt" } }` — no write.
- Success: `200` `{ "scene": CompositionScene }` with new `updatedAt`.
- Editor autosave uses `lib/scene/scene-save-client.ts`; on `stale-scene` it **keeps the local draft**, pauses autosave, and surfaces reload vs keep-editing (no silent wipe / no merge).

## Phase B (P18)

Postgres is attached. Keep the same HTTP contract and `CompositionScene` JSON shape; `scene-store` swaps backend when `ZAOLY_DATABASE_URL` is set. Optional one-shot import from `.data/scenes.json` when the table is empty. JSON remains the local/test fallback.
