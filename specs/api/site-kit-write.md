# Site Kit write API

**Status:** Accepted · **Date:** 2026-08-20 · **Tenancy follow-up:** `specs/domain/site-kit-collection-scope.md`  
**Spec domain:** `specs/domain/site-kit.md` · `specs/domain/site-kit-compositions.md`

## Routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/site-kit/write` | Session |
| POST | `/api/site-kit/compositions` | Session |
| GET | `/api/site-kit/compositions` | **SK-S1:** session/service + Collection ACL, **or** view token (scoped), **or** provisioning secret (hydrate). Unauthenticated unfiltered → `401` |
| POST | `/api/site-kit/storybook-view-token` | Session — mint Collection-scoped Storybook Live credential |
| GET | `/api/site-kit/catalog` | Session |
| GET | `/api/site-kit/overrides/:id` | Atom seed (`Site*`) MAY stay public. **SK-S1:** `Composition*` MUST authorize owning Collection (session/service/view token) else `404` |

Live overrides are durable in Postgres table `site_kit_overrides` when `ZAOLY_DATABASE_URL` is set. **Postgres is the production SSOT:** when configured, a write MUST succeed in Postgres or return `pg-unavailable` — disk under `.data/site-kit/overrides/` is a dev/local cache only and MUST NOT make a failed Postgres write appear successful. Reads merge Postgres + disk by `updatedAt` (newer wins). Storybook live polling MUST reset preview state when `componentId` changes and MUST surface loading / not-found / stale states instead of retaining a prior component tree.

## POST `/api/site-kit/write` (atom)

Body:

```json
{
  "componentId": "SiteButton",
  "args": { "children": "Go", "variant": "primary" },
  "tokenBindings": { "color": "color.action.primary" },
  "composition": {
    "type": "SiteButton",
    "props": { "children": "Go", "variant": "primary" },
    "style": { "color": "#…" },
    "tokenBindings": { "color": "color.action.primary" }
  }
}
```

Behavior: allowlist atom id → resolve **SK-S4 publish lane** → best-effort patch/regenerate story **only for seed lane** → ALWAYS write override JSON with `composition` (cascaded paint; see `site-kit-token-paint.md`). Optional `variants` / `defaultVariantId` (Master named variants, ≥2) MUST be stored on the override and MUST regenerate CSF so Storybook lists those names instead of seed demos (`Secondary`/`Ghost`) **for seed lane**. Live Storybook prefers `composition` / `variants` over flat `args`. `writesGit: false`.

**SK-S4 lanes:**

| `publishLane` | `platformProjectId` | Result |
|---------------|---------------------|--------|
| omitted + Collection | set | **fork** → override id `Atom~{scopeKey}~{SiteType}`; no disk CSF patch |
| `fork` | required | same |
| `seed` / omitted without Collection | — | global `Site*` **only if** `ZAOLY_SITE_KIT_SHARED_SEED_WRITE=1`; else `403` `seed-write-forbidden` |

Reject codes: `unknown-component`, `missing-platform-project-id`, `seed-write-forbidden`, `seed-lane-conflict`, `scope-mismatch`, …

Body MAY include:

```json
{
  "componentId": "SiteButton",
  "publishLane": "fork",
  "platformProjectId": "32498667-471e-4b21-b920-5eff5c338300",
  "args": { "children": "Go", "variant": "primary" },
  "composition": { "type": "SiteButton", "props": {} }
}
```

Body MAY include named variants (seed lane):

```json
{
  "componentId": "SiteButton",
  "args": { "children": "Go", "variant": "primary" },
  "composition": { "type": "SiteButton", "props": {} },
  "variants": [
    { "id": "v1", "name": "Default", "composition": { "type": "SiteButton", "props": {} } },
    { "id": "v2", "name": "Hover", "composition": { "type": "SiteButton", "props": {} } }
  ],
  "defaultVariantId": "v1"
}
```

Phase 3 Component Sets MAY include `axes` + per-cell `combination` (MUST round-trip onto the override and CSF):

```json
{
  "componentId": "SiteButton",
  "composition": { "type": "SiteButton", "props": {} },
  "axes": [{ "id": "axis-variant", "name": "Variant", "values": ["Default", "Secondary"] }],
  "variants": [
    {
      "id": "v1",
      "name": "Default",
      "combination": { "axis-variant": "Default" },
      "composition": { "type": "SiteButton", "props": {} }
    },
    {
      "id": "v2",
      "name": "Secondary",
      "combination": { "axis-variant": "Secondary" },
      "composition": { "type": "SiteButton", "props": {} }
    }
  ],
  "defaultVariantId": "v1"
}
```

WHEN `axes` is present with ≥2 variants, CSF MUST emit one select control per axis (arg key = axis id) and MUST NOT rely only on a flat `variant` name select. Override MUST store `axes` + `combination`.

**Hardening:** Axis ids MUST match `^[A-Za-z][A-Za-z0-9_-]{0,63}$`, MUST NOT use reserved control keys (`variant`, `componentId`, …), ≤8 axes / ≤32 values each / ≤64 cells. WHEN `axes` is sent, every variant MUST include a full valid unique `combination` — else reject `invalid-axes` / `invalid-variants` (HTTP 400). CSF titles/comments MUST be string-literal escaped. Orphan `combination` without `axes` MUST be stripped. WHEN serving or hydrating overrides, MUST soft-sanitize Component Set fields (drop illegal axes; fall back to flat named variants) so Live/Catalog never 500 on poisoned JSON.

