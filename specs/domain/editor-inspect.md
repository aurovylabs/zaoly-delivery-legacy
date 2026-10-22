# Editor inspect — CREATION v3

**Status:** Accepted (**Wave E4.1 done**; **P16/P17/P22/P23 shipped**; **P83 box-model compact**; **P84 auto-layout flow + align**; **P85 gap expand + opacity slider**; **P86 constraints size-box compact**; **P87 fill triplet compact**; **P88 alignSelf 9-point**; **P89 typography compact**; **P90 rotate→constraints + appearance effects**; **P98 layout clarity + grid glyphs**; **P30 form types + P32 DS atoms + P33 molecules + P34 list/layout in registry**; **P35 palette groups**; **P36 print**; **P37 personas**; **P38 print surface**; **P39 vocab green**; **P40 resolve green**; **P41 Brandion consume shipped**; **P42 print-channel green**; **P43 EntityCard**; **P44 atomic slots**; **P45 molecule shells**; **P46 print slots**; **P47 copy slots**; **P48 print leaves**; **P49 print lists**; **P50 remaining print arrays**; **P51 persona shell**; **P52 row hit-test**; **P53 print identity**; **P54 / W-SURFACE-EDIT**; **P55 / W-SURFACE-GRAIN**; **P56 / W-INSPECT-LIVE**; **P57 / W-PRINTCHIP-INSPECT**; **P58 / W-SURFACE-ALL**; **P59 / W-ATOM-REMAINING**; **P62 / W-UI-FINETUNE**; **P64 / W-FLOAT-RAILS**; **P65 / W-RAIL-RESIZE**; **P66 / W-RAIL-DOCK-TB**; **P71 / W-COLLECTION-PICKER**; **P76 / W-TOKEN-PICKER-LENGTH**; **P77 / W-TOKEN-PICKER-BROWSER**) — 2026-08-14 · **P98 2026-09-09**  
**Depends:** `editor-workspace.md`, `composition-scene.md`, `brand-token-consume.md`, `canvas-smart-hud.md` (HUD ranks Inspect fields; Inspect stays SSOT), Zaoly Spec 5 S-4 / `knowledge/inspect-ux-target.md` (reference only)  
**Knowledge:** `knowledge/editor-inspect-port.md` · `knowledge/editor-inspect-density.md` · `knowledge/editor-inspect-literals.md` · `knowledge/token-picker-length-p76.md` · `knowledge/token-picker-browser-p77.md` · **Smart HUD matrix:** `knowledge/canvas-smart-hud.md` · **UI finetune:** `knowledge/editor-ui-finetune.md` · **Deferred:** `knowledge/editor-parity-deferred-plan.md`

Surface completeness before nesting remains the completeness criterion for print/digital shells.

## Goal

Penpot/Figma-dichte **Design-Inspect**-Sektionen im In-App-Editor — Werte als **Token / Enum / Contract-Prop**. **P56 exception:** surface geometry and chrome (W/H, min/max, padding, radius, opacity, border*, fill, color) MAY be typed as CSS literals; `set_prop` persists and paint honors them. **P76:** TokenPicker is restored for length groups with Brandion recommendations. **Hybrid strip (2026-08-20):** one `@zaoly/ui` TokenPicker with `allowLiteral` — tippen = literal, Browser = binding (kein separates Input + „… token“-Label). **Google Fonts (2026-08-20):** Font Family browser scope `Google` lists the full Google Fonts catalog (static JSON); pick writes CSS family **literal** (`gf:` → `writeLiteral`). Scene loads used families on-demand via CSS2 (`useSceneGoogleFonts`). Brandion paths remain Suggested/group bindings. **P77:** TokenPicker opens Zaoly multi-context browser (search/scopes/Recent/drag/previews/cycle). Unset shows placeholder `—` and still accepts input. Do not hide empty optional groups.

## E4.1 — done

Sectioned inspect shipped for Top-N: field catalog, TokenPicker bindings, clear binding, canvas preview resolve.

## P23 — Zaoly-density inspect (2026-08-12)

Registry MUST expose Penpot-dense keep-props (not a thin stub):

