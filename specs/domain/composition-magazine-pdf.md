# Composition magazine PDF (P79 · P80a/d · P81b · P82c · P83 · P84 · P85 · P86 · P87 · P88 · P89 · P90 · P91 · WYSIWYG-P1)

**Status:** Accepted · **Amended:** 2026-08-15 (P80a Brandion Mag styles · P80d MagPage logo · P81b Mag font resolve · P82c typography.source embed hook · P83 OP-9 cascade materialize · **P84 instance paint → Mag tones/wrap** · **P85 print cascade lane** · **P86 layout/type instance paint** · **P87 Stack align aliases + block/inline box + slot typography lift** · **P88 MagTable cell paint** · **P89 Mag always print cascade + print∪digital Mag paint** · **P90 MagTable cell textAlign stretch + canvas PrintTable grain** · **P91 alignSelf block park vs textAlign + MagTable fit=hug** · **WYSIWYG-P1 capability matrix + textAlign vocab + print-lane resize**)  
**Product:** CREATION v3  
**Depends:** `composition-scene.md` · `brand-token-consume.md` · zaoly-ui Mag kit (`@zaoly/ui/mag`, P78/P80/P82/P84/P86/P88/P91)  
**API:** `specs/api/composition-magazine-pdf.md`  
**Capability matrix:** `knowledge/print-mag-capability-matrix.md`

## Purpose

Export a `CompositionScene` authored with HTML `Print*` nodes as a Magazin-PDF via react-pdf `Mag*` twins. Designer layout in the editor drives pages; no plexon EQC packing/report models.

**Sibling:** WYSIWYG export of any artboard (including non-Print) → `scene-surface-export.md` / `POST /api/scenes/:id/export`. Magazin PDF stays Print*-only.


## Locked decisions

- Adapter + Document live in creation-v3 (`apps/web/lib/magazine-pdf/`).
- Mag* primitives stay in `@zaoly/ui/mag`.
- **One `MagPage` per `PrintPage`.**
- Non-`Print*` nodes are **silently skipped** (children of skipped containers are still walked so nested Print* are found).
- **Styles (P80a):** When the scene has a **live** Brandion pack (`source === 'brandion'` + `guidelineId` + tokens), resolve print/digital colors via existing `printCssForLeaf` / path grammar into `MagThemeProvider` overrides. Fixture / no guideline / empty pack → DS `magColors` fallback. No second token path grammar; no Pantone→hex invent.
- **Mag paper substrate:** `color.background` maps to Mag `paper` **only when light enough** (relative luminance ≥ 0.55). Dark digital UI chrome (`zaoly-dark` `#0f0f12`, etc.) MUST NOT become PDF paper — keep DS cream. Same guard for P84 PrintPage/Cover `background` → theme paper. Intentional dark page art is out of scope for Mag paper.
- Unsaved editor state: client POSTs the in-memory scene (including `activeBreakpoint`).
- **OP-9 cascade (P83 / P85 / P89):** Before collect/flatten, Mag MUST materialize the **print** OP-9 lane (`materializeSceneForMagazine` → always `print`), not tablet/mobile/`activeBreakpoint`. Print viewport inspect overrides MUST appear in the PDF; tablet/mobile overrides are screen-only. Base props remain when no print override exists. `activePrintPreset` affects editor artboard geometry only in Phase 1 — Mag page size stays the DIN-A4 kit (follow-up: Mag page size from preset).
- **Instance paint (P84 / P86 / P87 / P89):** Mag MUST apply inspect-resolved `color` / `background` / padding/margin **and** layout/type (`gap`, `align`/`justify` aliases → `alignItems`/`justifyContent`, `paddingBlock`/`paddingInline` → physical sides, `width`/`height` incl. `%`, `fontSize` / `fontWeight` / `textAlign`, `lineHeight` / `letterSpacing`) from node props + tokenBindings onto Mag export. Prefer print-channel CSS (CT-6); when a leaf has no paintable print facet, Mag MUST fall back to digital lengths/type the same way color already falls back to digital hex (P89). Mag `textStyle` MUST include ink `color` for MagTable/MagRankedList text props.
- Empty printable set → **422** (no empty PDF).
- **Logo (P80d):** `MagPage showLogo` true with app-injected `ZaolyLogoPdf` (SVG path from `paths` / knowledge — no Coolify URL). `footerTitle` from folio slots as before.

## Twin map

| Scene `type` | Mag |
|--------------|-----|
| PrintPage | MagPage |
| PrintCover | MagCover |
| PrintChapter | MagChapter |
| PrintPullQuote | MagPullQuote |
| PrintCallout | MagCallout |
| PrintSteps | MagSteps |
| PrintScoreRing | MagScoreRing |
| PrintDonut | MagDonut |
| PrintRankedList | MagRankedList |
| PrintLedger | MagLedger |
| PrintTraitBars | MagTraitBars |
| PrintTable | MagTable |
| PrintTwoColumn | MagTwoColumn |
| PrintChip / PrintChipRow | MagChip / MagChipRow |
| PrintPersonaCard / PrintPersonaGrid | MagPersonaCard / MagPersonaGrid |

Slotted Text and list/KPI/persona body rows flatten to Mag props (same slot keys as canvas). Orphan Print* under root without a `PrintPage` wrap once into a synthetic page (P38 parity).

## Brandion → Mag color paths (P80a)

Reuse P39/P42 vocabulary (`knowledge/token-layers.md`). Prefer print channel CSS when paintable; else digital hex preview (same as `printCssForLeaf`).

