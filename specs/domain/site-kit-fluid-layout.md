# Site Kit fluid layout (Wave C)

**Status:** Accepted · 2026-10-10  
**Parent:** `specs/domain/responsive-breakpoint-board.md` · Operator: `knowledge/site-kit-fluid-layout.md`  
**Code:** `packages/site-kit/src/layout-fluid.ts` · `styles.css` · `apps/web/lib/site-kit/sync-tree.ts`

## Goal

Site Kit layout shells MUST reflow on narrow artboards **by default** (intrinsic CSS), so designers only add OP-9 overrides where fluid layout is not enough.

## Rules

1. **SiteStack / SiteContainer:** row direction MUST default to `flex-wrap: wrap` when `wrap` is unset (paint via `ensureSiteKitLayoutPaint` + CSS `--row`). Palette inserts MUST seed `wrap: true`.
2. **SiteGrid:** numeric `columns` MUST map to  
   `repeat(auto-fit, minmax(min(100%, {minTrack}), 1fr))` via `fluidGridTemplateFromColumns` — not fixed `repeat(N, 1fr)`. Explicit `gridTemplateColumns` strings still win.
3. **CSS fallback:** `.site-grid` default template MUST use the same `min(100%, 14rem)` auto-fit pattern.
4. **Recommended override keys** (docs + `RECOMMENDED_RESPONSIVE_OVERRIDE_KEYS`): `direction`, `wrap`, `gap`, `columns`, `padding*`, `maxWidth`, `fontSize`, `hidden`, `justify`, `align`.
5. **Zaoly Landing** Nav / Footer Masters MUST ship `wrap: true` and a `breakpoints.mobile` direction→column override. Soft-reseed when Nav lacks wrap or mobile direction.

## Non-goals

- Container queries in Site Kit CSS (may come later)
- Auto-writing OP-9 overrides from resize
- Changing Print layout shells

## Acceptance

1. `fluidGridTemplateFromColumns(3)` contains `auto-fit` and `minmax(min(100%`.
2. Palette `SiteStack` / `SiteContainer` defaults include `wrap: true`.
3. Landing soft-reseed detects missing nav wrap / mobile direction.
4. Knowledge lists recommended override keys.
