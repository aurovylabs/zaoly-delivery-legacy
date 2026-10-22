# Zaoly starter token pack — complete default kit

**Status:** Accepted — 2026-10-05  
**Product:** Zaoly standalone  
**Related:** `zaoly-token-studio.md` · `zaoly-corporate-design.md` · `site-kit.md` · `knowledge/zaoly-starter-token-pack.md` · `knowledge/token-layers.md` · `knowledge/corporate-design.md`

## Intent

Ship a **complete** Zaoly token pack as the default local-pack baseline (fixture seed) so:

1. Kit Playground / Site Kit atoms can bind every paint slot without inventing literals.
2. Inspect / Smart HUD / Mag PDF always resolve paths from the same vocabulary.
3. Empty projects look branded (Zaoly CD) on first open.

This is **not** a thin demo subset. The pack MUST cover every Site Kit atom paint need and every Token Studio editable type. Customer packs override **values**, not the path grammar.

## Architecture (best-of-breed)

| Layer | Inspired by | Rule |
|-------|-------------|------|
| **Primitives** | Tailwind scales | Raw ladders; compositions MUST NOT bind these directly when a role exists |
| **Roles** | shadcn semantic pairs | What atoms bind (`color.action.primary`, `typography.body`) |
| **Modes** | Bootstrap `data-bs-theme` | Same paths; light/dark digital values (CD foundations 9a) |
| **Channels** | Zaoly | `digital` required; `print` on color/type/space/radius/shadow where Mag needs it |

CSS emit remains `--ds-{path-with-dashes}` (+ `--zaoly-*` alias). Path grammar stays DTCG-style dotted paths under type roots.

## MUST

1. The fixture baseline (`INSPECT_TOKEN_CATALOG` / seed JSON) MUST include **every path** listed in § Inventory (or a superseding inventory appendix in knowledge). Missing paths that Site Kit defaults bind are a bug.
2. Every Site Kit atom in `packages/site-kit/src/components` that accepts paint MUST have a documented default binding set (`defaultSiteKitTokenBindings`) whose paths exist in the seed.
3. Every Token Studio editable type (`color`, `spacing`, `radius`, `opacity`, `size`, `typography`, `shadow`, `glow`, `effect`, `motion`, `asset`) MUST have a non-empty seed section.
4. Color roles that fill a surface MUST ship an **on-*** / foreground companion (shadcn pair rule), e.g. `color.action.primary` + `color.action.primaryForeground`.
5. Interactive atoms (Button, Link, Field, Checkbox) MUST have role paths for **default / hover / focus / disabled** (or document that Masters own state paint via the same role set).
6. Status / gauge / chart atoms MUST have dedicated color roles (`color.status.*`, `color.chart.1`…`5`).
7. Light and dark mode MUST expose the **same path set**; mode only changes digital values (CD light/dark columns).
8. Seed values MUST follow Zaoly CD (`corporate-design.md`): cream paper, cobalt primary, acid live, warm gray, **radius 0** for surface/control defaults unless a named exception (e.g. pill badge) is documented.
9. Derived leaves MAY use `{path}` expressions referencing primitives/roles (`zaoly-token-studio.md`).
10. Local-only Inspect groups (`blur`, `rotate`, `gradient`) remain in the catalog for canvas tools; they MAY stay outside Token Studio editable types.

## MUST NOT

1. Bind Layer-0 chrome vars (`--bg0`, `--accent`) as composition token paths.
2. Invent a second grammar (raw shadcn CSS names as bind paths).
3. Ship an incomplete seed that forces hex/px literals on Site Kit insert.
4. Depend on upstream brand-pack HTTP for defaults (`upstream-pack-out-of-scope-for-zaoly.md`).

## Site Kit atom coverage (required)

Every row MUST be seed-covered before atom polish ships.

