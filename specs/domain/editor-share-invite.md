# Editor share — Zaoly local members

**Status:** Accepted · 2026-10-04 (Zaoly rewrite)  
**Parent:** `specs/domain/editor-workspace.md` · `zaoly-scene-share.md`  
**API:** `specs/api/zaoly-scene-members.md`

## Goal

From the Zaoly editor, the **scene owner** shares the composition with other local Zaoly users (`editor` / `viewer`).

## Behavior

1. Share control is available when the actor is the scene owner (session).
2. UI lists owner + `scene_members` via `GET /api/scenes/:id/members`.
3. Owner adds a member by email (`POST …/members`) — user must already exist (admin invite first).
4. Owner may change role or remove members (`PATCH` / `DELETE`).
5. ACL: `require-scene-collection-access` / write gates honor owner + member roles.

## Non-goals

- Plexon Collection invite links (removed for Zaoly)
- Public anonymous editor links
- Client / customer page preview — `client-page-share.md`

## Mail

When SMTP is configured, adding a member SHOULD send branded `scene_shared` mail (`zaoly-system-mail.md`). Failure MUST NOT roll back the membership.
