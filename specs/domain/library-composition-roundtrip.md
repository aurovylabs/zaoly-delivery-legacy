# Library ↔ Composition round-trip (CREATION consumer)

**Status:** Accepted · **Date:** 2026-08-17  
**Canonical spec:** sibling `zaoly/specs/domain/library-composition-roundtrip.md`  
**API:** `specs/api/library-promote.md`  
**Knowledge:** `knowledge/library-composition-roundtrip.md`

CREATION owns **composition** (scenes, MagazineTemplate snapshots, Brandion binds). It does **not** own the primitive catalog. Catalog SSOT is `zaoly-ui` git; Storybook is the published view (`URL_Zaoly_UI_STORYBOOK`).

## Requirements inherited

This consumer MUST follow the canonical EARS in the zaoly-ui spec (palette ⊆ catalog, Promote = PR in Phase 4, pin `ZAOLY_UI_SOURCE`, reject Collection branding in library writes, WC compile in zaoly-ui, auto fan-out Phase 6, catalog-driven palette Phase 7, extend primitive Phase 8).

## CREATION-specific (Phases 1–8)

- Live **Download PDF** remains scene → Mag adapter (`specs/domain/composition-magazine-pdf.md`).
- **Publish template** remains composition consume for Plexon (`specs/domain/magazine-template.md`). Published templates MUST record `zaolyUiSource`.
- Settings + `GET /api/health` MUST show resolved `zaolyUiSource` and `libraryPromote.githubConfigured` (boolean only, never the token).
- Editor topbar MUST NOT expose Promote P1/P2 chrome (removed as leftover). Promote remains via `POST /api/library/promote` (API + client helpers) for tooling / future UI.
- `POST /api/library/promote/dry-run` MUST validate P1/P2/P3/P4 without writing git.
- `POST /api/library/promote` MUST open or update a PR on `aurovylabs/zaoly-delivery` for P1/P2/P4 when `GITHUB_TOKEN` is set; otherwise `github-unconfigured`. P3 stays `dev-track`. P4 MUST NOT drop inspect chrome fields (`genericCatalogInspectProps`: fill, type, radius, padding, size, stroke, alignment, and token bindings mapped via `PROMOTE_TOKEN_PATH_TO_CSS_VAR`, including `color.status.pipeline.*` → `--status-*`). Unpatchable sources or unmapped token paths → `extend-unrepresentable`.
- Palette MUST be generated from `@zaoly/ui` `insertableCatalogEntries()` (grouped by catalog layer). Mag print-twin entries insert the Print export. Docs entries MUST NOT appear.
- Scene renderer MUST keep the existing Print/slot switch and MUST use `catalogComponent(type)` for other catalog ids (import from `paths.zaolyUiCatalogModule` / `@zaoly/ui/catalog-registry`, not the server `@zaoly/ui` barrel). Types without a full component contract still expose `genericCatalogInspectProps` (fill, type, radius, padding, size, stroke, alignment). Do not invent a ChatBlockPanel contract. Unknown CSS is rejected. Live canvas paint for that chrome MUST use inheritable CSS custom properties (`--creation-catalog-fill`) onto inner `.ds-panel` / `__surface` — not `background-color: inherit` through an intermediate host. Promote P4 MUST lift the same chrome into the library primitive (CSS `var(--*)`, inner `Panel` style when present) so Storybook Promoted stories paint.
- Pin-bump PRs from zaoly-ui MUST be merged by a human before CREATION staging tracks a new SHA. CREATION MUST NOT write Storybook or Coolify.

## Out of scope here

WC compile lives in zaoly-ui (`specs/domain/wc-compile.md`). CREATION MUST NOT emit a parallel WC catalog.