| Brandion path | Mag color key |
|---------------|---------------|
| `color.background` | `paper` (light substrate only; dark UI bg skipped) |
| `color.neutral.100` | `wash` / `track` |
| `color.neutral.700` | `ink` / `inkSoft` |
| `color.action.primary` | `accent` |
| `color.action.accent` | `accent` |
| `color.brand.green` | `accent` (DS-DEPOSIT) |
| `color.action.secondary` | `muted` |

Typography family/size from Brandion is resolved via `magFontFromBrandPack` (P81b / **P82c**): known aliases (Geist/Inter/Noto/system) map onto the **registered** Mag face (`NotoSans`). When a typography leaf sets optional Brandion `source` to a fetchable TTF/OTF/WOFF URL or path, Mag `registerMagazinePdfFontFromSrc` registers that family; on failure keep Noto. Brandion **font-bytes MIME upload** remains deferred. Headers: `X-Zaoly-Mag-Font` / `X-Zaoly-Mag-Font-Fallback` / `X-Zaoly-Mag-Font-Embedded`.

## Acceptances (EARS)

1. WHEN the editor user triggers Download PDF, the system MUST POST the current in-memory scene to `POST /api/scenes/:id/pdf` and download the returned PDF blob.
1a. WHEN the posted scene has print-lane OP-9 overrides, Mag flatten MUST use the cascaded print props (P89: Mag always materializes `print`, not tablet/mobile/`activeBreakpoint`).
1b. WHEN a Print* node (or RankedRow label Text) has inspect color / background / padding bindings or literals, Mag export MUST reflect those as Mag tones, per-item label color, document paper/ink hints, and/or a box wrap (P84).
1c. WHEN a Print* / Stack / Grid / label Text has inspect gap, align, size, or typography bindings or literals, Mag export MUST reflect those via wrap layout and Mag `labelStyle` / `titleStyle` / `bodyStyle` (P86).
1d. WHEN Stack uses contract keys `align`/`justify`, Mag MUST map them to `alignItems`/`justifyContent`. WHEN inspect sets `paddingBlock`/`paddingInline` (or margin block/inline), Mag MUST expand to physical sides. WHEN Size/Align is set on a slotted title/value Text under PrintCover/Chapter/PullQuote, Mag MUST lift that paint into Mag `titleStyle`/`bodyStyle` (P87).
1e. WHEN PrintTable header or RankedRow label/value Text nodes have inspect typography or the table has gap/align, MagTable MUST receive `headStyle` / `cellStyle` / `cellStyles` / `gap` and wrap `alignSelf` as needed (P88). MagTable cell/head Text MUST span the cell width so `textAlign` is visible in react-pdf (P90). On canvas, PrintTable `alignItems` MUST mirror to print text-align grain on `th`/`td` (P90). WHEN PrintTable `alignSelf` is center/end, Mag MUST use MagTable `fit=hug` and MUST NOT invent cell `textAlign` from `alignSelf` (P91 — block park, no page-break blowout). WHEN PrintTable `columnAlign` is set (P92), MagTable MUST receive `columnAlign` and apply per-column align when cell-level `textAlign` is unset (cell > column > left / table grain).
1f. WHEN a Brandion spacing/size/typography leaf has no paintable print facet, Mag MUST still apply the digital CSS length/type (rem→pt) so Print viewport edits are not dropped while color continues to work (P89).
1g. WHEN the inspector exposes a Print* control listed in `knowledge/print-mag-capability-matrix.md`, Mag flatten MUST apply the twin Mag path (or the control MUST NOT be shown). Mag MUST accept textAlign `left|center|right|justify` and MUST normalize legacy `start`/`end` to `left`/`right` — Mag MUST NOT silently drop those values.
1h. WHEN the editor resizes or nudges a node while `activeBreakpoint` is `print` (or any non-desktop BP), ops MUST write `set_breakpoint_override` for width/height so Mag materialize (print lane) sees the size.
2. WHEN the scene contains `PrintPage` nodes, the PDF MUST contain one Magazin page per `PrintPage` in document order.
2a. WHEN the scene has `pages[]` with length ≥ 2, Mag MUST collect `PrintPage` nodes from **each page root in `pages[]` order** (not only `activePageId` / dual-write `root`).
3. WHEN non-Print nodes appear in the tree, the export MUST skip them without failing, while still exporting nested Print* descendants.
4. WHEN no printable Mag pages remain after skip/wrap, the API MUST respond 422 with a clear error and MUST NOT return `application/pdf`.
5. WHEN `scene.id` in the body does not match the path id, the API MUST respond 400.
6. WHEN the scene `platformProjectId` resolves to a live Brandion pack, Mag theme colors MUST come from mapped Brandion leaves; WHEN fixture/absent, MUST use DS `magColors`.
6a. WHEN Brandion `color.background` (or PrintPage background) is a dark UI chrome color, Mag MUST keep DS cream paper instead of painting black PDF pages.
7. WHEN rendering Mag pages, the system MUST pass `showLogo` with an app logo node (no hardcoded asset URL).

## Non-goals

Playwright HTML→PDF · arbitrary named channels UI · Pantone SSOT · Brandion-aware Mag primitives inside DS · Brandion font MIME upload · Print↔Mag screenshot farm (Mag Cover → pdf-to-img pixel smoke is P82d) · pixel-perfect HTML Print* CSS parity (Mag keeps magazine chrome; P84 covers inspect color/box paint only) · Mag PDF page size from `activePrintPreset` (P85 Phase 1 out of scope)
