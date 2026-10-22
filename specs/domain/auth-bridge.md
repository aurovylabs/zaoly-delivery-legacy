# Auth bridge — CREATION v3 ↔ Zaoly Host

## Status
Accepted (Wave 4 MVP) — 2026-08-12

## Goal
Hand Plexon identity from the CREATION AppShell to the Zaoly editor/Host **without** a second user store and **without** making Plexon an OIDC issuer.

Identity chain:

```
Plexon user → creation-v3 NextAuth session → opaque launchCode → (later) Zaoly Host session
```

## Contract

| Item | Value |
|------|--------|
| Mint | `POST /api/editor/launch-code` (session required when Plexon auth configured; open when auth bypass) |
| Redeem | `POST /api/editor/launch-code/redeem` — Host/machine; service secret + contract headers |
| Query on editor URL | `launchCode` (`paths.editorLaunchCodeQueryParam`) |
| Collection context | existing `platformProjectId` (Wave 3) |
| TTL | `paths.editorLaunchCodeTtlSeconds` (default 120) |
| Use | Single-use; second redeem fails |
| Signing | HMAC with `AUTH_SECRET` (or `ZAOLY_LAUNCH_TOKEN_SECRET` when set) |
| Store (W2) | Redis key `paths.launchCodeRedisKeyPrefix:{jti}` when `ZAOLY_REDIS_URL` set (`GETDEL` consume); else in-process Map · `specs/domain/auth-hardening-w2.md` |

## Mint body (optional)
```ts
{ platformProjectId?: string }
```

## Mint response
```ts
{ launchCode: string; expiresAt: string }
```

## Redeem body
```ts
{ launchCode: string }
```

## Redeem response
```ts
{ userId: string; email: string; name: string | null; platformProjectId: string | null }
```

## EARS
- WENN der Nutzer den Editor öffnet und eine Session (oder Auth-Bypass) vorliegt, DANN MUSS die Shell einen Launch-Code minten und an `buildEditorLaunchUrl` übergeben dürfen.
- WENN Plexon-Auth konfiguriert ist und keine Session vorliegt, DANN MUSS Mint mit 401 antworten.
- WENN ein Launch-Code abgelaufen oder bereits eingelöst ist, DANN MUSS Redeem fehlschlagen (nicht raten).
- WENN `ZAOLY_REDIS_URL` gesetzt ist, DANN MUSS der Launch-Code-Store Redis nutzen (mint `SET`+TTL, redeem `GETDEL`); WENN Redis unerreichbar ist, DANN DARF nicht still auf Prozess-Memory zurückgefallen werden.
- WENN `NODE_ENV=production`, DANN MUSS `ZAOLY_AUTH_BYPASS` wirkungslos bleiben (`specs/domain/auth-hardening-w2.md`).
- Host-Redeem MUSS denselben Federation-Contract + Service-Secret wie Provisioning nutzen.

## Non-goals
- Plexon as OIDC Discovery issuer for Zaoly
- Cookie SSO across Vite/Next origins
- Auto-membership / role mapping into Host projects (Host invite-first remains)
- Host rewrite inside Zaoly this wave (redeem endpoint is ready; Host consumer later)

## Settings
Settings federation band shows auth-bridge status: session → launch code; Host redeem deferred until editor Host is wired.
