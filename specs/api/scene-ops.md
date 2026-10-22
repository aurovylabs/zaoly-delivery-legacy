# Scene Ops API — CREATION v3

**Status:** Accepted (shipped P90) — 2026-08-23 · hardened 2026-09-09  
**Domain:** `specs/domain/scene-agent-editing.md` · `specs/domain/composition-scene.md`  
**Store:** Same as `scenes.md` (`scene-store` / Postgres)  
**Federation:** `2026-05-plexon-federation-v3`

## Overview

Granular, validate-before-write mutations for composition scenes. Replaces coarse document `PUT` as the **canonical agent and automation write path**.

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/scenes/:id/ops` | Apply ordered `SceneOp[]` batch |
| `GET` | `/api/scenes/:id/events` | Server-sent `scene-updated` events for live editor sync |
| `GET` | `/api/scenes/:id/tree` | Compact node index for agent planning |
| `GET` | `/api/editor/palette` | Insertable palette types + container policy |

Existing `GET` / `PUT` / `PATCH` on `/api/scenes/:id` remain; `PUT` is legacy bulk save for the editor until ops migration completes.

---

## Auth

Same dual mode as `scenes.md`, extended for service callers.

| Caller | Headers / cookie | Allowed |
|--------|------------------|---------|
| Browser session | Session cookie | All routes in this spec |
| MCP / automation | `X-Service-Secret`, `X-Federation-Contract-Version`, `X-Actor-User-Id` | All routes in this spec |
| Unauthenticated | — | Allowed only when local auth bypass / auth unset (local dev) |

WENN Auth konfiguriert und weder Session noch gültiger Service-Caller, DANN `401 { "error": "unauthorized" }`.

Service secret validation: `isProvisioningAuthorized()` in `federation-contract.ts`.

`X-Actor-User-Id` MUST be present for service callers (non-empty string). Missing → `401 { "error": "actor-required" }`.

Ungültige Scene-IDs DÜRFEN unauthentifizierten Callern nicht verraten werden — Antwort `401`, nicht `404` (same as `scenes.md`).

---

## POST `/api/scenes/:id/ops`

Apply one or more `SceneOp` values atomically.

### Request headers

| Header | Required | Notes |
|--------|----------|-------|
| `Content-Type` | yes | `application/json` |
| `X-Service-Secret` | service only | Service secret (`ZAOLY_SERVICE_SECRET`) |
| `X-Federation-Contract-Version` | service only | `2026-05-zaoly-federation-v3` |
| `X-Actor-User-Id` | service only | Acting user id for audit |
| `X-Actor-Label` | no | Free-text audit label (legacy alias `X-Actor-Label`) |

### Request body

```ts
type SceneOpsRequest = {
  /** Optimistic lock — MUST match scene.updatedAt at load time. */
  baseUpdatedAt: string
  /** Ordered ops; max 64. */
  ops: SceneOp[]
  /** Optional client batch id for logs only; not idempotency cache in P90. */
  clientBatchId?: string
}
```

`SceneOp` — exact union from `@zaoly/contracts`. No server extensions.

### Response `200`

```ts
type SceneOpsResponse = {
  scene: CompositionScene
  appliedCount: number
  updatedAt: string // same as scene.updatedAt
}
```

### Processing rules

1. Load scene; `404` if missing (authenticated callers only).
2. Compare `baseUpdatedAt` with `scene.updatedAt`; mismatch → `409 stale-scene`.
3. Reject empty `ops` → `400 empty-batch`.
4. Reject `ops.length > 64` → `400 batch-too-large`.
5. For each op: if `op === 'select'` → `400 op-not-persisted`.
6. Sequentially `applySceneOp`; on failure return `400 op-rejected` with `failedIndex`, `reason`, `op`.
7. After success: run same sanitization as `upsertScene` (comment prune, unknown top-level key strip).
8. Persist once; return full scene.
9. After successful persist, publish a lightweight `scene-updated` event for this `sceneId`.

### Error responses

| Status | `error` code | When |
|--------|--------------|------|
| 400 | `invalid-json` | Body parse failure |
| 400 | `empty-batch` | `ops.length === 0` |
| 400 | `batch-too-large` | `ops.length > 64` |
| 400 | `op-not-persisted` | `select` or other UI-only op |
| 400 | `op-rejected` | `applySceneOp` returned `ok: false` |
| 400 | `tree-too-large` | Post-apply node count exceeded |
| 401 | `unauthorized` | Auth required and missing |
| 401 | `actor-required` | Service secret without `X-Actor-User-Id` |
| 403 | `forbidden` | Bound scene Collection not accessible to the actor (session or service; fail closed) |
| 404 | `not-found` | Unknown scene id (authenticated) |
| 409 | `stale-scene` | `baseUpdatedAt` mismatch |
| 413 | `payload-too-large` | Body > 2 MiB |

`op-rejected` body example:

```json
{
  "error": "op-rejected",
  "message": "paint key belongs in style, not props: direction",
  "failedIndex": 2,
  "reason": "Invalid prop key direction on SiteStack",
  "op": { "op": "set_prop", "nodeId": "hero-stack", "key": "direction", "value": "row" }
}
```

### Example — hero stack for Deposit landing

```json
{
  "baseUpdatedAt": "2026-08-23T18:00:00.000Z",
  "ops": [
    {
      "op": "insert_child",
      "parentId": "page-root",
      "child": {
        "id": "hero-stack",
        "type": "SiteStack",
        "props": { "direction": "column", "gap": "lg" },
        "children": [
          {
            "id": "hero-title",
            "type": "SiteText",
            "props": { "role": "display", "children": "Deposit" },
            "tokenBindings": { "color": "color.action.primary" }
          }
        ]
      }
    },
    {
      "op": "set_token_binding",
      "nodeId": "hero-stack",
      "key": "gap",
      "tokenPath": "spacing.static.large"
    },
    {
      "op": "set_data_binding",
      "nodeId": "score-text",
      "key": "children",
      "dataRef": "checkion.scan.latest.overallScore"
    }
  ]
}
```

Collection data bind ops (`set_data_binding` / `clear_data_binding`) persist capability **refs** only — see `specs/domain/collection-data-bind.md`.

---

## GET `/api/scenes/:id/tree`

Lightweight structural index. Session or service auth per above.

### Response `200`

```ts
type SceneTreeIndex = {
  sceneId: string
  updatedAt: string
  activePageId: string | null
  activeBreakpoint: SceneBreakpointId | null
  platformProjectId: string | null
  nodeCount: number
  masterCount: number
  pageCount: number
  nodes: Array<{
    id: string
    type: string
    name?: string
    parentId: string | null
    index: number
    instanceOf?: string
    instanceVariantId?: string
    hidden?: boolean
    locked?: boolean
    childCount: number
  }>
  masters: Array<{ id: string; name: string; sourceKey?: string; variantCount: number }>
  pages: Array<{ id: string; name: string }>
}
```

Walk order: depth-first, active page root when `pages` present else `scene.root`.

MUST NOT include `props`, `style`, `tokenBindings`, or `children` arrays.

### Errors

Same auth/not-found rules as `GET /api/scenes/:id`.

---

## GET `/api/scenes/:id/events`

Server-sent events stream for live scene synchronization across open editors.

### Auth

Same auth/not-found rules as `GET /api/scenes/:id`.

### Response `200`

- `Content-Type: text/event-stream`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`

