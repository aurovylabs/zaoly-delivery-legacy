# Platform admin MFA API

**Status:** Active · **Date:** 2026-10-09  
**Routes:** via `paths.routes.*` · Spec domain `zaoly-platform-admin-mfa.md`

## Auth prepare

### `POST /api/auth/mfa/prepare` → `paths.apiAuthMfaPrepare`

Body: `{ email: string; password: string }`

```ts
{ ok: true; mfaRequired: boolean } | { ok: false }
```

- MUST rate-limit like login.
- MUST NOT reveal whether the email exists beyond `ok: false` for bad credentials.
- `mfaRequired: true` only when password valid and MFA enabled for that user.

## Credentials provider

`authorize` accepts optional `totp` (6-digit or recovery code). When MFA enabled and `totp` missing/invalid → fail (`CredentialsSignin` code `mfa_required` when missing).

## Self MFA (platform_admin)

Gate: session `platform_admin` + not impersonating.

| Method | Path | Body / result |
|--------|------|----------------|
| GET | `apiAdminMfa` | `{ enabled: boolean; required: boolean }` |
| POST | `apiAdminMfaSetup` | → `{ secret: string; otpauthUrl: string }` (pending) |
| POST | `apiAdminMfaConfirm` | `{ code: string }` → `{ ok: true; recoveryCodes: string[] }` |
| POST | `apiAdminMfaDisable` | `{ code: string }` → `{ ok: true }` |

Confirm MUST audit `user.mfa_enable`. Disable MUST audit `user.mfa_disable`.

## Errors

| Status | When |
|--------|------|
| 400 | Invalid code / already enabled / no pending |
| 403 | Not platform_admin / impersonating / MFA required env blocked path |
| 429 | Rate limited |
