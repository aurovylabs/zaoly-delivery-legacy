# Zaoly platform admin API

**Status:** Accepted (spec) — 2026-10-09 · Phase 1 + Phase 2a + Phase 2b shipped  
**Domain:** `specs/domain/zaoly-platform-admin.md`  
**Anchors:** `apps/web/app/api/admin/*` · UI `/admin/*`  
**Related:** `specs/api/zaoly-users.md` · `specs/api/zaoly-system-mail.md`

## AuthZ

| Gate | Rule |
|------|------|
| Phase 1 + 2a staff routes | Session + role `admin` \| `platform_admin` + not disabled + Postgres |
| Phase 2b elevated | Real actor `platform_admin` (not the impersonated target) |
| Impersonation | Elevated + `ZAOLY_PLATFORM_ADMIN_IMPERSONATION=1` |
| Members | 403 on all `/api/admin/*` |

UI routes `/admin/*` MUST use the same gate (server redirect to login or 403 page).

## Phase 1 — existing contracts (canonical for directory)

Reuse without breaking clients:

| Method | Path (`paths.*`) | Notes |
|--------|------------------|--------|
| `GET` | `apiAdminUsers` | List directory — **MAY** add `?q=&limit=&cursor=` (backward compatible: omit → full/simple list as today) |
| `POST` | `apiAdminUsersInvite` | Invite — unchanged body/response (`zaoly-users.md`) |
| `PATCH` | `apiAdminUser(id)` | `{ disabled?, role? }` — unchanged |
| `GET`/`PUT` | `apiAdminSmtp` | Managed lock unchanged |
| `POST` | `apiAdminSmtpTest` | Unchanged |

### `GET /api/admin/users` (extended, optional query)

Query (all optional):

| Param | Meaning |
|-------|---------|
| `q` | Case-insensitive match on email / name |
| `limit` | Page size (default documented in `paths`; cap e.g. 100) |
| `cursor` | Opaque pagination cursor |
| `role` | Filter `admin` \| `member` |
| `disabled` | `true` \| `false` |

Response MAY grow fields (additive):

```ts
{
  users: Array<{
    id: string
    email: string
    name: string | null
    role: 'admin' | 'member' | 'platform_admin'
    disabled: boolean
    createdAt: string
    lastLoginAt: string | null
    hasPassword?: boolean
    hasGoogle?: boolean
    ownedSceneCount?: number
  }>
  nextCursor?: string | null
}
```

## Phase 1 — overview

### `GET /api/admin/overview` → `paths.apiAdminOverview`

Admin only. Cheap instance status for `/admin` home:

```ts
{
  userCounts: { total: number; admins: number; members: number; disabled: number }
  publicSignup: boolean
  smtp: { configured: boolean; managed: boolean }
  sceneStore: 'postgres' | 'json' | string
}
```

MUST NOT leak SMTP passwords or raw secrets.

## Phase 2a — ops enrichment (admin-gated)

### `POST /api/admin/users/:id/force-password-reset` → `paths.apiAdminUserForcePasswordReset(id)`

Admin only. Body: optional `{ locale?: 'en' | 'de' }`.

```ts
{ ok: true; emailSent: boolean; emailError?: string; expiresAt: string }
```

- MUST mint a password-reset token for the target (same store as forgot-password).
- MUST attempt reset mail when SMTP is configured; failure MUST NOT roll back the token (`emailSent: false`).
- MUST reject disabled targets (`400` `user_disabled`) and missing users (`404`).
- MUST write an audit event `user.force_password_reset`.

### `GET /api/admin/audit` → `paths.apiAdminAudit`

Admin only. Query: `limit` (default `paths.adminAuditPageSizeDefault`, cap `adminAuditPageSizeMax`), `cursor` (opaque).

```ts
{
  events: Array<{
    id: string
    at: string
    actorUserId: string
    actorEmail: string | null
    action: string
    targetUserId: string | null
    meta: Record<string, unknown> | null
  }>
  nextCursor?: string | null
}
```

