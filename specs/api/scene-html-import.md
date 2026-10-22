# API — Scene HTML import

**Status:** Shipped P1 — 2026-08-24  
**Domain:** `specs/domain/html-scene-import.md`  
**Auth:** Same as `POST /api/scenes/:id/ops` (session or service secret + actor)

## Route

`POST /api/scenes/:id/import-html`

## Request body

```ts
{
  baseUpdatedAt: string
  html: string
  pageName?: string
  pageId?: string
  mode?: 'replace-page-root'
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `baseUpdatedAt` | yes | Optimistic lock; `409 stale-scene` on mismatch |
| `html` | yes | Document or body fragment; server max length (recommend **≤ 200_000** chars) |
| `pageName` | no | If set, create page then import into it |
| `pageId` | no | Target page; default `activePageId` |
| `mode` | no | v1 only `replace-page-root` |

## Response `200`

```ts
{
  scene: CompositionScene
  pageId: string
  warnings: Array<{ code: string; message: string; detail?: string }>
  stats: {
    nodeCount: number
    htmlBytes: number
  }
}
```

## Errors

| Status | Code | When |
|--------|------|------|
| 400 | `html-empty` | Empty after sanitize |
| 400 | `html-too-large` | Over size cap |
| 400 | `html-unsafe` | Rejected payload (if v1 chooses hard-fail over strip) |
| 400 | `html-map-failed` | Converter could not build a tree |
| 400 | `page-not-found` | Unknown `pageId` |
| 401 | — | No session / service auth |
| 404 | — | Unknown scene |
| 409 | `stale-scene` | `baseUpdatedAt` mismatch |

## Service headers

Same as scene ops: `X-Actor-User-Id` / actor attribution when called from MCP.
