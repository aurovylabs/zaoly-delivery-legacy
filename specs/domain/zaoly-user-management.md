# Zaoly user management

**Status:** Accepted — 2026-10-11 (set-password + soft email verify)  
**Product:** Zaoly standalone  
**API:** `specs/api/zaoly-users.md`  
**Related:** `zaoly-standalone.md` · `zaoly-platform-admin.md` · `zaoly-landingpage-concept.md` · `zaoly-scene-share.md` · `zaoly-system-mail.md` · `settings.md` · `knowledge/zaoly-postgres.md` · `knowledge/deploy-weddy-server.md`

## Intent

Zaoly owns a **local** user store in Postgres. Identity, login, signup, admin invite/disable, and session actor ids are Zaoly-SSOT. **Plexon is not** the auth or membership source for Zaoly.

The public landing page (`/`) and the application share one account surface: visitors can create a `member` account and continue into `/editor`.

## Model

| Concept | Values / notes |
|---------|----------------|
| User | `id` (uuid), `email` (unique, lowercased), `name`, `password_hash` (nullable for Google-only), `google_sub` (nullable unique), `email_verified_at` (nullable timestamptz), `role`, `disabled`, timestamps |
| App role | `admin` \| `member` |
| Invite | email + role + single-use token (hash stored), TTL 7 days — still available for admins |
| Onboarding | **Public self-registration** (email + password) and optional **Google OAuth**, plus admin invite |
| Bootstrap | When `users` is empty and `ZAOLY_BOOTSTRAP_ADMIN_EMAIL` + `ZAOLY_BOOTSTRAP_ADMIN_PASSWORD` are set → create first `admin` |
| Starter scene | Every **new** account gets a **personal** copy of the Zaoly default landing (`createZaolyDefaultLandingScene`) with `ownerUserId = user.id` — not a shared global `scene-demo` |

## Auth

- NextAuth **Credentials** + JWT validates against the local `users` table.
- NextAuth **Google** when `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` are set. First Google sign-in creates a `member` (or links `google_sub` to an existing email).
- Disabled users MUST NOT authenticate.
- Password: Node `scrypt` (salt + key, encoded in `password_hash`); minimum length **10**. Google-only users MAY have `password_hash = NULL` and MUST NOT pass Credentials login until they set a password via Settings (`PATCH /api/me/password`) or forgot-password.
- Session actor `user.id` is the uuid stamped as `ownerUserId` on create and used for ACL.
- User management **requires** `ZAOLY_DATABASE_URL`. JSON scene fallback MUST NOT host multi-user accounts.

## Public signup

- Default **on** when the user store is available.
- Operator kill-switch: `ZAOLY_PUBLIC_SIGNUP=0` / `false` / `off` disables `POST /api/register` and hides `/register` CTAs (login + invite remain).
- Self-registered users ALWAYS receive role `member`.
- Account is usable immediately after register or Google callback (**soft** email verification — never blocks editor access in this phase).
- Password register: `email_verified_at` starts `NULL`; when SMTP is configured, Zaoly sends `email_verify` (best-effort) with a single-use link (`/verify-email?token=`).
- Google first create / link: set `email_verified_at = NOW()` (provider already verified the address).
- Invite accept: set `email_verified_at = NOW()` (invite token proves mailbox control).
- System mail catalog: `zaoly-system-mail.md`.
- Landing primary CTA (“Loslegen” / “Get started”) MUST deep-link to `/register` (or `/login` when signup is disabled). “Anmelden” / “Sign in” stays on `/login`.

## Bypass

- `ZAOLY_AUTH_BYPASS=1` is allowed **only** when `NODE_ENV !== 'production'`.
- Default with Postgres user-store: bypass **off**.
- When bypass is on, viewer id remains `dev-local` for local DX only.

## Surfaces

| Surface | Who | Behavior |
|---------|-----|----------|
| `/` landing | anyone | CTAs into `/register` and `/login` |
| `/register` | anyone (when signup on) | Email/password create `member` → Credentials sign-in → `/editor` |
| `/login` | anyone | Email/password and optional Google → session. Viewport-wide split layout: compact CD Bildmarke and Lime Zaoly wordmark centered in the left half, form centered in the right half. Link to forgot-password. A decorative, animated low-poly SVG landscape spans both halves and respects reduced-motion preference. |
| `/forgot-password` | anyone | Request reset mail (`POST /api/auth/forgot-password`) |
| `/reset-password` | anyone | Consume token + set password (`POST /api/auth/reset-password`) |
| `/invite/[token]` | invitee | Set name + password → create user + accept invite |
| `/settings` Account | signed-in | Name, sign-out, set/change password, soft email-verify status + resend |
| `/verify-email` | anyone (token) | Consume verification token; show success / error |
| `/admin/users` | `admin` | Canonical directory (invite / role / disable) · `zaoly-platform-admin.md` · `paths.adminUsers` |
| `/settings/users` | `admin` | Compat redirect → `/admin/users` (legacy hub tab). |

## EARS

### Login landscape

