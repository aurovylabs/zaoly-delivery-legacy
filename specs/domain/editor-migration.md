# Editor migration — Zaoly → CREATION

**Status:** Accepted — 2026-08-13 · **Active gate:** E6 **closed** (P61 / W-CUTOVER-CLOSE) · **P62–P66 UI finetune** · **P18 Phase B landed** · **P36–P60** green · **P61:** Legacy CTA removed · Product signed  
**Product:** Zaoly standalone · **UI SoT:** `@zaoly/ui` (`packages/ui`, in-repo) + Site Kit  
**Note:** Sibling `zaoly-ui` is severed — see `specs/domain/zaoly-ui-in-repo.md`.  
**Rebuild stance:** Rebuild chrome + flows; do **not** fork or 1:1-port Zaoly `App.tsx` / Stencil WC.  
**UI finetune:** `knowledge/editor-ui-finetune.md`

## Locked decisions

1. Composition canvas renders **React `@zaoly/ui` primitives** (mapped from keep `ds-*` tags) — not Stencil WC.
2. Editor chrome is **rebuilt** in creation-v3 + zaoly-ui organisms (no 1:1 port of Zaoly chrome).
3. Scene format is **JSON tree** (`CompositionScene`) in `@zaoly/contracts` — not long-term `*.zaoly.html`.
4. Validate-before-write edit discipline is preserved as CREATION scene ops (not CEM/OP envelope 1:1).
5. **Usability:** In-app `/editor` is primary when `ZAOLY_EDITOR_INAPP` on. Legacy Zaoly CTA removed (P61). `ZAOLY_EDITOR_URL` may remain as optional unused Ops deep-link.
6. **Inspect contracts:** typed keep-prop registry (P16) — not full Stencil CEM parse (**wont-do**).
7. **Postgres scenes:** Phase B attached on Coolify (`ZAOLY_DATABASE_URL`); JSON fallback when unset (P18).

## Waves

| Wave | Scope | Status |
|------|--------|--------|
| E0 | Specs + knowledge (this program) | done |
| E1 | Keep-tag → zaoly-ui mapping | done |
| E2 | Close primitive gaps in Storybook | done (Top-N) |
| E3 | Editor chrome primitives (`CanvasViewport`, `SelectionHandles`, `PropertyInspector`, `ComponentPalette`, `TokenPicker`) | done |
| E4 | `/editor` beta + Top-N canvas | done |
| E4.1 | Sectioned Design Inspect (token-bound fields) | **done** |
| E5 | Scene persistence + Collection binding | done (API + durable JSON + P18 Postgres) |
| E6 | Parity sign-off + Zaoly sunset | **done** — P61 / W-CUTOVER-CLOSE · Product signed 2026-08-13 · Legacy CTA removed |
| E6+ | Deferred parity tranche | **done** — plan `knowledge/editor-parity-deferred-plan.md` · P28–P61 green · non-goals wont-do |
| P62 | W-UI-FINETUNE in-app chrome polish | **done** — `knowledge/editor-ui-finetune.md` · items 1–10 |
| P63 | W-UI-FINETUNE-2 autosave · native layers multi · DnD lane D | **done** — pin `86971324812c094062f74d206c010bb3b547741e` |
| P64 | W-FLOAT-RAILS detach + free place + collapse persist | **done** — app `EditorRailShell` · no DS pin bump |
| P65 | W-RAIL-RESIZE docked + floating size persist | **done** — `leftSize`/`rightSize` + float rects · no DS pin bump |
| P66 | W-RAIL-DOCK-TB home-edge snap only (no top/bottom) | **done** — rebuild chrome · TB dock removed 2026-09-10 · Comments still out |
| P71 | W-COLLECTION-PICKER hub + editor bind | **done** — live federation list via Plexon `accessible-collections` (same directory as Sync) |

## E4.1 Inspect — done

Sectioned PropertyInspector (Component / Auto layout / Constraints / Appearance / Typography / Fill & stroke), type-aware field catalog, TokenPicker bindings, `set_token_binding` / `clear_token_binding`. Spec: `editor-inspect.md` · knowledge: `editor-inspect-port.md`.

## Remaining workstreams → E6 (core — largely landed)

Push in **parallel** (see `knowledge/editor-parity-parallel-plan.md`). Cutover gate is the **core** parity checklist (P1–P15) — not staged beta flags beyond `ZAOLY_EDITOR_INAPP`.

