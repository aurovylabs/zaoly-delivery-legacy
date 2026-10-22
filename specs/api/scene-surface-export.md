# API — Scene surface export

**Status:** Accepted · **Date:** 2026-09-17  
**Domain:** `specs/domain/scene-surface-export.md`  
**Path helper:** `paths.routes.apiSceneExport(id)` → `/api/scenes/:id/export`

## Auth

Same session / scene access gate as `POST /api/scenes/:id/pdf`.

## `POST /api/scenes/:id/export`

### Request

```json
{
  "scene": { /* CompositionScene; id MUST equal :id */ },
  "format": "png" | "pdf",
  "scope": "active" | "all",
  "pageIds": ["optional", "overrides", "scope"],
  "breakpoint": "mobile" | "tablet" | "desktop" | "print",
  "scale": 2
}
```

- `format` required.
- `scope` default `active` when `pageIds` omitted.
- `scale` PNG only; default `2`; clamped 1–3.

### Responses

| Status | Body |
|--------|------|
| 200 | Binary `image/png` or `application/pdf`; `Content-Disposition: attachment` |
| 400 | `{ "error": string }` invalid body / id mismatch / bad format |
| 401 | `{ "error": "unauthorized" }` |
| 422 | `{ "error": string }` no pages / `png_requires_single_page` |
| 500 | `{ "error": string }` Playwright / render failure |

### Notes

- Does **not** load stored scene — client supplies current tree.
- Magazin PDF remains `POST /api/scenes/:id/pdf`.
