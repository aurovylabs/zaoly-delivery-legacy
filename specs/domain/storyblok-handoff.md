# Storyblok handoff (PoC) — CREATION → Headless CMS

**Status:** Accepted (PoC) · **Date:** 2026-09-14  
**Product:** CREATION v3  
**Related:** `code-export-handoff.md` · `brand-token-consume.md` · `site-kit-playground.md` SK-V13 · `page-as-pattern.md`  
**API:** `specs/api/storyblok-push.md`  
**Knowledge:** `knowledge/storyblok-handoff.md`  
**Not:** Storybook (CSF). This is **Storyblok** the headless CMS.

## Goal

Prove a **clean** path from customer Collection design (Brandion tokens + Site Kit / editor page) into Storyblok **without** baking look into the CMS:

1. Brandion remains token SSOT (`--ds-*` / paths).
2. Site Kit atoms/patterns become Storyblok **nestable bloks** (component schemas).
3. CREATION page/selection becomes a Storyblok **story `content`** tree (`page` + `body` bloks).
4. Export **Send to Storyblok** pushes via server Management API (`POST /api/storyblok/push`) and still copies the pack JSON. Tokens stay server-side (Coolify / `.env.local`).

## Locked decisions

1. **No 1:1 HTML dump into Storyblok.** Content is structured bloks; paint stays Kit + Brandion.
2. **Tokens:** `tokenBindings` export as Brandion **paths** (or a `token_bindings` map) — MUST NOT invent Storyblok color fields as SSOT hex.
3. **Blok naming:** Site Kit types map to technical names `site_*` (`SiteButton` → `site_button`). Patterns MAY use `pattern_<exportName>` later; PoC uses atom types after Instance expand / coerce.
4. **Containers** (`SiteStack` / `SiteGrid` / `SiteContainer`) expose a `body` **bloks** field for children.
5. **PoC out of scope:** asset upload, Visual Editor plugin, bidirectional sync, Storyblok Space provisioning.
6. Paths/URLs for Storyblok docs MUST live in `knowledge/paths.md` / `knowledge/storyblok-handoff.md` — MUST NOT hardcode CMS FQDNs in app logic beyond documented doc / app origins in `paths`.
7. Management credentials (`STORYBLOK_MANAGEMENT_TOKEN`, `STORYBLOK_SPACE_ID`) MUST NOT ship to the browser.

## Mapping (EARS)

1. WHEN Export opens Storyblok handoff for a target tree, the system MUST emit a pack (`data-testid="export-storyblok-pack"`) containing:
   - `story` — `{ name, slug, content }` where `content.component` is `creation_page` and `content.body` is nestable bloks
   - `components` — Management-API-shaped component definitions (`name`, `is_nestable`, `schema`) for every blok type used
   - `meta` — Collection id, scene id, Brandion note, generator version
2. WHEN a node is a Site Kit container with children, the blok MUST nest children under `body`.
3. WHEN a node has text-like props (`children`, `label`, `text`, `alt`, `href`, …), the system MUST map them to Storyblok field types `text` / `textarea` / `boolean` best-effort.
4. WHEN a node has `tokenBindings`, the system MUST include them as a JSON `textarea` field `token_bindings` (paths only).
5. Style/paint literals are **not** Storyblok brand SSOT. WHEN a node has Creation layout/paint (style + layout props such as direction/gap/padding), the system MUST emit a JSON `textarea` field `layout` (CSS snapshot) for Visual Preview fidelity. Brand colors still prefer `token_bindings` paths.
6. WHEN the operator activates Send to Storyblok (`data-testid="export-copy-storyblok-btn"`), the client MUST POST the pack to `paths.routes.apiStoryblokPush` and surface the returned `appUrl` (open + link). MUST NOT paste the full pack JSON into the dialog, clipboard, or snackbars by default.
7. WHEN Storyblok env is missing **or** `ZAOLY_STORYBLOK_HANDOFF` is unset/false (Zaoly default), the API MUST report `configured: false` / `503` with `code: storyblok_not_configured`, and Export MUST hide Send to Storyblok (no pack dump).
8. WHEN Storyblok is **not** configured on the host (`GET /api/storyblok/push` → `configured: false`), the Export dialog MUST **hide** Send to Storyblok and MUST NOT dump/copy the handoff pack JSON (hosted `zaoly.app` has no Storyblok Space by default).

## Acceptance

- Unit tests map a small SiteStack → SiteText/SiteButton tree to valid story + schemas.
- Export dialog pushes via API (mocked) and shows Sent / Open in Storyblok.
- API route tests cover configured push + missing env.
- Specs inventory lists domain + API files; paths knowledge documents Storyblok env keys + route.
