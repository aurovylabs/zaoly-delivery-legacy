# Observability — optional Sentry (W9)

**Status:** Accepted · **Date:** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Knowledge:** `knowledge/observability.md` · `knowledge/paths.md`  
**Related:** `specs/domain/observability-and-unbound-w4.md` · `apps/web/lib/observability/report-error.ts`

## Decision

Optional **Sentry** capture lives **only** inside `reportError`. Call sites stay on `reportError`. No app-wide SDK scatter. No required Coolify DSN — when unset, behavior matches W4 (console + optional webhook).

| Chosen | Not chosen |
|--------|------------|
| `@sentry/nextjs` capture inside `reportError` | Sprinkling `Sentry.capture*` across routes/components |
| Lazy init when DSN present | Always-on SDK / required DSN |
| Capture-only (init + `captureException`) | Full `withSentryConfig` wizard, source maps, Session Replay (later) |

## Env (via `paths.ts`)

| Env | Role |
|-----|------|
| `ZAOLY_SENTRY_DSN` | Server DSN (`paths.envSentryDsn`) |
| `NEXT_PUBLIC_ZAOLY_SENTRY_DSN` | Browser / error boundaries (`paths.envSentryDsnPublic`) |

Init environment name: `creation-v3`. Fail closed: `reportError` MUST never throw.

## Capture policy

- After console (+ optional webhook), if a DSN is present → lazy-init once → `captureException(err, { tags: { source }, extra: { digest? } })`.
- MUST NOT put scene payloads (or other large domain blobs) in Sentry extras by default. Do not forward `context.extra` wholesale.

## Non-goals (superseded by W10 where noted)

- Full wizard was deferred from W9 — see `specs/domain/observability-sentry-w10.md` for tunnel / sourcemaps / Replay.
- App-wide SDK scatter remains disallowed; capture stays inside `reportError`.
- Performance tracing productization beyond default SDK init remains optional/operator-driven.

## Acceptance

1. Specs inventory lists this doc; backlog marks W9 **done**.
2. Unit tests: DSN unset → no capture; DSN set → `captureException` invoked (mocked SDK).
3. Paths + observability knowledge document both DSN env keys.
