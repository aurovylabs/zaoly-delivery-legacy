# Site Kit compositions (Save as component)

**Status:** Accepted · **Date:** 2026-08-20 · **Tenancy:** see `specs/domain/site-kit-collection-scope.md` (SK-S1…S5)  
**Parent:** `specs/domain/site-kit.md`  
**API:** `specs/api/site-kit-write.md`  
**Knowledge:** `knowledge/site-kit-atoms-first.md` · `knowledge/site-kit-collection-scope.md`

## Purpose

Let designers build arbitrary trees from Site Kit atoms in CREATION and **save** them as named React exports that Storybook and apps consume unchanged.

## Model

| Concept | Definition |
|---------|------------|
| Atom / layout | Palette insertable (`SiteText`, `SiteButton`, `SiteImage`, `SiteStack`, …) — **always global** |
| Composition / Pattern | Named React function component under `packages/site-kit/src/compositions/{Name}.tsx`, **Collection-scoped** via `platformProjectId` on the override body |
| Story | CSF under `packages/site-kit/src/compositions/{Name}.stories.tsx` title `Compositions/{Shared\|scope}/{Name}` |

## Collection scope

- Override / catalog entry MUST carry optional `platformProjectId: string | null`.
- WHEN saving from a scene (from-scene / editor Save as Site Kit), the system MUST stamp `scene.platformProjectId`. WENN that id is missing, DANN MUST save reject with `missing-platform-project-id` (bind Collection first).
- **v1:** Export names remain **globally unique** (`Composition{Name}` PK) — no per-collection duplicate names.
- **Target (SK-S2 — shipped):** Primary key is `(platformProjectId, exportName)`; override id `Composition~{scopeKey}~{ExportName}` (`compositionScopeKey`); same `Hero` allowed in two Collections. Legacy `Composition{Name}` still resolves when scope matches.
- **Dev import (SK-S5 — shipped):** `@zaoly/site-kit/c/{scopeKey}/{ExportName}` (+ Collection barrel). Helpers: `compositionPackageImportPath`.
- Legacy overrides without `platformProjectId` (`null`) are **unscoped**: they MUST NOT appear in a Collection-filtered palette/library. Unbound editor shows only unscoped Patterns. Hydrate/admin list without filter returns all — **SK-S1 MUST eliminate unauthenticated unfiltered dumps**.

## Filter rules (GET catalog)

| Caller | Query | Result |
|--------|-------|--------|
| Hydrate / ops (authenticated admin) | (none) | all compositions — **not** a public Storybook path after SK-S1 |
| Editor / Library with Collection | `?platformProjectId=<id>` | exact match only (caller MUST be allowed that Collection — SK-S1) |
| Unbound editor | `?unscoped=1` | `platformProjectId == null` only |

**SK-S1:** Public / Storybook callers MUST NOT receive cross-Collection rows. Missing scope MUST NOT mean “return everything”.

## Naming

- Stored export name: PascalCase, `/^[A-Z][A-Za-z0-9]*$/`, max 48 chars.
- WHEN the designer enters a freeform label (`test`, `my hero`, `3col`), the system MUST normalize to PascalCase (`Test`, `MyHero`, `Col3`) before validate/write. Leading digits MUST move to the suffix so the React export starts with a letter.
- Reject reserved names that collide with atom export names (`Button`, `Text`, …) — use distinct composition names (`MarketingHero`, `FooterBar`).
- File path MUST stay under `src/compositions/` (no path escape).
- **Named variant story exports** MUST normalize to `/^[A-Za-z_$][A-Za-z0-9_$]*$/` (leading digits move to suffix, e.g. `3-up` → `Up3`). Duplicate normalized names and invalid exports MUST reject.
- **Tree validation** MUST recurse `props`, `style`, and `children`; reject unknown/dangerous prop keys (`dangerouslySetInnerHTML`, paint keys in `props`), invalid prop value shapes (plain objects), `Instance` nodes, unknown types, depth **> 64**, and node count **> 500**.
- **Codegen** MUST be shared between the Next write path and Docker hydration (`@zaoly/site-kit/composition-codegen`). Generated TSX MUST escape `{`/`}` in text and emit valid JSX expressions for array/object props.
- **Catalog** MUST have a single source (`packages/site-kit/src/catalog.ts`); web and hydrate scripts derive atom lists from it — no hand-maintained duplicates.

## Save behavior

