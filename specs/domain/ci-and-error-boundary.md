# CI and error boundary — CREATION v3

**Status:** Accepted · **W1** 2026-09-12  
**Knowledge:** `knowledge/enterprise-hardening-backlog.md` · `knowledge/staging-coolify.md`

## Goals

1. Gate merges with automated Vitest + TypeScript check before Coolify deploy.
2. Uncaught render errors MUST show a recoverable UI fallback (not a blank crash).

## CI

- Repo MUST provide `.github/workflows/ci.yml`.
- On `push` and `pull_request` to `main` (and PR branches), CI MUST:
  1. Check out this repo.
  2. Check out `aurovylabs/zaoly-delivery` at the `ZAOLY_UI_SOURCE` pinned in root `Dockerfile` as a sibling `zaoly/` (same layout as local `file:` deps / Docker DS stage).
  3. `npm ci` at repo root.
  4. `npm test` (web + site-kit + mcp-server).
  5. `npm run typecheck -w web` (app/source; Vitest files are excluded from `tsc` — same surface Coolify `next build` typechecks).
  6. `npm run test:google-fonts-sync` (or `check:google-fonts`).
- CI MUST NOT require a full `next build` in W1 (Coolify remains the deploy image build / typecheck gate for production images).

## Error boundary

- App Router MUST ship `apps/web/app/error.tsx` (segment errors) with:
  - Client component, `reset()` retry control.
  - Localized title/body (`common.error*` keys, en+de).
  - `data-testid="creation-error-boundary"`.
  - `console.error` of the error (W4 may replace with vendor reporting).
- App MUST ship `apps/web/app/global-error.tsx` for root-layout failures (minimal shell; no AppProviders dependency).

## Non-goals (this wave)

- Sentry/Datadog vendor wiring.
- Running `next build` on every PR.
- Horizontal Coolify replicas.
