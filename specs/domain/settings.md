# Settings — Zaoly

## Status
Accepted · standalone Zaoly settings (no suite federation / Zaoly library chrome)

## Surface
`/settings` — dense 2-col `SettingsShell` under AppShell. Minimal help copy.

## Sections
| Section | Behavior |
|---------|----------|
| Account | Signed-in local user (`GET/PATCH /api/me`); sign-out; empty only under auth bypass |
| Profile / display name | Prefer session `name` (server); device-local key MAY cache display |
| Appearance | Theme + AccentSwatchGroup (local prefs) |
| Language | `en` / `de` — local cache |
| Users / Admin | Admin only → `/admin/users` (canonical); `/settings/users` redirects · primary nav **Admin** · `zaoly-platform-admin.md` · `zaoly-user-management.md` |

## Must not surface
- Plexon federation contract / base / mode
- Auth-bridge launchCode copy
- `ZAOLY_UI_SOURCE`, Storybook catalog URL, GitHub promote status

## Deferred
- Personal API tokens — after auth harden
