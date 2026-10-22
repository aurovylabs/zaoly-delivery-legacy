# Storyblok Visual Preview (PoC) — CREATION host

**Status:** Accepted (PoC) · **Date:** 2026-09-14  
**Product:** CREATION v3  
**Related:** `storyblok-handoff.md` · `brand-token-consume.md` · `site-kit-playground.md`  
**Knowledge:** `knowledge/storyblok-handoff.md`  
**Route:** `/preview/storyblok/[[...slug]]` (`paths.routes.storyblokPreview`)

## Goal

Host a **public** HTTPS preview that Storyblok Visual Editor can iframe, rendering `creation_page` / `site_*` bloks with **Site Kit** + optional **Brandion** `--ds-*` — not Liquid / quickstart.

## Locked decisions

1. Preview is **CREATION-hosted** for the PoC; customer storefronts may replace it later.
2. Fetch draft stories via Storyblok CDN + `STORYBLOK_PREVIEW_TOKEN` (server).
3. Map bloks → `SiteKitCompositionNode` → `CompositionPreview`.
4. Route MUST be middleware-public (Storyblok iframe has no Creation session).
5. Allow framing from `paths.storyblokAppBase` (`Content-Security-Policy: frame-ancestors`).
6. Optional Brandion: `platformProjectId` query **or** `creation_page.collection_id` from handoff loads Brandion active pack CSS.
7. Bridge: load Storyblok V2 bridge script; on `input` re-map story client-side (live field edits).
8. MUST NOT expose Management PAT to the browser — preview token only if needed client-side later; PoC keeps CDN fetch server-side and bridge updates via payload.
9. WHEN a blok has `layout` JSON, preview MUST merge it into composition `style` (token_bindings CSS vars win for bound keys).

## EARS

1. WHEN `GET /preview/storyblok/{slug}` is requested, the system MUST fetch draft story `slug` and render Site Kit.
2. WHEN slug is empty, default slug MUST be `home` (Storyblok home convention) unless `?slug=` overrides.
3. WHEN Brandion `platformProjectId` is provided (query or `collection_id`) and resolvable, inject `:root { --ds-* }` via `digitalCssForLeaf` (never raw JSON leaf strings).
4. WHEN Storyblok query `_storyblok` is present, initialize the preview bridge for live updates.
5. WHEN blok `layout` is present, apply Creation layout CSS so Visual Preview matches editor structure (flex direction, gap, padding, widths).

## Acceptance

- Unit tests: blok → composition mapping for stack/text/button.
- Specs inventory lists this file; paths document preview URL for Space Settings.
- Staging URL: `{URL_ZAOLY_STAGING}/preview/storyblok/` (set as Visual Editor Location).
