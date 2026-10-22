# Zaoly system mail (SMTP)

**Status:** Accepted — 2026-10-11 (dedicated hosted MTA)  
**Product:** Zaoly standalone  
**API:** `specs/api/zaoly-system-mail.md`  
**Related:** `zaoly-user-management.md` · `client-page-share.md` · `zaoly-scene-share.md` · `knowledge/zaoly-system-mail.md` · `knowledge/zaoly-mail-identity.md` · `knowledge/deploy-weddy-server.md`

## Intent

Optional **transactional SMTP** for all Zaoly system mail. Hosted `zaoly.app` ships **managed** SMTP via env (`ZAOLY_SMTP_*` + `ZAOLY_SMTP_MANAGED=1`) against the **dedicated** Zaoly MTA (`paths.hostedSmtpHost` = `mail.zaoly.app`) — not the weddy mailserver. Settings MUST NOT override it. Self-hosted / local installs leave managed unset and MAY configure SMTP in Settings (or via env). When SMTP is unset, product flows that mint URLs MUST still succeed (copy-URL / silent skip) — no hard dependency.

Every system mail MUST be a **multipart** message: branded **HTML** (Zaoly Corporate Design) plus a plain-text alternative. Default locale is **English**; German (`de`) MUST ship alongside.

## Config sources (precedence)

1. WENN `ZAOLY_SMTP_MANAGED` truthy (`1`/`true`/`yes`/`on`) — **hosted**: use **env** `ZAOLY_SMTP_*` only; ignore DB override; `PUT /api/admin/smtp` MUST return `403 smtp_managed_by_host`.
2. Else (self-host): **Admin DB settings** (`zaoly_system_settings` key `smtp`) when `enabled` and host/from are set.
3. Else **env** `ZAOLY_SMTP_*` when host + from are set.
4. Else **disabled** — no outbound mail.

Password in DB MUST be encrypted at rest (AES-GCM keyed from `AUTH_SECRET`). API responses MUST never return the plaintext password (only `passwordSet: boolean`).

## Env keys (canonical via `paths.ts`)

| Key | Purpose |
|-----|---------|
| `ZAOLY_SMTP_HOST` | SMTP hostname (hosted: `mail.zaoly.app`) |
| `ZAOLY_SMTP_PORT` | Default `587` |
| `ZAOLY_SMTP_USER` | Auth user |
| `ZAOLY_SMTP_PASS` | Auth password |
| `ZAOLY_SMTP_FROM` | From address (`noreply@zaoly.app`) |
| `ZAOLY_SMTP_FROM_NAME` | Optional display name (default `Zaoly`) |
| `ZAOLY_SMTP_TLS` | `starttls` (default) \| `tls` \| `none` |
| `ZAOLY_SMTP_MANAGED` | Hosted lock — env is SSOT; Settings edit disabled |

## Catalog (mail kinds)

| Kind | Trigger | Recipient | CTA |
|------|---------|-----------|-----|
| `invite` | Admin invites user | Invitee | Accept invite URL |
| `welcome` | Public register **or** invite accept | New user | Open editor |
| `smtp_test` | Admin SMTP test | Session / `to` | — |
| `scene_shared` | Owner adds scene member | Member | Open composition |
| `comment_new` | Guest posts client-share comment | Scene owner | Open editor / share |
| `comment_reply` | Designer reply mirrored to guest comment | Guest (`authorEmail` if set) | Open share |
| `account_disabled` | Admin disables user | That user | — |
| `account_enabled` | Admin re-enables user | That user | Sign in |
| `role_changed` | Admin changes app role | That user | — |
| `password_reset` | Forgot-password request | Account email | Reset URL (single-use, TTL) |
| `password_changed` | Password reset / Settings password set completed | Account email | Sign in |
| `email_verify` | Password register (or Settings resend) | Account email | Verify URL (single-use, TTL 48h) |

Locale: `en` (default) \| `de`. Resolve from explicit `locale` arg, else default `en`.

## HTML brand (MUST)