| ID | Workstream | Owner repo | Outcome for E6 |
|----|------------|------------|----------------|
| W-UNDO | Session undo / redo | creation-v3 | ⌘Z / ⌘⇧Z restores prior scene after `set_prop` / bindings / insert / remove |
| W-PAN | Canvas pan gestures | creation-v3 (+ CanvasViewport props already in zaoly-ui) | Space-drag or middle-drag pans; zoom already present |
| W-LAYERS | Layers / structure panel | zaoly-ui primitive + creation-v3 compose | Tree mirrors `CompositionScene`; click selects; expand/collapse |
| W-HANDLES | Wire `SelectionHandles` | creation-v3 (primitive exists) | Selected node shows bbox overlay on canvas |
| W-BP | Breakpoint switch (stub) | creation-v3 (+ optional contract note) | Toolbar/chrome switches artboard BP; full maps → W-OP9 |
| W-PERSIST | Durable scene store | creation-v3 | JSON survive restart (P13); Postgres → W-PG Phase B landed |
| W-INSPECT+ | Denser inspect | creation-v3 (+ TokenPicker polish in zaoly-ui) | −/+ token cycle (P77); Design \| CSS; registry → W-CONTRACT |
| W-PALETTE+ | Palette beyond Top-N | creation-v3 catalog + zaoly-ui if chrome needs search | Mapped keep-list types insertable |
| W-KEYS | Keyboard + duplicate + layers reorder + scene name | creation-v3 | Delete/Esc/arrows/⌘D; `reorder_node`; editable name |

## Deferred workstreams → E6+ (P16–P28)

Authoritative plan: `knowledge/editor-parity-deferred-plan.md`.

