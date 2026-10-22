# Observability — Sentry v11 `dataCollection` hardening

**Status:** Accepted · **Date:** 2026-10-10  
**Related:** `specs/domain/observability-sentry-w9.md` · `specs/domain/observability-sentry-w10.md`  
**Knowledge:** `knowledge/observability.md` · **Impl:** `apps/web/lib/observability/report-error.ts`

## Decision

`@sentry/nextjs` **v11** collects rich PII by default when `dataCollection` is unset (replaces restrictive `sendDefaultPii` defaults from v10). Zaoly MUST opt into a **privacy-restrictive** profile on every `Sentry.init` from `reportError`:

| Category | Value |
|----------|--------|
| `userInfo` | `false` |
| `cookies` | `false` |
| `httpHeaders` | request/response with deny substrings for forwarded / IP / via / user |
| `httpBodies` | `[]` (none) |
| `urlQueryParams` | deny substrings for forwarded / IP / via / user |
| `genAI` | inputs + outputs `false` |
| `databaseQueryData` | `false` |
| `graphQL` | document + variables `false` |

Call sites stay on `reportError`. Scene payloads remain out of Sentry extras (W9).

## Acceptance

1. Specs inventory lists this doc; `knowledge/observability.md` documents the profile.
2. `reportError` unit tests assert `init` receives the restrictive `dataCollection` object when a DSN is set.
3. Replay / tunnel / `withSentryConfig` rules from W10 are unchanged.
