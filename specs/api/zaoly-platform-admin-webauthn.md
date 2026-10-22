# Platform admin WebAuthn API

**Status:** Active · **Date:** 2026-10-09  
**Routes:** `paths.routes.*` · Domain `zaoly-platform-admin-webauthn.md`

## Register (platform_admin, not impersonating)

| Method | Path | Result |
|--------|------|--------|
| POST | `apiAdminWebAuthnRegisterOptions` | PublicKeyCredentialCreationOptionsJSON |
| POST | `apiAdminWebAuthnRegisterVerify` | `{ ok: true; credentialId: string }` body: browser attestation response |
| GET | `apiAdminWebAuthnCredentials` | `{ items: Array<{ id; credentialId; deviceType?; backedUp?; createdAt }> }` |
| DELETE | `apiAdminWebAuthnCredential(id)` | `{ ok: true }` |

## Login (public)

| Method | Path | Body / result |
|--------|------|----------------|
| POST | `apiAuthWebAuthnLoginOptions` | `{ email }` → options JSON or `{ ok: false }` |
| POST | `apiAuthWebAuthnLoginVerify` | `{ email, response }` → `{ ok: true; webauthnTicket }` |

Credentials provider accepts `webauthnTicket` (instead of password) and mints the session.

## Errors

| Status | When |
|--------|------|
| 400 | Invalid assertion / missing challenge / counter rollback |
| 403 | Not platform_admin / impersonating |
| 429 | Rate limited (login options/verify share login bucket) |
