# API — Magazine templates

**Status:** Accepted · **Date:** 2026-08-15  
**Domain:** `specs/domain/magazine-template.md`  
**Path helpers:** `paths.routes.apiMagazineTemplates` · `apiMagazineTemplate` · `apiMagazineTemplatePublish` · `apiMagazineTemplateVersion`  
**Knowledge:** `knowledge/magazine-template-publish.md`

Auth: Session required for mutating methods (`POST` draft / publish) via `requireApiSession`. `GET` list/detail remain readable for consumers (Wave 4 may tighten). Contract shapes: `@zaoly/contracts`.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/magazine-templates` | Query: `platformProjectId` (required for filtered list), `role` (optional), `status` (`published` default; `draft` \| `all` for authors) |
| POST | `/api/magazine-templates` | Create draft from scene. Body: `{ sceneId?: string, scene?: CompositionScene, role: string, name?: string, platformProjectId?: string }` |
| GET | `/api/magazine-templates/:templateId` | Latest draft or highest published version meta + body |
| POST | `/api/magazine-templates/:templateId/publish` | Validate + publish next immutable version. Optional body `{ scene?: CompositionScene }` to refresh snapshot from in-memory scene before publish |
| GET | `/api/magazine-templates/:templateId/versions/:version` | Immutable published version (404 if missing / draft-only) |

## List response

```json
{ "templates": [ /* MagazineTemplateSummary[] */ ] }
```

Summaries omit full `sceneSnapshot` (include `slotSchema` length / keys). Full get/version include `sceneSnapshot`.

## Publish responses

| Status | Body |
|--------|------|
| 200 | `{ "template": MagazineTemplate }` |
| 400 | `{ "error": string, "issues"?: ValidationIssue[] }` |
| 404 | `{ "error": "Not found" }` |

## Compat

`compatVersion` constant: `2026-08-magazine-template-v1` (`paths.magazineTemplateCompatVersion`).