## POST `/api/site-kit/compositions` (save as component)

Body:

```json
{
  "name": "MarketingHero",
  "platformProjectId": "32498667-471e-4b21-b920-5eff5c338300",
  "root": {
    "type": "SiteStack",
    "props": { "direction": "column" },
    "style": { "gap": "var(--site-space-4)", "padding": "1rem" },
    "children": []
  },
  "variants": [
    { "id": "mvar-default", "name": "Default", "composition": { "type": "SiteStack", "props": {} } },
    { "id": "mvar-hover", "name": "Hover", "composition": { "type": "SiteStack", "props": {} } }
  ],
  "defaultVariantId": "mvar-default"
}
```

`root` is the client-serialized tree (active-breakpoint cascade; paint in `style`; contract fields in `props`).

`platformProjectId` MUST be a non-empty Collection id (from the bound scene). Missing/blank → `missing-platform-project-id`.

Optional `variants` (Master named variants, ≥2): each entry MUST validate like `root`. WHEN present, override MUST store `variants` + `defaultVariantId`; `composition` MUST equal the default variant’s tree (or `root` when it matches). Optional `axes` + per-variant `combination` MUST be stored when provided (Phase 3).

Behavior:

1. Validate name + tree (Site Kit types only); validate each variant composition when provided; require `platformProjectId`.
2. Write `packages/site-kit/src/compositions/{Name}.tsx` + `{Name}.stories.tsx` when writable (one CSF export per named variant when `variants` length ≥ 2). CSF title `Compositions/{scope}/{Name}`.
3. ALWAYS write override `{ componentId: "Composition~{scopeKey}~{Name}", composition, args: {}, platformProjectId, variants?, defaultVariantId?, updatedAt }` (SK-S2). Legacy `Composition{Name}` may still exist until migrated.
4. Request one Coolify Storybook force rebuild (same as Publish); build hydrates composition CSF from overrides.
5. Response `{ ok: true, exportName, wrote[], storyTitle, componentId, platformProjectId, variantCount?, writesGit: false, storybookRedeploy }`.

Reject: `invalid-name`, `invalid-tree`, `invalid-variants`, `invalid-variant-name`, `duplicate-variant-name`, `missing-platform-project-id`, `path-escape`, `disk-unwritable`, `pg-unavailable`, `reserved-name`.

Validation and TSX/CSF codegen MUST use the shared module `@zaoly/site-kit/composition-codegen` (same implementation as Docker `hydrate-composition-stories.mjs`). Server write and hydration MUST produce equivalent module/story output for the same override payload.

## GET `/api/site-kit/compositions`

Returns `{ compositions: [{ name, exportName, storyTitle, componentId, platformProjectId, updatedAt, previewRoot? }] }` from disk scan + override index. `previewRoot` is the override `composition` tree when present (Library live preview).

**Auth (SK-S1):** fail-closed — see `specs/domain/site-kit-collection-scope.md` § SK-S1.

| Principal | Behavior |
|-----------|----------|
| Session / scene-api service | `platformProjectId` → ACL check + exact filter; `unscoped=1` → unscoped only; neither → intersect viewer’s accessible Collections (never world dump) |
| View token (`X-Zaoly-Site-Kit-View` / `zaolyViewToken`) | Exact token Collection only |
| Provisioning (`X-Service-Secret` + contract) | Admin/hydrate may list all (or honor query filter) |
| None | `401` `{ error: 'unauthorized', code: 'site-kit-scope-required' }` |

Query:

| Param | Behavior |
|-------|----------|
| `platformProjectId=<id>` | exact Collection match only (must be authorized) |
| `unscoped=1` | only `platformProjectId == null` (legacy / unbound editor; session/service) |

CORS `*` + allow header `X-Zaoly-Site-Kit-View`. `Cache-Control: no-store`.

`POST /api/site-kit/compositions/from-scene` MUST stamp `scene.platformProjectId` the same way (reject when unbound).

## POST `/api/site-kit/storybook-view-token`

Session required. Body `{ "platformProjectId": "<Collection id>" }`. Viewer MUST pass Collection ACL. Response `{ ok: true, viewToken, expiresAt, platformProjectId }`. Token is reusable until `exp` (Live poll). Spec: `site-kit-collection-scope.md` SK-S1.

## GET `/api/site-kit/overrides/:componentId`

CORS `*`, `Cache-Control: no-store`. Used by Storybook live preview.

| Id class | Auth |
|----------|------|
| Atom seed (`Site*`) | Public (SK-S1) |
| Atom fork (`Atom~*`) | Same as Patterns — owning Collection (SK-S4) |
| Pattern (`Composition*`) | Session/service/view token for owning `platformProjectId`; else **`404`**. Unscoped Patterns: session/service only. |

## POST `/api/site-kit/publish`

Batch-writes Site Kit Masters to overrides (SK-S4: default Collection **fork** when `platformProjectId` on body/items), then requests **one** Storybook rebuild.

Response when `ok: true`:

- `published`, `componentIds`, `wrote`
- optional `failures: [{ componentId, error }]` for per-item write errors (partial publish)
- `storybookRedeploy: { status, reason }` where `status` is one of:
  - `queued` — Coolify deploy/hook accepted
  - `skipped` — credentials not configured (`missing-coolify-credentials`)
  - `failed` — configured but deploy request failed (`deploy-failed`)

Editor UI MUST distinguish live override saved vs rebuild queued/skipped/failed. MUST NOT claim “rebuild started” unless `storybookRedeploy.status === 'queued'`.
