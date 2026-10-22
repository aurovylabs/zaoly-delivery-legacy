# Site Kit responsive defaults

**Status:** Accepted · 2026-10-10  
**Parent:** `site-kit-fluid-layout.md` · `responsive-breakpoint-board.md`  
**Code:** `apps/web/lib/scene/site-kit-responsive.ts`  
**Operator:** `knowledge/site-kit-responsive-defaults.md`

## Goal

Every Site Kit **layout shell** (atoms + section Masters + default-kit patterns) ships clean responsive behavior: fluid CSS first, sparse OP-9 overrides where rows/sections must change structure on Tablet/Mobile.

## Merge-only policy

`applySiteKitResponsiveDefaults(root)` walks the tree and:

| Node | Default |
|------|---------|
| `SiteStack` / `SiteContainer` | `wrap: true` when unset |
| Same, `direction: row` | `breakpoints.mobile.props`: `direction: column`, `gap: sm` |
| `SiteGrid` | `breakpoints.mobile|tablet.props.gap: md` when unset on that lane |
| Large `paddingInline` tokens (`xl` / `page` / `margin.section`) | tablet → `lg`, mobile → `md` |
| Large `paddingBlock` / `paddingTop` section tokens | mobile → `xl` |

Existing override keys **win** (no clobber). Safe to re-run.

## Surfaces

| Surface | Wiring |
|---------|--------|
| Palette atom Masters | `seedSiteKitPaletteMasters` |
| Insert defaults | `defaultChildForType` for Stack/Container/Grid |
| Landing section Masters | `compositionMaster` + soft-fill in `seedZaolyLandingSectionMasters` |
| Canon pattern seeds | `zaoly-pattern-seeds` layout helper |

## Non-goals

- Responsive props objects on React atoms (Zaoly uses OP-9 on the scene tree)
- Auto-overrides for every typography role
- Print channel recipes here

## Acceptance

1. Fresh Landing Nav/Hero/Footer trees pass `!siteKitNodeNeedsResponsiveDefaults(root)`.
2. Row patterns from `zaolyNavPatternBlock` have mobile `direction: column`.
3. Soft-fill does not overwrite a designer-set mobile `gap`.
