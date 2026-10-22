# API — VIDEON media BFF (CREATION)

**Status:** Accepted · 2026-09-25 · **Phase:** P0  
**Domain:** `specs/domain/videon-asset-consume.md`  
**Upstream:** `videon-v3/specs/api/media-list.md` · `videon-v3/specs/api/media-frame.md`  
**Paths:** `knowledge/paths.md` · `apps/web/lib/paths.ts`

## Auth

| Route | Auth |
|-------|------|
| `GET /api/videon-media` | Session **or** service secret + `X-Actor-User-Id` (middleware machine path); Collection access for `platformProjectId` |
| `GET /api/videon-media/:mediaAssetId/frame` | Same |

Upstream to VIDEON: `X-Service-Secret` + `X-Federation-Contract-Version` + `X-Actor-User-Id` (actor). Env: `VIDEON_API_URL` (prefer) / `NEXT_PUBLIC_VIDEON_URL` fallback; `ZAOLY_SERVICE_SECRET`.

## List

`GET /api/videon-media?platformProjectId={uuid}`

**200**

```json
{
  "source": "videon",
  "platformProjectId": "…",
  "items": [
    {
      "id": "…",
      "originalFilename": "hero.mp4",
      "mimeType": "video/mp4",
      "lifecycleState": "ready",
      "durationMs": 12000,
      "sceneCount": 4,
      "frameUrl": "/api/videon-media/…/frame?platformProjectId=…&t=1000&w=240"
    }
  ]
}
```

- Proxies `GET {VIDEON}/api/media?platformProjectId=` (project scope only).
- WHEN `VIDEON_API_URL` unset → **503** `{ "error": "videon_unconfigured" }`.
- WHEN Collection access denied → **403**.
- WHEN upstream 404/empty workspace → **200** with `items: []` (or propagate 404 when VIDEON says not_found).

## Frame

`GET /api/videon-media/:mediaAssetId/frame?platformProjectId=&t=&w=`

- Proxies VIDEON `GET /api/media/:id/frame` (JPEG).
- Default `t=1000`, `w=480` (thumb list MAY use `w=240`).
- Response: `image/jpeg` + `Cache-Control: private, max-age=300`.
- Fail closed on auth / Model B / missing config.

## Errors

| Code | When |
|------|------|
| 401 | No session |
| 403 | Collection access denied |
| 400 | Missing `platformProjectId` / `mediaAssetId` |
| 502 | Upstream VIDEON failure |
| 503 | `VIDEON_API_URL` / secret missing |

## Testing

- Unit: URL builders + empty list when unconfigured  
- Contract: list requires Collection ACL; frame proxies content-type  
- Spec inventory includes this file  
- Client modules MUST NOT embed `ZAOLY_SERVICE_SECRET`
