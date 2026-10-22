# Domain hubs — CREATION v3

## Status
Accepted (Wave 5) — 2026-08-12

## Goal
Magazine hubs for CREATION domain surfaces **without** porting the Zaoly canvas into Next.

| Hub | Route | Role |
|-----|-------|------|
| Compositions | `/compositions` | Recent composition stubs + Open editor (Wave 2/4) |
| Library | `/library` | Read-only WC / contract overview (fixture snapshot) |
| Projects | `/projects` | Collection capabilities (Wave 3) |

## Principles
- Product Library hub SoT = Site Kit (`SITE_KIT_CATALOG` + site-kit compositions) + `@zaoly/ui`
- Hubs are rebuild magazine surfaces using `@zaoly/ui`
- Offline `library-catalog` fixture remains for API/MCP orientation; `/api/compositions` reads live scene-store summaries — no live FS Bridge / CEM parse at request time
- Capability Catalog / MCP deferred to Wave 6

## Specs
- `specs/domain/compositions-hub.md`
- `specs/domain/library-hub.md`