Actions recorded in 2a: `user.invite`, `user.patch`, `user.force_password_reset`.  
Actions recorded in 2b: `user.anonymize`, `user.impersonate_start`, `user.impersonate_stop`.  
Actions recorded in P1: `auth.denied` (authenticated `403` only).

### `user.patch` audit meta (P1)

```ts
{
  before: { role: AppRole; disabled: boolean }
  after: { role: AppRole; disabled: boolean }
}
```

### `auth.denied` audit meta

```ts
{ reason: 'forbidden' | 'platform_admin_required' | 'impersonating'; gate: string }
```

`gate` examples: `admin`, `platform_admin`, `mutation_lock`. MUST NOT record blank `401` (no session).

## Session revoke (P1)

JWT callback MUST invalidate the session (`null` token) when:

- effective `token.sub` user is missing or `disabled`, or
- while impersonating, the real actor is missing / disabled / not staff, or the target is disabled.

When not impersonating, JWT MUST refresh `email` / `name` / `role` from the store so role demotions apply without re-login.

## Read-only impersonation (P2)

While the signed impersonation cookie is valid:

- Mutating methods (`POST`/`PUT`/`PATCH`/`DELETE`) under `/api/*` MUST return `403` `{ error: 'impersonating' }`.
- Exception: `POST` `paths.apiAdminImpersonateStop` remains allowed.
- GETs and page navigations remain allowed (view-as is read-only).
- Enforced in `proxy.ts` via `impersonationWriteBlockReason` (defense in depth with admin mutation locks).

## Phase 2b — elevated

### `POST /api/admin/users/:id/anonymize` → `paths.apiAdminUserAnonymize(id)`

`platform_admin` only (real actor).

```ts
{ ok: true; id: string; email: string; disabled: true }
```

- MUST set `disabled=true`, clear `password_hash` + `google_sub`, set `name=null`, replace email with `anon-{id}@anonymized.invalid` (paths).
- MUST NOT anonymize self or the last enabled staff (`admin` \| `platform_admin`) → `400` `last_admin` / `cannot_anonymize_self`.
- MUST write audit `user.anonymize`.

### `POST /api/admin/impersonate` → `paths.apiAdminImpersonate`

Body: `{ userId: string; reason: string }`. Gate: `platform_admin` + env impersonation on + not already impersonating.

```ts
{ ok: true; targetUserId: string; expiresAt: string }
```

- MUST require `reason` trimmed length ≥ `paths.impersonationReasonMinLength` (else `400` `reason_required`).
- MUST set signed httpOnly impersonation cookie (TTL `paths.impersonationTtlSeconds`, default 30m).
- Effective `session.user.id` becomes the target; product ACL uses the target.
- Admin gates MUST still authorize the real platform_admin for **stop** only while cookie is set.
- MUST reject disabled / missing / staff targets; MUST NOT impersonate self.
- MUST write audit `user.impersonate_start` with `{ reason, targetEmail }`.

While impersonating, these MUST return `403` `impersonating`: invite, user PATCH, force-reset, anonymize, SMTP PUT, start impersonate.

### `POST /api/admin/impersonate/stop` → `paths.apiAdminImpersonateStop`

Clears cookie; restores real actor. Audit `user.impersonate_stop`. Allowed for the real staff actor even while cookie is set.

### `GET /api/me` (additive)

MAY include:

```ts
{ impersonating?: boolean; impersonatorId?: string; realRole?: 'admin' | 'platform_admin' }
```

## Errors

| Status | When |
|--------|------|
| 401 | No session |
| 403 | Not admin / managed SMTP write / impersonation off |
| 503 | User store / Postgres not configured |

## Compatibility

- Existing `/api/admin/users*` and `/api/admin/smtp*` clients MUST keep working.
- New UI SHOULD prefer `paths.admin*` page routes; APIs stay under `/api/admin/*`.