- **Auto layout:** direction / align / justify / wrap as **segmented** controls; `gap` token-bindable; padding + **side / axis** tokens (`paddingTop`… / `paddingBlock` / `paddingInline`); **margin** + sides / axes (`margin` / `marginTop`… / `marginBlock` / `marginInline`) with `tokenGroup: space` (D7 / W-SPACING-ROLES).
- **Appearance:** radius, opacity, shadow, **blur**, overflow. **Overflow** (`visible` \| `hidden` \| `scroll` \| `auto`) applies to **all** Inspect node types with an Appearance surface (`SHARED_APPLIES.overflow = '*'`), including Site Kit shells — not only Stack/Grid/Card/Image/Panel/ScrollArea.
- **Constraints:** width \| height paired; min/max size tokens; `alignSelf`; **rotate** (geometry).
- **Typography:** fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textAlign, decoration/transform.
- **Fill:** color, background, borderColor/Width/**Style**, gradient (token).
- **Card** is a surface (gap + shared styles), not an empty stub.

Values remain **token / enum / contract** — never free `px` / `#hex`. Token fixture catalog MUST cover the new groups (`fontFamily`, `lineHeight`, `letterSpacing`, `blur`, `rotate`).

Inspect chrome MUST be design-tool dense: TokenPicker is a compact popover (not an always-open list); palette labels are type names only; Type/Id meta is omitted from the Design tab.

## P83 — Box-model compact (Figma) (2026-08-23)

Registry **keeps** all padding / margin side / axis / corner keys (round-trip, CSS peek, overrides). UI **default collapsed:** side and corner keys MUST NOT appear in the flat field list.

- **Padding / Margin compact:** one row with **Block + Inline** (vertical / horizontal). When only the uniform key is set (`padding` / `margin`), show a **single uniform** TokenPicker instead.
- **Radius compact:** one **uniform** `radius` field. Expand reveals `radiusTopLeft` … `radiusBottomLeft`.
- **Expand toggle:** icon control on the group header; persisted in `sessionStorage` key `creation-editor-inspect-box-expanded` (`padding` | `margin` | `radius` → bool).
- **Auto-expand:** when stored values diverge (per-side padding, per-corner radius, or mixed representations), the group MUST open expanded and compact fields MAY show `editor.mixedValue`.
- **Write rules (one `onOps` batch = one undo step):**
  - Uniform write → set uniform key; clear all side / axis / corner siblings in the group.
  - Axis write (Block / Inline) → set axis key(s); clear uniform + four sides.
  - Side / corner write → set side or corner key; clear uniform + axis (padding / margin) or uniform (radius).
- **Mixed-value:** multi-select with differing box-model values shows mixed in compact controls.

## P84 — Auto-layout flow + align compact (2026-08-23)

Registry **keeps** `direction`, `wrap`, `align` / `alignItems`, `justify` / `justifyContent`, and `alignContent`. UI MUST NOT render Flow / Align keys as tall per-field rows when the compact groups are used.

- **Flow row:** one compact row with `direction` + `wrap` Icon-`ToggleGroup` controls (aria-labels; no tall Field labels).
- **Align bar:** one row with Justify and Align ToggleGroups side by side (micro-labels). Prefer `justify` over `justifyContent`, and `align` over `alignItems`, when both aliases exist in the catalog for the selection.
- **9-point matrix:** the compact Align group additionally exposes a spatial 3×3 control. It maps horizontal/vertical axes through `direction`, writes the selection’s justify/align keys together (**P98:** Stack → `justify` + `align`; Flex shells → `justifyContent` + `alignItems`). Distribute cycles **Packed → Even (`space-between`) → Around (`space-around`) → Packed**. **Stretch** toggles cross-axis `align` / `alignItems` (`stretch` ↔ packed start). **P98** removes the duplicate segmented Justify/Align row beside the matrix.
- **`alignContent`:** MUST appear in the flat list only when `wrap` is true (`true` / boolean true).
- Write path remains existing `set_prop` / breakpoint override (no sibling clear batch).
- Gap Expand and Opacity slider remain out of scope for P84.

## P98 — Layout clarity: Flex vs Grid (2026-09-09)

Layout inspect MUST frame Flex and Grid as different modes — not one “Auto layout” wall with a nested “CSS Grid Container”.

- **Section title:** `layout` Collapsible title is **Flex layout** for Stack / flex shells, and **Grid layout** for `Grid` / `SiteGrid` / `PrintPersonaGrid` (and other catalog grid parents). Default English fallback “Auto layout” remains only when type is unknown.
- **Flex selection:** Flow → Align matrix (+ Packed/Even) → Gap → box model. MUST NOT render a second segmented Verteilen/Ausrichten row next to the matrix.
- **Align write/read:** Matrix MUST use the same prop keys the catalog exposes for the type (`align`/`justify` on Stack; `alignItems`/`justifyContent` on flex shells). Read current matrix state from those keys (with CSS-alias fallback for legacy scenes).
- **Grid selection:** Spalten-Presets (grouped: Equal / Responsive / Splits) → cell `justifyItems` / `alignItems` → Gap → box. Template cols/rows and auto-flow/rows/cols live behind collapsed **Advanced**. WHEN `gridTemplateColumns` is in the catalog, MUST NOT also render the `columns` enum as a parallel control (presets write template ± optional `columns` clear/sync).
- **Grid glyphs:** Column presets and Constraints col/row span chips MUST show a compact SVG (or native) track diagram above the short label — equal columns, auto-fit/fill density, splits, and span fill states — so the control reads as layout, not opaque CSS enums. Glyphs come from `@zaoly/ui` (`InspectLayoutGlyphs`); fills use `--ink`, accents `--accent` (readable on light and dark). Active tiles use brand tokens (no hardcoded white/blue fills).
- **Cell park glyphs:** Grid `justifyItems` / `alignItems` MUST use `CellParkGlyph` tiles (start / center / end / stretch × h|v), not flat enum selects. Write path remains `set_prop`.
- **Distribute glyphs:** Flex Packed/Even toggle MUST show `DistributeGlyph` beside the label.
- **Clip preset glyphs:** Compact Clip/Slant presets MUST use `ClipPresetGlyph` silhouette tiles (`CLIP_PRESET_IDS`), not a lone `<select>`. Amount / Advanced remain.
- **Follow-on glyph tiles (same catalog):** Flex `direction` / `wrap`, Grid Advanced `gridAutoFlow`, Constraints `position`, Appearance `overflow`, Fill `borderStyle` + `backgroundPosition` (5-point) MUST use the matching `@zaoly/ui` layout glyphs (`FlowDirectionGlyph`, `WrapGlyph`, `AutoFlowGlyph`, `PositionGlyph`, `OverflowGlyph`, `BorderStyleGlyph`, `BgPositionGlyph`) instead of text-only segmented / select / pills. Dual-ship Web + macOS where the control exists.
- **Self-park / nine-point / text / aspect:** `alignSelf` stretch|auto modes and segmented `justifySelf` / `alignSelf` use `SelfParkGlyph`; media Object Position and `transformOrigin` use `NinePointGlyph` / aliases (theme tokens, no letter pills / hardcoded blue); typography `textAlign` and constraints `aspectRatio` use `TextAlignGlyph` / `AspectRatioGlyph` via icon ToggleGroup. Gap expand toggle + axis rows use `GapAxisGlyph`. SiteKit `columns` enum and `orientation` use `GridColumnGlyph` / `GapAxisGlyph`. `DisplayModeGlyph` remains catalog-ready until a display control ships.
- **Labels:** Prefer designer wording (“Grid layout”, “Columns”) over “CSS Grid Container”.
- **Constraints `alignSelf`:** remains under Constraints (child vs container) — not folded into Flex/Grid layout.
- **Dual-ship:** Web + macOS Inspect MUST share this IA (titles, matrix-only flex align, grouped presets + Advanced on grid, glyph tiles for presets/span/cell-park/distribute/clip/flow/position/overflow/border/bg-pos).

## P85 — Gap expand + Opacity slider (2026-08-23)

- **Gap compact:** one uniform `gap` TokenPicker row with expand toggle; expanded reveals `rowGap` + `columnGap` (registry keys; same `space` token group).
- **Write rules (one `onOps` batch):** uniform write clears `rowGap`/`columnGap`; axis write clears uniform `gap`.
- **Auto-expand** when only axis keys are set or values diverge (`mixed`).
- Session key `creation-editor-inspect-gap-expanded` (bool).
- **Opacity:** Appearance renders `@zaoly/ui` `Slider` (0–100%) + percent input beside the existing TokenPicker strip; slider/`%` writes a 0–1 CSS literal via `set_prop` and clears a bound opacity token. Token binding remains available.

## P86 — Constraints size-box compact (2026-08-23)

Registry **keeps** `width`, `height`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`, and `alignSelf`. UI MUST NOT render size keys as tall standalone Field rows when the compact size-box group is used.

- **Size box:** one compact group with **W | H** pair (short labels `W` / `H`; full prop name in `aria-label` / `title`). Header shows a **Hug / Fixed** summary badge (`W Hug · H Fixed` when bound or literal width/height is set).
- **Axis modes:** Width and Height each expose Hug / Fill / Fixed. Hug writes `auto`, Fill writes `100%`, and Fixed preserves an existing fixed value or seeds `200` width / `120` height literals.
- **Nested containment:** WHEN an ancestor has a fixed width/height, Hug/Fill descendants MUST NOT paint wider/taller than that ancestor (`applyLayoutContainment` — `min-*: 0` + `max-*: 100%`; see `knowledge/layout-containment-nested-width.md`). Fixed literals are unchanged.
- **Size mode glyphs:** each Hug / Fill / Fixed control MUST show a compact framed diagram from `@zaoly/ui` (`SizeModeGlyph`) — content hug / stretch-to-parent / fixed tick. Strong fills MUST use `--ink` (not `#fff`); accents MUST use `--accent`. Same language as Grid glyphs; dual-ship Web + macOS.
- **Expand toggle:** reveals `minWidth | maxWidth` and `minHeight | maxHeight` pairs (`minW` / `maxW` / `minH` / `maxH` labels).
- Session key `creation-editor-inspect-size-expanded` (bool).
- **Auto-expand** when any min/max key is set.
- **`alignSelf`:** remains a flat segmented row (not inside the size box). **P88** replaces that flat row with the 9-point pin.
- Write path: existing `set_prop` / token binding per key — no sibling-clear batch (independent axes).

## P87 — Fill & stroke triplet compact (2026-08-23)

Registry **moves** `color`, `background`, `gradient`, `borderColor`, `borderWidth`, and `borderStyle` to section `fill` (Fill & stroke). Appearance keeps radius / opacity / shadow / blur / overflow (`rotate` moves to Constraints in **P90**).

- **Triplet (default):** one compact row with Fill (`background`) · Color (`color`) · Stroke (`borderColor`) TokenPickers. Short labels `Fill` / `Color` / `Stroke`; full prop names remain `aria-label` / TokenPicker a11y.
- **Expand toggle:** reveals `borderWidth`, `borderStyle`, and `gradient` (flat / paired as today).
- Session key `creation-editor-inspect-fill-expanded` (bool).
- **Auto-expand** when any expand-only key is set (`borderWidth` / `borderStyle` / `gradient`).
- Write path: existing `set_prop` / token binding per key — no sibling-clear batch.

## P88 — Align-self 9-point compact (2026-08-23)

Registry **keeps** `alignSelf` enum (`auto` / `stretch` / `flex-start` / `center` / `flex-end`). UI MUST NOT render Align self as a tall segmented ToggleGroup when the compact pin is used.

- **9-point pin:** Constraints renders a compact **3×3** pin grid. Row click maps to cross-axis park:
  - top row → `flex-start`
  - middle row → `center`
  - bottom row → `flex-end`
- **Stretch** and **Auto** sit as icon buttons beside the grid (same `set_prop` path).
- Active cell(s) in the matching row highlight; Stretch/Auto highlight when that value is set.
- Clicking the active Stretch/Auto again MAY write `auto` (clear park). Clicking an already-active pin row MAY write `auto`.
- Write path: existing `set_prop` / breakpoint override — no sibling-clear batch.

## P89 — Typography compact (2026-08-23)

Registry **keeps** `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `textAlign`, `textDecoration`, and `textTransform`. UI MUST NOT render Typography as tall standalone Field rows when the compact type group is used.

- **Type stack:** Typography section renders one compact group:
  - full-width `fontFamily`
  - pair `fontSize` \| `fontWeight` (short labels `Size` / `Wt`)
  - pair `lineHeight` \| `letterSpacing` (short labels `LH` / `Track`)
- **Text chrome bar:** one row with bare Icon-`ToggleGroup` controls for `textAlign`, `textDecoration`, and `textTransform` (micro-labels; full prop names remain `aria-label`).
- Write path: existing `set_prop` / token binding / breakpoint override — no sibling-clear batch.
- Full prop names remain TokenPicker / control a11y; compact labels only in the type stack.

## P90 — Rotate in Constraints + Appearance effects compact (2026-08-23)

Registry **moves** `rotate` from section `appearance` to section `constraints` (geometry / transform, next to size and alignSelf — not an effect). Appearance keeps `radius`, `opacity`, `shadow`, `blur`, and `overflow`.

- **Constraints rotate:** after size-box + alignSelf pin, Constraints renders a compact `rotate` TokenPicker row (short label `°`; full prop name remains a11y).
- **Appearance effects:** Appearance renders one compact group for remaining effect chrome:
  - full-width `shadow`
  - compact `blur` (short label `Blur`)
  - bare Icon-`ToggleGroup` for `overflow` (micro-label) — available on every Appearance-capable type (`SHARED_APPLIES.overflow = '*'`)
- Radius (P83) and Opacity slider (P85) stay as today; they are NOT folded into the effects group.
- Write path: existing `set_prop` / token binding / breakpoint override — no sibling-clear batch.

## P91 — Container Background Media & Image Fills (2026-09-07)

Every container and surface node (`Stack`, `Grid`, `Card`, `Button`, `Panel`, `FormSection`, `Box`, `Section`, `Container`, `SiteStack`, `SiteContainer`, `SiteGrid`, `SiteCard`, `SiteSection`, `SiteHero`, `Page`) MAY carry a background image fill in addition to solid background colors.

- **Keys in Fill section:**
  - `backgroundImage`: string URL, data URL, or CSS `url(...)`.
  - `backgroundSize`: enum `cover` (default), `contain`, `auto`.
  - `backgroundPosition`: enum `center` (default), `top`, `bottom`, `left`, `right`.
  - `backgroundRepeat`: enum `no-repeat` (default), `repeat`.
  - `backgroundOverlay`: string tint or gradient (e.g. `rgba(0,0,0,0.5)` or `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8))`) layered over the image for WCAG typography contrast.
- **Inspect UI in Fill & stroke:**
  - **Immediate Header & Compact Actions:**
    - The Fill header exposes an explicit `+ Image` / `Image` button alongside the expand toggle so image fill capability is always visible without needing to guess what the droplet icon does.
    - In the compact row (`!expanded`), an immediate `+ Background Image` trigger and Sparkles Asset Library shortcut are rendered directly below the color triplet swatches.
    - When a background image is set, a compact thumbnail preview chip shows the active image with click-to-edit and instant remove actions even when the panel is collapsed.
  - When expanded & unset: displays "Add Background Image" card with local File Chooser (converts to base64 Data URL), 4 curated high-res stock photo presets (Architecture, Nature, Abstract, Dark Mood), direct URL input, and "Browse Asset Library & Unsplash..." primary button.
  - When expanded & set: displays thumbnail image preview chip, Size toggle (`cover` / `contain` / `auto`) as **fit glyph tiles** (frame + image crop metaphor shared with Image `objectFit`), Position picker, Overlay tint selector, change from library button, and 1-click "Remove Background" action.
  - Image `objectFit` chips use the same fit glyph tiles (`cover` / `contain` / `fill` / `none` / `scale-down`). Dual-ship Web + macOS.
- **Asset Library Toolbar Integration & Canvas Artboard Fallback:**
  - When opening the Asset Library from the top toolbar without an explicit child node selected (`selectedId === null`), "Apply as Container Background" automatically targets the active artboard / page container (`pageRoot.id`).
  - Dialog button explicitly reflects the target: `Apply as Background (${targetNodeName})`.
- **Canvas Rendering Parity:**
  - Web `SceneNodeView` composes CSS `background-image`, `background-size`, `background-position`, and `background-repeat`.
  - macOS `NativeSceneHTMLRenderer` and `NativeNodeView` mirror the exact background CSS composition.
  - Code Export formats into Tailwind (`bg-[url(...)] bg-cover bg-center`) and SwiftUI (`.background(...)`).

## Canvas Smart HUD vs Inspect (2026-09-11 · layout ownership 2026-10-10)

The Canvas Floating HUD Smart edit lane (concept freeze: `specs/domain/canvas-smart-hud.md` · matrix/situations/algorithms `knowledge/canvas-smart-hud.md`) is a **ranked subset** of the same fields and structure ops Inspect already owns. Inspect remains the **SSOT** for the full property surface (all sections, literals where allowed, breakpoint/state overrides, long strings). The HUD MUST NOT invent a parallel prop vocabulary; implementation MUST rank existing `site-kit-fields` / `SHARED_STYLE_PROPS` / scene ops via a separate `hudQuickSlotsByFamily` registry (not `hudRank` on `ContractPropDef`). W1 disables HUD writes when Inspect pseudo-state ≠ default; W4 may write state overrides. Context menu (P28) and HUD `⋯` MUST share enablement rules.

**Flex / align ownership (2026-10-10):** Inspect **Flex layout** owns direction, wrap, justify/align matrix, and the full gap group. HUD `layoutStack` MUST NOT expose direction / justify / align (those duplicated the Align bar). HUD MAY keep gap · width · pad · margin as spacing/size craft. Spatial multi-align stays HUD-only (P92). See `knowledge/inspector-hud-layout-ownership.md`.

**Site Kit catalog filter (2026-10-10):** Site Kit inspect MUST merge shared styles via typed aliases (`SITE_KIT_TYPED_ALIAS` → `sharedStylePropsForType`), not the unfiltered `genericCatalogInspectProps()` dump. Grid chrome MUST mount only for grid parents; Image media props MUST render once through `InspectMediaGroup`. See `knowledge/inspector-uniformity.md`.

## P92 — Multi-Selection Spatial Alignment & Distribution Actions (2026-09-07 · ownership 2026-10-10)

When more than one node is selected (`selectedCount > 1` / `selectedIds.length > 1`), spatial alignment and distribution actions MUST be accessible in the **Canvas Floating HUD only** (not duplicated at the top of the Inspector). Ownership: `knowledge/inspector-hud-layout-ownership.md`.

- **Alignment Actions:**
  - **Align Left:** aligns left edges of all selected nodes to the minimum left bounding coordinate (`minLeft`).
  - **Align Center:** aligns horizontal midpoints of all selected nodes to the union bounding center (`midX`).
  - **Align Right:** aligns right edges of all selected nodes to the maximum right bounding coordinate (`maxRight`).
  - **Align Top:** aligns top edges of all selected nodes to the minimum top bounding coordinate (`minTop`).
  - **Align Middle:** aligns vertical midpoints of all selected nodes to the union bounding center (`midY`).
  - **Align Bottom:** aligns bottom edges of all selected nodes to the maximum bottom coordinate (`maxBottom`).
- **Distribution Actions (3+ nodes):**
  - **Distribute Horizontally:** calculates total available span between the first and last sorted nodes, and spaces intermediate nodes with identical horizontal gaps.
  - **Distribute Vertically:** calculates total available span between the highest and lowest sorted nodes, and spaces intermediate nodes with identical vertical gaps.
- **Atomic Operations:** All multi-node coordinate updates MUST emit as a single `onOps(ops)` batch for single-step undo/redo.

## P93 — Media & Asset Library Manager (2026-09-07)

A unified Asset Library Manager modal is available across Web (`apps/web`) and macOS Native (`apps/macos`) to discover, manage, and assign photography and graphic assets without context switching.

- **Trigger Points:**
  - Workspace Topbar "Assets" button.
  - "Browse Asset Library..." action button in `InspectFillGroup` (container background image).
  - "Browse Asset Library..." action button in `InspectMediaGroup` (image element `src`).
  - Canvas Smart HUD `Image…` hostAction (`openAssetLibrary`, image mode).
- **Dialog chrome (Web, 2026-09-11):**
  - MUST override default `@zaoly/ui` Dialog `max-width: 28rem` via `.creation-editor-asset-library-dialog` (same pattern as HTML preview).
  - Width/height MUST be viewport-flexible (`min(92vw, 64rem)` / `min(88vh, 44rem)`), resizable, and the gallery MUST fill remaining height with scroll (`ScrollArea`).
  - Grid MUST use `auto-fill` min columns so tile count adapts to dialog width.
  - Controls MUST compose `@zaoly/ui` primitives (`Dialog`, `Button`, `Input`, `FilterRow`, `Chip`, `ScrollArea`, `Card`, `Image`, `Stack`, `Text`, `EmptyState`) — no raw styled inputs/pills in the overlay.
- **Stock Library & Categories:**
  - Curated high-resolution Unsplash catalog grouped into: `All`, `Architecture`, `Nature`, `Tech & Workspace`, `Abstract`, `Minimal & Textures`, `Dark Mood`.
  - Instant live keyword filtering across titles and category tags.
- **Custom Uploads & Project Assets:**
  - Local drag-and-drop file upload zone reading image files into Data URLs.
  - Project asset history list showing recently used/uploaded media.
- **Collection media (VIDEON) — P0 stills (`videon-asset-consume.md`):**
  - Category chip lists Collection-scoped VIDEON media when the scene has a real `platformProjectId`.
  - Thumbs and Apply paint use CREATION BFF frame URLs (`/api/videon-media/:id/frame`); node also stores `videonMediaRef` JSON.
  - Non-goals in P0: Video scene node, Cut/scene clip picker (see domain spec).
- **Collection data bind (`collection-data-bind.md`):** For bindable props (`children`, `value`), Inspect MUST offer **Bind Collection value…** (Checkion / Metron catalog refs via `dataBindings`). Scene stores refs only; canvas resolves via `/api/collection-data/resolve`.
- **1-Click Application Modes:**
  - When opened from `InspectFillGroup`: "Apply as Background" writes `backgroundImage` prop (and default `cover` sizing).
  - When opened from `InspectMediaGroup`: "Apply as Image" writes `src` prop.
  - When opened from Topbar with node selected: offers "Use as Image" or "Use as Container Background" actions.

## P62 — Inspect collapse / search / CSS peek / override banner (2026-08-13)

- Design sections MUST be **collapsible** so the rail is not one endless wall.
- A **filter** input MAY hide fields whose label/name do not match.
- When writing breakpoint overrides (non-desktop / override mode), Inspect MUST show a **clear banner** (stronger than a field “(override)” suffix alone).
- CSS tab is read-only peek: clearer empty copy + optional **copy-to-clipboard**. Writable CSS remains non-goal.

## P64 — Inspect collapse persist + floating rails (2026-08-13)

- Collapsed DESIGN section map persists in `sessionStorage` key `creation-editor-inspect-collapsed`.
- Left/right rails MAY undock (header drag or undock control), free-place, and snap-redock — see `editor-workspace.md` / `lib/editor-panel-chrome.ts` / `EditorRailShell`. Not a Zaoly dock clone.

## P78 — Typed field commit (blur) (2026-08-21)

WENN the designer types into a free-text Inspect control (string `name` / copy, or DESIGN literal length/chrome fields), DANN MUST the inspector keep a **local draft** while focused and MUST NOT call `onOps` / push undo history on every keystroke.

WENN the control blurs (or the designer presses Enter where that control commits), DANN MUST the draft write via the existing `set_prop` / `set_breakpoint_override` / clear-binding path (one history entry per commit).

WENN the selection or cascaded persisted value changes while the field is not focused, DANN MUST the draft reset to the persisted value.

Discrete picks (Select, ToggleGroup, TokenPicker binding path, clear ×) MAY still commit immediately.


## P24 — Inspect / chrome icons (2026-08-12)

- Segmented enums MUST render as **icon ToggleGroup** (`variant="icon"`) when a glyph exists; option `label` remains the accessible name.
- Mapped axes: layout (`direction`, `align`, `justify`, `justifyContent`, `alignItems`, `wrap`, `alignSelf`, `axis`), type (`textAlign`, `textDecoration`, `textTransform`), stroke (`borderStyle`, `overflow`), component (`variant`, `size`, `tone`, booleans).
- Token/string Field labels SHOULD show a leading **prop icon** (16px, `currentColor`) from `@zaoly/ui` wraps — mapping lives in the app (`lib/inspect/icons.tsx`), not in the DS.
- Palette and Layers rows SHOULD show a **type icon**; Layers hide/lock/move/chevron MUST be lucide icons (primitive), not unicode.

## P25 — Token strip shows the bound value (2026-08-12)

- TokenPicker current strip MUST show the option **label** (or path) when bound; empty MUST show `emptyLabel` (default `—`), never `noneLabel` / clear copy.
- `noneLabel` is the listbox none option only. `clearLabel` is the × control.
- `fontPreview` MAY set `font-family` on the value label (display only). Color `preview` remains swatch-only.
- Demo / default Text and Heading nodes SHOULD ship with typography token bindings so inspect is not an empty wall of dashes.

## P26 — Inspect values must be readable (2026-08-12)

- Canvas Text/Heading MUST inherit token-resolved type from the scene wrap. Magazine role CSS (`max-width: 22ch`, display size, tracking) MUST NOT override inspect tokens.
- Canvas Text/Heading MUST honor Inspect `textTransform` / `textDecoration` (wrap paint inherits; leaf MAY also set the CSS longhands). Scene chrome MUST NOT force `text-transform: none` on `.ds-text-*` / `.ds-heading` when a wrap transform is set. Explicit prop `none` MUST paint as `text-transform: none` so role defaults (e.g. Site Kit label uppercase) can clear.
- Inspector string/select/token controls MUST be full-width with high-contrast value color.
- TokenPicker −/+ cycle MUST NOT crowd the strip in the inspect rail (hover/focus only, or omitted). `×` MAY stay but MUST not hide the bound label.
- Role and other enum Selects MUST show the current option label (title case). Empty Name MAY use a placeholder, not a blank hole.

## P27 — Inspect chrome follows Zaoly light/dark tokens (2026-08-12)

- Editor chrome MUST use semantic tokens (`--bg0` / `--bg1` / `--ink` / `--muted` / `--line` / `--field`). It MUST NOT paint light-only greys (`#fff`, `#f7f7f7`, `rgba(0,0,0,0.12)` fallbacks) that ignore `data-theme`.
- TokenPicker current strip and inspect Inputs MUST match magazine Field language: transparent fill, ink hairline + firm bottom rule, value color `--ink`.
- Canvas well MAY use `--bg0`; the artboard page fill stays paper (`#fff`) so a light composition still reads on a dark editor.

## Sections (order)

| Id | Label | Typical fields |
|----|-------|----------------|
| `component` | Component | **Create Master** (first, when Convert is valid); name, type, id, variant, size, role, children, placeholder, label, checked (P30 forms) |
| `layout` | Flex layout / Grid layout (P98) | Flex: direction, align/justify, wrap, gap; Grid: presets, template/advanced, justifyItems/alignItems, gap; padding + sides, **margin + sides** (D7) |
| `constraints` | Constraints | width \| height, min/max, alignSelf, **rotate** |
| `appearance` | Appearance | radius, opacity, shadow, blur, overflow |
| `typography` | Typography | family/size/weight/leading/tracking, align, decoration |
| `fill` | Fill & stroke | color, background, border*, gradient |

Empty sections MUST be omitted — except `component` MAY remain when only **Create Master** is shown.

## Field kinds

| Kind | UI | Write |
|------|-----|-------|
| `enum` | Select **or segmented ToggleGroup** (short layout/align axes) | `set_prop` (or `set_breakpoint_override` when editing non-base BP — P17) |
| `string` | Input | `set_prop` (incl. `name`) |
| `boolean` | Select true/false | `set_prop` |
| `token` | **P57+P76+P77 + hybrid:** one TokenPicker (`allowLiteral`) for all token groups — strip tippen = literal (placeholder `—`); browser/cycle = Brandion path. **Color:** dedicated swatch opens `@zaoly/ui` ColorPicker (HSV + Hex/RGB/HSL + Alpha + Eyedropper); emits `#rrggbb` / `#rrggbbaa`. **CT-18:** Plus promote when unbound valid scalar literal + live Brandion pack → dialog → Brandion upsert + bind. | `set_prop` literals (`writeLiteral` / `onLiteralChange`); TokenPicker `set_token_binding` / `clear_token_binding` (or BP-scoped ops — P17) |
| `readonly` | Input read-only | — |

### Field source (P16)

- **Target:** typed contract registry in `@zaoly/contracts` mirroring keep-list props.
- Field catalog (`lib/inspect/field-catalog.ts`) MUST derive type-aware fields from the registry; fixture lists remain fallback for unmapped types only.
- **Non-goal:** live Stencil CEM parse.

## Token catalog (fixture → Brandion SSOT)

Editor ships a **Brandion-vocabulary** fixture until the Collection’s active guideline pack is fetched (`specs/domain/brand-token-consume.md`). Canvas resolves **digital** channel to CSS for preview only — attrs stay token paths (never `--bg0` / `--print-*` / free hex).

- **P39** W-TOKEN-VOCAB: **shipped** — catalog paths = Brandion grammar (`color.action.*`, `spacing.static.*`, `typography.heading.h1`, …). Type fields bind one typography leaf; resolve uses facets.
- **P40** W-TOKEN-RESOLVE: **shipped** — parse Brandion digital JSON → CSS.
- **P41** W-TOKEN-CONSUME: **shipped** — BFF `GET /api/brand-tokens` → Brandion `active-pack`; fixture fallback.
- **CT-18** promote literal → Brandion: **shipped** — Inspect Plus on unbound scalar literals; `PATCH /api/brand-tokens` + bind (`brand-token-consume.md`). **Local preview:** WHEN `ZAOLY_AUTH_BYPASS` and fixture pack, BFF MAY set `localPromotePreview`; client shows Plus and binds in-session without Brandion write (`knowledge/hud-tokenpicker.md`).
- **P42** W-TOKEN-PRINT: **shipped** — canvas inside `PrintPage` resolves Brandion **print** channel (`mm`/`pt` when CSS-paintable; digital hex MAY preview when print color is Pantone-only). Screen nodes stay digital. Push from CREATION remains **out**.

## OP-9 override UX (P17)

- When `activeBreakpoint` is set, token/enum fields MAY show inherit vs override for the active BP.
- Writing an override uses `set_breakpoint_override`; clearing restores inherit via `clear_breakpoint_override`.
- CSS peek MUST show **resolved** (cascaded) values for the active BP.

### Elsewhere overrides (Wave B — 2026-10-10)

WENN a selected node has a field key present in `breakpoints.mobile|tablet|print` (props, tokenBindings, or dataBindings) for a breakpoint **other than** the active one, DANN MUST Inspect show a compact **elsewhere badge** on that field label (`data-testid="inspect-bp-elsewhere"`) with chips for those BPs (M / T / P) and a localized tip listing the names. This MUST appear on **Desktop** as well (so designers see which fields diverge without flipping chips). Multi-select: union of elsewhere BPs across the selection. MUST NOT invent a second write path.

### Elsewhere jump (2026-10-10)

WENN an elsewhere chip is shown and Inspect has `onBreakpointChange`, DANN MUST each chip be a button (`data-testid="inspect-bp-elsewhere-chip"`) that sets `activeBreakpoint` to that lane (same path as the toolbar BreakpointSwitcher). Tip MUST mention that clicking switches the breakpoint. Desktop is not an elsewhere chip (base lane).

## Variant UX lite (P22)

- Registry enums for `variant` / `size` / similar axes on Component section / Inspect `variant-axes`.
- **Master named variants (Phase 2):** During Master-Edit, Inspect section `variant-axes` ALSO hosts active-variant select, rename, **Add** (text name), and delete — see `composition-masters.md`. Instance `instanceVariantId` uses the same section. P22 chips MUST NOT create Master variants.
- **Instance Inspect (page mode):** When an Instance is selected outside Master-Edit, Inspect MUST display the **resolved** Master variant root (definition ⊕ `instanceOverrides`) for field values and type catalog — not the empty Instance stub. Writes still target overrides on the Instance id (`composition-masters.md`). WHEN `instanceOverrides.props[key]` (or cascaded props) holds a free literal, TokenPicker MUST show that literal and MUST NOT keep the inherited Master `tokenBindings[key]` as the strip `value` (same mask as HUD chips).
- **Non-goal:** Zaoly pending variants, multi-axis variant matrix, Figma compare sync.

## Layers vs inspect

- **Layers / structure** lives in the left rail (`editor-workspace.md`) — not inside PropertyInspector.
- Inspect remains the right rail for the **primary** selected node (P19: last id). Locked primary → read-only fields.

## Multi-select (P19)

- Header shows “N selected” when `selectedIds.length > 1`.
- Shared fields (same value across selection) remain editable and write to all unlocked members; divergent fields are omitted / read-only.
- Remove applies to the full selection set (non-root, unlocked).

## Palette form types (P30)

- Registry MUST include `Checkbox`, `Select`, `Switch`, `Textarea` with token/enum/boolean props only (`label`, `checked`, `placeholder`, `size`, `disabled`).
- `Select` fixture options live on the node as `{ value, label }[]` — not a free CSS options editor.

## Palette DS atoms (P32)

- Registry MUST include `Chip`, `Divider`, `Avatar`, `Alert`, `Hint`, `Spinner`, `StatusDot`, `EmptyState`, `Slider`, `Field`, `Panel`, `Tabs`, `Accordion`.
- Token/enum/boolean/string only. `Slider` numeric props inspect as strings. `Tabs` / `Accordion` fixture items A/B — no free item-array editor.
- Avatar initials use `displayName` (not META `name`) so layer rename stays distinct.
- Skip `Skeleton` (free width/height). Product chrome (Chat*, AppFrame, NavRail) stays out. **P36:** Print magazine twins are in the registry (string/enum inspect; fixture arrays).

## Palette molecules (P33)

- Registry MUST include `LoadingText`, `PageTitle`, `AddTile`, `TagInput`, `ToggleGroup`, `MetricChip`, `Meter`, `Lede`, `ScrollArea`, `FormSection`, `CardActions`, `FilterRow`.
- `TagInput` / `ToggleGroup` fixture arrays — no free item editor. `Meter` numeric props inspect as strings. Skip `SwatchStrip` (free hex) and overlay chrome.

## Palette list/layout (P34)

- Registry MUST include `SectionChrome`, `RankedRow`, `RankedList`, `TopStatus`, `EventFooter`, `ChannelStack`, `ChannelLane`, `StepStrip`, `KpiStrip`, `DivergingBar`.
- `DivergingBar` body children are rows (P49) — inspect the child, not a parent array. **P48:** `KpiStrip` items explode to Lede body children (inspect the child, not a parent array). `RankedRow` numeric `index` / `barPct` inspect as strings. Skip `DataTable` (function cells), magazine Contents nav, overlays, product chrome.

## Palette entity card (P43) + atomic slots (P44 / P45 / P46 / P47 / P48 / P49 / P50 / P51 / P52 / P53) + surface edit (P54) + grain (P55)

- Registry MUST include `EntityCard`. Shell inspect: `size` (`default` | `tall`) + `gap` token. Title/meta/badge/footer/toolbar/headActions are **slotted child nodes** (`props.slot`), not parent strings. Unslotted children are the body (drop Slider/Spacer/Text; inspect the child).
- **P45:** Field / FormSection / FilterRow / EventFooter / ChannelLane / Lede / TopStatus / MetricChip / RankedRow / SectionChrome chrome copy lives on slotted children. Shell inspect is layout/variant enums + gap where the DS has a body. Skip `DataTable`, `MagazineContentsNav`, `PrintQuickCheck`.
- **P46:** PrintPullQuote / PrintChip / PrintScoreRing / PrintCover / PrintChapter / PrintPersonaCard identity copy lives on slotted children. Shell inspect: Cover `url`, Chapter `index`, ScoreRing `max` (**P60:** value is slotted Text), Persona `confidence`/`spread`. **P51:** card traits/goals/painPoints explode to existing print primitive children (not parent arrays). **P53:** canvas paints identity `slotKids` (Cover/Chapter/quote/chip/ring) so inspect + canvas select the same Text.
- **P47:** Alert / Hint / EmptyState / LoadingText / PageTitle / AddTile copy lives on slotted children. Canvas paints `slotKids` (DS regions are ReactNode). Shell inspect: Alert `tone`, Hint `panel`. **P59:** Chip / Button / Badge string `children` lift to slotted label Text (palette `/^Chip$/i` stays). Not drop containers.
- **P48:** PrintDonut center (`value`/`label`) and PrintPage folio (`label`/`footer`) live on slotted children. **P53** paints those kids in the center/folio regions. **P59:** Donut `slices` explode to RankedRow body children `${parentId}__slice_${key}` (legend paints those kids; shell keeps donut inspect). KpiStrip body children are Ledes. PrintPage paints `bodyKids` only (folio Text is not page body). PrintDonut is not a drop container.
- **P49:** PrintRankedList / PrintLedger / PrintTraitBars / DivergingBar 1D arrays explode to body children. Shell inspect: RankedList `columns`/`compact`/`startIndex`, Ledger `max`.
- **P50:** PrintPersonaGrid body children are `PrintPersonaCard` nodes (inspect the card; no parent `personas` array; no second persona type). PrintCover KPI body children are Ledes (inspect the child; Cover `url` stays parent inspect; Cover is not a free drop container). PrintTable row children hold cell text. **P59:** table `columns` explode to slotted Text `${parentId}__col_${index}` (inspect the child; no second table type).
- **P51:** PrintPersonaCard is a drop-container shell. Inspect `spread` + `confidence`. Canvas composes title/ChipRow/summary/TraitBars/TwoColumn children so they are hit-testable. Grid paints those card children (not closed DS cards).
- **P52 / W-ROW-HITTEST:** Canvas paints those list/table/KPI body children (magazine CSS) instead of a closed DS `items`/`traits`/`rows`/`kpis` extract. Clicking a painted row label selects the RankedRow (or Lede KPI wrapper), not only the parent list. Inner Text vs row remains layers-first this wave. Shell inspect unchanged (`columns`/`compact`/`startIndex`/`max`; table `columns` stay parent strings).
- **P53 / W-PRINT-IDENTITY:** Canvas paints print identity `slotKids` instead of feeding closed DS strings. Clicking Cover/Chapter title or eyebrow, PullQuote body, PrintChip label, or PrintPage folio selects the Text. **P60:** ScoreRing digit is slotted Text in the ring; max stays shell inspect. Digital Chip/Button/Badge flatten landed in P59.
- **P54 / W-SURFACE-EDIT — surface completeness before nesting:** Inspect of a selected node MUST show instance geometry and chrome on **that** node first: width / height (existing layout fields), border width / color / style, radius, color (ink) / background (fill) when the shared catalog already has them for surfaces. Variants / states **only if the DS primitive already has them** — do not invent PrintChip axes beyond DS (`PrintChip` exposes P92 shell `tone`: default|muted|accent|solid; still no `variant`/`selected`/`size`; digital Chip keeps `size` / `selected`). Inner slot explode (P44–P53) stays landed; it is not the completeness criterion. Do not claim atom-edit complete. **PrintChip** is the proving ground: include it in `SURFACE_TYPES` + color/background; shell `children` is a proxy onto the `slot === 'label'` Text child (create/lift if missing). Paint resolved styles onto the visible `.zaoly-print-chip` (override DS `border: 1px solid var(--print-line)` when instance stroke is set) — not only the outer wrap hit box.
- **P55 / W-SURFACE-GRAIN — instance alignment + chrome on print shells:** P54 left remaining `Print*` out of `SURFACE_TYPES` and left alignment off most inspect catalogs. A selected primitive MUST be able to set **alignment** (and the rest of instance chrome) when paint can honor it — not an empty inspect. Shared catalog field names only (`textAlign`, `alignSelf`, `justifyContent`, `alignItems`, padding, border*, radius, color/fill). Do not invent a parallel system or `justifySelf` unless a Grid/flex parent needs it. **Defaults stay unset** so magazine layout is unchanged until the designer sets a value.
  - **Leaves / copy** (`PrintChip`, PullQuote, Cover/Chapter/Page/ScoreRing/PersonaCard, plus Text/Heading/Chip): `textAlign` (inner copy) + `alignSelf` (instance in parent). PrintChip `textAlign` paints onto `.zaoly-print-chip`; wrap stays `alignSelf`. Text/Heading `textAlign` MUST remain visible inside print ancestry.
  - **Flex/grid shells** (`PrintChipRow`, `PrintTwoColumn`, `PrintPersonaCard`, lists, Page/Chapter/Cover, Donut, PersonaGrid): `justifyContent` / `alignItems` on the wrap, forwarded onto inner `.zaoly-print-*` via generic `creation-scene-node--print-surface` + CSS vars when the magazine class is the flex parent. Stack keeps type props `align` / `justify` (no duplicate shared fields).
  - Roll remaining `Print*` into `SURFACE_TYPES` + padding + color/background **iff** wrap or descendant override applies those properties to a visible box. P54 PrintChip label proxy / border override / size MUST keep working. PrintChip `tone` is DS-backed (P92); still no invented `variant`/`selected`. Digital Chip `/^Chip$/i` and Grid `/^Grid$/i` stay. PrintPage folio is still not page body; Field body still has no extra Stack wrap.
- **P56 / W-INSPECT-LIVE — DESIGN is writable for every palette type:** Catalog fields that paint can honor MUST appear and accept input. Root cause of dead PrintChip DESIGN: token-only TokenPicker + `fieldValue` reading only `tokenBindings` (canvas resize lived in `node.style`; `set_prop` literals never painted) + optional enums faking `alignSelf: stretch` + fill/border living in a later section so Appearance looked empty. Fix: literal Input beside TokenPicker (`inspect-literal-*`, placeholder `—`); `literalFieldValue` reads props then `node.style` for W/H; `resolveNodePaintStyle` merges tokens → props → enums → style; fill/border/color live in Appearance; optional enums stay unset; empty optional ≠ hidden. Layer name writes `SceneNode.name`. Same shared apply map for all registered types (Print* + digital shells). Chip `/^Chip$/i` flattened; Grid `/^Grid$/i` unchanged. PrintChip axes stay DS-only (`tone`).
- **P57 / W-PRINTCHIP-INSPECT — DESIGN length fields are literal-typable:** P56 left TokenPicker (`editor-inspector.tsx` token branch) as the visible `—` strip. TokenPicker is a **button** (`ds-token-picker__trigger`, `emptyLabel` `—`) and swallows keys; designers still could not type Width/Radius. Fix: native `@zaoly/ui` `Input` with placeholder `—`, `aria-label` = field label, commit on change/blur via `writeLiteral` → `set_prop` + paint merge. **P76 restores TokenPicker beside those Inputs** for size/space/radius/opacity/blur/rotate (options = Brandion/fixture catalog; labels show path · resolved CSS). Color/type/shadow/gradient keep literal + TokenPicker. PrintChip DESIGN MUST show Width, Height, Radius, Opacity, border width/color/style, Fill, Color, Align (`textAlign`), Padding as live controls. Workspace test types Width `120` and Radius `8`. Unset placeholder stays `—`. Chip `/^Chip$/i` and Grid `/^Grid$/i` unchanged.
- **P58 / W-SURFACE-ALL — same live DESIGN on every selected palette type:** P57 proved typable literals on PrintChip. The shared inspector + catalog MUST give the same chrome to Stack / PrintPage / PrintCover / PrintChapter / Field / digital Chip / Button / PrintPersonaCard / PrintRankedList (and the rest of `EDITOR_PALETTE_TYPES`): typable W/H/min/max/padding/radius/opacity/border width; color/fill = literal + TokenPicker; **P76:** length groups also get TokenPicker. Alignment visible (`textAlign` on copy shells, `justifyContent`/`alignItems` on flex containers, `align`/`justify` on Stack, `alignSelf` on instances). Optional enums stay unset (no fake stretch). **Variants/states only from the pinned DS + `component-contracts.ts`:** digital Chip `size`/`selected`, Button `variant`/`size`/`disabled`, Field `size`/`layout`/`invalid`. PrintChip stays without invented variants. Layer name writes `SceneNode.name`. Paint via `resolveNodePaintStyle`; PrintChip inner radius/border CSS vars stay. Gap CSS literals paint on Stack/Grid (DS enum ids still map through `layoutGapFromBindings`). Coolify `next build` is required (`knowledge/staging-coolify.md`).
- **Catalog generic DESIGN (2026-08-17):** WHEN the selected type has no `getComponentContract` (catalog insert such as `ChatBlockPanel`), Inspect MUST still show shared DESIGN chrome from `genericCatalogInspectProps()` (fill, type, radius, padding, size, stroke, alignment) and paint MUST honor it on the scene wrap + inner surface. MUST NOT invent a typed ChatBlockPanel contract. P4 Promote MUST extend **all** of those fields into the library primitive (token paths → existing CSS variables via `PROMOTE_TOKEN_PATH_TO_CSS_VAR`); live canvas remains the composition preview until the Promote PR is merged.
- **Catalog generic live paint (2026-08-17):** WHEN instance fill/radius/stroke/type is set (literal **or** `tokenBindings`, including empty `props.background` with `tokenBindings.background`), the wrap MUST forward CSS custom properties (`CATALOG_GENERIC_VARS` / `--creation-catalog-fill`) and descendant DS surfaces (`.ds-panel`, `__surface`, especially `.ds-panel.ds-panel--default`) MUST use those vars via the `background` shorthand (not only `background-color`, which loses to the DS `background: var(--surface-2)` wash). MUST NOT use `background-color: inherit`. Canvas is the live React editor; Storybook stays the library view after Promote.
- **P76 / W-TOKEN-PICKER-LENGTH — restore TokenPicker recommendations on length fields:** P57 bypassed TokenPicker for size/space/radius/opacity/blur/rotate so designers could type raw `px`/`rem`. Hybrid locked: typable literal **and** TokenPicker for those groups (`inspectUsesTokenPicker` = true whenever a group is set). Binding writes `tokenBindings`; typing writes `props` via `set_prop`. Option labels MUST include resolved digital CSS (`path · 0.5rem`). Source = live Brandion pack with fixture fallback. **UI (2026-08-20):** one TokenPicker strip with `allowLiteral` (no separate Input + „… token“ label). Out of scope: autocomplete-as-token-path; invent/create paths from inspect (Tokens tab / Brandion / P75).
- **P77 / W-TOKEN-PICKER-BROWSER — Zaoly multi-context TokenPicker:** Extend `@zaoly/ui` TokenPicker with `browser` (portal search, Suggested/group/All scopes, session Recent, drag header, kind-aware `TokenPreview`, Arrow/Enter/Escape, `allowCycle`). CREATION inspect wires browser for every token field; `suggestedPaths` = current group; All = full live/fixture catalog; Recent via `sessionStorage` key `zaoly.inspect.tokenRecent`; `contextTitle` when BP override. Literals live in the same strip via `allowLiteral`. Out of scope: Propose-from-Inspect; Variables rail. Knowledge: `token-picker-browser-p77.md`. Side: satisfies W-INSPECT+ cycle chrome.
- **P59 / W-ATOM-REMAINING — remaining atom-edit holes:** Donut slices, table columns, magazine “Ziele” / “Pain Points” eyebrows, nested Text hit-test, Chip/Button/Badge flatten, and inline canvas edit. Surface completeness before nesting still holds.
- **P60 / W-SCORERING-TEXT — ScoreRing digit as Text:** Value is slotted Text; shell keeps `max`. Ring fill parses the Text. Secondary W-CONTRACT gap fill: Button `variant`/`shape` match pinned DS. Skips: full variant matrix, W-TOKEN-PUSH, live CEM. Leftover is Product cutover only.

## Palette groups (P35)

- Workspace chrome only: group `EDITOR_PALETTE_TYPES` into Layout / Forms / Feedback / Lists / Print. Inspect registry is unchanged. Search still filters across groups. Do not dump the remaining catalog.

## Palette print (P36)

- Registry MUST include `PrintPage`, `PrintChapter`, `PrintCover`, `PrintPullQuote`, `PrintCallout`, `PrintSteps`, `PrintScoreRing`, `PrintChip`, `PrintChipRow`, `PrintTwoColumn`, `PrintDonut`, `PrintRankedList`, `PrintLedger`, `PrintTraitBars`, `PrintTable`.
- Numeric print props inspect as strings. **P59:** Donut slices are RankedRow body children (legend paints those kids; no free item-array editor). PrintDonut center + PrintPage folio are slotted children (P48). Ranked / ledger / traits rows are children (P49). Cover kpis / table rows / persona grid cards are children (P50). Table columns are slotted Text children (P59).

## Palette personas (P37)

- Registry MUST include `PrintPersonaCard` and `PrintPersonaGrid`.
- Card inspects confidence (string) + spread. Name / bio are **slotted children** (P46). Segment + confidence copy live on PrintChip children inside a ChipRow (P51). Nested `traits` / `goals` / `painPoints` explode to PrintTraitBars / PrintRankedList / PrintTwoColumn children (P51). **P50:** Grid `personas` explode to those same `PrintPersonaCard` shells — no free item-array editor, no second persona tree. Skip `PrintQuickCheck`.

## Print surface (P38) + print channel (P42)

- Magazine look uses Print tokens (`--print-*` on `PrintPage`), not screen `--color-*` / `--space-*`. Layer 0 kit stays isolated from app dark mode.
- Palette insert of a print type outside a `PrintPage` ancestor wraps in `PrintPage`. Orphan print nodes on canvas paint inside a visual `PrintPage` so ink/paper resolve.
- **P42:** Brandion-backed `tokenBindings` on nodes inside that surface resolve the **print** channel (CT-6). Customer ink/type/spacing on the page are Layer 1 print, not `--print-accent`.

## Non-goals (closed or deferred)

- Live CEM / Zaoly contract parse → replaced by typed registry (P16)
- Free X/Y positioning
- Full OP-9 matrix UI beyond override/inherit lite (P17)
- Undo (session history in workspace — not inspect chrome)
- Writable CSS / free hex in Design tab **except P56 surface literals** (W/H, radius, opacity, border*, fill, color, padding) which `set_prop` persists and paint honors. Tokens remain optional.
- CREATION Library token store / CREATION → Brandion push (`brand-token-consume.md` CT-8)

## E6 denser inspect (shipped / remaining)

- TokenPicker −/+ cycle within group — shipped
- Design | CSS tabs — shipped (`InspectTabs`)
- Wire registry (P16) + residual keep-props (P22)
- Live Brandion pack (P41) **shipped** — fixture (P39) remains the degrade path when Brandion is unset

## Acceptance

1. Selecting any Top-N node shows grouped sections (not a flat stub list). **(E4.1 met)**
2. Token fields include **radius**, **padding**, **opacity**, **color** / **background** where applicable. **(E4.1 met)**
3. Changing a token updates `tokenBindings` and canvas preview style. **(E4.1 met)**
4. Clearing a token removes the binding. **(E4.1 met)**
5. Tests cover catalog grouping + binding resolve + inspector smoke. **(E4.1 met)**
6. E6 denser: Design | CSS read-only tab when claimed green on parity checklist. **(met)**
7. P16: catalog derives from typed registry for keep-mapped types.
8. P17: override/inherit lite + cascaded CSS peek.
9. P22: variant/size enums from registry only.
10. P23: Stack inspect includes padding sides + token gap + segmented direction/align; Text includes fontFamily/lineHeight; Card exposes gap token.
11. P56: PrintChip DESIGN shows live W/H/radius/border/textAlign; unset shows `—` and still accepts input; `set_prop` paints. Empty optional fields stay visible. Digital Chip flatten and Grid columns stay.
12. P57: PrintChip Width/Radius are typable `<input>`s (literal escape hatch). Typing `120` / `8` stores props and paints wrap width / inner chip radius. Border/fill/color/textAlign/padding appear in DESIGN.
13. P58: Selecting Stack / PrintCover / Field / Chip / Button / PrintPersonaCard / PrintRankedList shows the same typable W/H/radius/opacity/padding/border/fill/color chrome as PrintChip. DS variants appear only where the registry already has them. PrintChip has none. Chip `/^Chip$/i` and Grid `/^Grid$/i` stay. Dummy-env `next build` must pass.
14. P59 / W-ATOM-REMAINING: Donut slice labels and table column Text are selectable children. Persona “Ziele” / “Pain Points” eyebrows are visible Text. Glyph click on a RankedRow/Chip label selects the Text. Double-click unlocked `Text` / `Heading` / `SiteText` / `Link` / `SiteLink` opens canvas inline edit (`creation-inline-edit` → `set_prop` `children`). Chip `/^Chip$/i` and Grid `/^Grid$/i` stay. Product cutover stays unchecked.
15. P62 / W-UI-FINETUNE: Design sections collapsible + searchable; BP override banner; CSS peek empty + copy. Chip `/^Chip$/i` and Grid `/^Grid$/i` stay.
16. P76 / W-TOKEN-PICKER-LENGTH: Length groups (size/space/radius/opacity/blur/rotate) show one hybrid TokenPicker (`allowLiteral`). Selecting a Brandion path writes `tokenBindings`; typing still uses `set_prop`. Option labels include resolved digital CSS.
17. P77 / W-TOKEN-PICKER-BROWSER: Opening Radius TokenPicker shows search + Suggested scopes; picking a path updates the strip; −/+ cycles; literal type-in on the same strip still works.
18. **P78 / W-INSPECT-COMMIT:** Free-typed string and literal Inspect fields MUST NOT push undo history / scene ops on every `onChange` keystroke. Commit on blur (and Enter where the control supports it). Discrete controls (Select, ToggleGroup, TokenPicker path pick, clear) MAY commit immediately.

## D5 — DS variant consume hint (2026-08-14)

When the selected node type + variant/tone/size/shape/selected matches the DS-DEPOSIT consume map, Inspect MUST show a read-only **Consumes** hint (Brandion paths the `@zaoly/ui` class already paints via CSS vars). MUST NOT auto-write `tokenBindings`. MUST NOT restyle Layer 0 from Brandion. Optional **Bind suggested** only if a matching inspect color/space/radius field exists and is unbound. Map: `lib/ds-deposit/component-semantic-map.ts` (copied JSON). Spec twin: `brand-token-consume.md` CT-16.
