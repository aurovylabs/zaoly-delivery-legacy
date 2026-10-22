# Plexon federation — CREATION v3

## Status
**Accepted (Wave 3)** — auth + health + Assistant host + Collection provisioning/origin. Default local remains `dummy`.

## Contract
`2026-05-plexon-federation-v3` against **plexon-v3 only**.

## Directions
| Direction | Endpoint | Notes |
|-----------|----------|-------|
| CREATION → Plexon | Auth validate | `POST /api/auth/validate-credentials` via NextAuth credentials |
| CREATION public | `GET /api/health` | Registry health probe |
| CREATION public | `GET /api/federation/health` | Contract + plexon reachability when live |
| Plexon → CREATION | `PUT/GET /api/platform/provisioning/projects/{id}` | Collection binding upsert / dashboard summary |
| CREATION → Plexon | `POST …/creation-project-origin` | Product-first Collection origin |

## Mode
- Default `paths.federationMode = dummy` — shell + fixtures, no live upsert/origin outbound
- Override with `ZAOLY_FEDERATION_MODE=live` + `ZAOLY_SERVICE_SECRET` (+ `NEXT_ZAOLY_FEDERATION_BASE_URL` or `ZAOLY_FEDERATION_AUTH_URL`)
- Staging Coolify MUST use `live` once Plexon registry + shared secret are set (otherwise Sync CTAs return `503 federation_mode_dummy`)
- `/api/federation/health` reports configuration; live probe of plexon `/api/health` when secret + base set
- Inbound provisioning (PUT/GET) is authorized by service secret + contract header regardless of dummy/live (machine path)
- Bulk pull: `POST /api/projects/sync-from-plexon` → Plexon `POST /api/platform/provisioning/sync-capability-mirrors` with `productIds: ['creation']`
- **P71 list:** `GET /api/projects/collections` → Plexon `GET /api/platform/provisioning/accessible-collections` (same directory as Sync; service + `X-Actor-User-Id`)

## Provisioning (Wave 3)
- **PUT** upsert: `name`, `platformCompanyId`, `ownerUserId`, `contractVersion` required; optional `domain`, `status`
- Response: `{ status: 'applied', externalProjectId, projectId, platformProjectId }`
- **GET** summary: requires `X-Actor-User-Id`; returns `{ externalProjectId, platformProjectId, compositionCount }` (counts stubbed until domain hubs)
- Public via middleware: `/api/platform/provisioning/*`

## Origin (Wave 3)
- Outbound when `ZAOLY_FEDERATION_MODE=live` and federation configured
- Body: `{ creationProjectId, name, domain?, ownerPlexonUserId?, platformCompanyId? }`
- Local placeholders (`plx-local-*`, non-UUID) trigger origin; real Collection UUIDs bind without re-origin

## Central Assistant (cross-app)
- Host: `PlatformAssistantHost` in AppShell → iframe `{plexonBase}/assistant/embed`
- Embed product query: `product=creation`
- Spec: `plexon-v3/specs/domain/central-assistant-flyout.md` · `plexon-v3/specs/api/assistant-embed.md`
- Public Plexon origin for iframe: `NEXT_PUBLIC_ZAOLY_FEDERATION_URL` / `NEXT_ZAOLY_FEDERATION_BASE_URL` / `ZAOLY_FEDERATION_AUTH_URL` — see `knowledge/paths.md`

## Auth (NextAuth + Plexon)
- NextAuth credentials provider validates against plexon `POST /api/auth/validate-credentials`
- Env: `ZAOLY_FEDERATION_AUTH_URL`, `ZAOLY_SERVICE_SECRET`, `AUTH_SECRET` (≥32), optional `NEXT_PUBLIC_ZAOLY_FEDERATION_REGISTER_URL`
- Middleware requires login when Plexon auth is configured; public: `/login`, `/api/auth/*`, `/api/health`, `/api/federation/health`, `/api/platform/provisioning/*`
- Local bypass (“Continue to app”) only when Plexon auth unset

## Env
See `knowledge/paths.md` and `knowledge/staging-coolify.md`.
