# Zaoly — enterprise web design product

**Status:** Accepted — 2026-10-10  
**Knowledge:** `knowledge/zaoly-webdesign-product.md` · print `knowledge/print-out-of-scope-for-zaoly.md`

## Goal

Lock Zaoly as an **enterprise web design** editor: digital responsive compositions, local brand tokens, Site Kit / code handoff.

## Non-goals

- Print / magazine production UX (see print out-of-scope note).
- Suite federation / upstream packs (existing notes).
- Replacing CREATION.

## Editor consequences

1. Digital breakpoints only in create/apply UI (`mobile` \| `tablet` \| `desktop`).
2. Topbar: breakpoint **compare** remains; no print preset chrome; no global size switcher.
3. Pack catalogs: `artboard.preset.*` (geometry) + `media.breakpoint.*` (CSS thresholds).
4. Legacy `activeBreakpoint: print` MUST coerce to `desktop` for Zaoly editor preview.
