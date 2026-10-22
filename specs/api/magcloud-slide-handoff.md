# Magcloud APIs — removed

**Status:** Removed — 2026-10-11  
**Paths:** `paths.routes.apiScenePublishMagcloud` · `paths.routes.apiMagcloudBoards`

| Method | Path | Response |
|--------|------|----------|
| POST | `/api/scenes/:id/publish-magcloud` | **410** `{ "error": "print_out_of_scope" }` |
| GET/POST | `/api/magcloud/boards` | **410** `{ "error": "print_out_of_scope" }` |

No `MAGCLOUD_*` env keys. No Magcloud client in `apps/web`. Domain: `specs/domain/magcloud-slide-handoff.md`.