| Atom | Bind slots (min) | Required role paths (examples) |
|------|------------------|--------------------------------|
| `Button` | bg, fg, radius, type, pad, border?, shadow? | `color.action.primary`, `color.action.primaryForeground`, `color.action.primaryHover`, `radius.control.*`, `typography.label`, `spacing.padding.control`, `motion.fast` |
| `Link` | color, type | `color.action.link`, `color.action.linkHover`, `typography.body` |
| `Text` | color, type facets | `color.ink`, `color.inkMuted`, `typography.display`…`caption` |
| `Badge` | bg, fg, radius, type, pad | `color.status.*` / `color.action.accent` + foregrounds, `radius.control.sm`, `typography.label` |
| `Input` / `Textarea` / `Select` | bg, fg, border, radius, type, pad, ring | `color.surface.field`, `color.ink`, `color.line`, `color.ring`, `radius.control.sm`, `typography.body` |
| `Checkbox` | fg, accent, border | `color.action.primary`, `color.line`, `color.ink` |
| `Divider` | color / border | `color.line`, `color.lineStrong` |
| `Stack` / `Container` / `Grid` | gap, pad, bg | `spacing.gap.*`, `spacing.padding.*`, `color.surface.*` |
| `Table` | bg, line, type, pad | `color.surface.elevated`, `color.line`, `typography.body` / `label` |
| `Chart` | series colors | `color.chart.1`…`5`, `color.inkMuted` (axis) |
| `Gauge` | track, fill by tone | `color.status.ok` / `warn` / `danger`, `color.neutral.*` |
| `Image` | radius, bg placeholder | `radius.surface`, `color.surface.muted` |
| `Svg` / `Shape` | color (currentColor) | `color.ink`, `color.action.primary` |
| Layout shell / page | bg | `color.background`, `color.surface.canvas` |

Masters / named variants MAY remap which role is bound; they MUST still use seed paths.

## Inventory

### A · Color — primitives (palette)

| Path | Notes |
|------|-------|
| `color.palette.cobalt.50`…`900` | Ladder around brand primary (OKLCH or hex digital) |
| `color.palette.cream.50`…`900` | Paper / wash ladder |
| `color.palette.warmGray.50`…`900` | Chrome / ink ladder |
| `color.palette.lime.50`…`900` | Live / accent ladder |
| `color.palette.danger.50`…`900` | Destructive ladder |
| `color.palette.ok.50`…`900` | Success ladder |
| `color.palette.warn.50`…`900` | Warning ladder |
| `color.white` / `color.black` | Absolute anchors |

Primitives exist so roles can `{ref}` them; Prefer roles in atom defaults.

### B · Color — surfaces & ink (roles)

| Path | CD light default (intent) |
|------|---------------------------|
| `color.background` | Paper `#F3EEE4` |
| `color.surface.base` | same / alias |
| `color.surface.elevated` | `#FBF6EC` |
| `color.surface.canvas` | `#E1D6C2` |
| `color.surface.field` | elevated / white-cream for inputs |
| `color.surface.muted` | wash |
| `color.surface.inverse` | warm gray `#2E2A24` |
| `color.surface.inverseForeground` | cream |
| `color.ink` | `#1E1B17` |
| `color.inkSecondary` | `#57554C` |
| `color.inkMuted` | `#8C8578` |
| `color.inkInverse` | cream on inverse |
| `color.line` | `#C9BCA1` |
| `color.lineStrong` | darker hairline |
| `color.lineFocus` | ring companion |
| `color.overlay` | scrim |

Keep legacy aliases used by scenes: `color.neutral.100`, `color.neutral.700` — map to surface/ink via same values or expressions.

### C · Color — action & interactive (roles + pairs)

| Path | Pair / state |
|------|----------------|
| `color.action.primary` | + `primaryForeground` |
| `color.action.primaryHover` | + foreground if needed |
| `color.action.primaryActive` | |
| `color.action.primaryDisabled` | + foreground |
| `color.action.secondary` | + `secondaryForeground` |
| `color.action.secondaryHover` | |
| `color.action.accent` / `live` | + foreground (black ink on acid) |
| `color.action.destructive` | + foreground |
| `color.action.link` | + `linkHover` / `linkVisited` |
| `color.brand.primary` | CD cobalt (may alias primary) |
| `color.brand.warmGray` | CD warm gray |

### D · Color — status, chart, focus

| Path |
|------|
| `color.status.ok` / `okForeground` / `okSubtle` / `okBorder` |
| `color.status.warn` / `warnForeground` / `warnSubtle` / `warnBorder` |
| `color.status.danger` / `dangerForeground` / `dangerSubtle` / `dangerBorder` |
| `color.status.info` / companions (optional but recommended) |
| `color.chart.1` … `color.chart.5` |
| `color.ring` / `color.ringOffset` |

### E · Spacing

