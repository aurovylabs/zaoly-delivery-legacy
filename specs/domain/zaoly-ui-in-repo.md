# Zaoly UI in-repo (sever sibling msqdx-ui)

**Status:** Accepted · **Date:** 2026-10-10  
**Product:** Zaoly standalone  
**Knowledge:** `knowledge/zaoly-ui-in-repo.md`  
**Naming:** `specs/domain/zaoly-naming-purge.md`

## Decision

Zaoly MUST own its design-system packages **inside this monorepo**. The former sibling GitHub repo `aurovylabs/zaoly-delivery` and local path `../msqdx-ui` are **out of scope** for runtime, build, CI, and Docker.

| Package | Path | Role |
|---------|------|------|
| `@zaoly/ui` | `packages/ui` | Design system (vendored from former `@msqdx/ui`) |
| `@zaoly/ui-tokens` | `packages/ui-tokens` | Token package (vendored from former `@msqdx/ui-tokens`) |
| `@zaoly/site-kit` | `packages/site-kit` | Site compositions / Kit playground (unchanged role) |

App UI primitives MUST come from `@zaoly/ui` via `apps/web/lib/zaoly-ui*.ts` barrels. Direct deep imports into `packages/ui/src` from app components SHOULD go through barrels where the surface is shared.

## Must not

1. `file:../../../msqdx-ui/...` dependencies
2. Dockerfile `git clone` / `MSQDX_UI_REPO` / `MSQDX_UI_REF` checkout of the sibling
3. CI job that checks out `msqdx-ui` beside the workspace
4. Webpack/Vitest aliases that resolve outside the zaoly repo
5. Library Promote opening PRs against `aurovylabs/zaoly-delivery` — promote MUST write into `packages/ui` on `aurovylabs/zaoly-delivery`

## Acceptance

1. `npm ls -w web` shows `@zaoly/ui` / `@zaoly/ui-tokens` from `packages/*` only.
2. Grep of packaging configs finds no `msqdx-ui` path / `MSQDX_UI_REPO` clone.
3. Specs inventory + packaging tests pin the in-repo packages.
4. `npm test -w web` and `npm run build -w web` green without a sibling checkout.
