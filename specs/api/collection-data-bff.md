# API — Collection data BFF (CREATION)

**Status:** Accepted · Wave 1.3 · 2026-10-02  
**Domain:** `specs/domain/collection-data-bind.md`  
**Upstream:** METRON `GET /api/kpis` · `POST /api/kpis/:id/evaluate` · CHECKION `GET /api/platform/provisioning/projects/:platformProjectId`  
**Paths:** `knowledge/paths.md` · `apps/web/lib/paths.ts`

## Auth

| Route | Auth |
|-------|------|
| `GET /api/collection-data/collections` | Session **or** service secret + `X-Actor-User-Id` |
| `GET /api/collection-data/catalog` | Session **or** service secret + `X-Actor-User-Id`; Collection access for `platformProjectId` |
| `POST /api/collection-data/resolve` | Same; scene Collection ACL + ACL for every scoped `collection.{uuid}.…` ref |

Upstream: `X-Service-Secret` + `X-Federation-Contract-Version` + `X-Actor-User-Id`.  
Env: `METRON_API_URL` / `NEXT_PUBLIC_METRON_URL`; `CHECKION_API_URL` / `NEXT_PUBLIC_CHECKION_URL`; `ZAOLY_SERVICE_SECRET`.

## Collections directory

`GET /api/collection-data/collections`

**200**

```json
{
  "items": [
    { "id": "…uuid…", "name": "Acme Brand" }
  ],
  "truncated": false
}
```

- Same visibility as Plexon accessible-Collections directory.
- WHEN federation unset → **503** with `plexon_not_configured` / `federation_mode_dummy`.

## Catalog

`GET /api/collection-data/catalog?platformProjectId={uuid}`

`platformProjectId` is the **source** Collection to list (may differ from the open scene Collection). Viewer MUST have access.

**200**

```json
{
  "source": "live" | "fixture",
  "platformProjectId": "…",
  "items": [
    {
      "ref": "metron.kpi.kpi_abc.value",
      "label": "Conversion rate",
      "product": "metron",
      "kind": "kpi_value",
      "hint": "KPI evaluate"
    },
    {
      "ref": "metron.collection.kpis",
      "label": "Collection KPIs (chart)",
      "product": "metron",
      "kind": "chart_series",
      "hint": "One row per active KPI",
      "fields": [
        { "key": "name", "label": "Name", "kind": "string", "role": "label" },
        { "key": "value", "label": "Value", "kind": "number", "role": "value" }
      ]
    },
    {
      "ref": "checkion.scan.latest.facets",
      "label": "Latest scan facets (chart)",
      "product": "checkion",
      "kind": "chart_series",
      "hint": "Score + issue count as rows",
      "fields": [
        { "key": "label", "label": "Label", "kind": "string", "role": "label" },
        { "key": "value", "label": "Value", "kind": "number", "role": "value" }
      ]
    },
    {
      "ref": "checkion.scan.latest.scores",
      "label": "Latest scan scores (chart)",
      "product": "checkion",
      "kind": "chart_series",
      "hint": "Score cards",
      "fields": [
        { "key": "label", "label": "Label", "kind": "string", "role": "label" },
        { "key": "value", "label": "Value", "kind": "number", "role": "value" }
      ]
    },
    {
      "ref": "checkion.scan.scan_abc.scores",
      "label": "Scan scores · example.com · 2026-10-01",
      "product": "checkion",
      "kind": "chart_series",
      "hint": "Overall 78",
      "fields": [
        { "key": "label", "label": "Label", "kind": "string", "role": "label" },
        { "key": "value", "label": "Value", "kind": "number", "role": "value" }
      ]
    }
  ]
}
```

- Scalar kinds (`kpi_value`, `scan_score`, `scan_issue_count`) for Inspect text/gauge.
- `chart_series` for Chart studio **Data source** only (filter by `kind`). Live catalog MUST include completed scans from CHECKION `scoreHistory` (capped).
- WHEN Metron/Checkion origins unset → `source: "fixture"` with demo refs (same grammar).
- WHEN Checkion returns **404** (Collection not provisioned) → live empty Checkion chart sources + hint (no fake scan rows).
- WHEN Collection access denied → **403**.
- Partial live: Metron live + Checkion fixture (or reverse) → `source: "live"` if **any** live product contributed; else `fixture`.

## Resolve

`POST /api/collection-data/resolve`

```json
{
  "platformProjectId": "…",
  "refs": ["metron.kpi.kpi_abc.value", "metron.collection.kpis", "checkion.scan.latest.facets"]
}
```

**200**

```json
{
  "platformProjectId": "…",
  "values": {
    "metron.kpi.kpi_abc.value": {
      "status": "ok",
      "display": "42",
      "numeric": 42,
      "source": "metron"
    },
    "metron.collection.kpis": {
      "status": "ok",
      "display": "2 KPIs",
      "source": "metron",
      "rows": [
        { "name": "Conversion", "value": 42 },
        { "name": "Retention", "value": 18 }
      ],
      "fields": [
        { "key": "name", "label": "Name", "kind": "string", "role": "label" },
        { "key": "value", "label": "Value", "kind": "number", "role": "value" }
      ]
    },
    "checkion.scan.latest.facets": {
      "status": "ok",
      "display": "2 facets",
      "source": "checkion",
      "rows": [
        { "label": "Overall score", "value": 78 },
        { "label": "Issue count", "value": 12 }
      ],
      "fields": [
        { "key": "label", "label": "Label", "kind": "string", "role": "label" },
        { "key": "value", "label": "Value", "kind": "number", "role": "value" }
      ]
    }
  }
}
```

- Batch; unknown refs → `status: "error"`.
- Fixture refs resolve to deterministic demo numbers / rows when upstream unset.
- Chart-series refs MUST include `rows` + `fields` on success.
- MUST NOT invent scores for live refs that failed.

## Errors

| Code | When |
|------|------|
| 401 | No session / service actor |
| 403 | Collection access denied |
| 400 | Missing `platformProjectId` / invalid body |
| 503 | Optional — prefer fixture over hard 503 for catalog |

## Testing

- Unit: ref parse + fixture catalog/resolve
- Contract: catalog requires Collection ACL
- Spec inventory includes this file + domain
- Client MUST NOT embed `ZAOLY_SERVICE_SECRET`
