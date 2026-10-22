# Zaoly standalone product

**Status:** Accepted — 2026-10-05  
**Product id:** `zaoly`  
**Origin:** Fork of `creation-v3` — see `knowledge/origin.md`

## Intent

Zaoly is a **standalone** composition design editor. Sibling CREATION remains a separate suite product. The two share `@zaoly/ui` + scene concepts but not a required runtime coupling.

## MUST

1. `npm run dev` MUST open the in-app editor without suite-federation or upstream pack env.
2. The public `/` route MUST introduce Zaoly; `/editor` remains the primary product workspace and primary in-app nav item (`zaoly-landingpage-concept.md`).
3. Env keys MUST be `ZAOLY_*` / `NEXT_PUBLIC_ZAOLY_*` only — no `CREATION_*` / `PLEXON_*` aliases (`envGet`).
4. Scene format MUST remain `CompositionScene` JSON (`@zaoly/contracts`).
5. UI primitives MUST come from `@zaoly/ui` (no Stencil WC canvas).
6. Durable compositions MUST use Postgres when `ZAOLY_DATABASE_URL` is set (`specs/domain/zaoly-composition-persistence.md`); JSON fallback when unset.
7. Standalone create/list MUST NOT require a Collection / `platformProjectId`; ownership uses `ownerUserId`.
8. Identity / login / admin MUST use local Zaoly users (`specs/domain/zaoly-user-management.md`) — **not** suite credentials.
9. Multi-user + scene share require `ZAOLY_DATABASE_URL` (`zaoly-scene-share.md`).

## MAY

1. Explicit `ZAOLY_AUTH_BYPASS=1` outside production for single-actor DX (`dev-local`).
2. **Hosted profile** (`zaoly.app`) MAY lock managed capabilities (e.g. `ZAOLY_SMTP_MANAGED`) and keep PoC integrations default-off (e.g. Storyblok handoff) — see `knowledge/zaoly-hosted-vs-self-host.md`.
3. **Platform admin** console at `/admin` MAY deepen hosted ops (directory search, overview, phase-2 elevated role) while self-host keeps the same routes with thinner modules — `zaoly-platform-admin.md`.
4. **Community distribution** (public GitHub) MAY ship developable app source without internal `knowledge/` or hosted zaoly.app ops — `specs/domain/zaoly-community-distribution.md`.

## MUST NOT

1. Require Collections / `platformProjectId` to edit a scene.
2. Reintroduce canon Stencil/`*.zaoly.html` as composition SoT.
3. Replace or gut sibling `creation-v3`.
4. Share CREATION Coolify Postgres with Zaoly.
5. Use suite federation as Zaoly auth or membership SSOT — no suite login, Assistant host, product switcher, Collection sync, or federation health on Zaoly product surfaces (`knowledge/suite-federation-out-of-scope-for-zaoly.md`).
6. Consume or push an upstream brand pack (no live `/api/brand-tokens`; route MAY return `410`). Token SSOT is the local pack (`zaoly-token-studio.md` · `knowledge/upstream-pack-out-of-scope-for-zaoly.md`).
7. Surface suite hubs (`/projects` Collection sync, Magcloud, suite client-share policy) as primary product paths.
8. Make **self-host** installs depend on weddy-only secrets (Traefik file routes, `/root/.zaoly-smtp`, external `weddy-ecosystem` network). Self-host MUST remain operable via documented Compose + `.env` (`knowledge/self-host.md`).

## Acceptance

- [ ] `paths.productId === 'zaoly'` and `paths.brandLabel === 'Zaoly'`
- [ ] Local credentials login against Postgres users (or explicit bypass in non-production)
- [ ] Public home introduces Zaoly and links to `/editor`; editor remains the primary authenticated workspace
- [ ] Smoke test `standalone-boot` green
- [ ] Composition persistence smoke (`zaoly-composition-persistence`) green
- [ ] User-management + scene-share specs inventory green
