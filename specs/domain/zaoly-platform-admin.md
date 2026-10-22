# Zaoly platform admin

**Status:** Accepted — 2026-10-09 · Phase 1 + Phase 2a + Phase 2b shipped  
**Product:** Zaoly standalone · profiles `knowledge/zaoly-hosted-vs-self-host.md`  
**API:** `specs/api/zaoly-platform-admin.md`  
**Ops:** `knowledge/zaoly-platform-admin.md`  
**Related:** `zaoly-user-management.md` · `zaoly-system-mail.md` · `zaoly-standalone.md` · `settings.md`

## Intent

Operators of a Zaoly deployment (especially **hosted zaoly.app**) need a dedicated **platform admin** console to administer the full local user directory and instance mail status. This is the same codebase and same `users` table as self-host — not a second product or suite federation surface.

`/settings/users` is the legacy entry; platform admin **MUST** become the canonical surface at `/admin`.

## Model

| Concept | Notes |
|---------|--------|
| Instance | One deploy · one Postgres user directory |
| App role | `member` \| `admin` \| `platform_admin` |
| Staff | `admin` **or** `platform_admin` — may open `/admin` and phase-1/2a APIs |
| Elevated | `platform_admin` only — anonymize + impersonation |
| Ops console | Authenticated hub under `/admin/*` |
| Hosted modules | Managed SMTP, signup status; impersonation only when `ZAOLY_PLATFORM_ADMIN_IMPERSONATION=1` |

## Surfaces

| Surface | Who | Behavior |
|---------|-----|----------|
| `/admin` | `admin` | Overview console: directory metrics · module tiles (Users / Mail / Audit / Security) · instance health |
| `/admin/users` | `admin` | Canonical directory: search, pagination, invite, role, disable |
| `/admin/mail` | `admin` | SMTP status / test; Hosted managed = read-only config + test; Self-host = full Settings SMTP parity |
| `/admin/audit` | `admin` | Phase 2a mutation log |
| `/settings/users` | `admin` | **MUST** redirect to `/admin/users` (compat) |
| `/settings` | signed-in | Account / appearance only — no full directory |

Primary nav: when the actor is `admin`, shell **MUST** expose an Admin entry to `/admin` (or `/admin/users`). The former Users-only tab MAY be renamed/replaced by Admin.

## MUST