Event payload:

```ts
type SceneUpdatedEvent = {
  type: 'scene-updated'
  sceneId: string
  updatedAt: string
  platformProjectId: string | null
  source: 'scene_ops' | 'scene_put'
}
```

Notes:

- Stream MUST emit periodic keepalive heartbeats so reverse proxies do not close idle connections.
- Stream payload MUST stay lightweight; clients fetch the full scene only when they choose to reconcile.
- Multiple open editors for the same Scene MAY consume the same event independently.

### Client behavior

- WENN `updatedAt === savedUpdatedAt`, DANN DARF der Client das Event ignorieren.
- WENN ein Save/Ops-Request **in flight** ist, DANN MUSS der Client `scene-updated` ignorieren (Echo der eigenen Persistenz — sonst False-Positive „Remote update available“).
- WENN der Editor keine lokalen ungespeicherten Änderungen hat, DANN MUSS er die Scene neu laden und den Canvas ersetzen.
- WENN der Editor lokale ungespeicherte Änderungen hat **und** kein Save in flight ist, DANN DARF er **nicht** still mergen; stattdessen MUSS er eine sichtbare „Remote update available“-Aufforderung zeigen.

### Error responses

Same auth/not-found rules as `GET /api/scenes/:id`.

---

## GET `/api/editor/palette`

Public insertable types for agent planners. Auth: session **or** service secret when Plexon auth on; open in dev.

### Response `200`