| Path | Digital intent |
|------|----------------|
| `spacing.static.0` … `spacing.static.8` | 0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4 rem ladder |
| `spacing.static.small` / `medium` / `large` | aliases → static steps (compat) |
| `spacing.gap.none` / `tight` / `modules` / `section` / `page` | Stack/Grid gap roles |
| `spacing.padding.none` / `xs` / `sm` / `md` / `lg` / `xl` / `control` / `page` | pad roles |
| `spacing.margin.sm` / `md` / `lg` / `page` / `section` | margin roles |
| `spacing.fluid.sm` / `md` / `lg` | optional clamp() expressions |

### F · Radius

CD default is **0**. Still ship a full ladder so customers can override without adding paths.

| Path |
|------|
| `radius.none` (= 0) |
| `radius.control.xs` / `sm` / `md` / `lg` / `pill` |
| `radius.surface` / `surface.lg` |
| `radius.field` (alias control.sm) |

Seed values for Zaoly brand: control + surface = `0` (document pill as optional exception if Badge needs it).

### G · Opacity

| Path |
|------|
| `opacity.full` / `subtle` / `muted` / `disabled` / `overlay` / `ghost` |

### H · Size

| Path |
|------|
| `size.touch.target` |
| `size.control.sm` / `md` / `lg` (min-height) |
| `size.icon.sm` / `md` / `lg` |
| `size.logo.min` / `preferred` |
| `size.container.sm` / `md` / `lg` / `max` (max-width) |
| `size.block.hero` (min-height, landing hero band) |
| `size.media.sm` / `md` / `lg` (min-height frames) · `size.media.lgMax` (max-height) |

### I · Typography roles

Structured leaves (family + digital size/weight/lineHeight/letterSpacing; print facets on body/heading).

| Path |
|------|
| `typography.display` |
| `typography.heading.h1` / `h2` / `h3` / `h4` |
| `typography.body` / `typography.body.family` (compat) |
| `typography.body.strong` |
| `typography.label` / `label.sm` |
| `typography.caption` |
| `typography.overline` |
| `typography.code` / `typography.family.mono` |
| `typography.quote` |

Faces default to CD stacks (Geist / Noto / Spectral / mono as appropriate per role — see corporate-design.md).

### J · Shadow / glow / effect / motion

| Path |
|------|
| `shadow.none` |
| `shadow.elevation.sm` / `md` / `lg` / `overlay` |
| `shadow.focus` (ring-like cast if used) |
| `glow.accent` / `glow.live` / `glow.danger` |
| `effect.blur.sm` / `md` / `lg` |
| `effect.saturate.punch` |
| `motion.instant` / `fast` / `base` / `emphasized` / `exit` |
| `motion.easing.standard` / `emphasized` / `linear` (if split from duration leaves) |

### K · Border width (length via spacing or dedicated)

| Path |
|------|
| `size.border.hairline` / `thin` / `thick` |

(Prefer `size` or `spacing` type consistent with studio — document chosen type in seed.)

### L · Asset

| Path |
|------|
| `logo.mark` / `logo.wordmark` → `paths.brandAssets.mark` / `.wordmark` |

### M · Local Inspect-only (catalog, not Studio types)

Keep: `blur.*`, `rotate.*`, `gradient.*` as today.

## Modes

- Seed stores **light** digital values as default leaf digital.
- Dark overrides: **parallel digital map** merged by theme (`starterPackLeavesForTheme('light'|'dark')`) — MUST keep path set identical.
- CD dark column (`knowledge/corporate-design.md` foundations 9a) is SSOT for dark role values.
- Inspect fixture catalog remains **light**; dark leaves are available for theme-aware CSS emit / Token Studio preview.

## Interactive Masters (wave 3)

Interactive Site Kit atoms (`SiteButton`, `SiteLink`, `SiteInput` / `SiteTextarea` / `SiteSelect`, `SiteCheckbox`) MUST seed `states` overrides that bind starter role paths:

| State | CSS / attr | Typical bind |
|-------|------------|--------------|
| `hover` | `:hover` | `color.action.primaryHover` / `linkHover` / `lineStrong` |
| `focus` | `:focus` / `:focus-visible` / `:focus-within` | `color.ring` |
| `active` | `:active` | `color.action.primaryActive` (Button) |
| `disabled` | `:disabled` / `[aria-disabled="true"]` / `[data-disabled="true"]` | `primaryDisabled` (+ fg) / muted ink |

