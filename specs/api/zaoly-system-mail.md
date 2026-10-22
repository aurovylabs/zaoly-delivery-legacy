# Zaoly system mail API

**Status:** Accepted — 2026-10-11  
**Domain:** `specs/domain/zaoly-system-mail.md`  
**Anchors:** `apps/web/lib/mail/*` · `apps/web/app/api/admin/smtp` · `apps/web/app/api/auth/forgot-password` · `apps/web/app/api/auth/reset-password` · invite / register / members / comments routes

## Auth

Admin session only for SMTP admin routes (`role === 'admin'`, not disabled). Postgres user-store required (`503 auth_not_configured` otherwise). Forgot/reset are public.

## `GET /api/admin/smtp`

```ts
{
  configured: boolean
  source: 'db' | 'env' | 'none'
  managed: boolean
  host: string | null
  port: number
  user: string | null
  from: string | null
  fromName: string | null
  tls: 'starttls' | 'tls' | 'none'
  passwordSet: boolean
  dbEnabled: boolean
}
```

Never returns `pass` / ciphertext. `managed: true` when `ZAOLY_SMTP_MANAGED` is set (hosted).

## `PUT /api/admin/smtp`

`403 { error: 'smtp_managed_by_host' }` when managed.

Body:

```ts
{
  enabled: boolean
  host?: string
  port?: number
  user?: string
  pass?: string | null
  from?: string
  fromName?: string
  tls?: 'starttls' | 'tls' | 'none'
}
```

- `enabled: false` → disable DB override (env may still configure mail).
- Validation: when `enabled: true`, `host` and `from` required (valid email for from).

## `POST /api/admin/smtp/test`

Body optional: `{ to?: string; locale?: 'en' | 'de' }` — default session user email; locale default `en`.

```ts
{ ok: true } | { ok: false; error: string }
```

## Invite response extension

`POST /api/admin/users/invite` additionally:

```ts
{ …; emailSent: boolean; emailError?: string }
```

## Password reset

### `POST /api/auth/forgot-password`

```ts
// request
{ email: string; locale?: 'en' | 'de' }
// response (always when store available — no enumeration)
{ ok: true }
```

Creates a single-use token (TTL via `paths.passwordResetTtlSeconds`, default 1h), stores hash, sends `password_reset` when the user exists and SMTP is configured. Google-only users without password MAY still receive a reset so they can set a local password.

### `POST /api/auth/reset-password`

```ts
// request
{ token: string; password: string }
// response
{ ok: true } | { error: string }
```

Consumes token, sets password, sends `password_changed`. Errors: `invalid_token`, `token_expired`, `password_too_short`, `auth_not_configured`.

## Soft email verify

### `POST /api/auth/verify-email`

```ts
{ token: string } → { ok: true } | { error: string }
```

### `POST /api/auth/verify-email/resend`

Session. Mints token (TTL `paths.emailVerifyTtlSeconds`, 48h) and sends `email_verify` when SMTP configured.

## Best-effort send sites

| Route | Kind |
|-------|------|
| `POST /api/register` | `welcome` + `email_verify` |
| `POST /api/invites/accept` | `welcome` |
| `POST /api/auth/verify-email/resend` | `email_verify` |
| `POST /api/scenes/:id/members` | `scene_shared` |
| `POST /api/public/client-shares/:token/comments` | `comment_new` |
| `POST /api/scenes/:id/client-share-thread` | `comment_reply` (guest email) |
| `PATCH /api/admin/users/:id` | `account_disabled` / `account_enabled` / `role_changed` |
