# API — Client Page Share (CREATION)

**Status:** Accepted · 2026-09-20 · **Phase:** P8  
**Domain:** `specs/domain/client-page-share.md`  
**Paths:** `knowledge/paths.md` · `apps/web/lib/paths.ts` (constants only; no FQDN literals)

## Auth matrix

| Route | Auth |
|-------|------|
| `POST /api/scenes/:id/client-shares` | Session; Collection lifecycle manage |
| `GET /api/scenes/:id/client-shares` | Session; scene viewer (list metadata + `shareUrl` when `token_plain` present; never on public routes) |
| `DELETE /api/scenes/:id/client-shares/:shareId` | Session; lifecycle manage (revoke) |
| `PATCH /api/scenes/:id/client-shares/:shareId` | Session; lifecycle manage (refresh snapshot, rotate password, extend TTL) |
| `DELETE /api/platform/provisioning/collections/:platformProjectId/client-shares/:shareId` | Plexon service secret + `X-Actor-User-Id` (Collection admin revoke fan-out; P4) |
| `GET /api/public/client-shares/:token` | Public; optional `Authorization: Bearer` unused in P1; password via header or body on challenge |
| `POST /api/public/client-shares/:token/unlock` | Public; `{ password }` → short-lived viewer cookie/JWT scoped to share id |
| `GET /api/public/client-shares/:token/comments` | Public; unlocked share |
| `POST /api/public/client-shares/:token/comments` | Public; unlocked share — body `{ pageId, authorName, body, pinX?, pinY? }` |

## Create

`POST /api/scenes/:id/client-shares`

```json
{
  "pageIds": ["page_home", "page_pdp"],
  "accessMode": "password",
  "password": "optional-when-password",
  "expiresInDays": 14,
  "label": "Client review",
  "contentMode": "pinned_revision"
}
```

**Response 201** (plain token once):

```json
{
  "id": "…",
  "token": "crs_…",
  "shareUrl": "https://…/share/p/crs_…",
  "accessMode": "password",
  "expiresAt": "…",
  "pageIds": ["page_home", "page_pdp"],
  "contentMode": "pinned_revision"
}
```

`shareUrl` is built from runtime public origin + `pathClientPageShare(token)` — never hardcoded host in route handlers.

Create leaves room status **`shared`**. Suite E2 ClientRoom publish requires an explicit approve (below).

## Approve (Suite E2)

`PATCH /api/scenes/:id/client-shares/:shareId`

```json
{ "approve": true }
```

Sets `approved_at` / `approved_by_user_id` (`status: approved`). Best-effort PUT to Plexon  
`…/client-room/slots/creation_pages` with `{ productId: "creation", subjectRef: shareId, title, href?, actorUserId }`.

Revoke of an **approved** share best-effort clears the same slot (`clear: true`).

## Public resolve

`GET /api/public/client-shares/:token`

- Invalid/revoked/expired → **404** (generic).
- `accessMode: password` and no valid unlock → **401** `{ "code": "password_required" }`.
- Success → `{ pageIds, pages, brandCssRef, artboard, label, contentMode }` — **subset only**.

## Guest comments (P3 / P7 / P8 / P9)

`POST /api/public/client-shares/:token/comments`

- Always stores on the share record.
- When `pinX`/`pinY` present: **P8** also projects into `CompositionScene.comments` (`id` = `cmt_crs_` + guest id; board coords = page frame + pin) and publishes `scene-updated` (`source: client_share_guest_comment`).
- Guests still MUST NOT call scene ops / PUT.

`GET /api/scenes/:id` (authenticated) backfills missing projected pins via `syncAllGuestCommentsIntoScene` without bumping `updatedAt`.

`GET` public share / comments (**P9**): responses include `replies[]` + `resolved` enriched from the matching projected scene comment (`enrichGuestCommentsFromScene`, merges share + scene replies).

`POST /api/scenes/:id/client-share-thread` (**P9 live**): `{ sceneCommentId, replies, resolved }` — session; immediately mirrors onto active share `guest_comments` when the designer replies/resolves in the editor (does not wait for scene Save). Scene `PUT` still re-mirrors as a durable backup.

## Policy

Before create/resolve, BFF MAY call Plexon policy endpoint (P1 minimal: env flag `ZAOLY_CLIENT_SHARE_ENABLED`; P2: live `GET …/client-share-policy`). If disabled → **403** on create, **404** on public resolve.

## Errors

| Code | When |
|------|------|
| 401 | No session on manage routes; password required on public |
| 403 | Policy forbid / not Collection admin |
| 404 | Unknown scene, unknown share, revoked, expired |
| 422 | Empty `pageIds`, invalid page id, TTL above org max |

## Testing

Contract tests for create once-token, hash storage, subset filter, password unlock, revoke, guest→scene projection (P8).
