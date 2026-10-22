# Zaoly scene share (local members)

**Status:** Accepted — 2026-10-04  
**Product:** Zaoly standalone  
**API:** `specs/api/zaoly-scene-members.md`  
**Related:** `zaoly-user-management.md` · `zaoly-composition-persistence.md`  
**Replaces for Zaoly:** Plexon Collection invite path in `editor-share-invite.md`

## Intent

Composition owners share a scene with other **local Zaoly users** via `scene_members`. No Plexon Collection membership.

## Roles

| Role | Read | Write ops | Manage members | Delete scene |
|------|------|-----------|----------------|--------------|
| Owner (`ownerUserId`) | yes | yes | yes | yes |
| `editor` | yes | yes | no | no |
| `viewer` | yes | no | no | no |
| Other | no | no | no | no |

## Behavior

1. Share UI lists members + owner; owner can add by email (existing user) or invite+pending grant.
2. `listScenesForViewer` = owned ∪ member rows ∪ **orphan** scenes (no `ownerUserId`) that are unbound or bound to a Collection the viewer can access.
3. Write routes (ops, PATCH scene, delete) require owner or `editor`.
4. Viewer membership yields read-only APIs (GET scene, export, presence read).
5. **Orphan claim:** Scenes with empty/null `ownerUserId` (seed/reseed leftovers) are readable and writable by any authenticated viewer who may access them. The first successful write (`PUT` / `POST …/ops` / import) sets `ownerUserId` to that viewer. Soft-reseed of the default landing MUST preserve an existing `ownerUserId`.
6. **Per-user starter:** New accounts receive a personal Zaoly default landing via `ensureStarterLandingForUser` (`ownerUserId` set). Do not put multiple tenants on one shared `scene-demo`.

## Non-goals

- Public anonymous editor links
- Plexon Collection invites
- SMTP delivery of share links
