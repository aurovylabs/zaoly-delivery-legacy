# Brand token consume — CREATION v3

**Status:** Accepted (P39–P42 shipped; **P75 / W-TOKEN-STUDIO-EDIT** authoring shell; **CT-18** promote Inspect literal → Brandion) — 2026-08-21  
**Program:** Token consume + thin Brandion authoring UI in CREATION  
**Knowledge:** `knowledge/token-layers.md` · **Tasks:** `tasks/00-token-consume-plan.md`  
**API:** `specs/api/brand-tokens.md`  
**Brandion twin:** `brandion-v3/specs/domain/creation-token-export.md`  
**Depends:** `editor-inspect.md` · `composition-scene.md` · Brandion `design-tokens.md`

## Goal

CREATION inspect and canvas **use Brandion Collection guidelines as SSOT** for customer color, spacing, type (and other visual leaves). Scene JSON stores **paths only**. Digital channel values paint the screen. Designers MAY **edit** existing guideline leaf digital values from a minimal CREATION Token Studio; writes go **only** to Brandion via BFF (no CREATION token store).

## Layers (locked)

| Layer | Owner | In scenes? |
|-------|--------|------------|
| 0 Primitive | `@zaoly/ui` (`--bg0`, `--print-ink`, …) | **No** |
| 1 Brand SSOT | Brandion active guideline | Paths only, via bind |
| 2 Composition | CREATION `tokenBindings` | Yes |

## Requirements (EARS)

### CT-1 Path bind
Inspect TokenPicker MUSS only emit Brandion token **paths**. It MUST NOT write `--bg0`, `--print-*`, free `#hex`, or free `px`.

### CT-2 Vocabulary first
BEVOR live fetch ships, MUSS the fixture catalog use Brandion canonical paths (`color.action.primary`, `spacing.static.medium`, `typography.heading.h1`, `radius.control.md`, …) — not CREATION-invented `space.md` / `color.ink` / `fontSize.xl`.

### CT-3 Live pack
WENN the scene has a real `platformProjectId` AND Brandion returns an active pack, DANN MUSS TokenPicker options and canvas resolve use that pack (active leaves only).

### CT-4 Fallback
WENN Brandion is unset, unreachable, or has no active guideline, DANN MUSS the aligned fixture catalog apply. Same paths as CT-2. MUST NOT invent a third Library token store.

### CT-5 Digital resolve
Für screen nodes MUSS canvas resolve the **digital** channel to CSS (`hex` **6- or 8-digit**, length/`rem`/`clamp`, family/size/weight/lineHeight/letterSpacing, box-shadow, opacity). Scene attrs stay paths (CT-7). Inspect ColorPicker literals MAY use `#rrggbb` / `#rrggbbaa` (same grammar as Brandion digital hex).

### CT-6 Print channel
WENN a node is inside a `PrintPage` (including the visual wrap for orphan `Print*` nodes, and the `Print*` node itself), DANN MUSS canvas resolve Brandion-backed leaves from the **print** channel — not digital (CT-5). Screen nodes (no print ancestor) MUST keep digital.

WENN the print facet is missing, DANN MUSS that property be skipped (do not guess px, do not invent Pantone→hex).

WENN the print value is CSS-paintable (`#hex`, `rgb()`/`rgba()`, `mm`/`pt`/`px`/`rem`/`em`/`%`/`clamp()`, opacity 0–1, shared `family`/`weight`), DANN MUSS it paint as CSS on the canvas. `mm`/`pt` are CSS length units — they MUST paint, not stay as inspect-only labels.

WENN print color has no CSS-paintable value (Pantone / CMYK / RAL only, or print omitted), DANN MAY digital `hex` preview as a conservative screen stand-in. MUST NOT convert Pantone/CMYK/RAL to hex.

WENN print shadow/color/length is not CSS-paintable (e.g. ink note `K 20`), DANN MUSS that property be skipped.

Layer 0 `--print-*` magazine kit MUST stay on `PrintPage` chrome (P38). Bound customer tokens paint **content**. MUST NOT remap `--print-*` onto screen `--color-*` / `--space-*`. Pending leaves still skipped (CT-13). CREATION MUST NOT write print values back to Brandion (CT-8).

