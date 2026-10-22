# Zaoly Token Studio

**Status:** Accepted  
**Product:** Zaoly standalone  
**API:** `specs/api/zaoly-tokens.md`  
**Knowledge:** `knowledge/zaoly-token-studio.md` · `knowledge/upstream-pack-out-of-scope-for-zaoly.md`  
**Related:** Upstream pack / CREATION consume docs are **out of scope** for Zaoly product work.  
**Starter pack:** `specs/domain/zaoly-starter-token-pack.md` · `knowledge/zaoly-starter-token-pack.md` — complete default seed for Site Kit atoms.

## Goal

Zaoly MUST expose a first-class **Token Studio** hub (`/tokens`) for administering the **local** brand token pack: list, filter, search, add, edit, and revert. The editor Tokens rail remains a compact craft surface; the hub is the administration surface. The rail MUST offer an **Open hub** control (`paths.routes.tokens`) and per-leaf **Open in hub** links (`paths.routes.tokensFocus(path)`) so craft edits can jump to the full catalog dock.

The editor, Kit Playground Tokens tab, Inspect/HUD promote, and magazine PDF paint MUST load the same merged pack via `GET paths.routes.apiTokens` (`source: "local"`). Craft saves and promote upserts MUST `PATCH` that route (admin / auth bypass). They MUST NOT call an upstream pack or `paths.routes.apiBrandTokens`.

## SSOT

| Mode | Pack used by editor / TokenPicker | Hub administers |
|------|-----------------------------------|-----------------|
| Always (Zaoly) | Local pack (fixture + overrides) | Local pack (fixture + overrides) |

Zaoly MUST NOT depend on an upstream brand pack. There is no upstream consume or push path in the Zaoly product. (Suite history for CREATION: `brand-token-consume.md` — deferred.)

## Vocabulary

Paths and types MUST use Zaoly pack grammar (`color.*`, `spacing.*`, `typography.*`, …) — same shapes as `INSPECT_TOKEN_CATALOG`. Digital-channel field models reuse `lib/inspect/digital-edit.ts`.

## Color digital formats

Color leaves (literal digital, independent of compose) MUST accept CSS Color Level 4 paintable values via `lib/tokens/color-css.ts`:

- Formats in the hub dock: **HEX**, **RGB** (`rgb()` / `rgba()`), **HSL** (`hsl()` / `hsla()`), **OKLCH**.
- Native swatch picker stays available; it syncs into the active format (picker is sRGB hex; alpha is preserved from the current value when converting).
- Stored digital MAY be `{ hex }` (legacy), `{ css, hex? }` for non-hex CSS, or a bare CSS/hex string. Read prefers `css` → string → `hex` → `rgba`/`rgb`.
- CSS emit (`digital-css`) MUST paint `css` / functional colors including `oklch()`, not only hex.

## Derived expressions (compose)

Scalar leaves MAY store a **CSS-native expression** in the digital channel instead of a bare literal:

- Token refs use `{path.to.token}` (Zaoly pack paths).
- Spacing / size / radius: `calc({spacing.static.medium} * 2)` (and `+` / `-` / `/`).
- Color: `color-mix(in oklch, {color.action.primary} 22%, white)` (or `black`).
- Hub MUST fold compose into the **same digital value field** for `spacing` and `color` (no separate Literal/Derived mode toggle). Free text remains for paste.
- Resolve for media preview by substituting concrete digital values (cycle → invalid). CSS export MAY emit `var(--zaoly-…)` via `paths.zaolyTokenCssVarPrefix`.
- **Artboard presets** (`type: artboard`, paths `artboard.preset.*`) are pack geometry metadata for the Add page dialog — see `artboard-presets.md`. MUST NOT emit CSS custom properties.
- Primitives (wheel/hex) stay absolute; derived leaves MUST NOT become circular.

### Smart compose (hub dock)

Compose MUST live on the digital value control (`TokenComposeField`), not a second mode:

1. **Cycle-safe** — omit candidates that would reach the edited leaf (direct or via nested refs).
2. **Rank** — same path-family prefix first (deeper shared segments win), then literal digital over derived, then CSS length proximity for spacing (when both sides parse), then path localeCompare.
3. **Link from value** — a `{ }` / “from token” control on the literal value seeds an expression from the top-ranked safe candidate; “edit as literal” restores a bare digital value.
4. **Same field chrome** — when the digital value looks like an expression, that same value field MUST show variable affordance (leading `{ }` badge + mono input on the light paper island) plus base select, scale/shade presets, and live resolve readout (`→ …` / color swatch). Unresolved/cycle shows invalid state (save still blocked by cycle guard).

