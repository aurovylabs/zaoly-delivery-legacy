# App shell — Zaoly standalone

## Status
Accepted — Zaoly hub chrome (extends CREATION-era P68–P70 layout language)

## Goal
Editor-first product chrome via `@zaoly/ui` only: `AppFrame`, `BrandCorner` (seal / preview), `PageTitle`. Primary product navigation is a **horizontal top-left** strip composed in the AppFrame brand/top region — **not** a vertical left `NavRail`.

## Brand
- Hub wordmark: **Zaoly** (seal + label in `.zaoly-hub-chrome`)
- Product id: `zaoly`
- No product launcher menu, no suite switcher, no Plexon Assistant FAB (`knowledge/suite-federation-out-of-scope-for-zaoly.md`)
- No MUI layout, no `ZaolyAppLayout`, no `@zaoly/react`
- `AppFrame` SHALL pass `shellCorners` **on** with `shellCornerRadius={paths.brandCornerRadiusPx}`
- BrandCorner (guest preview) SHALL use the same `borderRadius={paths.brandCornerRadiusPx}`
- Stage content wraps in `creation-stage` only — do **not** nest a second `.app-main` inside AppFrame’s page body

## Primary nav
| Id | Route | Notes |
|----|-------|-------|
| editor | `/editor` | Primary surface |
| compositions | `/compositions` | Scene list |
| library | `/library` | Catalog |
| kit | `/kit` | Kit Playground |
| tokens | `/tokens` | Local Token Studio |
| users | `/settings/users` | Local user management |
| settings | `/settings` | Quiet settings — trailing in hub nav |

- **Magazine / general pages** (`AppShell` without `immersive`): primary nav MUST be a **full-width warm-gray bar** (`.creation-top-nav--bar`) at the top (`.zaoly-hub-chrome`). Seal stays brand blue; wordmark + links use warm-gray foreground. Active link: acid lime fill with dark ink.
- **Immersive editor** (`AppShell immersive`): MUST reuse the same labeled hub nav bar. Below it, the product topbar hosts editor tools only.
- Do **not** mount vertical left `NavRail` for product chrome. Editor floating rails remain separate.
- Settings MUST NOT sit alone in `div.topbar-right.creation-topbar-trail`.

### Topbar trail slot
- `AppShell` exposes a **topbar trail host** (`creation-topbar-trail`) via React context so immersive editor can portal editor chrome into the product topbar.
- Magazine hubs: trail MAY be empty.
- Immersive editor: trail hosts tools then actions — see `editor-workspace.md`.

Authenticated shell MUST **not** mount a platform Assistant host or suite product switcher.

## Client share preview (`AppShell preview`)

Public `/share/p/:token` uses `AppShell preview`:

| Present | Absent |
|---------|--------|
| `AppFrame` + `shellCorners` | Primary nav |
| BrandCorner **logo only** | Settings link |
| Topbar trail (page tabs / export) | Assistant / product launcher |
| Quiet lead label (`shell.clientSharePreview`) | Magazine title / lead |

## Immersive editor

WO `AppShell immersive` (route `/editor`), DANN MUSS page title / lead entfallen — workspace full-bleed under hub nav + tool strip. Exit via product nav.

## Forms
Product dropdowns / multiline use `Field` + `Select` / `Textarea` from `@zaoly/ui` — never OS `<select>` chrome.

## Shell metrics
Documented in `knowledge/paths.md` / `apps/web/lib/paths.ts`. Knowledge: `knowledge/shell-chrome.md`.

## Acceptance
1. Shell works at desktop and stacks on narrow widths.
2. Shared package styles imported once via `app/globals.css`.
3. Horizontal top nav marks active for primary hubs; Settings trailing; Users separate.
4. Immersive editor and magazine hubs share the labeled warm-gray hub nav bar.
5. No Assistant FAB; no suite product switcher.
6. Shell corners visible on magazine hubs **and** `/editor`; BrandCorner plaque only on guest preview.
7. Editor floating rails still work; no double product NavRail.