### CT-7 Persist paths
`CompositionScene` tokenBindings MUSS persist paths. MUST NOT persist resolved CSS literals.

### CT-8 No local token store
CREATION MUST NOT persist design-token leaves in its own database or scene JSON as a second SoT. Scene `tokenBindings` remain **paths only** (CT-7).

**Zaoly standalone:** the `/tokens` hub MAY persist **local pack overlays** (`token_leaves` / `.data/token-pack.json`) as the default pack when Brandion is unset. Those overlays MUST NOT PATCH Brandion. Spec: `zaoly-token-studio.md`.

### CT-17 In-app Brandion authoring shell (P75 / W-TOKEN-STUDIO-EDIT · P81a Add-leaf)
WENN the designer opens the Tokens rail, DANN MUST Token Studio list the **same Inspect token catalog** in use for TokenPicker/canvas (fixture and/or merged live Brandion pack) — path + resolved digital preview for every active leaf.

**UI IA (compact Variables panel):** Token Studio MUST present a dense Figma/Relume-like Variables chrome in the left rail: search + type filter chips (**with `TokenKindGlyph` type metaphors**), tokens **grouped by type** in collapsible sections (**first section open by default**, others collapsed), **single-line rows** (value `TokenPreview` / color swatch when paint-ready · otherwise `TokenKindGlyph` · short path label · read-only value). Scalar edits MUST open via a **hover/focus edit control** into a small dialog (color → native color picker + hex; other scalars → text). Commit from the dialog (Save / Enter). Long prose hints MUST NOT dominate the panel — use a slim Brandion / read-only status strip. Add-leaf MUST be collapsed behind a `+` control (inline sheet), not a permanent form stack; add-type MUST use kind glyph chips (not a bare `<select>`). PATCH contract below is unchanged. Drag-token-onto-canvas binding is **CT-19**.

### CT-19 Drag Token Studio leaf → canvas bind
WENN the designer drags an active catalog leaf from Token Studio onto a canvas node, DANN MUST CREATION bind that **path** onto a default Inspect field for the leaf's Brandion type (same write path as Inspect: clear literal via `set_prop` + `set_token_binding`). MIME: `application/x-zaoly-brand-token` with JSON `{ path, type }`. MUST NOT persist resolved CSS.

**Default binding keys (node-aware via `inspectFieldsForType`):**

| Brandion type | Prefer (first present) | Else |
|---------------|------------------------|------|
| `color` | Surfaces: `background`; text leaves: `color` | then `borderColor` |
| `spacing` | `gap` | `padding`, then `margin` |
| `radius` | `radius` | — |
| `opacity` | `opacity` | — |
| `size` | `width` | `height` |
| `typography` | **all** present facet keys among `fontFamily` / `fontSize` / `fontWeight` / `lineHeight` / `letterSpacing` with the **same** path (CT-11) | — |

WENN no matching Inspect field exists on the node type, OR the node is locked / hidden, DANN MUST reject the drop (drop chrome `Can't drop`). Shadow/asset and other non-studio types MUST reject.

**Expand / Instance targets (Zaoly landing sections):** WENN the drop hotspot is an **expanded** descendant (`hostId::defPath`) or a section **Instance** shell that paints as a bindable type, DANN MUST CT-19 resolve the **painted** node type (via expand) and write with the same expand-id / Instance path as Inspect (`set_token_binding` → `instanceOverrides.descendants` when needed). MUST NOT require Detach for token bind on the default landing.

Drop chrome MUST reuse the existing `data-drop-*` ghost (edge `into`) with a bind label (`Bind background`, `Bind gap`, `Bind type`, …). Hotspot zones (fill vs stroke), modifier keys for alternate fields, and multi-select drop are out of this wave.

Fixture catalog leaves MAY drag-bind (paths only); Brandion write is unrelated.

WENN the scene has a live Brandion pack (`source: 'brandion'` + `guidelineId`), DANN MAY the designer edit **digital** channel scalars for studio-editable types (color hex, spacing/radius/size length, opacity) and Add new leaves.

