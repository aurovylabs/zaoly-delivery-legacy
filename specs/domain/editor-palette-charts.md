# Editor palette charts — CREATION v3

**Status:** Accepted · **Date:** 2026-09-17  
**Product:** CREATION v3 · Related: `editor-palette-molecules.md` · `composition-scene.md` · `creation-vs-metron-dashboard.md`  
**DS:** `zaoly/specs/domain/zaoly-ui-chart.md` · Gauge molecule

## Goal

Expose existing `@zaoly/ui` **Chart** and **Gauge** as first-class composition insert types in `/editor` — fixture/authoring data only. Not a second analytics builder.

## Insert types

| Type | Kind | Defaults |
|------|------|----------|
| `SiteChart` | leaf (Site Kit) | `variant: bar`, sample `data: ChartPoint[]`, optional `title` / `height` |
| `SiteGauge` | leaf (Site Kit) | sample `value` / `min` / `max` / `label` / `unit` / `tone` |

Legacy `Chart` / `Gauge` composition types may still paint; palette insert is Site Kit only.

## Inspect

- SiteChart: `chartType` enum (Select **Chart type** in Component — not Master variant axes; legacy `variant` still paints), `title`, `height`, series as multiline `Label: value` text in `data`.
- SiteGauge: `value` / `min` / `max` / `label` / `unit` / `tone` (Meter-like strings).
- `props.data` for SiteChart: multiline text (or legacy `{ label, value }[]`); paint parses either.
- Palette hydrate inserts SiteChart/SiteGauge as free nodes so fixture props stick.

## Paint

Site Kit registry (`lib/site-kit/registry.ts`) → `@zaoly/site-kit` Chart/Gauge atoms. CDN-safe SVG for all chart kinds (`bar`, `bar_horizontal`, `line`, `area`, `scatter`, `pie`, `donut`, `funnel`) — not a second analytics builder.

## Non-goals

- Live Metron `kpiId` / evaluate embed (later; see `creation-vs-metron-dashboard.md`)
- Multi-series / dual-axis
- New Sparkline or other DS primitives in this wave
- Mag PDF flatten of Chart/Gauge (screen/digital only)
- Hosting Metron dashboard builder in Creation
- Stuffing full chart mark/series authoring into Inspect — that belongs in **Chart studio** (`chart-studio-panel.md`)

## Implementation

- Kit: `packages/site-kit` Chart/Gauge + catalog + palette ids
- Insert: `apps/web/lib/scene/scene-insert-defaults.ts`
- Inspect: `apps/web/lib/inspect/site-kit-fields.ts`
- Knowledge: `knowledge/editor-palette-charts.md` · `knowledge/site-kit-atoms-first.md`
