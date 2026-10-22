# Zaoly corporate design — product chrome

**Status:** Accepted — 2026-10-03  
**Knowledge:** `knowledge/corporate-design.md`  
**Source bundle:** sibling `zaoly_creation_v2/Zaoly CREATION/zaoly-corporate-design/`

## Intent

Standalone Zaoly MUST present the Zaoly Corporate Design (cobalt / acid / cream, radius 0, seal 造) on product chrome. `@zaoly/ui` remains the primitive library; this product remaps theme tokens.

## MUST

1. Light theme MUST use cream surfaces (`#F3EEE4` / `#FBF6EC`), ink `#1E1B17`, hairline `#C9BCA1`, accent cobalt `#1F44FF`, live acid `#C6F24A`, warm charcoal chrome `#2E2A24` (`--editor-warm-gray`).
2. Dark theme MUST use CD dark column (`#15120F` / `#201C17`, accent `#3E63FF`); warm gray MAY map to `#24201A`.
2a. Brand primary MUST be centralized as `paths.brandPrimaryHex` (`#1f44ff`) and drive `--accent` / `--brand-primary` / Site Kit `--site-accent` / fixture `color.brand.primary`. Default accent preference MUST be `blue` (Zaoly cobalt, not suite green / coral).
2b. Warm charcoal MUST be centralized as `paths.brandWarmGrayHex` (`#2e2a24`) → `--editor-warm-gray` / `--warm-gray` / fixture `color.brand.warmGray`.
3. All chrome radii (`--radius*`) MUST be `0`.
3a. Product favicon / app icons MUST use the Zaoly product seal (造 on cobalt `#1F44FF` with cream `#F3EEE4` glyph) — same as chrome `ZaolySealMark` / `ZaolyLogoMark`. Paths: `paths.brandAssets` → `apps/web/public/favicon.{svg,ico}`, `apple-touch-icon.png`, `/brand/zaoly-mark.svg`. Favicon SVG MUST bake the glyph (raster/path) — MUST NOT rely on live `<text>造</text>` (browser tabs lack CJK fonts). Regenerate via `scripts/generate-zaoly-favicon.mjs`. MUST NOT ship the suite MSQDX five-square mark or a generic favicon.
4. BrandCorner MUST use the seal mark (造 on cobalt) and Spectral wordmark treatment where labeled.
4a. Immersive editor MUST reuse the same full-width warm-gray primary-nav bar as hubs (`.zaoly-hub-chrome`); tool strip sits below it.
4a-hub. Magazine / general pages **and** immersive editor MUST use a full-width warm-gray primary-nav bar (`--editor-warm-gray` / `#2E2A24` light) with seal + thin Spectral wordmark inside (`.zaoly-hub-chrome`). Only the seal MAY use brand blue; wordmark + links use `--editor-warm-gray-fg`. Nav link weight MUST be light (`300`) and slightly smaller than body.
4b. Immersive editor MUST NOT show the BrandCorner plaque (seal/wordmark live in the hub nav bar).
4c. Property Inspector / editor rails MUST use radius `0`, cream panel surfaces, and uppercase section meta (canon inspect chrome).
4d. `/kit` Playground chrome (`.creation-kit-*`) MUST use radius `0`, CD panel/border tokens, and solid acid lime + black ink for active nav/tabs (WCAG; see `site-kit-playground.md` §6a).
4d-users. `/settings/users` hub (`.zaoly-users-hub`) MUST use radius `0`, CD tokens, barrel `@zaoly/ui` via `lib/zaoly-ui.ts`, fill the AppShell stage width (`width: 100%`, no `max-width` cap). Invite form (`.zaoly-users-hub__invite`) and directory rows (`.zaoly-users-hub__row`) MUST stretch the SettingsBand body (`align-items: stretch`). SectionChrome titles (Invite / Directory) MUST have **no** bottom border. MUST NOT use `--zaoly-*` CSS vars or duplicate the AppShell title as inspect SectionChrome.
4d-tokens. `/tokens` hub (`.zaoly-token-studio`) MUST be magazine chrome: `creation-magazine`, `HubIndexCard` tiles, radius `0`, CD tokens, full stage width. Selected cards and filter chips MUST use acid lime fill + `--editor-live-ink`. Leaf edit MUST be a compact `Dialog` (`.zaoly-token-studio-dialog`), not a sticky inspector column. Card media MUST flush to the panel top and clip inside the tile (no empty pad above the swatch, no right overflow). MUST NOT use inspect list rows as the primary catalog.
4e. WHERE acid lime is used as a fill for interactive active states, text MUST be `--editor-live-ink` (`#1E1B17`), never lime text on dark or translucent lime wash.
4f. WHERE cobalt (`--editor-accent`) is used as a button/fill (e.g. `.ds-btn--primary`), label text MUST be white (`--editor-accent-ink` / `#FFFFFF`) for WCAG contrast.
5. Default theme preference MUST be `light`. When localStorage has no theme key, UI MUST NOT fall through suite `migrateLegacyThemeId(null)` → `dark`.
5a. Default UI locale MUST be `en`. Public/SSR locale MAY use the `zaoly.locale` cookie when set; MUST NOT sniff `Accept-Language` to force `de`.
6. Token overlay MUST live in-repo (`apps/web/css/zaoly-corporate.css`) and load after `@zaoly/ui/styles.css`.
7. Standalone mode MUST NOT surface Plexon Collection pickers inside Inspect.

## MUST NOT

1. Use Zaoly coral (`#ff6a3b`) as the product accent.
2. Round resting chrome (pills / panels / inspect chips) for brand identity.
3. Treat Stencil/`*.zaoly.html` as chrome SoT — CD HTML is visual reference only.
4. Show suite atmosphere radial gradients on hubs/editor (`body` / `.atmosphere`) — ground MUST be flat cream / CD panel.

## Acceptance

- [ ] `--accent` resolves to `#1f44ff` under `data-theme='zaoly'`
- [ ] `--radius` is `0`
- [ ] Seal mark present on BrandCorner
- [ ] Smoke test `corporate-design` green
