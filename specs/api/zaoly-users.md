# Zaoly users API

**Status:** Accepted — 2026-10-11 (set-password + soft email verify)  
**Domain:** `specs/domain/zaoly-user-management.md`  
**Anchors:** `apps/web/lib/users/*` · `apps/web/app/api/me` · `apps/web/app/api/admin/users` · `apps/web/app/api/invites` · `apps/web/app/api/register` · `apps/web/app/api/auth/verify-email` · `apps/web/auth.ts`

## Auth

| Caller | Gate |
|--------|------|
| Session | NextAuth JWT (`requireApiSession` / `auth()`) |
| Admin routes | Session + `role === 'admin'` + not disabled |
| Invite accept | Public (token proves invite) |
| Register | Public when `ZAOLY_PUBLIC_SIGNUP` is not off |
| Login | NextAuth `POST /api/auth/callback/credentials` and `/api/auth/callback/google` |

WENN Postgres fehlt, DANN User-APIs `503 { "error": "auth_not_configured" }`.

## `GET /api/me`

Session required.

```ts
{
  id: string
  email: string
  name: string | null
  role: 'admin' | 'member' | 'platform_admin'
  hasPassword: boolean
  emailVerified: boolean
}
```

## `PATCH /api/me`

Session required. Body: `{ name?: string }` (trim, 1–80 chars).

## `PATCH /api/me/password`

Session required. Not allowed while impersonating.

```ts
// set (Google-only / no password yet)
{ password: string }
// change
{ currentPassword: string; password: string }
// response
{ ok: true; hasPassword: true } | { error: string }
```

Errors: `password_too_short`, `invalid_current_password`, `impersonating`, `unauthorized`.

## Soft email verification

### `POST /api/auth/verify-email`

Public. Body: `{ token: string }` → `{ ok: true }` or `invalid_token` / `token_expired`.

### `POST /api/auth/verify-email/resend`

Session required. `{ ok: true; emailSent: boolean }` — no-op success when already verified (`already_verified`).

## `POST /api/register`

Public when signup is enabled. Body: `{ email: string; password: string; name?: string }`.

```ts
{ id: string; email: string; name: string | null; role: 'member' }
```

- Email lowercased; password min 10 chars.
- Existing enabled user → `409 { "error": "already_exists" }`.
- Signup disabled → `403 { "error": "signup_disabled" }`.
- After success, client signs in via NextAuth credentials and SHOULD land on `/editor`.
- Best-effort `welcome` + `email_verify` when SMTP configured (never fail signup).

## `GET /api/admin/users`

Admin only.

```ts
{ users: Array<{
  id: string
  email: string
  name: string | null
  role: 'admin' | 'member'
  disabled: boolean
  createdAt: string
  lastLoginAt: string | null
}> }
```

## `POST /api/admin/users/invite`

Admin only. Body: `{ email: string; role?: 'admin' | 'member' }` (default `member`).

```ts
{ inviteId: string; email: string; role: string; expiresAt: string; inviteUrl: string; emailSent: boolean; emailError?: string }
```

- Email lowercased; duplicate pending invite for same email MAY replace token.
- Existing enabled user with same email → `409 { "error": "already_exists" }`.
- When SMTP is configured (`zaoly-system-mail.md`), MUST attempt invite delivery; failure MUST NOT roll back the invite (`emailSent: false`).

## `POST /api/invites/accept`

Public. Body: `{ token: string; password: string; name?: string }`.

```ts
{ id: string; email: string; name: string | null; role: 'admin' | 'member' }
```

- Invalid/expired/used token → `400` / `410`.
- Password min 10 chars.
- After accept, client signs in via NextAuth credentials.

## `PATCH /api/admin/users/:id`

Admin only. Body: `{ disabled?: boolean; role?: 'admin' | 'member' }`.

- MUST NOT disable or demote the last enabled admin.
- Self-disable MAY be rejected (`400`).

## Google OAuth (NextAuth)

- Env: `AUTH_GOOGLE_ID` · `AUTH_GOOGLE_SECRET` (optional). When both set, Google provider is enabled.
- Callback path: `/api/auth/callback/google` (Auth.js default).
- First sign-in: upsert local `member` by `google_sub` or email; set `last_login_at`.

## Errors

| Status | error |
|--------|-------|
| 401 | `unauthorized` |
| 403 | `forbidden` / `signup_disabled` |
| 404 | `not-found` |
| 409 | `already_exists` |
| 410 | `invite_expired` / `invite_used` |
| 503 | `auth_not_configured` |
