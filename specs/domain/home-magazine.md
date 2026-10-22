# Home magazine — CREATION v3

## Status
Accepted (Phase 1) — editorial magazine on `/`

## Goal
Replace the Panel stub home with one magazine composition: brand cover, capability entry tiles, three recent entity columns (Projects · Compositions · Library) — Brandion / Audion home parity for the composition island.

## Composition (`HomeMagazine` / `creation-magazine--home`)
Full stage width (no Panel cap). Spine — not stacked dashboard panels:

1. **Cover** — large **CREATION** wordmark only (no lede, no cover CTAs)
2. **01 · Launch** — three capability tiles: **Projects** · **Compositions** · **Library** → hub routes (Settings stays in primary nav only)
3. **02 · Recent** — three equal columns (`creation-home-recent-columns`), each a numbered `creation-magazine-list`:
   - **Projects** — recent Collection summaries (~6–8); link `/projects/:id`
   - **Compositions** — recent `CompositionScene` rows for the viewer’s projects; link `/editor?sceneId=&platformProjectId=`
   - **Library** — Site Kit composition catalog entries; link `/library`

Sort recent items by `lastActivityAt` / `updatedAt` desc when present, else name. Empty columns use `EmptyState` + hub CTA.

## Data
- `listProjectsForViewer` · `listScenes` (mapped via `sceneToCompositionSummary`, filtered to viewer project Collections) · `listSiteKitCompositions` (tolerate empty / store failure)
- Project `compositionCount` MAY be enriched at read time from scene counts
- No new API fields
- Legacy CREATION home used `force-dynamic`; Zaoly public `/` is the landing (see `zaoly-landingpage-concept.md`) and adopts Cache Components without `instant = false` (`cache-components-adoption.md`)
- When AppShell is used on a magazine home, omit `titleKey` / `descriptionKey` — cover is the hero identity

## UI primitives (`@zaoly/ui`)
`EmptyState` · `Text`  
App composition for magazine chrome (`creation-home-*`, capability tiles, recent lists). Cover is brand wordmark only. Do not invent create dialogs on home.

## Drop / reshape
- Two-panel home stub (`SectionChrome` + bullet “Where to go”)
- Duplicate `AppShell` page title / lead on `/`

## Related
- Shell: `app-shell.md`
- Hubs: `project-workspace.md`, `compositions-hub.md`, `library-hub.md`
- Reference: BRANDION / AUDION `home-magazine.md`
