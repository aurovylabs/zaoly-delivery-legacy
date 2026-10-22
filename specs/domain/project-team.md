# Project team (CREATION)

**Status:** Accepted — 2026-09-19
**Parent:** Plexon `collection-members.md` / `collection-invite-links.md`
**Parity:** CHECKION `specs/domain/project-team.md` (compact inline add)
**Related:** `editor-share-invite.md`

## Goal

A CREATION project is a Collection capability mirror. The Team panel shows who has
Collection access and allows:

1. Add by email (same-company Plexon user → additive assignment)
2. Revoke an assigned member (the Collection creator row is not removable)
3. Mint a Collection invite link

Plexon is the SSOT. CREATION stores no local members table and never invents a
second access model.

## Collection Team vs scene share invite

| Surface | Scope | Route | Spec |
|---------|-------|-------|------|
| Team panel | **Collection** — durable roster for every CREATION composition under the project | `POST /api/projects/:id/invites` | this spec |
| Editor share | **Scene** — invite carries `sceneId` so the recipient lands on one composition | `POST /api/scenes/:id/share-invite` | `editor-share-invite.md` |

Both mint against `plexonProvisioningCollectionInvitesPath`. Team invites carry no
`sceneId`; editor share-invite behavior is unchanged by this spec.

## UI

- `ProjectTeamPanel`, mounted in `project-detail-panel.tsx` after the project header
  Panel and before Compositions.
- Numbered magazine rows (`creation-magazine-list`), **inline draft email row** on
  “Add member” — no always-visible Field. Enter commits, Escape cancels, blur commits.
- Invite link is a secondary foot action. When the draft email is filled, the BFF
  forwards `toEmail` so Plexon emails the invite; otherwise the URL is copied to the
  clipboard when the browser allows it.
- Unbound / `plx-local-*` project: empty state asking to sync a Collection; no add row.

## BFF

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/projects/:id/members` | roster from Plexon; `source: 'creator'` → `status: 'owner'` |
| POST | `/api/projects/:id/members` | `{ email, role? }` |
| DELETE | `/api/projects/:id/members/:userId` | revoke assignment |
| POST | `/api/projects/:id/invites` | `{ role? }` → `{ inviteUrl, inviteId, expiresAt? }` |

Every handler requires a session, loads the project via `getProject`, gates with
`viewerCanAccessProject`, and rejects unbound projects (`collection_required`, 400)
via `isRealPlatformProjectId`. Outbound calls live in
`apps/web/lib/collection-members-plexon.ts` and return `federation_off` (503) unless
`ZAOLY_FEDERATION_MODE=live` with Plexon configured.
