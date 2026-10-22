# Save page as Site Kit Pattern

**Status:** Accepted · **Date:** 2026-09-12  
**Product:** CREATION v3  
**Parent:** `specs/domain/site-kit-compositions.md` · `specs/domain/scene-pages.md`  
**Knowledge:** `knowledge/page-as-pattern.md` · Paths: `knowledge/paths.md`  
**API:** `POST /api/site-kit/compositions/from-page`  
**MCP:** `zaoly.site_kit_page_save` (`mcp-server.md` § v2)

## Purpose

Let designers save an **entire scene page** (artboard root) as a Collection **Site Kit Pattern** in one step — without the manual Create Master → Inspect Save dance. Durable SSOT only (no ZIP/download handoff).

## Locked decisions

1. Persistence = Site Kit composition override + CSF hydrate (same write path as Save as Site Kit).
2. System MUST **ensure** a custom Master + Instance for the page root when the root is not already an Instance of an unsynced/bound Pattern Master (`create_master` forbids page root — page path uses an explicit ensure helper).
3. Collection bind required (`platformProjectId`); otherwise `missing-platform-project-id`.
4. Default = **active page**; `allPages: true` saves each page as its own Pattern (name from page title → PascalCase).
5. Code export handoff stays separate: Copy-only multi-format; **no Download**.
6. Editor chrome layout aliases (`Stack`/`Grid`/…) MUST be coerced to Site Kit types (`SiteStack`/`SiteGrid`/…) on the Master tree before validate/write.

## Requirements (EARS)

1. WHEN the designer invokes **Save page as Pattern** with a bound Collection, the system MUST ensure Master+Instance for that page root, validate/expand, write the composition override, and return `exportName` + `masterId` + updated scene for `bind_master_composition`.
2. WHEN `allPages` is true, the system MUST save each page in `pages[]` order as a separate Pattern and MUST apply unique PascalCase names (suffix on collision).
3. WHEN `platformProjectId` is missing, the system MUST reject with `missing-platform-project-id`.
4. WHERE the page root is already an Instance of a custom Master, the system MUST reuse that Master (re-save / bind) rather than nesting another Master.
5. The write MUST reuse `saveSiteKitComposition` / validate/expand helpers — MUST NOT invent a second SSOT store.
6. WHEN the page/Master tree contains editor layout aliases (`Stack`, `Grid`, …) — including after nested Instance expand — the system MUST coerce them to Site Kit catalog types before validation.
7. WHEN save succeeds, the system MUST persist the bound scene (`upsertScene`) and return `updatedAt` (same as `scene.updatedAt`) so MCP/service callers do not depend on a browser autosave. Publish `scene-updated` after persist.
8. MCP tool `zaoly.site_kit_page_save` MUST proxy this route and MUST include `bind_master_composition` in the curated `SCENE_OP_NAMES` allowlist for follow-up polish.
9. WHEN Web **Save page as Pattern** (or **Save all pages**) succeeds, the editor MUST open Kit Playground for the primary returned `componentId` via `kitPlaygroundHref({ componentId, platformProjectId })` in a **new tab** (`noopener`) so Design can hand off without leaving the canvas — toast MAY still echo the href. MCP/API callers MUST NOT be forced to open a browser.

## Non-goals

- ZIP / file download bundles.
- Multi-breakpoint matrix in Pattern payload.
- Playground TSX writeback.
- Replacing Inspect **Save as Site Kit** for Master subtrees.