## Hub UX

- Magazine `AppShell` page (`creation-magazine`); primary nav tab **Tokens** after Kit, before Users.
- Full-width Zaoly chrome (`zaoly-token-studio`): `HubIndexCard` **cards** catalog (no list layout) with type media (color field, **spacing / size / radius / opacity as a 1rem unit sheet with a single corner crop** — origin snaps to the nearest 1rem intersection near the media center; spacing maps the leaf as accent pad on the right/bottom edges; size maps the leaf as an accent square whose bottom-right sits on that origin; radius maps `border-bottom-right-radius` on the corner module; opacity maps a translucent accent fill over a 1rem checkerboard; **typography** uses a 1rem unit sheet with a very light grid wash (quieter than spacing/size/radius) plus a multi-line specimen (≥2 lines) and hairline rules between lines at each line-height step — no fill band; **shadow** uses a light cream paper sheet (always `#F3EEE4`, theme-independent so soft casts stay readable) with a quiet 1rem grid wash, a hairline ghost rest box, and an elevated light plate (`#FBF6EC`) with the live `box-shadow`; **glow** (local pack only) uses a dark charcoal sheet with a light plate and live positioned halo; **effect** (local pack only) uses a cream sheet with a color-bar specimen under the live CSS `filter`; **motion** (local pack only) uses a cream sheet with a looping plate driven by digital `duration` + `easing` — other type samples), grouped by **type → path family → compound cluster** with `SectionChrome` (type chapter) and nested family/cluster headings. Paths stay flat (`color.action.linkHover`); path families/clusters are derived for display (`lib/tokens/pack-path-groups.ts`) and MUST read as **clearly separated panels** (chapter rules + bordered family blocks) — not a flat continuous card stream. Catalog MUST fill the stage — no side inspector column.
- **Create group (admin):** each type chapter MUST offer **New group** — an inline family-slug field that inserts an empty path-family shell under that type (`withEmptyPathFamilies`). Empty shells disappear once any leaf in that family exists in the pack. Creating a group MAY open the create dock with path prefilled `{type}.{family}.`.
- **Add token per group (admin):** each path family MUST include a `HubIndexCard` **create** card (not a single global create at the top of the first chapter). Clicking it opens the shared side create dock anchored to that card, with type locked to the chapter and path prefilled `{type}.{family}.` so the new leaf lands in that group.
- Catalog view switch MUST offer **Cards | JSON | CSS** (not Cards/List). JSON and CSS are read-only pack dumps from `lib/tokens/pack-export.ts` (nested DTCG-style JSON with `$type`/`$value` plus `$extensions.com.zaoly.studio` `{ type, value }` for round-trip; CSS `:root` custom properties via `paths.zaolyTokenCssVarPrefix`, expressions compiled to `var(--zaoly-…)`). Each dump MUST include **Copy** and **Download** controls (`paths.tokenPackDownloadJsonName` / `paths.tokenPackDownloadCssName`).
- **Import** (admin, JSON view): upload a DTCG JSON dump → dry-run diff (create / update / unchanged / invalid) → confirm applies local overrides via `POST paths.routes.apiTokensImport`. Prefer `$extensions.com.zaoly.studio`; scalar `$value` fallback when the extension is absent. CSS dumps are download-only (no CSS import).
- Type filter chips with `TokenKindGlyph`, search, plus status chips **Unresolved / Override / Custom** (counts from the type+search-filtered set; exclusive toggle, re-click clears to all). Empty catalog under a status filter MUST use a status-specific empty message. Open-card and active chips use acid lime + black ink. Selected media MUST paint lime on the **token specimen** (spacing pad / size square / radius module / opacity fill), not on the static inner module.
- Catalog cards MUST show non-default origin via `lib/tokens/pack-leaf-status.ts`: **Override** (local value on a seed path) and **Custom** (local-only path). Seed/default leaves MUST NOT show a Fixture badge (default is silent). Scalar compose leaves whose `{refs}` do not resolve (or cycle) MUST show an **Unresolved** badge on the card (not only in the edit dock). Status filter badges MUST render **outside** the `HubIndexCard` control (sibling under the card slot) so the catalog card button does not nest interactive controls. Clicking an Override / Custom / Unresolved badge MUST apply that status filter (without opening the dock).
- Catalog cards MUST use a **uniform tile geometry**: fixed media aspect (`16 / 10`), title clamped to two lines, meta clamped so long paths/values do not stretch neighbors unevenly. Grid slots stretch to equal row height; media MUST NOT flex-grow.
- When `canWrite` and at least one **Override** exists, the toolbar MUST offer **Revert all overrides** — deletes every local override on a fixture path (custom leaves unchanged), then reloads the pack.
- **Override** cards and the edit dock MUST surface the seed baseline digital summary (`fixtureBaselineForPath`; UI label **Seed**, never Fixture) so admins can see what the local value replaced.
- Deep-link `paths.routes.tokensFocus(path)` (`/tokens?path=…`, query key `paths.tokenPackPathQueryKey`) MUST open Cards, select that leaf, hydrate the edit dock, and keep the query in sync while a leaf is selected (clear on dock close).
- **Edit** MUST pin the catalog card on click and open a **side edit dock** (right when the card midX is in the left viewport half, otherwise left). Nominal fields MUST use **endless scale wheels** (`lib/tokens/nominal-sliders.ts` + dock Rädchen): a fixed center notch; pointer/wheel drag **moves the scale** (not a thumb on a fixed track), **extends past catalog steps** by repeating the edge gap (does NOT wrap back to 0), clamps length/time at `0`, and snaps with **live media preview** on the pinned card while dragging. Wheel + bezier fields MUST stack full width in the dock/dialog (no two-column split). Free text input remains for off-ladder values. **Motion easing** MUST use a cubic-bezier pad (`lib/tokens/cubic-bezier.ts`): two draggable control points, preset chips, CSS string sync, live curve + motion-card preview. Commit with Save or Enter; Revert when origin is local. Escape or outside click closes without save — but MUST NOT treat portaled `@zaoly/ui` Select menus (`ds-select-menu` / `ds-select-menu-portal`) as outside (menu lives on `document.body`). Hover MAY lift media only — MUST NOT open the dock.
- **Rename** — clicking the edit-dock title (`zaoly-token-studio__edit-dock-title`) MUST enter inline path edit (admin). Enter / blur commits when the path is valid and free; Escape cancels rename without closing the dock. PATCH MAY send `fromPath` with the new `path`/`type`/`value`: upserts the new path (with the current draft value), deletes the local override at `fromPath` when present, and rewrites `{fromPath}` refs inside other local override values. Fixture-only sources fork to a local leaf at the new path (fixture path remains). Duplicate target paths MUST fail (`path_exists`).
- **Add** MUST use the same side edit dock as Edit (per-family create card pins; dock anchors to that create card). Include type chips, path (prefilled from the family when opened from a group), and the same nominal wheels / bezier pad. No separate modal `Dialog` on the hub.
- `glow.*`, `effect.*`, and `motion.*` are **Zaoly local pack types** (halo, CSS filter, duration+easing). Hub and editor rail administer the same local pack.
- **Shadow digital** MUST expose offsetX, offsetY, blur, spread, color, and inset (CSS `box-shadow`). Offset wheels use a **signed px** ladder (negatives allowed).
- **Glow digital** MUST expose offsetX, offsetY, blur, spread, and color — glow is a positioned halo `box-shadow` (not locked to `0 0`). Offset wheels use the same signed px ladder.
- Fixture leaves: edit writes an override; revert removes the override.
- Custom leaves: add via a family create card + side dock; delete via revert when origin is local.

## Access

- GET merged pack: signed-in session (or auth bypass).
- PATCH / DELETE: admin (or auth bypass).
- PATCH MUST reject invalid / oversized / cyclic values server-side (`pack-validate.ts`); file-store writes are atomic; rename is transactional (see `specs/api/zaoly-tokens.md`).

## Acceptance

1. `/tokens` is in primary nav and `paths.routes.tokens`.
2. Admin can change `color.action.primary` digital hex and see the override origin.
3. Revert restores the fixture leaf.
4. Editor fixture catalog merges local overrides via `GET /api/tokens` on load and on window focus (`useLocalPackFocusRefresh`).
5. Pack changes stay local (file / Postgres); no external brand service.
6. Tokens rail Save / Add and Inspect/HUD promote persist via `PATCH /api/tokens` when `canWrite` is true.

## Bound component refresh

Scene components store token paths in `tokenBindings`; the editor resolves those paths against the local Zaoly pack. When the pack is changed in the Token Studio, opening or returning focus to an editor MUST fetch `/api/tokens` again so every bound component paints the new value without individual field edits. An already mounted editor MAY wait until focus or visibility return; this is not a push to exported React code.
