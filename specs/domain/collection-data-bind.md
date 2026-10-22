# Collection data bind — CREATION v3

**Status:** Accepted · Wave 1.4 (2026-10-02)  
**Program:** Live Collection values in CompositionScene (Checkion / Metron)  
**API:** `specs/api/collection-data-bff.md`  
**Knowledge:** `knowledge/collection-data-bind.md` · `knowledge/creation-vs-metron-dashboard.md`  
**Depends:** `brand-token-consume.md` · `editor-inspect.md` · `composition-scene.md` · `chart-studio-panel.md`  
**Plexon twin:** `plexon-v3/knowledge/creation-collection-data-bind.md`

## Goal

CREATION layouts bind **live Collection capability values** onto scene props (text, gauge, later chart series). Scene JSON stores **refs only** (paths). Truth stays in CHECKION / METRON. CREATION paints projections via BFF — same pattern as Brandion `tokenBindings`, different vocabulary.

## Layers (locked)

| Layer | Owner | In scenes? |
|-------|--------|------------|
| Capability truth | CHECKION scores / METRON KPI evaluate | **No** (resolved at paint) |
| Bind map | CREATION `dataBindings` | Yes — refs only |
| Layout / chrome | CREATION CompositionScene + Site Kit | Yes |

## Non-goals

- METRON dashboard builder / formula composer in CREATION (`creation-vs-metron-dashboard.md`)
- Persisting resolved numbers in scene JSON
- EQC one-shot `dataSlot` materialize (separate batch path; may later emit `dataBindings`)

## Ref grammar (SSOT)

Canonical string refs (dot paths, Brandion-like):

| Ref | Meaning |
|-----|---------|
| `metron.kpi.{kpiId}.value` | METRON `POST /api/kpis/:id/evaluate` → `value` (scalar) |
| `metron.collection.kpis` | All active Collection KPIs as chart **rows** (`name`, `value`) |
| `checkion.scan.latest.overallScore` | CHECKION latest completed scan score (scalar) |
| `checkion.scan.latest.issueCount` | Same distillate `issueCount` (scalar) |
| `checkion.scan.latest.facets` | Latest scan overallScore + issueCount as chart rows |
| `checkion.scan.latest.scores` | Latest scan **score cards** as chart rows (`label`, `value`, `max`, `kind`) |
| `checkion.scan.{scanId}.scores` | Score cards for a specific completed scan in the Collection |
| `checkion.collection.scoreHistory` | Completed scans over time (`label`, `value`=overallScore) |
| `checkion.scan.{scanId}.overallScore` | Specific scan (catalog MAY omit; resolve supported) |
| `checkion.scan.{scanId}.issueCount` | Specific scan issue count |
| `collection.{platformProjectId}.{localRef}` | Same local grammar, resolved against **another** accessible Collection |

Unscoped refs resolve against the scene’s `platformProjectId`. Chart studio MAY bind cross-Collection sources via the scoped form. Scalar Inspect binds MAY stay unscoped (open Collection) in Wave 1.4.

Chart studio **Data source** catalog MUST list live scans for the **selected** Collection (default = open scene). Viewer MUST pick only Collections they can access (`GET /api/collection-data/collections`).

## Bindable prop keys

| Node types | Prop key | Display |
|------------|----------|---------|
| SiteText, Text, Heading, … | `children` | Stringify resolved number/string |
| SiteGauge, Gauge, Meter | `value` | Numeric when finite, else string |
| SiteChart (Wave 1.2) | `data` | Whole series from a **source** ref + `chartDataMap` |
| SiteChart (Wave 1.1 legacy) | `data.{i}.value` | Single series point scalar |

WHEN a key has both a literal `props[key]` and a `dataBindings[key]`, canvas MUST prefer the **resolved binding** for paint. Inspect MAY still show the stale literal as fallback when resolve fails.

### Chart source field map

WHEN `dataBindings.data` is a chart-series source, DANN MAY `props.chartDataMap` map source field keys onto paint:

```ts
{ label: string; value: string; color?: string | null }
```

Defaults come from the catalog item’s `fields` (role hints). Color unset → Site Kit categorical fill.

## Requirements (EARS)

### CD-1 Path bind
Inspect data bind MUST emit Collection **refs** only. MUST NOT write free numbers into `dataBindings`.

### CD-2 Persist refs
`CompositionScene` `dataBindings` MUST persist refs. MUST NOT persist resolved values.

### CD-3 Catalog
WENN the scene has a real `platformProjectId`, DANN MUST `GET /api/collection-data/catalog?platformProjectId=` list bindable refs for **that** Collection (Metron + Checkion chart series). Catalog `platformProjectId` MAY differ from the open scene Collection WHEN the viewer also has access (cross-Collection Chart studio). WENN upstream unset/unreachable, DANN MUST return a **fixture** catalog with the same path grammar (CD-1). WENN Checkion responds 404 (Collection not provisioned), DANN MUST return live empty Checkion chart sources with a hint — MUST NOT invent fixture scan rows for that Collection.

### CD-3b Collections directory
WENN Chart studio needs a Collection picker, DANN MUST `GET /api/collection-data/collections` list Plexon Collections the signed-in viewer can access (same directory as Sync Collections).

### CD-4 Resolve
WENN the editor paints nodes with `dataBindings`, DANN MUST `POST /api/collection-data/resolve` batch-resolve refs. Body `platformProjectId` is the **scene** Collection (ACL). Each ref MAY carry `collection.{uuid}.…` scope; resolve MUST ACL-check every scoped Collection and evaluate against that Collection. Unscoped refs use the body `platformProjectId`. Failures MUST leave the literal prop / show unresolved chrome — MUST NOT invent fake scores.

### CD-5 Ops
`set_data_binding` / `clear_data_binding` MUST mirror token-binding ops (including Instance `instanceOverrides.dataBindings`).

### CD-6 No second SSOT
CREATION MUST NOT store KPI formulas, Checkion scan rows, or a parallel metrics DB. Display only.

### CD-7 Auth
Catalog/resolve/collections BFF MUST use session or service auth + Collection access (same gate as VIDEON media BFF). Upstream calls MUST forward `X-Service-Secret` + contract + `X-Actor-User-Id`.

## Scene model

```ts
interface SceneNode {
  // …
  tokenBindings?: Record<string, string>  // Brandion paths
  dataBindings?: Record<string, string>   // Collection refs (this spec)
}
```

Same optional map on breakpoint / state / instance overrides when those layers write binds (Wave 1: base node + instance overrides only).

## Inspect UX (Wave 1)

For bindable fields (`children`, `value`), Inspect MUST show a compact **Data** control under the literal:

- Bound: short ref label + clear
- Unbound: “Bind Collection value…” → catalog picker (grouped Metron / Checkion)

### Chart studio (Wave 1.4)

Chart studio MUST offer a **Collection** picker (accessible Collections) then a **Data source** within that Collection. WHEN the chosen Collection differs from the open scene Collection, DANN MUST persist `collection.{uuid}.{localRef}` on `dataBindings.data`. Field map + series preview unchanged from Wave 1.3.

## Acceptance

1. Specs + inventory + knowledge paths for `METRON_API_URL` / `CHECKION_API_URL`.
2. Ops round-trip `set_data_binding` / `clear_data_binding`.
3. Catalog returns fixture when upstream unset; live items when configured.
4. Resolve returns display values for fixture refs.
5. Inspect can bind SiteText `children` and SiteGauge `value` to a catalog ref.
6. Canvas paints resolved value when resolve map present.