| ID | Workstream | Owner | Parity | Status |
|----|------------|-------|--------|--------|
| W-CONTRACT | Typed contract registry (no full CEM) | creation-v3 | P16 | green |
| W-OP9 | Per-node responsive override maps | creation-v3 | P17 | green |
| W-PG | Postgres scene store | creation-v3 | P18 Phase B | green |
| W-MULTI | Multi-select + marquee | creation-v3 (+ optional DS slot) | P19 | green |
| W-LAYERS-DND | Layers drag-reorder | zaoly-ui → creation-v3 | P20 | green |
| W-LAYERS-HL | Hide / lock (`hidden`/`locked` + `set_flags`) | zaoly-ui + creation-v3 | P21 | green |
| W-DENSITY | Variant UX lite + residual props | creation-v3 | P22 | green |
| W-WRAP | Wrap / unwrap siblings (Zaoly OP-7 / OP-15) | creation-v3 | P28 | green |
| W-CLIP | Session clipboard copy/cut/paste | creation-v3 | P29 | green |
| W-FORMS | Palette form types (Checkbox/Select/Switch/Textarea) | creation-v3 | P30 | green |
| W-DRAG | Palette drag-insert onto canvas slots (OP-1) | creation-v3 + ComponentPalette MIME | P31 | green |
| W-PALETTE-DS | Generic DS atoms/molecules on palette | creation-v3 | P32 | green |
| W-PALETTE-MOL | Remaining composition molecules | creation-v3 | P33 | green |
| W-PALETTE-LIST | List/layout molecules + palette search | creation-v3 | P34 | green |
| W-PALETTE-GROUP | Palette groups (Layout / Forms / Feedback / Lists) | creation-v3 | P35 | green |
| W-PALETTE-PRINT | Print magazine twins on palette | creation-v3 | P36 | green |
| W-PALETTE-PERSONA | Print persona card/grid on palette | creation-v3 | P37 | green |
| W-PRINT-SURFACE | PrintPage wrap so magazine tokens apply | creation-v3 | P38 | green |
| W-TOKEN-VOCAB | Align fixture paths to Brandion grammar | creation-v3 | P39 | green |
| W-TOKEN-RESOLVE | Parse Brandion digital JSON → canvas CSS | creation-v3 | P40 | green |
| W-TOKEN-CONSUME | BFF fetch Collection active pack | creation-v3 | P41 | green |
| W-TOKEN-PRINT | Brandion print-channel preview on PrintPage | creation-v3 | P42 | green |
| W-TOKEN-STUDIO-EDIT | In-app Token Studio; BFF PATCH → Brandion leaf upsert | creation-v3 + brandion-v3 | P75 | green |
| W-TOKEN-STUDIO-ADD | Add new studio-editable leaf via same PATCH upsert | creation-v3 | P81a | green |
| W-MAG-FONT-RESOLVE | Brandion typography family → Mag registered Noto | creation-v3 | P81b | green |
| W-MAG-DRIFT-NOTE | Playwright pixel farm deferred; Drift-CI smoke stays | zaoly-ui docs | P81c | green |
| W-COMMENTS-STUB | Editor Comments chrome stub (no persistence) | creation-v3 | P81d | green |
| W-TOKEN-STUDIO-TYPO-ADD | Token Studio typography Add (family/size/weight) | creation-v3 | P82a | green |
| W-COMMENTS-THREADS | Scene JSON comments + panel (add/resolve) | creation-v3 | P82b | green |
| W-MAG-FONT-EMBED | Mag register from typography.source (MIME upload deferred) | creation-v3 + zaoly-ui | P82c | green |
| W-MAG-PIXEL-SMOKE | MagCover PDF → pdf-to-img PNG smoke (not Playwright farm) | zaoly-ui | P82d | green |
| W-TOKEN-PICKER-LENGTH | Restore TokenPicker on length DESIGN fields (literal + recommendations) | creation-v3 | P76 | green |
| W-TOKEN-PICKER-BROWSER | Zaoly multi-context TokenPicker (search/scopes/Recent/drag/previews/cycle) | zaoly-ui + creation-v3 | P77 | green |
| W-PALETTE-ENTITY | EntityCard on palette (string inspect + body children) | creation-v3 | P43 | green |
| W-ATOMIC-SLOTS | Molecule shells expand to selectable atom children | creation-v3 | P44 | green |
| W-ATOMIC-SHELLS | Field/FormSection/FilterRow/Lede/… chrome as slotted children | creation-v3 | P45 | green |
| W-PRINT-SLOTS | Print identity copy as slotted children (`slotPlainText`) | creation-v3 | P46 | green |
| W-COPY-SLOTS | Digital copy leaves as slotted children (Alert/Hint/EmptyState/…) | creation-v3 | P47 | green |
| W-PRINT-LEAVES | PrintDonut center, PrintPage folio, KpiStrip items as children | creation-v3 | P48 | green |
| W-PRINT-LISTS | PrintRankedList / Ledger / TraitBars / DivergingBar rows as children | creation-v3 | P49 | green |
| W-PRINT-REMAINING | PrintPersonaGrid cards / Cover kpis / PrintTable rows as children | creation-v3 | P50 | green |
| W-PERSONA-SHELL | PrintPersonaCard internals as selectable print primitives | creation-v3 | P51 | green |
| W-ROW-HITTEST | Paint list/table/KPI rows as selectable scene children (no closed extract) | creation-v3 | P52 | green |
| W-PRINT-IDENTITY | Paint print identity copy as selectable slot children (no closed DS strings) | creation-v3 | P53 | green |
| W-SURFACE-EDIT | Surface completeness before nesting — instance geometry/chrome on the selected node (PrintChip proving ground) | creation-v3 | P54 | green |
| W-SURFACE-GRAIN | Alignment + remaining instance chrome on print shells (and digital surfaces that lacked align) | creation-v3 | P55 | green |
| W-INSPECT-LIVE | DESIGN inspect is writable for PrintChip and the rest of the palette (unset `—` accepts input; literals paint) | creation-v3 | P56 | green |
| W-PRINTCHIP-INSPECT | PrintChip DESIGN length fields are typable literals (TokenPicker bypassed for size/radius/opacity/space) | creation-v3 | P57 | green |
| W-SURFACE-ALL | Same typable DESIGN chrome on every selected palette type; DS variants only where they already exist | creation-v3 | P58 | green |
| W-ATOM-REMAINING | Donut slices, table columns, magazine eyebrows, nested Text, Chip flatten, inline canvas edit | creation-v3 | P59 | green |
| W-SCORERING-TEXT | PrintScoreRing digit as selectable Text (+ Button DS enum gap fill) | creation-v3 | P60 | green |
| W-CUTOVER-CLOSE | Remove Legacy Zaoly CTA; Product sign-off; close deferred non-goals as wont-do | creation-v3 + Product | P61 | green |

## Parity checklist (cutover gate)

Authoritative rows + acceptance: `knowledge/editor-parity-checklist.md`.

Core flows (all green) and Product cutover (P61) are closed. **P62–P66** are post-cutover polish (copy, dirty/autosave, tabbed + floating/resizable rails with home-edge snap, multi layers, shortcuts, denser inspect) — see `knowledge/editor-ui-finetune.md`. Deferred non-goals remain **wont-do**. Do not reintroduce Legacy Zaoly CTA.

## Related

- `specs/domain/composition-scene.md`
- `specs/domain/editor-workspace.md`
- `specs/domain/editor-inspect.md`
- `specs/domain/brand-token-consume.md` · `specs/api/brand-tokens.md` · `tasks/00-token-consume-plan.md`
- `knowledge/editor-parity-checklist.md`
- `knowledge/editor-parity-parallel-plan.md`
- `knowledge/editor-parity-deferred-plan.md`
- `knowledge/editor-ui-finetune.md`
- `knowledge/paths.md`
- zaoly-ui `specs/domain/zaoly-ui-creation-editor-chrome.md`
- zaoly-ui `knowledge/ds-keep-mapping.md`
