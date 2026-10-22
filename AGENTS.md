# AGENTS.md — Zaoly

1. Specs under `specs/domain` before behavior changes when you add features.
2. UI from `@zaoly/ui` via `apps/web/lib/zaoly-ui*.ts` — no MUI.
3. Routes/env via `apps/web/lib/paths.ts` and `runtime-config.ts`.
4. Default origin is localhost; set `NEXT_PUBLIC_ZAOLY_URL` / `AUTH_URL` for your deploy.
5. Prefer product behavior in `specs/` over ad-hoc docs.
