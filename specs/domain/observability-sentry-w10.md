# Observability — Sentry productization (W10)

**Status:** Accepted · **Date:** 2026-09-12  
**Backlog:** `knowledge/enterprise-hardening-backlog.md` · **Knowledge:** `knowledge/observability.md` · `knowledge/paths.md`  
**Related:** `specs/domain/observability-sentry-w9.md` · `apps/web/lib/observability/report-error.ts` · `apps/web/next.config.ts`

## Decision

Extend optional Sentry **behind env** without requiring Coolify DSN or build tokens:

| Feature | When |
|---------|------|
| Capture in `reportError` | DSN set (W9) |
| Browser **tunnel** | Client init uses `paths.sentryTunnelPath`; middleware treats tunnel as public |
| `withSentryConfig` | Any DSN or `SENTRY_AUTH_TOKEN` present at build |
| Source map upload | `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` |
| Session Replay | Browser DSN **and** `NEXT_PUBLIC_ZAOLY_SENTRY_REPLAY` truthy — **error-only** (`replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1`), masked text/inputs |

Call sites stay on `reportError`. No app-wide `Sentry.capture*` scatter. Horizontal scale remains out of scope.

## Env (via `paths.ts`)

| Env | Role |
|-----|------|
| `ZAOLY_SENTRY_DSN` / `NEXT_PUBLIC_ZAOLY_SENTRY_DSN` | Runtime DSN (W9) |
| `NEXT_PUBLIC_ZAOLY_SENTRY_REPLAY` | Opt-in error-only Session Replay (W10) |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Build-time source maps (W10; never commit token) |
| Tunnel path | `paths.sentryTunnelPath` = `/monitoring/sentry-tunnel` |

## Acceptance

1. Specs inventory lists this doc; backlog marks W10 **done**.
2. Without Sentry envs, `next.config` stays unwrapped (default export = plain Next config).
3. Tunnel path is public in middleware.
4. `reportError` tests remain green; replay init only when replay env + DSN (unit coverage via init options mock).
