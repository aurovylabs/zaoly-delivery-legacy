# API — Library promote

**Status:** Accepted · **Date:** 2026-08-17  
**Domain:** `specs/domain/library-composition-roundtrip.md`  
**Canonical:** sibling `zaoly/specs/domain/library-composition-roundtrip.md` Phases 3–4  
**Path helpers:**  
`paths.routes.apiLibraryPromoteDryRun` → `/api/library/promote/dry-run`  
`paths.routes.apiLibraryPromote` → `/api/library/promote`

Auth: Session required when Plexon auth is configured (`requireApiSession`). Local open only with `ZAOLY_AUTH_BYPASS=1`. Phase 3 never writes git. Phase 4 opens a PR only.

## POST `/api/library/promote/dry-run`

Body:

```json
{
  "kind": "P1",
  "scene": { },
  "nodeId": "cover",
  "zaolyUiSource": "optional-override"
}
```

| Field | Notes |
|-------|--------|
| `kind` | `P1` \| `P2` \| `P3` \| `P4` |
| `scene` | Required `CompositionScene` |
| `nodeId` | Required for P1 and P4 |
| `zaolyUiSource` | Optional; default `resolveZaolyUiSource()` |

`PromoteProposal.writesGit` MUST be `false`. File ops MAY include `contents` (preview).

## POST `/api/library/promote`

Same body as dry-run. Runs the dry-run validator, materializes files, then opens or updates a GitHub PR on `aurovylabs/zaoly-delivery`.

| Status | Body |
|--------|------|
| 200 | `{ "ok": true, "proposal": PromoteProposal }` (`writesGit: true`, `pullRequest`) |
| 400 | `{ "ok": false, "error": string, "issues": […] }` (validation) |
| 503 | `{ "ok": false, "error": string, "issues": [{ "code": "github-unconfigured" \| "github-failed" }] }` |

MUST NOT push `main`. MUST NOT call Coolify. P3 is always 400 `dev-track`. P1 with a closed inspect chrome field (`genericCatalogInspectProps`) missing from the primitive contract MUST upgrade to P4 — including fill/type/radius/padding/size/stroke and `tokenBindings` mapped to library CSS variables (`PROMOTE_TOKEN_PATH_TO_CSS_VAR`). Raw hex stays `collection-branding`.

P4 file ops: `packages/ui/src/components/{Type}.tsx` (named prop + style on `{...rest}` and inner `<Panel` when it has no `style=`), `{Type}.promoted.stories.tsx` args that paint, `{Type}.promoted.extend.test.tsx`. Print-bundle / unpatchable sources / unmapped token paths → 400 `extend-unrepresentable`.

P1 file imports MUST resolve from the story’s folder: atoms `import { Type } from './Type'` in `packages/ui/src/components/`; Print `import { PrintPage, Type } from './PrintPrimitives'` in `packages/ui/src/print/`. A `../components/` import from `components/` fails Storybook module load.

P1 atom stories MUST be args-only (no JSX `render`) so the static Storybook preview can load them the same way as human `Type.stories.tsx`. Print P1/P2 MAY wrap with `createElement` — MUST NOT emit JSX. `tokenBindings` belong in `parameters`, not component `args`.

## GitHub env (`paths`)

| Env | Role |
|-----|------|
| `GITHUB_TOKEN` | `paths.envGithubToken` — Contents + Pulls |
| `GITHUB_API_URL` | `paths.envGithubApiUrl` — default `paths.githubApiBaseDefault` |
| `ZAOLY_UI_GITHUB_REPO` | Optional `owner/repo`; default `paths.zaolyUiGithubRepo` |

Issue codes: `dev-track` · `collection-branding` · `missing-node` · `invalid-kind` · `report-payload` · `github-unconfigured` · `github-failed` · `extend-unrepresentable`.