WENN the designer saves a leaf, DANN MUSS CREATION BFF `PATCH /api/brand-tokens` proxy to Brandion `PATCH /api/guidelines/:guidelineId/tokens` with service secret (CT-12). Persistenz MUSS Brandion bleiben (BT-1).

**P81a / W-TOKEN-STUDIO-ADD · P82a Typography Add · CT-20 structured types:** WENN the designer submits a **new** path + studio-editable type + value, DANN MUSS the same `PATCH` create the leaf in Brandion (upsert). Path MUST match Brandion grammar and type root (`color.*`, `spacing.*`, `radius.*`, `opacity.*`, `size.*`, `typography.*`, **`shadow.*`**, **`logo.*` / `asset.*`**). Scalar types use a digital scalar; **typography** / **shadow** / **asset** use structured digital fields (Brandion leaf shapes). CREATION MUST NOT invent CREATION-only aliases or persist leaves locally. Print-channel authoring and Brandion asset **binary upload** remain out of this wave (URI `src` only for asset).

### CT-20 Typography list-edit + Shadow/Asset Add (Brandion-shaped digital)
WENN the scene has a live Brandion pack, DANN MUST Token Studio allow **list edit** of **typography** leaves via the same hover→dialog pattern as scalars, with digital fields mirroring Brandion `TokenTypedFields`: `family` (shared) + digital `size` / `weight` / `lineHeight` (optional). MUST preserve existing `print` / `source` / other siblings on PATCH. `letterSpacing` and font `source` MAY stay omitted from CREATION chrome (Brandion typed UI also omits them; Spec/Contract still allow Raw).

WENN Add type is **shadow**, DANN MUST CREATION collect a single-layer **digital** shadow (`offsetX`, `offsetY`, `blur`, `spread`, `color`, optional `inset`) and PATCH `type: "shadow"` under `shadow.*` — same shape as Brandion design-tokens B.4.

WENN Add type is **asset**, DANN MUST CREATION collect digital URI metrics (`label?`, `src`, `format?`, `minWidth?`) and PATCH `type: "asset"` under `logo.*` or `asset.*` — URI-ref only (BT asset binary upload stays Brandion Studio).

WENN Fixture / no guideline, DANN MUST NOT enable these writes. Shadow/asset **list edit** MAY reuse the same dialog once a live leaf exists.

Print-channel Add/Edit and multi-layer shadows remain out of this wave.

WENN Fixture / no guideline, DANN MUST the studio still **list** the fixture catalog (read-only) and MUST NOT fake Brandion writes.

CREATION MUST NOT invent types outside the studio-editable set for writes.

### CT-18 Promote Inspect literal → Brandion leaf
WENN Inspect TokenPicker shows a **literal** digital value (no token bound) for a studio-scalar group (`color`, `space`→`spacing`, `radius`, `opacity`, `size`) AND the scene has a live Brandion pack, DANN MUST the strip offer an explicit **promote** control (Plus).

WENN the designer activates promote, DANN MUST a small dialog collect a Brandion **path** (prefilled suggestion under `{type}.custom.*`) with the literal value shown read-only.

WENN the designer confirms a valid unused path, DANN MUST CREATION:
1. `PATCH /api/brand-tokens` upsert the leaf (same as P81a),
2. refresh the Inspect catalog,
3. **bind** the field to the new path (`set_token_binding`) and clear the raw prop literal.

WENN the pack is fixture / missing `guidelineId`, DANN MUST NOT show promote. WENN the literal is empty, mixed, invalid for the type, or a token is already bound, DANN MUST NOT show promote. Typography facet fields are out of this wave (use Token Studio Add).

Promote MUST NOT auto-create leaves on every keystroke.

### CT-9 No hardcoded URLs
Brandion base and pack routes MUSS go through `apps/web/lib/paths.ts` + `runtime-config.ts` and be listed in `knowledge/paths.md`.

### CT-10 Group map
TokenPicker group filters MUSS follow the inspect-group → Brandion type map in Design below.

### CT-11 Typography facets
WENN a node field is fontFamily / fontSize / fontWeight / lineHeight / letterSpacing, DANN MUSS the picker list **typography** leaves. The binding path is the leaf (`typography.heading.h1`). Resolve uses the **facet** for that field (family, digital.size, weight, digital.lineHeight, digital.letterSpacing). Multiple type fields on one node MAY share one path.

