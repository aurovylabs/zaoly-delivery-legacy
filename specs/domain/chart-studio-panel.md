# Chart studio panel — CREATION v3

**Status:** Phase 4 palette shipping · **Date:** 2026-09-18  
**Product:** CREATION v3 · Related: `editor-palette-charts.md` · `editor-inspect.md` · `canvas-smart-hud.md` · `brand-token-consume.md`  
**Knowledge:** `knowledge/chart-studio-panel.md`

## Goal

WHEN the designer selects or inserts a **SiteChart** (and later SiteGauge), open a dedicated **Chart studio** panel — not an ever-growing Inspect Component section. Fixture/authoring only; not Metron live evaluate.

## Why

Inspect Component cannot host the full chart authoring surface:

- Series values need a **small editable table** (add/remove/reorder rows), not only multiline text.
- Mark styling is per-kind and per-series: colors, bar thickness/gap, donut inner radius, line stroke, point size, etc.
- Stuffing that into the right-rail Inspect makes the rail huge and fights layout/geometry chrome.

## Panel chrome

- **Open when:** SiteChart selected **or** freshly inserted from the palette.
- **Close when:** selection leaves SiteChart / user dismisses the panel (persisted preference OK).
- **Surface:** floating, **draggable**, **resizable** (hide/collapse). Not locked inside Inspect.
- Inspect MAY keep a one-line teaser (“Open Chart studio”) + geometry/layout only.
- **Field density:** Studio body MUST use `ds-inspect-density` (shared with `PropertyInspector`) so labels/icons/inputs match Inspect — muted Title Case, icon left of label, quiet boxed controls — not magazine orange uppercase Field defaults.

## Authoring sections (minimum)

| Section | Intent |
|---------|--------|
| **Kind** | `chartType` (bar / bar_horizontal / line / area / scatter / pie / donut / funnel) |
| **Series** | Editable table: label, value (+ optional color override). Add / remove / reorder rows. |
| **Marks** | Kind-specific: bar width/gap, line stroke, point radius, donut hole, funnel row gap, … |
| **Palette** | Series/slice colors — Brandion token pickers preferred over free hex when possible |
| **Chrome** | Title, height, ticks / value labels (as paint fidelity allows) |

Props stay on the scene node (`chartType` / `data` / `chartStyle`). Studio is the write UI; paint remains Site Kit SVG.

### `chartStyle` (Phase 3)

| Key | Used by | Meaning |
|-----|---------|---------|
| `barGap` | bar, bar_horizontal, funnel | px gap between bars / rows |
| `donutHole` | donut | inner radius as fraction of outer (0–0.85); studio shows %) |
| `strokeWidth` | line, area | polyline stroke px |
| `pointRadius` | line, area, scatter | vertex / scatter radius px |

### Series colors (Phase 4)

Each `SiteChartPoint` MAY carry:

| Field | Meaning |
|-------|---------|
| `color` | Resolved CSS paint (`#hex`, `var(--…)`, …) |
| `colorToken` | Brandion path SSOT — resolve at canvas paint via token catalog |

Studio: TokenPicker (color group) + free hex literal per series row. Clear restores default categorical fill. Line/area polyline uses `chartStyle.strokeColor` when set, else the first point color, else accent.

## Non-goals (this wave)

- METRON dashboard builder / formula composer in CREATION
- Multi-series / dual-axis
- Full DS Chart SVG parity as a blocker for the panel shell
- Mag PDF flatten

## Wave 1.2 — Collection chart **source** (preferred)

Designer picks **one Collection data source** at the top of Chart studio; rows below map **fields from that object/list** onto label / value / color. Per-row scalar bind (Wave 1.1) is legacy — hide when a source is bound.

| Binding | Meaning |
|---------|---------|
| `dataBindings["data"]` | Series **source** ref (`metron.collection.kpis`, `checkion.scan.latest.scores`, `checkion.scan.{id}.scores`, `checkion.collection.scoreHistory`, …) |
| `props.chartDataMap` | Field map: `{ label, value, color? }` — keys from the source’s field catalog |

- WHEN source bound: series table is a **preview** of resolved rows (add/remove/reorder disabled); field map selects which source fields paint label/value/color.
- Catalog MUST list **live scans** for the **selected** Collection (default = open scene). Viewer MAY choose another accessible Collection; bind then uses `collection.{uuid}.{localRef}`.
- WHEN source cleared: restore editable fixture series; clear `chartDataMap` optional.
- Binding a source MUST clear orphan `data.N.value` bindings.
- MUST NOT persist resolved numbers in scene JSON — only refs + field-map keys.

## Wave 1.1 — Per-row value bind (legacy)

WHEN no source is bound on `data`, DANN MAY each value cell still offer `dataBindings["data.{i}.value"]` (scalar catalog). Remove/reorder MUST remapping index keys. Prefer Wave 1.2 for new charts.

## Implementation sketch

1. Spec + knowledge (this doc).
2. Floating panel host (drag/resize/hide) — prefer `@zaoly/ui` if a dock/panel primitive exists; otherwise app-local host until promoted.
3. Wire open on SiteChart select/insert; series table ↔ `props.data` (structured points, not only text).
4. Mark/style controls → typed props or a single `chartStyle` object (document in contracts + Site Kit paint).
5. Tests: open/close, series table round-trip, mark prop paint smoke.

## Acceptance

- Selecting a SiteChart opens Chart studio without forcing the designer into a long Inspect list.
- Series editable as a table; changing a cell updates canvas paint.
- At least one mark control per major kind (bar thickness **or** donut hole **or** line stroke) persists and paints.
- Panel can be dragged, resized, and hidden.
