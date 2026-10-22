# Media breakpoints (pack CSS thresholds)

**Status:** Accepted — 2026-10-10  
**Product:** Zaoly (enterprise web design)  
**Knowledge:** `knowledge/media-breakpoints.md` · product `knowledge/zaoly-webdesign-product.md`  
**Related:** `artboard-presets.md` · `zaoly-token-studio.md` · `print-out-of-scope-for-zaoly.md`

## Goal

Central, editable **CSS media min-width** catalog in the local token pack for export/handoff — not new OP-9 lanes and not artboard geometry.

## Locked decisions

1. Pack leaves: `type: "media"`, path `media.breakpoint.{id}`.
2. Value:

```ts
{
  digital: {
    minWidth: number  // CSS px ≥ 0
    label?: string
    lane?: 'mobile' | 'tablet' | 'desktop'  // documentation link only
  }
}
```

3. Seed: mobile `0` · tablet `768` · desktop `1440` (align tablet/desktop with digital artboard widths).
4. CSS export MUST emit `--zaoly-media-{id}: {minWidth}px` (unlike artboard presets).
5. Inspect TokenPicker omits `media` leaves (`groupForPackLeaf` → null).
6. Print media types are out of scope for Zaoly.

## EARS

1. WHEN the merged pack includes valid `media.breakpoint.*` leaves, CSS pack export MUST include corresponding `--zaoly-media-*` custom properties.
2. WHEN an admin edits a media leaf, PATCH MUST validate via `pack-validate`.
3. WHEN seeds are missing from overrides, fixture merge MUST still expose the three default media breakpoints.

## Acceptance

- Unit tests: parse/build, seeds in `catalogToPackLeaves`, CSS export vars, pack-validate.
- Specs inventory lists this file.