WHEN the designer invokes **Save as Site Kit component** on a selection:

Inspect MUST show the Save panel only when the selection belongs to an **unsynced scene Master** (Create Master, no `sourceKey` or not yet `Composition:{Name}`): Master-Edit on that Master, or the persisted **Instance root** on the page. MUST NOT show for free layout/pattern nodes on the page tree, palette atom Instances (`sourceKey` = `SiteText`, …), or Masters already bound to Storybook. Workflow: **Create Master** → edit → **Save as Site Kit component**. Atoms sync via **Publish**.

1. Resolve the selected subtree (single root; if multi-select, reject).
2. Root MUST be a Site Kit type OR a layout container whose descendants are Site Kit / layout only. Nested scene **Instance** refs (palette atoms inside custom Masters) MUST be expanded to Site Kit atoms before validate/write. Unresolved Instances (missing master, circular master refs) MUST reject with explicit error codes.
3. Save MUST target the full Master root or persisted Instance root — partial child selections MUST NOT save a subtree.
4. Serialize tree for the **active editor breakpoint** (cascade overrides into base props/tokens, then paint with the **live Brandion token catalog**):
   - `props` = component-contract fields only (variant, children, role, href, direction, wrap, columns, …).
   - `style` = full resolved CSS for every Inspect surface field (spacing, typography, color, align, gap enums→CSS, grid columns→`gridTemplateColumns`, …).
   - `tokenBindings` = Brandion paths preserved for round-trip (not required for Storybook paint).
5. Generate React TSX (children-first) + Default CSF story.
6. Write disk files when kit root is writable; ALWAYS write durable override `Composition{Name}` for live Storybook.
7. Register in compositions catalog (disk index or scan).
8. Request **one** Coolify Storybook force rebuild (same as **Publish to Storybook**). Build hydrates `src/compositions/{Name}.tsx` + `.stories.tsx` from overrides (`scripts/hydrate-composition-stories.mjs`).
9. **Master named variants / Component Sets:** WHEN the save is tied to a Master with ≥2 named variants (Instance of Master or Master-Edit), MUST include `variants` + `defaultVariantId` on the override and MUST generate one CSF story per variant name (disk + hydrate). WHEN the Master has Phase-3 `axes`, MUST also persist `axes` + per-cell `combination` and MUST expose Storybook axis controls (not only a flat Variant list). Duplicate variant story names MUST reject. Live/Catalog MUST let the designer pick the cell (axes or flat name). Cross: `composition-masters.md`.
10. **Post-save binding:** WHEN save succeeds, the scene Master MUST receive `sourceKey = Composition:{exportName}` (scene op `bind_master_composition`) so Inspect hides the Save panel and accidental re-save is prevented. Scene persists via normal editor history/autosave.

### Save page as Pattern

WHERE a Collection is bound, the designer MAY save the **active page root** (or all pages) as a Pattern without manual Create Master first — see `specs/domain/page-as-pattern.md` · `POST /api/site-kit/compositions/from-page`. The system MUST ensure Master + Instance for the page root, then reuse the same validate/expand/write pipeline as from-scene.

Non-goals on save: `hidden`/`locked`, multi-breakpoint matrix in the kit payload, multi-select, mapping Master variants onto atom `props.variant`.

## Round-trip

- Editor may re-open a composition by loading its serialized tree into the scene (future).
- Storybook prefers `composition` override payload via `CompositionPreview`; falls back to compiled story module after rebuild.
- Coolify static Storybook MUST ship baked `Compositions/Live` and `Compositions/Catalog` stories for instant preview.
- **SK-S3:** Pattern CSF MUST NOT be world-browsable across Collections. Default Coolify image bakes **zero** Pattern CSF unless `STORYBOOK_PLATFORM_PROJECT_ID` is set. Catalog/Live require `zaolyViewToken` (`site-kit-collection-scope.md`).
- Catalog polls `GET /api/site-kit/compositions` (~4s) for a live list (scoped); Live/Catalog poll overrides for content hot-reload (not Vite file HMR).
- Override ids: allowlisted atoms (`Site*`) **and** namespaced / legacy composition ids — do not reject compositions as unknown-component. **SK-S2** Pattern ids use Collection-namespaced grammar.

## Non-goals

- Editing generated TSX by hand from the editor (git/dev track).
- Saving non–Site-Kit `@zaoly/ui` catalog nodes into Site Kit.