`SceneStateId` includes `disabled`. Soft-fill on palette Masters MUST NOT overwrite designer state keys.

**Inspect state bar vs variants:** The Default / Hover / Focus / Active / Disabled bar edits **interactive pseudo-states** (`node.states`) and MUST force-preview that state on the **selected** canvas node (`data-force-state` + paint cascade). Named looks (Primary / Secondary / Ghost) are **Master variants** (`composition-masters.md`) — not this bar.

**Temporary UI gate:** Inspect MUST NOT render the interactive state bar while `INSPECT_INTERACTIVE_STATE_BAR_ENABLED` is false (`apps/web/lib/inspect/inspect-ui-flags.ts`). Soft-fill `node.states` on Kit Masters and cascade/CSS generation remain; only the Inspect chrome is hidden.

## Starter named Master variants (wave 7)

On Kit Master Prefill (`seedSiteKitPaletteMasters`), soft-seed **Phase-2 named variants** for atoms that have multiple starter role remaps:

| Master `sourceKey` | Default root | Soft-added names (if missing) |
|--------------------|--------------|-------------------------------|
| `SiteButton` | Primary roles | `Secondary`, `Accent`, `Destructive` |
| `SiteBadge` | Accent roles | `Ok`, `Warn`, `Danger` |

Rules:

1. MUST use deterministic variant ids (`mvar-{sourceKey}-{slug}`) for SSR hydration.
2. MUST NOT overwrite an existing variant with the same name (case-insensitive).
3. MUST NOT soft-seed when the Master already has Phase-3 `axes` (designer Component Set wins).
4. Variant roots MUST bind starter pack paths only (same inventory as atom defaults).
5. Prefill still soft-fills `tokenBindings` / `states` on the Master `root` (and leaves other variant roots alone unless newly added).

## Print

Color / typography / spacing / radius / shadow leaves used by Mag MUST include print where Mag already consumes (`printCssForLeaf`). Charts/gauges digital-only is OK for v1.

**Mag-critical print set (wave 5):** paths in `ZAOLY_STARTER_MAG_PRINT_REQUIRED_PATHS` MUST resolve a CSS-paintable print facet (`mm` / `pt` / `#hex`). Color print MAY carry Pantone/CMYK **plus** `hex` so canvas Mag paint does not invent Pantone→hex.

## Theme-aware Kit CSS

`buildTokenPackRootCss` / `tokenPackCssForHandoff` MAY accept `theme: 'light' | 'dark'`. When `dark`, digital emit uses `starterPackLeavesForTheme('dark')` for paths still at light starter values; live-pack overrides that differ from the light seed MUST win.

## Delivery

| Artifact | Location |
|----------|----------|
| Spec (this) | `specs/domain/zaoly-starter-token-pack.md` |
| Knowledge inventory + CD map | `knowledge/zaoly-starter-token-pack.md` |
| Fixture seed (impl) | Expand `INSPECT_TOKEN_CATALOG` / dedicated seed module under `apps/web/lib/tokens/` |
| Atom defaults | `defaultSiteKitTokenBindings` updated to seed paths |
| Hub | Fixture / Override / Custom status unchanged |

## Acceptance

1. Spec inventory lists every Site Kit atom with required paths.
2. Seed implements inventory (test: every required path present).
3. `defaultSiteKitTokenBindings` paths ⊆ seed paths.
4. Token Studio types each have ≥1 seed leaf.
5. Kit handoff CSS from seed paints Button/Text/Field/Badge without unresolved vars.
6. CD: primary cobalt, paper cream, control radius 0 in seed defaults.

## Implementation waves (suggested)

1. **Spec + knowledge** (this doc) — done when inventory accepted.
2. **Seed expand** — fill catalog + JSON seed; tests for path presence. **Done.**
3. **Atom bind pass** — update Site Kit defaults + Masters to full role set (hover/focus/disabled). **Done.**
4. **Dark mode values** — complete dark column via `starterPackLeavesForTheme`. **Done.**
5. **Mag print facets** — fill print on Mag-critical leaves. **Done.**
6. **Theme-aware Kit CSS** — dark digital emit when user theme = dark. **Done.**
7. **Starter named Master variants** — Button Secondary/Accent/Destructive · Badge Ok/Warn/Danger. **Done.**
