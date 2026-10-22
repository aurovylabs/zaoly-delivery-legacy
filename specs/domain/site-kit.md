# Site Kit (website framework)

**Status:** Accepted · **Atoms-first / React handoff** · **Date:** 2026-08-20  
**Product:** CREATION v3 · Package `@zaoly/site-kit`  
**Knowledge:** `knowledge/site-kit.md` · `knowledge/site-kit-atoms-first.md` · Coolify `knowledge/site-kit-storybook-coolify.md` · inbound pull draft `knowledge/site-kit-kit-pull.md` · **Collection tenancy** `knowledge/site-kit-collection-scope.md`  
**API:** `specs/api/site-kit-write.md` · Compositions: `specs/domain/site-kit-compositions.md` · Kit→CREATION pull draft: `specs/domain/site-kit-kit-pull.md` · **Collection scope:** `specs/domain/site-kit-collection-scope.md`  
**Backup (shells purged):** tag `site-kit-pre-shell-purge-2026-08-20` / branch `backup/site-kit-pre-shell-purge`  
**Older composite-sync:** tag `site-kit-composite-sync-backup-2026-08-20` / branch `backup/site-kit-composite-sync`

## Purpose

Provide a **developer-reusable React website kit** that designers build **visually in CREATION**. Storybook is the live catalog of the **same** React modules. Output is code-native: apps import from `@zaoly/site-kit` without rebuilding.

Separate from `@zaoly/ui` product chrome (AppShell, Chat, …). Site Kit = public website building blocks + **user-saved compositions**.

**Multi-tenant:** Collection (`platformProjectId`) is the isolation boundary for Patterns and Storybook Pattern browse — `specs/domain/site-kit-collection-scope.md` (waves SK-S1…S5). One Storybook host; not one Coolify app per Collection.

**Daily catalog:** in-app Kit Playground `/kit` (`specs/domain/site-kit-playground.md`) — ephemeral TSX + live preview without Coolify rebuild. Coolify Storybook remains for package CSF hydrate.

## Locked decisions

1. **React kit code is the developer SSOT** (`packages/site-kit`).
2. **CREATION is the visual write surface.** No GitHub Promote in the Site Kit loop.
3. **Storybook** co-located in Coolify project `Zaoly-Creation-v3` catalogs the same package.
4. **Palette = atoms + layout only** (`SiteText`, `SiteButton`, `SiteImage`, `SiteSvg`, `SiteStack`, `SiteTable`, …). No pre-baked Hero/Section inserts.
5. **Custom components** = named compositions saved from an editor selection (`site-kit-compositions.md`).
6. **Brandion** remains token SSOT (path-bind). Kit paint at save = resolved CSS; paths preserved on nodes.
7. WHERE a shell/composition has scene `children`, React MUST render children-first (no duplicate prop defaults).

## Requirements (EARS)

1. WHERE a Site Kit atom exists, a CSF story MUST exist under `packages/site-kit/src/**/*.stories.tsx`.
2. WHEN CREATION syncs an atom node, the system MUST write under kit root / overrides and MUST NOT open a GitHub PR.
3. WHERE the editor insert palette is shown, the system MUST list only Site Kit **atom + layout** ids (and Patterns for saved compositions) — MUST NOT list `@zaoly/ui` catalog layers. Atom + layout palette entries MUST remain available regardless of the active Collection / `platformProjectId` (project-scoped tokens and Patterns do not gate atoms).
4. WHEN the designer inserts a Site Kit palette item, the scene node `type` MUST equal the Site Kit id and MUST render via `@zaoly/site-kit`.
5. WHEN a selected node is a Site Kit atom/layout type, Inspect MUST expose props. Atom → Storybook sync is **Publish to Storybook** (top bar), not a per-node Inspect Write.
5a. WHEN Publish writes an atom Master with **≥2** named variants, the system MUST sync **all** named variant trees onto the atom override (`variants` + `defaultVariantId`) and MUST regenerate the atom CSF file as **one CSF story per named variant** plus Controls `variant` select. Coolify Site Kit Storybook MUST hydrate those CSF substories from live overrides at image build. MUST NOT keep seed demo stories (`Secondary` / `Ghost`) or a custom on-canvas dropdown as the switcher.
5b. WHEN the designer clicks **Publish to Storybook** in the editor top bar, the system MUST write overrides for every Scene Master whose root `type` is a Site Kit catalog atom (incl. named variants when ≥2) and MUST schedule **exactly one** Site Kit Storybook Coolify rebuild.
6. WHEN the designer saves a selection as a composition, the system MUST write a named React module + CSF story under `packages/site-kit/src/compositions/` (and live override JSON for static Storybook). Codegen/normalization MUST import `@zaoly/site-kit/composition-codegen` — no duplicated hand-maintained logic in `apps/web` or hydrate scripts.
6a. The atom catalog (`SITE_KIT_CATALOG`) MUST have a single source in `packages/site-kit/src/catalog.ts`; web re-exports and hydrate scripts MUST derive from it (incl. `SiteImage`).
7. WHEN Site Kit Storybook runs as a static Coolify image, it MUST fetch live overrides from CREATION (`GET /api/site-kit/overrides/:id`) without a user session.
8. WHERE Storybook fetches overrides cross-origin, `GET /api/site-kit/overrides/*` MUST be public; write/save remain session-gated.
9. WHEN `ZAOLY_DATABASE_URL` is set, override writes MUST treat Postgres as SSOT — failed Postgres writes MUST return `pg-unavailable` and MUST NOT report success based on disk alone. Reads MUST reconcile Postgres + disk by `updatedAt`.
10. WHEN Publish or Save-as-composition completes, the editor MUST surface `storybookRedeploy.status` (`queued` | `skipped` | `failed`) and partial publish `failures[]` when present.
11. Storybook live preview MUST reset override state when `componentId` changes, MUST NOT render a previous component when the new fetch is not-found, and MUST mark transient poll failures as stale when a prior tree was loaded.

## Non-goals

- Replacing `@zaoly/ui` product primitives.
- Auto-seeding nested Hero/Section trees from the palette (the `/editor` `createDemoScene` landing is a **demo scene only**, not a palette shell insert).
- Flattening composites into prop bags as Storybook truth.
- Mixing Site Kit into `ds.projects-a.plygrnd.tech`.
- CREATION-owned token store.
- Bidirectional live sync from Storybook Controls into scene Masters (use explicit Pull — `site-kit-kit-pull.md`).
- One Coolify Storybook deployment per Collection as the default (use Collection ACL on one host — `site-kit-collection-scope.md`).