- The login **and register** pages MUST show a locally rendered, vector-based East Asian landscape behind the existing auth form without changing auth behavior or routes. Forgot-password, reset-password, and invite-accept keep the centered stack. A static raster image MUST NOT be used as the animated scene.
- At desktop widths the login/register composition MUST fill the viewport and use two equal columns, with the brand centered in the left column and the auth form centered in the right column. At narrow widths the two blocks MUST stack without horizontal overflow. Other auth screens retain their centered single-column layout.
- The split-login seal MUST be smaller than its initial 160 px size. The Zaoly wordmark MUST use CD cobalt (`--editor-accent` / `#1f44ff`) over the landscape **without** a charcoal pill backing (no background fill). Auth form `SectionChrome` titles MUST be larger than default chrome; MUST NOT show a redundant brand meta label (`Zaoly`) beside the title on `/login` and `/register`.
- The composition MUST preserve legible form controls and keyboard focus in both theme settings and at narrow viewport widths.
- Mountain layers, mist, daylight and water facets MUST have independently timed, calm motion so the entire scene feels alive without distracting from sign-in. With `prefers-reduced-motion: reduce`, all decorative motion MUST stop. The SVG is decorative and MUST not enter the accessibility tree.
- Small birds MAY cross the sky in a slow loop, and a fish MAY occasionally jump above the lake with brief splash marks. These details MUST remain secondary to the form, avoid continuous attention-grabbing movement, and become static or hidden under reduced motion. On narrow screens the fish MAY be hidden when the form obscures the lake.

### Auth field chrome

- On `.creation-login` surfaces (`/login`, `/register`, `/forgot-password`, invite accept when using `AuthScreenLayout`), text inputs MUST read as **underline-only**: no visible top/side borders, transparent fill, firm bottom rule only.
- Focus MUST strengthen the bottom rule with cobalt (`--editor-accent` / `--accent`); invalid state MUST use danger on the bottom rule only (no box frame).

1. WENN `users` leer ist UND Bootstrap-Env gesetzt ist, DANN MUSS der erste Admin beim App-Boot / erstem Auth-Touch erzeugt werden.
2. WENN ein Admin invited, DANN MUSS die API eine Invite-URL zurückgeben. WENN SMTP konfiguriert ist (`zaoly-system-mail.md`), DANN MUST zusätzlich eine Invite-Mail versucht werden (`emailSent` in der Response).
3. WENN ein Invite akzeptiert wird, DANN MUSS genau ein enabled User entstehen und der Token single-use verbraucht werden.
4. WENN `disabled=true`, DANN MUSS Login fehlschlagen und bestehende Sessions bei API-Gates abgewiesen werden dürfen.
5. WENN kein Postgres, DANN MUSS User-Management mit klarer 503/`auth_not_configured` antworten (kein stiller JSON-User-Store).
6. WENN der authentifizierte App-Shell gerendert wird und der Actor `admin` ist, DANN MUSS Platform Admin als Primary-Nav-Ziel (`/admin` oder `/admin/users`) erscheinen — nicht nur als Settings-Unterseite (`zaoly-platform-admin.md`).
7. WENN Public Signup aktiv ist, DANN MUSS `POST /api/register` einen enabled `member` anlegen und die Landing-/Login-UI einen Weg dorthin zeigen.
8. WENN Google OAuth konfiguriert ist, DANN MUSS Login (und Register) einen Google-Button anbieten; erster erfolgreicher Callback legt oder verknüpft den lokalen User.
9. WENN ein neuer User entsteht (Register, Invite-Accept, Google first create, Bootstrap-Admin), DANN MUSS `ensureStarterLandingForUser` eine unbound Landing-Scene mit `ownerUserId = user.id` anlegen (idempotent: wenn der User schon owned Scenes hat, keine zweite). `/editor` ohne `sceneId` MUSS für eingeloggte Viewer die neueste owned Scene laden bzw. bei leerem Besitz die Starter-Landing sichern — nicht die globale `scene-demo` eines anderen Owners.

## Password reset + set password

- Token table `password_reset_tokens` (hash only), TTL `paths.passwordResetTtlSeconds` (1h).
- Opaque forgot response (no email enumeration). Google-only users MAY use forgot-password to mint a first local password.
- On success: update `password_hash`, invalidate token, send `password_changed` mail when SMTP configured.
- Signed-in `PATCH /api/me/password`: set password when `password_hash` is null (no current password); change password when set (requires `currentPassword`).
- Spec detail: `zaoly-system-mail.md`.

## Soft email verification

- Token table `email_verification_tokens` (hash only), TTL `paths.emailVerifyTtlSeconds` (48h).
- `POST /api/auth/verify-email` consumes token; `POST /api/auth/verify-email/resend` (session) re-mints when still unverified.
- MUST NOT gate `/editor` or API access on `email_verified_at` in this phase.
- Hard / required verification is a later phase (`ZAOLY_REQUIRE_EMAIL_VERIFICATION` reserved, not wired).

## Non-goals (this phase)

- Hard email verification gate / magic-link login
- Apple / Microsoft / other SSO
- Companies / orgs / Collection membership
- Personal API tokens
