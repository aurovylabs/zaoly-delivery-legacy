# Zaoly scene members API

**Status:** Accepted — 2026-10-04  
**Domain:** `specs/domain/zaoly-scene-share.md`

## Auth

Session required. Scene must be visible to the actor (owner or member). Mutating members requires **owner**.

## `GET /api/scenes/:id/members`

```ts
{
  ownerUserId: string | null
  members: Array<{
    userId: string
    email: string
    name: string | null
    role: 'editor' | 'viewer'
    createdAt: string
  }>
}
```

## `POST /api/scenes/:id/members`

Owner only. Body: `{ email: string; role: 'editor' | 'viewer' }`.

- Existing user → upsert `scene_members`.
- Unknown email → `404 { "error": "user_not_found" }` (invite users via admin first in Phase 1).
- Cannot add owner as member (noop / `400`).

## `PATCH /api/scenes/:id/members/:userId`

Owner only. Body: `{ role: 'editor' | 'viewer' }`.

## `DELETE /api/scenes/:id/members/:userId`

Owner only. Removes membership.

## Errors

| Status | error |
|--------|-------|
| 401 | `unauthorized` |
| 403 | `forbidden` |
| 404 | `not-found` / `user_not_found` |