WENN TokenPicker shows a bound typography option (or the bound strip), DANN MUST the visible label prefer the **resolved facet value** for that field (font family name, size length, weight number, line-height) — not the raw path leaf alone (e.g. not only `Family`). Role may appear as a short suffix for disambiguation (`Geist · Body`, `2rem · H1`).

### CT-12 Secret stays server-side
Browser MUST NOT receive `ZAOLY_SERVICE_SECRET`. Live consume goes CREATION BFF → Brandion.

### CT-13 Pending leaves
Pending Brandion leaves MUST NOT appear in inspect options or canvas resolve.

### CT-14 Deposit spacing ladder → Stack/Grid gap
WENN a node binds `tokenBindings.gap` to `spacing.static.1` … `spacing.static.6` (DS-DEPOSIT pack), DANN MUSS `layoutGapFromBindings` map onto `@zaoly/ui` Stack/Grid gap ids (`xs`…`xl`) so canvas layout paints. Fixture aliases `spacing.static.small|medium|large` MUST keep working. MUST NOT invent CREATION-only path aliases.

| Path leaf | Stack `gap` |
|-----------|-------------|
| `1` | `xs` |
| `2` / `small` | `sm` |
| `3` | `md` |
| `4` | `lg` |
| `5` / `6` | `xl` |
| `medium` | `md` (fixture demo) |
| `large` | `lg` (fixture demo) |

### CT-15 Spacing role leaves + margin inspect (D7 / W-SPACING-ROLES)
WENN the active pack includes role leaves `spacing.padding.*` / `spacing.margin.*` / `spacing.gap.*`, DANN MUSS TokenPicker `space` list them beside `spacing.static.*` (same type `spacing`).  
WENN a node exposes padding token fields, DANN MUSS it also expose **margin** fields (`margin`, `marginTop`…`marginInline`) with `tokenGroup: 'space'`. Bindings MUST resolve via `resolveTokenBindingsToStyle` / surface props to CSS margin.  
WENN `tokenBindings.gap` is a D7 role path (`spacing.gap.tight`, `spacing.gap.modules`, `spacing.gap.sm`, …), DANN MUSS `layoutGapFromBindings` map via the role→static table (Brandion path map). Role rem MUST equal the aliased static step — CREATION MUST NOT invent a second scale or zaoly-ui `--padding-*` / `--margin-*`.

### CT-16 DS variant consume hint (D5)
The D5 consume map (`apps/web/lib/ds-deposit/component-semantic-map.json`) remains the reference for which Brandion paths `@zaoly/ui` variant classes already paint via CSS vars.

WENN a node is selected, DANN MUST NOT Inspect show a **Consumes** / **Bind suggested** chrome block (removed — cluttered Appearance without actionable bind UX).

MUSS NOT auto-write `tokenBindings` on select. MUSS NOT restyle Layer 0 DS CSS from Brandion at runtime. TokenPicker remains the write path for scene-node overrides.

Copied map: `apps/web/lib/ds-deposit/component-semantic-map.json` (canonical `brandion-v3/knowledge/ds-deposit-component-semantic-map.json`). No runtime Brandion package dependency.

## Design

### Path grammar (Brandion SoT)

Copy Brandion `specs/domain/design-tokens.md` Path vocabulary. Fixture catalog in P39 is the **Zaoly visual subset** already seeded in Brandion fixtures (active only):

| Inspect `TokenGroupId` | Brandion `type` / prefix | Digital CSS |
|------------------------|--------------------------|-------------|
| `color` | `color` / `color.*` | `digital.hex` |
| `space` | `spacing` / `spacing.static.*`, `spacing.fluid.*`, `spacing.padding.*`, `spacing.margin.*`, `spacing.gap.*` | digital length |
| `radius` | `radius` / `radius.*` | digital length |
| `opacity` | `opacity` / `opacity.*` | digital alpha |
| `shadow` | `shadow` / `shadow.*` | digital box-shadow |
| `size` | `size` / `size.*` | preferred / clamp |
| `fontFamily` | `typography` | `family` |
| `fontSize` | `typography` | `digital.size` |
| `fontWeight` | `typography` | `weight` |
| `lineHeight` | `typography` | `digital.lineHeight` |
| `letterSpacing` | `typography` | `digital.letterSpacing` |
| `blur` / `rotate` / `gradient` | no Brandion type yet | keep local fixture **or** omit from live pack; do not invent Brandion types in this program |

