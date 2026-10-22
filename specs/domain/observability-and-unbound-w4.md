# Observability + unbound scenes — W4

**Status:** Accepted · **W4** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md`  
**Related:** `specs/domain/ci-and-error-boundary.md` · `specs/api/scenes.md` · `knowledge/observability.md`

## Goals

1. Central error reporting hook so App Router fallbacks (and future API paths) share one sink — vendor-ready without locking to Sentry yet.
2. Document how to alert on `/api/health`.
3. Fail-closed Collection ACL for unbound scenes when Plexon auth is configured.

## Error reporting

- App MUST expose `reportError(error, context)` in `apps/web/lib/observability/report-error.ts`.
- MUST always log structured `console.error` with `source` (+ optional `digest`).
- MAY POST a minimal JSON payload to `ZAOLY_ERROR_WEBHOOK_URL` (server) and/or `NEXT_PUBLIC_ZAOLY_ERROR_WEBHOOK_URL` (browser) when set — fire-and-forget; MUST NOT throw to callers.
- `app/error.tsx` and `app/global-error.tsx` MUST call `reportError` (not raw `console.error` only).
- Non-goal this wave: shipping a paid vendor SDK. **W9:** optional Sentry inside `reportError` (`specs/domain/observability-sentry-w9.md`) — still no app-wide SDK scatter.

## Health alerting

- `GET /api/health` remains public and secret-free.
- Operators SHOULD monitor `ok === true` (HTTP 200) — see `knowledge/observability.md`.
- Coolify app healthcheck SHOULD hit `/api/health`.

## Unbound scene ACL

- WENN `isPlexonAuthConfigured()` **true** und `platformProjectId` fehlt/leer, DANN MUSS Object-ACL mit `403` `{ "error": "forbidden", "reason": "unbound-scene" }` antworten.
- WENN Plexon-Auth **nicht** konfiguriert ist (lokaler Bypass), DANN DARF unbound weiter zugelassen werden (DX / Vitest ohne Federation).
- Hub-Liste (`GET /api/scenes` ohne Filter) bleibt Collection-scoped — unbound erscheinen dort nicht.
- Creating/updating a scene without a Collection while auth is configured MUST also fail closed via the same helper.

## Non-goals

- Full multi-tenant Org model.
- CRDT / conflict merge (W6).
- God-file refactors (W5).
