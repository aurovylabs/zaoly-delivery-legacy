# Platform admin WebAuthn / Passkeys

**Status:** Active · **Date:** 2026-10-09  
**Product:** Zaoly standalone · **Related:** `zaoly-platform-admin-mfa.md` · `zaoly-admin-hardening.md`

## Intent

Let `platform_admin` register discoverable/platform authenticators (passkeys) and sign in without password when a credential exists. Complements TOTP MFA — does not replace it.

## Scope

| In | Out |
|----|-----|
| Register / list / delete passkeys under `/admin/security` | Auth.js experimental Passkey provider + Prisma adapter |
| Passwordless login via WebAuthn assertion → short-lived ticket → credentials session | Attestation trust stores / enterprise MDM |
| RP ID / origin from `zaolyPublicUrl()` | Conditional UI mediation only |

## EARS

1. WENN ein `platform_admin` (nicht impersonating) Register startet, DANN MUST die API Registration Options mit Challenge liefern und die Challenge serverseitig speichern (TTL).
2. WENN Verify Registration gelingt, DANN MUST credentialId + publicKey + counter persistiert und Audit `user.webauthn_register` geschrieben werden.
3. WENN Login Options für eine E-Mail mit ≥1 Credential angefragt wird, DANN MUST Authentication Options zurückgegeben werden; unbekannte E-Mails MUST opaque scheitern.
4. WENN Verify Authentication gelingt, DANN MUST ein einmaliges `webauthnTicket` ausgegeben werden; Credentials-Authorize MUSS das Ticket konsumieren und eine Session für den User erzeugen.
5. WENN Counter-Regression erkannt wird, DANN MUST Verify fehlschlagen.

## Acceptance

- [x] Specs + knowledge + paths
- [x] `user_webauthn_credentials` store
- [x] Register / login / list / delete APIs
- [x] Security UI + login passkey button
- [x] Tests