1. Single-column table layout (~600px), inline CSS, `role="presentation"`, radius **0**.
2. Colors from CD / `paths`: paper `#F3EEE4`, light `#FBF6EC`, ink `#1E1B17`, line `#C9BCA1`, cobalt `#1F44FF`, acid `#C6F24A`, warm charcoal `#2E2A24`.
3. Header: warm charcoal bar with seal mark **造** on cobalt + wordmark **Zaoly**.
4. Primary CTA: cobalt fill, white label, square corners (no pills).
5. Plain-text alternative MUST include the same URLs as HTML.
6. MUST NOT depend on external CSS, web fonts, JS, or background images for meaning.

## Surfaces

| Surface | Who | Behavior |
|---------|-----|----------|
| `/settings/users` SMTP band | `admin` | Managed host: status + test only. Self-host: edit DB SMTP + test |
| `POST /api/admin/users/invite` | `admin` | Send `invite`; always return `inviteUrl`; `emailSent` |
| `POST /api/register` · invite accept | public | Best-effort `welcome`; register also best-effort `email_verify` |
| `POST /api/auth/verify-email/resend` | session | Best-effort `email_verify` when still unverified |
| `POST /api/scenes/:id/members` | owner | Best-effort `scene_shared` |
| Guest comment POST | public | Best-effort `comment_new` to owner |
| Designer reply mirror | editor | Best-effort `comment_reply` when guest email present |
| `PATCH /api/admin/users/:id` | `admin` | Best-effort account status / role mails |
| `POST /api/auth/forgot-password` | public | Always opaque success; send `password_reset` when user exists + SMTP |
| `POST /api/auth/reset-password` | public | Consume token; send `password_changed` |
| `/login` · `/reset-password` | public | Forgot / reset UI |

## EARS

1. WENN SMTP nicht konfiguriert ist, DANN MUSS Invite weiterhin `inviteUrl` zurückgeben und MUST NOT failen wegen Mail.
2. WENN SMTP konfiguriert ist UND Invite gelingt, DANN MUST die App die Invite-Mail senden und `emailSent: true` setzen.
3. WENN SMTP konfiguriert ist UND Versand fehlschlägt, DANN MUST Invite trotzdem persistieren und `emailSent: false` + `emailError` zurückgeben (HTTP 200 — URL bleibt nutzbar).
4. WENN `ZAOLY_SMTP_MANAGED` gesetzt ist, DANN MUST NOT Admin-SMTP die Env-Config überschreiben (PUT 403). WENN unmanaged UND ein Admin SMTP speichert, DANN MUST die Config in Postgres landen und Env-Defaults für diese Instanz überschreiben.
5. WENN Admin **Test senden** auslöst, DANN MUST eine Testmail an die Session-Email (oder angegebenes `to`) gehen.
6. WENN `password` im PUT leer/`null` ist und bereits ein Passwort gesetzt war, DANN MUST das bestehende Passwort erhalten bleiben.
7. WENN eine System-Mail gesendet wird, DANN MUST sie HTML + Text im CD-Layout und lokalisiert (`en`/`de`) sein.
8. WENN SMTP fehlt, DANN MUST Register / member-add / comments / account-patch weiterhin gelingen (Mail best-effort).
9. WENN `forgot-password` für eine unbekannte Email kommt, DANN MUST die API denselben Erfolgscode wie bei bekannter Email liefern (kein Email-Enumeration).
10. WENN ein Reset-Token abläuft oder verbraucht ist, DANN MUST Reset fehlschlagen und MUST NOT das Passwort ändern.
11. WENN hosted managed SMTP gesetzt ist, DANN MUST `ZAOLY_SMTP_HOST` der dedizierte Zaoly-MTA sein (`mail.zaoly.app`), nicht `mail.weddy.page`.

## Non-goals

- Inbound IMAP / webmail product UI
- Signup email verification / magic-link login
- Marketing / newsletter campaigns / MJML build pipeline
- Moving `zaoly.app` MX off IONOS (human inboxes) in the same change as outbound MTA
- Third-party transactional APIs (Resend / Postmark / SES)
- Per-user notification preference center (later)
