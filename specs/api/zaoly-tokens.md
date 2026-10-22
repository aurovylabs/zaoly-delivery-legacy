# API — Zaoly local token pack

**Status:** Accepted  
**Domain:** `specs/domain/zaoly-token-studio.md`  
**Route constants:** `paths.routes.apiTokens` (`/api/tokens`)

Zaoly local pack only — no Brandion. Scalar `value` digital may be a literal or a CSS expression with `{token.path}` refs (`specs/domain/zaoly-token-studio.md` derived expressions).

## Store

When `ZAOLY_DATABASE_URL` is set: table `token_leaves` (`path`, `type`, `value` JSON text, `updated_at`).  
Otherwise: JSON file `paths.tokenPackStoreRelPath` (`.data/token-pack.json`), override via `ZAOLY_TOKEN_PACK_PATH`.

### Durability

- **File store:** writes MUST be atomic (temp file in the same directory + `rename`). Concurrent mutations on one process MUST be serialized (in-process queue).
- **Rename:** upsert + sibling `{fromPath}` ref rewrite + delete of `fromPath` MUST be one unit — Postgres `BEGIN`/`COMMIT`, or a single atomic file rewrite for the JSON store.

### Write validation

PATCH MUST validate via `lib/tokens/pack-validate.ts` before persist:

- Path / type (existing rules).
- `value` byte length ≤ `paths.tokenPackMaxValueBytes`.
- Leaf JSON shape + digital channel for the type (scalar literals / compose expr; structured drafts rebuildable).
- Compose expressions: reject cycles against the current merged pack (`expr_cycle`).

## GET `/api/tokens`

Session (or auth bypass). Response:

```json
{
  "source": "local",
  "tokens": [{ "path": "color.action.primary", "type": "color", "value": "{...}", "status": "active" }],
  "origins": { "color.action.primary": "fixture" },
  "canWrite": true
}
```

`tokens` = fixture catalog leaves (typed) merged with local overrides (override wins). `origins` is `fixture` | `local`. `canWrite` is true for admin / bypass.

## PATCH `/api/tokens`

Admin. Body: `{ "path", "type", "value", "fromPath"? }` — `value` is Zaoly pack leaf JSON (digital channel; same shapes as the fixture catalog). Path MUST pass `isValidStudioTokenPath`. Upserts an override. Editor rail and HUD promote use this endpoint (not Brandion).

When `fromPath` is set and differs from `path`: **rename** — upsert at `path`, delete local override at `fromPath` if any, rewrite `{fromPath}` → `{path}` inside other local override values. Target path MUST NOT already exist in the merged pack (`409` `path_exists`). Invalid `fromPath` empty with rename intent is ignored (plain upsert).

Success: `{ "ok": true, "token": { "path", "type", "value", "status": "active" }, "renamedFrom"?: string, "rewritten"?: number }`

Errors: `400` `fields_required` | `invalid_path` | `invalid_type` | `invalid_value` | `value_too_large` | `expr_cycle`; `409` `path_exists`; `401`; `403`.

## DELETE `/api/tokens?path=`

Admin. Removes the local override (fixture leaf returns) or deletes a custom leaf.

Success: `{ "ok": true, "path": "..." }`  
Missing path: `400` `fields_required`.

## POST `/api/tokens/import`

Admin. Import a nested DTCG-style JSON pack dump (`lib/tokens/pack-import.ts`).

Body:

```json
{ "json": "{ ... }", "dryRun": true }
```

- `json` MUST be a string; UTF-8 size ≤ `paths.tokenPackMaxImportBytes`.
- `dryRun` defaults to `true`. When `true`, validate + diff only (no writes). When `false`, upsert every valid create/update leaf (batch; each leaf passes `pack-validate`).

Success:

```json
{
  "ok": true,
  "dryRun": true,
  "diff": {
    "create": ["color.custom.brand"],
    "update": ["color.action.primary"],
    "unchanged": ["spacing.static.medium"],
    "invalid": [{ "path": "shadow.x", "error": "invalid_value" }]
  },
  "applied": 0
}
```

When `dryRun: false`, `applied` is the number of upserts. Errors: `400` `fields_required` | `invalid_json` | `import_too_large`; `401`; `403`.
