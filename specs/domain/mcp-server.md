# Zaoly MCP Server

**Status:** Accepted — 2026-10-11 (Zaoly rename; Magcloud tool removed)  
**Implements:** `mcp-server/` (Streamable HTTP + stdio)  
**Knowledge:** `knowledge/mcp-server.md` · `knowledge/paths.md`  
**Auth:** `ZAOLY_SERVICE_SECRET` (+ aliases) for service reads/writes; actor via `X-Actor-User-Id`  
**Product:** standalone Zaoly (`zaoly-standalone.md`) — not suite federation SSOT

## Purpose

Expose Zaoly library / composition / project / scene APIs as MCP tools for assistants and Cursor. Separate deployable from the web app.

## Transport

| Mode | Env | Use |
|------|-----|-----|
| Streamable HTTP (default) | `MCP_PORT` (3102), optional `MCP_STATELESS=1` | Hosted / Cursor |
| stdio | `MCP_TRANSPORT=stdio` | Local subprocess |

## Env

| Key | Required | Notes |
|-----|----------|-------|
| `ZAOLY_API_URL` | Yes | Base URL of Zaoly web (e.g. `http://localhost:3009`) |
| `ZAOLY_SERVICE_SECRET` | For service tools | Shared secret — machine calls with `X-Service-Secret` |
| `MCP_TRANSPORT` | No | `stdio` or omit/`http` |
| `MCP_PORT` | No | Default `3102` |
| `MCP_STATELESS` | No | `1` when behind a reverse proxy that drops session headers |

## Tool surface (v1 read-only)

Prefix: `zaoly.`

| Tool | Maps to | Notes |
|------|---------|--------|
| `zaoly.health` | `GET /api/health` | Liveness |
| `zaoly.library_catalog` | `GET /api/library/catalog` | Offline fixture; product hub SoT = Site Kit |
| `zaoly.compositions_list` | `GET /api/compositions` | Scene-store summaries; session or service+actor |
| `zaoly.projects_list` | `GET /api/projects` | Project list; service secret when auth configured |
| `zaoly.project_get` | `GET /api/projects/:id` or `?platformProjectId=` | Detail |

## Tool surface (v2 write)

See `specs/domain/scene-agent-editing.md` · `specs/api/scene-ops.md`. Error bodies MUST be forwarded (`reason`, `failedIndex`, `scene.updatedAt`).

| Tool | Maps to |
|------|---------|
| `zaoly.scene_get` | `GET /api/scenes/:id` |
| `zaoly.scene_list` | `GET /api/scenes?platformProjectId=` |
| `zaoly.scene_tree_index` | `GET /api/scenes/:id/tree` |
| `zaoly.scene_content_audit` | `GET /api/scenes/:id/content-audit` |
| `zaoly.scene_preview` | `GET /api/scenes/:id/preview` |
| `zaoly.scene_craft_debug` | `GET /api/scenes/:id/craft-debug` |
| `zaoly.scene_import_html` | `POST /api/scenes/:id/import-html` |
| `zaoly.scene_apply_ops` | `POST /api/scenes/:id/ops` |
| `zaoly.editor_palette` | `GET /api/editor/palette` |
| `zaoly.brand_tokens_get` | `GET /api/brand-tokens?platformProjectId=` |
| `zaoly.site_kit_composition_save` | `POST /api/site-kit/compositions` |
| `zaoly.site_kit_page_save` | `POST /api/site-kit/compositions/from-page` |

### v2 requirements

1. Client MUST send `X-Actor-User-Id` on mutating tools (`actorUserId` arg).
2. Tools MUST NOT re-implement `applySceneOp` — HTTP proxy only.
3. Prefer `zaoly.scene_tree_index` before large `scene_get` loads.
4. `zaoly.scene_apply_ops` MUST embed `baseUpdatedAt` + `ops` array.
5. Page artboard ops in `SCENE_OP_NAMES`: `add_page`, `rename_page`, `duplicate_page`, `set_active_page`, `delete_page`, `reorder_pages`, `move_node_to_page`, `bind_master_composition`.

### MUST NOT

- Magcloud / print PDF MCP tools (`print-out-of-scope-for-zaoly.md`)
- Suite federation as Zaoly auth SSOT

## Acceptance

1. `npm run build` + `npm test` in `mcp-server/` succeed.
2. Spec inventory lists this file + `knowledge/mcp-server.md`.
3. Tool names use `zaoly.` prefix; no `creation.scene_publish_magcloud`.
4. Dockerfile under `mcp-server/Dockerfile`; port **3102**.
