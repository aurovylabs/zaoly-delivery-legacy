# Catalog API — CREATION v3

**Status:** Accepted (Wave 6) — 2026-08-12 · **Compositions → scene-store** 2026-09-26  
**Companion:** `specs/domain/mcp-server.md` · `library-hub.md` · `compositions-hub.md` · `specs/api/scenes.md`

## Purpose

HTTP read surfaces for the library fixture catalog and composition summaries so MCP (and clients) do not scrape HTML hubs.

## Routes

| Method | Path | Auth | Body |
|--------|------|------|------|
| GET | `/api/library/catalog` | Public | `LibraryCatalogFixture` |
| GET | `/api/compositions` | Session **or** service secret + actor (same as `/api/scenes`) | `{ items: CompositionSummary[] }` |
| GET | `/api/projects` | Session **or** service secret when Plexon auth on | `{ items }` or single via `?platformProjectId=` |
| GET | `/api/projects/:id` | Session **or** service secret when Plexon auth on | `ProjectDetail` |

Query on library catalog (optional):

| Param | Notes |
|-------|--------|
| `q` | Case-insensitive substring on `tagName` |
| `category` | Exact category match |

Query on compositions (optional):

| Param | Notes |
|-------|--------|
| `platformProjectId` | Narrow to one Collection (ACL-checked) |

## Compositions data

- SoT = persisted `CompositionScene` via `scene-store` (JSON or Postgres).
- Items = `sceneToCompositionSummary` over `listScenesForViewer` (Collection ACL).
- Fixture `composition-store` removed — do not reintroduce static demo stubs as SoT.

## Middleware

When Plexon auth is configured:
- `/api/library/catalog` stays public (GET).
- `/api/compositions` is **not** public — session gate; machine callers use service secret via `isMachineScenePath` (same pattern as `/api/scenes`).
- `/api/projects*` allow through when `X-Service-Secret` + `X-Federation-Contract-Version` match, else session gate.

## Non-goals

- Live CEM parse
- Write endpoints for library/compositions (writes go through `/api/scenes`)
