# API — Composition magazine PDF

**Status:** Accepted (P79) · Amended **P80a** 2026-08-14 · **P83/P84** 2026-08-15 · **Auth** 2026-08-22  
**Domain:** `specs/domain/composition-magazine-pdf.md`  
**Path helper:** `paths.routes.apiScenePdf(id)` → `/api/scenes/:id/pdf`

## Auth

Same session gate as `specs/api/scenes.md`. WENN Plexon-Auth konfiguriert ist, DANN `POST` ohne Session → `401` `{ "error": "unauthorized" }`.

## `POST /api/scenes/:id/pdf`

Renders the submitted scene as Magazin-PDF (`@zaoly/ui/mag`).

### Request

```json
{ "scene": { /* CompositionScene; id MUST equal :id */ } }
```

- Content-Type: `application/json`
- Body must include `scene` as a `CompositionScene`
- `scene.id` MUST equal path `:id` (else 400)
- Optional `scene.platformProjectId` — when present, server resolves Brandion active-pack (same BFF contract as `GET /api/brand-tokens`) and maps colors into `MagThemeProvider`

### Responses

| Status | Body |
|--------|------|
| 200 | `application/pdf` bytes; `Content-Disposition: attachment; filename="{safeName}.pdf"` |
| 400 | `{ "error": string }` invalid/missing body or id mismatch |
| 401 | `{ "error": "unauthorized" }` no session (auth configured) |
| 422 | `{ "error": string }` no printable Mag pages |
| 500 | `{ "error": string }` render failure (message only) |

`safeName` is derived from `scene.name` (filesystem-safe) or falls back to `scene.id`.

### Notes

- Does **not** load the stored scene — client supplies the current tree (supports unsaved edits).
- `scene.activeBreakpoint` drives OP-9 cascade materialization before Mag flatten (same view as the editor canvas).
- Brandion pack is passed into render for P84 instance tokenBindings (print-channel paint) in addition to document Mag theme colors.
- Server registers Mag fonts and pins `@react-pdf/renderer` to the app install (single Font store).
- Live Brandion pack → Mag theme overrides; fixture/no guideline → DS `magColors`.
- MagPage logo is always enabled on Creation export (app-injected SVG; see domain spec).
