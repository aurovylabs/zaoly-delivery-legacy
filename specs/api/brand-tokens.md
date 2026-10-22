# API — Brand token pack (CREATION history)

**Status:** **Retired on Zaoly** — 2026-10-05 · CREATION suite history only  
**Zaoly:** `GET`/`PATCH` `/api/brand-tokens` MUST return `410` `{ error: "brandion_out_of_scope", use: "/api/tokens" }`. Token SSOT is `specs/api/zaoly-tokens.md`.  
**CREATION domain (historical):** `specs/domain/brand-token-consume.md`  
**Knowledge:** `knowledge/upstream-pack-out-of-scope-for-zaoly.md`

> The sections below document the former CREATION BFF contract. Zaoly MUST NOT implement live Brandion consume or push.

## Route — read (CREATION historical)

`GET /api/brand-tokens?platformProjectId=`

Session auth (same gate as `/api/scenes`). Public unauthenticated access MUST be denied when Plexon auth is configured.

## Query

| Param | Required | Notes |
|-------|----------|--------|
| `platformProjectId` | yes | Collection id on the scene. Local placeholders (`plx-local-*`) MUST skip live fetch and return fixture empty/`source: fixture`. |

## Response `200`

```ts
{
  source: 'brandion' | 'fixture'
  guidelineId: string | null
  platformProjectId: string
  /** Active visual leaves, Brandion `DesignTokenLeaf` shape (path, type, value JSON, status) */
  tokens: Array<{ path: string; type: string; value: string; status: 'active' }>
}
```

- `source: 'brandion'` — live active pack.
- `source: 'fixture'` — Brandion unset, 404, or error; CREATION applies local catalog. MUST NOT leak upstream error bodies to the client.
- `localPromotePreview?: true` — **dev only** when `ZAOLY_AUTH_BYPASS` is on and the pack is fixture. Client MAY show promote UX as a **session overlay** (bind + catalog merge in memory). MUST NOT call `PATCH /api/brand-tokens` / Brandion. Staging/prod MUST omit the flag.

## Response `204` / empty

Allowed when `platformProjectId` missing. Client keeps fixture.

## Errors (GET)

| Status | When |
|--------|------|
| 400 | Missing/invalid `platformProjectId` when caller insisted on live |
| 401 | No session (auth configured) |
| 502 | Brandion configured but transport failed — still MAY return `200` + `source: 'fixture'` (prefer degrade over hard fail for inspect) |

## Route — write (P75 / W-TOKEN-STUDIO-EDIT)

`PATCH /api/brand-tokens`

Body:

```ts
{
  platformProjectId: string
  guidelineId: string
  path: string
  type: string
  value: string  // Brandion leaf JSON string (digital channel updated)
  status?: 'active' | 'pending'
}
```

CREATION BFF MUST:
1. Require session when auth configured
2. Resolve live pack for `platformProjectId` and verify `guidelineId` matches (prevent cross-guideline writes)
3. Proxy to Brandion `PATCH {BRANDION}/api/guidelines/{guidelineId}/tokens` with service secret + contract headers
4. Return `{ ok: true, token: { path, type, value, status } }` or upstream error code

MUST NOT persist leaves in CREATION Postgres. MUST NOT invent paths/types.

### Errors (PATCH)

| Status | When |
|--------|------|
| 400 | Missing fields / fixture-only Collection |
| 401 | No session |
| 403 | `guidelineId` does not match active pack for Collection |
| 502 | Brandion unreachable / upstream non-OK |

## Upstream call (server only)

| Item | Source |
|------|--------|
| Base | `BRANDION_API_URL` or `NEXT_PUBLIC_BRANDION_URL` (`paths` / runtime-config) |
| Read path | Brandion active-pack (document in `knowledge/paths.md`) |
| Write path | Brandion `/api/guidelines/:id/tokens` |
| Auth | `X-Service-Secret: ZAOLY_SERVICE_SECRET` + federation contract headers |
| Never | Secret in `NEXT_PUBLIC_*` or browser fetch to Brandion |

## DS-DEPOSIT D4 smoke (Zaoly Collection)

Staging Collection id: `paths.zaolyDepositPlatformProjectId` (`knowledge/paths.md`).

WENN Brandion has an active deposit guideline for that Collection, DANN `source` MUSS be `brandion`, `guidelineId` the active guideline, and `tokens` MUST include deposited leaves (≈138 after D7) such as `color.brand.green` (`#00ca55`) and `spacing.static.1`…`6`.

CI MUST mock Brandion (no live secret required). Operator staging curl: `knowledge/ds-deposit-d4-operator.md`.

## Non-goals

- Browser-direct Brandion export/write
- CREATION-local leaf store
- Full Brandion studio (chapters, assets, compliance) in P75 — minimal digital edit only
- Caching spec beyond “request per editor load / platformProjectId change” (implementation MAY cache in memory for the session)
