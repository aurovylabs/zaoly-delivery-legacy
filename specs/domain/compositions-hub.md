# Compositions hub — Zaoly

## Status
Accepted (Wave 5 · **Scenes as Compositions** 2026-08-29 · **Cards / cover preview** 2026-08-29 · **CD chrome** 2026-10-03)

## Route
`/compositions` under AppShell.

## Model
A **composition** in product UX is a persisted `CompositionScene` document (Editor SoT). Not fixture stubs. Not Site Kit catalog exports (those stay on `/library`).

## Chrome (Zaoly CD)
- Hub chrome (`.creation-compositions-hub`) MUST use **radius 0**, `--editor-panel` / `--editor-panel-muted` / `--editor-border`.
- Layout switch active state MUST be solid acid lime + black ink (`--editor-live` / `--editor-live-ink`).
- Card hover MAY use cobalt border/wash; create-tile hover MAY use lime wash.
- Preview thumbnails MUST be sharp (`border-radius: 0`) on Ma cream (`--editor-canvas-frame`).
- Copy MUST NOT surface CREATION / Plexon branding on this page.

## Behavior
- AppShell title/lead only (no duplicate intro Panel / generic “Open editor” CTA on this page)
- **Recent compositions** via `listScenesForViewer` (standalone: `ownerUserId`; federated: Collection ACL), sorted by `updatedAt` desc
- **View modes:** Cards | List via `@zaoly/ui` `HubIndexLayoutSwitch` (session persist `zaoly.compositions.view`)
- **Cards:** `@zaoly/ui` `HubIndexCard` + optional `media` = clipped live preview · title · meta; whole card opens editor
- Row / card action: Open editor with `?sceneId=` and `?platformProjectId=` when bound
- **Card menu:** overflow control (sibling of the card link, not nested inside `<a>`) opens `@zaoly/ui` `ContextMenu` with **Rename** and **Delete**
  - Rename → Dialog → `PATCH /api/scenes/:id` `{ name }` → refresh list
  - Delete → confirm Dialog → `DELETE /api/scenes/:id` → remove from list
- **Create (standalone):** first-grid `HubIndexCard` `variant="create"` opens `Dialog` (name; optional project) → `POST /api/scenes` with `ownerUserId` → `/editor?sceneId=`
- **Create (federated):** name + project → bind `platformProjectId` as today
- WENN federated and the viewer has no projects, DANN show EmptyState + CTA to `/projects`
- WENN standalone, DANN create remains enabled without a project
- WENN in-app editor env is off, DANN the create Dialog shows the in-app-off hint (hub itself has no separate editor CTA)

## Live thumbnail
- Thumbnail = sandboxed **iframe** on `GET /api/scenes/:id/preview-html?pageId=&breakpoint=desktop`
- Preview viewport is a **clipped** box (`overflow: hidden` + `contain: paint`); desktop artboard (1280×800) scales to **card media width** via container query (`100cqw / 1280`) — MUST NOT spill past the card edge.
- Hub summary carries optional `previewPageId` from `resolveCompositionCoverPageId(scene)`:
  - Prefer valid `coverPageId` when set
  - Else first page / active / root-implied (`page-default`)
- Editor: pages list context menu **Set as cover** → `set_cover_page` op (`CompositionScene.coverPageId`)

## Data
- Durable SoT: `specs/domain/zaoly-composition-persistence.md` · `apps/web/lib/scene/scene-store.ts`
- Hub rows: `CompositionSummary` via `sceneToCompositionSummary` / `listScenesForViewer`
- Viewer projects (optional bind): `listProjectsForViewer`
- Open/create helpers: `apps/web/lib/scene/blank-scene.ts`, `scene-summary.ts`
- Cover resolve: `apps/web/lib/scene/composition-cover.ts`

## Non-goals
- Canvas / inspect inside the hub
- Soft-archive / restore UI (hard delete only for now)
- Site Kit “Save as composition” (Library / Patterns)
- PNG/raster thumbnails, worker/CDN
- Projects hub rewrite / Home recent thumbs (follow-up)

## Related
- Shared tile + switch: `zaoly-ui` `specs/domain/zaoly-ui-hub-index-card.md`, `zaoly-ui-hub-index-layout-switch.md`
- CD: `specs/domain/zaoly-corporate-design.md`
- Project detail list/create: `project-workspace.md`
- Scenes API: `specs/api/scenes.md`
- Editor boot: `editor-launch.md` / `editor-workspace.md`
- Pages / cover: `scene-pages.md`
