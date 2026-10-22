# API — Storyblok push (PoC)

**Status:** Accepted · **Date:** 2026-09-14  
**Domain:** `specs/domain/storyblok-handoff.md`  
**Route:** `GET|POST /api/storyblok/push` (`paths.routes.apiStoryblokPush`)

## Auth

- `GET` — **public** configured probe (no secrets).
- `POST` — same as scene write APIs: `requireSceneApiAccess` (session or federation service).

## `GET` — configured?

```ts
{ configured: boolean }
```

Used by Export to hide Send to Storyblok when handoff is off / env unset (no pack dump on hosted).

Zaoly default: `configured: false` unless `ZAOLY_STORYBLOK_HANDOFF=1` **and** Space credentials are set.

## Env (server only — Coolify / `.env.local`)

| Key | Purpose |
|-----|---------|
| `ZAOLY_STORYBLOK_HANDOFF` | Opt-in (`1`/`true`) — default **off** for Zaoly product |
| `STORYBLOK_SPACE_ID` | Target Space |
| `STORYBLOK_MANAGEMENT_TOKEN` | Personal access token (Management API) |

MUST NOT expose tokens to the browser. Preview/CDN token is not sufficient.

## Body

```json
{ "pack": { "meta": {}, "story": {}, "components": [], "stories": [] }, "publish": false }
```

`pack` MUST include `story` + non-empty `components` (Shape from `buildStoryblokHandoffPack`). Optional `stories[]` for multi-page.

## Responses

| Status | Meaning |
|--------|---------|
| 200 | `{ ok: true, storyId, storySlug, storyAction, appUrl, componentsCreated, componentsUpdated, … }` |
| 400 | invalid pack |
| 401/503 | auth |
| 503 | `storyblok_not_configured` (+ `missing` keys) |
| 502 | Management API failure |

## UI

Export dialog **Send to Storyblok** (`export-copy-storyblok-btn`) is shown only when `GET` reports `configured: true`. Then it POSTs the current pack, copies JSON + opens/shows `appUrl`.