1. Platform admin UI and APIs MUST live in this repo (`apps/web`) — no separate admin service required for phase 1.
2. Access to `/admin` and phase-1/2a APIs MUST require Postgres user store + staff role (`admin` \| `platform_admin`) + not disabled. Elevated APIs MUST require `platform_admin`.
3. Canonical user-directory path MUST be `/admin/users` (`paths.adminUsers`).
4. `/settings/users` MUST redirect to `/admin/users`.
5. Directory MUST support list + invite + role change + disable/enable (reuse / extend `specs/api/zaoly-users.md` admin routes).
6. Self-host MUST remain able to run core admin without weddy-only secrets (`zaoly-standalone.md` MUST NOT #8).
7. Hosted managed SMTP rules MUST still apply inside `/admin/mail` (`zaoly-system-mail.md`).
8. Specs and `paths.ts` MUST be updated before shipping new admin routes or env keys.

## MAY

1. Phase 2a (shipped): force password-reset, audit log, last login + owned scene counts for staff.
2. Phase 2b (shipped): `platform_admin`, anonymize, impersonation behind env flag.
3. Seed/promote via `ZAOLY_PLATFORM_ADMIN_EMAILS` (comma-separated) and/or PATCH role.
4. Hosted modules gated by profile env (`ZAOLY_SMTP_MANAGED`, `ZAOLY_PLATFORM_ADMIN_IMPERSONATION`).

## MUST NOT

1. Split platform admin into a second product repository or fork.
2. Use suite / Plexon / federation as the admin identity SSOT.
3. Expose impersonation or cross-user session switch without an explicit phase-2 flag and audit trail.
4. Let `member` reach `/admin` or admin APIs.
5. Require Traefik / `/root/.zaoly-smtp` for self-host admin to function.
6. Put billing, Magcloud, or Collection sync into `/admin` as primary modules.

## EARS

1. WENN ein Staff-User die App-Shell öffnet, DANN MUSS ein Nav-Ziel zum Platform Admin (`/admin` oder `/admin/users`) sichtbar sein.
2. WENN `/settings/users` aufgerufen wird, DANN MUSS auf `/admin/users` umgeleitet werden.
3. WENN der Actor kein Staff ist oder disabled ist, DANN MUSS `/admin/*` und Admin-APIs mit 401/403 abgewiesen werden.
4. WENN Profile A und `ZAOLY_SMTP_MANAGED=1`, DANN MUSS `/admin/mail` Konfiguration nicht überschreibbar speichern (`PUT` → 403); Test-Send MAY bleiben.
5. WENN Profile B (managed unset), DANN MUSS SMTP unter `/admin/mail` wie bisher konfigurierbar sein.
6. WENN `ZAOLY_PLATFORM_ADMIN_IMPERSONATION` nicht freigeschaltet ist, DANN MUSS Impersonate mit 403 abgewiesen werden.
7. WENN Impersonation aktiv ist, DANN MUSS die effektive Session-Actor-Id die Target-Id sein; Admin-Gates MUST den realen `platform_admin` prüfen.
8. WENN anonymize auf den letzten enabled Staff trifft, DANN MUSS die API mit `last_admin` ablehnen.
9. WENN Impersonation aktiv ist, DANN MUST elevated Admin-Mutationen (invite, patch, force-reset, anonymize, SMTP write, start impersonate) mit `403` `impersonating` abgewiesen werden — Stop bleibt erlaubt.
10. WENN Impersonate gestartet wird, DANN MUST ein Reason (≥ `paths.impersonationReasonMinLength`) mitgegeben werden; Target MUST NOT staff sein; TTL MUST `paths.impersonationTtlSeconds` sein.
11. WENN `/admin` oder `/admin/*` ohne Staff-Actor aufgerufen wird, DANN MUST serverseitig nach Login bzw. Home umgeleitet werden (nicht nur Nav-Hide).
12. WENN öffentliche Auth-Mutationen (login credentials, register, forgot-password, invite) die Rate-Limits überschreiten, DANN MUST `429` mit `Retry-After` folgen.
13. WENN ein User disabled (oder gelöscht) ist, DANN MUST ein bestehendes JWT bei der nächsten Session-Auswertung invalidiert werden (kein Produktzugriff mehr).
14. WENN Impersonation aktiv ist und der reale Actor disabled/nicht-Staff ist ODER das Target disabled ist, DANN MUST das JWT ebenfalls invalidiert werden.
15. WENN ein authentifizierter Non-Staff oder ein Impersonation-Lock eine Admin-Gate mit `403` trifft, DANN MUST ein Audit-Event `auth.denied` geschrieben werden (kein Audit für blank `401`).
16. WENN `user.patch` audited wird, DANN MUST `meta` vorher/nachher (`before` / `after` für `role` + `disabled`) enthalten.
17. WENN Impersonation aktiv ist, DANN MUST jede mutierende `/api/*`-Anfrage außer `POST` Impersonate-Stop mit `403` `impersonating` abgewiesen werden (read-only view-as).
18. WENN Hosted Bootstrap `paths.hostedBootstrapAdminEmail` genutzt wird, DANN SHOULD Operators persönliche `platform_admin`-Accounts nutzen; Bootstrap ist Break-glass.

## Acceptance (phase 1)

- [x] Specs + knowledge inventoried
- [x] `paths.admin` / `paths.adminUsers` / `paths.adminMail` in `paths.ts` + `paths.md`
- [x] `/admin/users` UI with search + existing mutate actions
- [x] `/settings/users` → `/admin/users`
- [x] Admin nav entry (`nav.admin` → `/admin`)
- [x] SMTP band under `/admin/mail` respects managed lock
- [x] Tests: overview API, redirect, nav, inventory

## Acceptance (phase 2a)

- [x] Directory shows `lastLoginAt` + `ownedSceneCount`
- [x] Force password-reset action + API
- [x] Audit log table + `GET /api/admin/audit` + `/admin/audit`
- [x] Invite / patch / force-reset write audit events

## Acceptance (phase 2b)

- [x] Role `platform_admin` in store + staff gates
- [x] Anonymize API + UI (platform_admin)
- [x] Impersonate start/stop behind `ZAOLY_PLATFORM_ADMIN_IMPERSONATION`
- [x] Audit events `user.anonymize`, `user.impersonate_start`, `user.impersonate_stop`
- [x] Shell banner while impersonating

## Acceptance (P1 hardening)

- [x] JWT invalidate when effective user or impersonation actor is disabled / missing
- [x] Live role refresh on JWT when not impersonating (demotion without re-login)
- [x] Audit `auth.denied` for authenticated 403 admin gates + impersonation mutation lock
- [x] `user.patch` audit meta includes `before` / `after`

## Acceptance (P2 hardening)

- [x] Read-only impersonation: proxy blocks mutating `/api/*` except stop
- [x] Banner indicates read-only view-as
- [x] Break-glass bootstrap policy documented for operators (no overview UI banner — hosted ops already use that account)
