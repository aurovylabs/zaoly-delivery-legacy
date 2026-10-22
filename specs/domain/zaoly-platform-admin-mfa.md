# Platform admin MFA (TOTP)

**Status:** Active · **Date:** 2026-10-09  
**Product:** Zaoly standalone · **Related:** `zaoly-platform-admin.md` · `zaoly-admin-hardening.md`

## Intent

Protect `platform_admin` credentials with TOTP (RFC 6238) + single-use recovery codes. Hosted operators SHOULD enroll; when `ZAOLY_PLATFORM_ADMIN_MFA_REQUIRED` is on, enrollment is mandatory before other `/admin` modules.

## Scope

| In | Out |
|----|-----|
| Credentials login MFA for users with MFA enabled | WebAuthn / passkeys (later) |
| Self-serve enroll / disable under `/admin/security` | Forcing MFA on `admin` / `member` |
| Encrypted TOTP secret at rest (AUTH_SECRET-derived) | SMS OTP |
| Recovery codes (hashed) | Google OAuth MFA challenge (credentials path first) |

## EARS

1. WENN `platform_admin` MFA enabled ist und Credentials-Login ohne gültigen TOTP/Recovery erfolgt, DANN MUST Authorize fehlschlagen (`mfa_required` / invalid).
2. WENN Enroll gestartet wird, DANN MUST ein Pending-Secret gespeichert werden; aktiv wird es erst nach erfolgreicher Confirm-Code-Prüfung.
3. WENN Confirm gelingt, DANN MUST Recovery-Codes einmalig im Klartext zurückgegeben und nur gehasht persistiert werden.
4. WENN `ZAOLY_PLATFORM_ADMIN_MFA_REQUIRED` aktiv ist und der Actor `platform_admin` ohne MFA ist, DANN MUST `/admin/*` außer `/admin/security` auf Security umleiten.
5. WENN TOTP-Secrets persistiert werden, DANN MUST sie mit einem aus `AUTH_SECRET` abgeleiteten Schlüssel verschlüsselt sein.

## Acceptance

- [x] Specs + knowledge + paths
- [x] `user_mfa` store + encrypt helpers
- [x] Setup / confirm / disable / status APIs
- [x] Login prepare + credentials `totp` field
- [x] `/admin/security` UI + login MFA step
- [x] Tests