```ts
type EditorPaletteCatalog = {
  groups: Array<{
    id: 'layout' | 'forms' | 'feedback' | 'lists' | 'print' | 'site-kit'
    label: string
    types: Array<{
      type: string
      label: string
      isContainer: boolean
      siteKit: boolean
      defaultChildPolicy: 'token-enum-only' | 'fixture-arrays'
      /** Snapshot of `defaultChildForType(type).props` for agent planners. */
      seedProps?: Record<string, unknown>
      /** Short content-complete hint (labels, options, placeholders, …). */
      contentHint?: string
    }>
  }>
  wrapContainerTypes: string[] // WRAP_CONTAINER_TYPES
  topNTypes: string[]
}
```

Implementation MUST derive from the same sources as the editor palette (`site-kit-palette`, `EDITOR_PALETTE_GROUP_TYPES`) — no duplicate hand-maintained list. `seedProps` MUST come from `defaultChildForType`.

---

## MCP mapping (v2)

See `specs/domain/mcp-server.md` § Tool surface v2.

| MCP tool | HTTP |
|----------|------|
| `zaoly.scene_get` | `GET /api/scenes/:id` |
| `zaoly.scene_list` | `GET /api/scenes?platformProjectId=` |
| `zaoly.scene_tree_index` | `GET /api/scenes/:id/tree` |
| `zaoly.scene_apply_ops` | `POST /api/scenes/:id/ops` |
| `zaoly.scene_import_html` | `POST /api/scenes/:id/import-html` |
| `zaoly.scene_content_audit` | `POST /api/scenes/:id/content-audit` (or documented audit route) |
| `zaoly.scene_preview` | preview HTML / raster for agent QA |
| `zaoly.editor_palette` | `GET /api/editor/palette` |
| `zaoly.brand_tokens_get` | `GET /api/brand-tokens?platformProjectId=` |
| `zaoly.site_kit_composition_save` | `POST /api/site-kit/compositions` |

Editor live sync uses `GET /api/scenes/:id/events` (SSE) — **not** an MCP tool (process-local bus; single web replica preferred).

MCP MUST forward federation headers and `X-Actor-User-Id` on mutating calls. On HTTP errors, MCP MUST return the BFF JSON body (`reason`, `failedIndex`, `scene.updatedAt`, …) so agents can recover locks.

---

## EARS

- WENN `POST /api/scenes/:id/ops` mit gültigem Batch aufgerufen wird, DANN MUSS die persistierte Scene bitgenau dem sequentiellen `applySceneOp`-Ergebnis entsprechen.
- WENN Op *i* fehlschlägt, DANN DÜRFEN Ops *0..i-1* nicht gespeichert sein.
- WENN `baseUpdatedAt` fehlt, DANN MUSS der Server `400 missing-base-updated-at` antworten.
- WENN `GET /api/scenes/:id/tree` aufgerufen wird, DANN MUSS `nodeCount` der Anzahl Einträge in `nodes` entsprechen.
- WENN ein Service-Caller ohne `X-Actor-User-Id` mutiert, DANN MUSS der Server `401 actor-required` antworten.
- WENN die Scene an eine Collection gebunden ist und der Actor (Session oder Service) keinen Zugriff hat, DANN MUSS der Server `403 forbidden` antworten (fail closed; unreachable accessible-collections MUST NOT soft-allow).
- WENN `insert_child` nur `id`+`type` liefert, DANN MUSS der Server Palette-Defaults (`defaultChildForType`) mergen und Aufrufer-Props darüberlegen.
- WENN `insert_instance` `props` enthält, DANN MUSS der Server sie als `instanceOverrides.props` speichern.
- WENN `GET /api/editor/palette` geliefert wird, DANN SOLLEN Types mit bekannten Seeds `seedProps` und ggf. `contentHint` enthalten.

---

## Implementation notes

- Shared module: `apps/web/lib/scene/apply-scene-op-batch.ts` (new) wrapping `applySceneOp` + limits.
- Route: `apps/web/app/api/scenes/[id]/ops/route.ts`.
- Route: `apps/web/app/api/scenes/[id]/tree/route.ts`.
- Route: `apps/web/app/api/editor/palette/route.ts`.
- Audit log (P90.1): structured console + optional Postgres `scene_op_audit` — domain intent only in P90.0 spec.
- Tests: `apps/web/__tests__/scene-ops-api.test.ts`, extend `scenes-api-auth.test.ts`.