Default demo bindings (P39):

| Field | Path |
|-------|------|
| color (body/headline) | `color.neutral.700` (ink stand-in) or `color.action.secondary` |
| font* (headline) | `typography.heading.h1` (all facets, one path) |
| font* (body) | `typography.body.family` |
| gap / padding | `spacing.static.medium` |

Exact mapping table for the fixture file lives in `knowledge/token-layers.md` (kept in sync by T1).

### Resolve

Input: path + inspect field (or CSS prop) + **channel** (`digital` | `print`).  
Lookup leaf in current pack (live or fixture).  
Screen nodes take `digital` (CT-5). Nodes inside `PrintPage` (incl. visual wrap) take `print` (CT-6).  
Helper: `apps/web/lib/inspect/digital-css.ts` — `digitalCssForLeaf` / `printCssForLeaf` (same value contract; channel argument).  
Output: CSS string for `resolveTokenBindingsToStyle`. Missing facet → skip that property (do not guess px). Color print without CSS-paintable ink MAY use digital hex (CT-6).

### Fetch

Editor (session) → `GET /api/brand-tokens?platformProjectId=` (CREATION).  
BFF → Brandion `GET /api/guidelines/active-pack?platformProjectId=` with service secret + contract headers when `BRANDION_API_URL` set.  
Dummy/unset Brandion → 204/empty → fixture.

### `@zaoly/ui`

No DS change required. TokenPicker already binds paths. Do not hoist DTCG parse into the DS.

## Workstreams

| Id | Parity | Owner | Ships |
|----|--------|-------|--------|
| **W-TOKEN-VOCAB** | P39 | creation-v3 | CT-1, CT-2, CT-7, CT-10, CT-11 (fixture) |
| **W-TOKEN-RESOLVE** | P40 | creation-v3 | CT-5, CT-13 (parse digital from Brandion-shaped values) |
| **W-TOKEN-CONSUME** | P41 | creation-v3 | CT-3, CT-4, CT-8, CT-9, CT-12 |
| **W-TOKEN-PACK** | Brandion | brandion-v3 | active-pack endpoint (BT-*) |
| **W-TOKEN-PRINT** | P42 | creation-v3 | CT-6 |
| **W-TOKEN-DEPOSIT-SMOKE** | D4 | creation-v3 | CT-3 + CT-14 against Zaoly Collection pack |
| **W-TOKEN-CONSUME-MAP** | D5 | creation-v3 | CT-16 inspect Consumes hint (copied map) |
| **W-TOKEN-PUSH** | — | deferred | not this program |

P39 MAY ship without Brandion. P41 MUST NOT ship before P39+P40 and Brandion W-TOKEN-PACK.

## Non-goals

- CREATION → Brandion upsert
- Binding Layer 0 primitives
- Arbitrary named channels
- Plexon-hosted token JSON
- Measuring CREATION HTML/PDF in Brandion (later evidence adapter)
- Changing `@zaoly/ui` TokenPicker contract

## Acceptance

1. Fixture catalog paths are a subset of Brandion path vocabulary (CT-2). Tests fail if `space.md` / `color.ink` remain.
2. Demo Text/Heading bindings use Brandion paths; canvas still paints (P40).
3. With Brandion URL + active guideline, inspect lists those colors/spacing/type (P41).
4. With Brandion down, inspect still lists fixture paths (CT-4).
5. No write route to Brandion tokens from CREATION (CT-8).
6. Inside `PrintPage`, bound spacing/type paint print `mm`/`pt` when CSS-paintable; color without print hex MAY use digital hex; screen nodes still resolve digital (P42 / CT-6).
7. D5 / CT-16: consume map stays in-repo for tooling; Inspect MUST NOT render Consumes UI. No auto-bind.
