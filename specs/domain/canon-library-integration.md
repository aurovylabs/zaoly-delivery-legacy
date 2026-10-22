# Canon library integration (Site Kit patterns)

**Status:** Accepted — 2026-10-03  
**Knowledge:** `knowledge/canon-library-integration.md`  
**Related:** `zaoly-corporate-design.md` · `site-kit.md` · `knowledge/canon-archive.md`

## Intent

Standalone Zaoly MUST reuse the visual and compositional vocabulary of the legacy Stencil library without rolling the canvas back to Web Components. Molecules that existed as `ds-*` tags MUST land as editable CompositionScene pattern seeds built from Site Kit atoms.

## MUST

1. Product chrome MUST expose the Zaoly BrandMark (seal 造 + Spectral wordmark) in the editor toolbar.
2. Canon molecules Nav / CTA / Card / Section MUST ship as deterministic pattern seed builders (`pattern-zaoly-*` ids) using Site Kit palette Masters.
3. Pattern seeds MUST be insertable / savable as Collection Patterns (same path as other demo blocks).
4. Radius on Zaoly-branded pattern surfaces MUST be `0` (CD edges).
5. Specs / knowledge MUST document keep / reshape / drop against `zaoly-ui` `ds-keep-mapping`.

## MUST NOT

1. Load Stencil / `@zaoly/library` WC at runtime for the canvas.
2. Treat `*.zaoly.html` as long-term composition SoT.
3. Invent parallel Site Kit atoms that already exist in `@zaoly/ui` / Site Kit catalog.

## Acceptance

- [ ] `EditorTopbarChrome` renders `data-testid="product-brand"` with seal + wordmark
- [ ] `homePageRoot` includes `pattern-zaoly-nav`, `pattern-zaoly-section`, `pattern-zaoly-card`, `pattern-zaoly-cta`
- [ ] Demo footer / hero copy identify Zaoly (not CREATION)
- [ ] Corporate overlay forces sharp topbar chrome (`border-radius: 0`)
