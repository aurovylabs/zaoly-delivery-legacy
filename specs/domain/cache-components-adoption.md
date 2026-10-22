# Cache Components adoption — Zaoly

**Status:** Accepted · staged · 2026-10-10  
**Product:** Zaoly standalone · **Next:** 16.4+  
**Knowledge:** `knowledge/cache-components-adoption.md`

## Goal

Adopt Next.js Cache Components (`cacheComponents` + `partialPrefetching`) so public, hub, editor, and admin navigations can ship instant shells. Request-bound work streams under `<Suspense>`; `instant = false` is only for documented temporary escapes.

## Rules

1. [`apps/web/next.config.ts`](../../apps/web/next.config.ts) MUST set `cacheComponents: true` and `partialPrefetching: true`.
2. App Router pages, layouts, **and route handlers** MUST NOT export `dynamic`, `revalidate`, `fetchCache`, or `runtime` segment configs under `cacheComponents` (Next 16.4 rejects them at build). Request-time work uses Suspense / `connection()` / uncached IO instead. Node APIs remain available without `runtime = 'nodejs'`.
3. Routes not yet converted MUST export `export const instant = false` (TODO comment allowed). Highest explicit `instant` wins for the subtree.
4. **Public instant (Wave B):** `/` and `/faq` MUST NOT set `instant = false`. Locale cookie reads MUST NOT block the entire HTML shell — isolate via Suspense (or default locale in shell + client hydrate).
5. **Hubs instant (Wave C):** `/library`, `/compositions`, `/kit` MUST NOT set `instant = false`. Session + project/scene loads MUST stream under `<Suspense>`; per-user lists MUST NOT use `'use cache'`.
6. **Projects / settings / auth instant (Wave D):** `/projects`, `/projects/[id]`, `/settings`, `/settings/users`, `/login`, `/register`, `/forgot-password`, `/reset-password` MUST NOT set `instant = false`. Auth/session/DB/`searchParams`/`redirect` work MUST stream under `<Suspense>` (or stay sync env-only for static auth shells).
7. **Tokens / invite / share / preview instant (Wave E):** `/tokens`, `/invite/[token]`, `/share/p/[token]`, `/preview/storyblok/**` MUST NOT set `instant = false`. `AppShell` / `useSearchParams` / params / Storyblok fetch MUST stream under `<Suspense>`. Invite token SHOULD be passed from the server page (avoid client `useParams` as the sole source).
8. **Editor / admin instant (Wave F):** `/editor` and `/admin/**` MUST NOT set `instant = false`. Staff gate (`requireAdminUser` + redirects), editor `auth` / `searchParams` / scene boot, and `AppShell` / `AdminOpsShell` MUST stream under `<Suspense>`. `AdminOpsShell` MUST expose a sync wrapper with Suspense around the async cookie/session gate so page Instant validation does not treat `/admin/users` (etc.) as blocking.
9. API route handlers MUST NOT export `runtime` / `dynamic` under `cacheComponents` (Next 16.4 rejects them at build). Node APIs remain available without the export.
10. After Wave F, no App Router page/layout SHOULD keep `instant = false` except intentional temporary escapes documented in knowledge.

## Related

- Landing: `zaoly-landingpage-concept.md`
- Hubs: `library-hub.md`, `compositions-hub.md`, `editor-workspace.md`
- Paths: `knowledge/paths.md`
