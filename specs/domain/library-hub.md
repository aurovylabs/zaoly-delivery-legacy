# Library hub — Zaoly

## Status
Accepted — 2026-10-11 · **Sections (starter Masters) + Site Kit catalog cards**

## Route
`/library` under AppShell (top-chrome magazine hub).

## Layout

1. **Hero panel** — one-line handoff copy, primary actions (Editor, Kit Playground, Storybook when set, Refresh).
2. **Sections (starter)** — card grid from Zaoly landing section Masters (`Composition:Landing*`, same catalog as editor Insert → Sections / Kit SK-V22). **Global**, not Collection-scoped. Per card: label, export / `sourceKey`, **live mini preview** from `buildStarterSectionPlaygroundSeed` → `SiteKitLibraryPreview` kind `section`, CTA **Open in Kit Playground** (`kitPlaygroundHref({ componentId })`). These are scene Masters (teaching bands), not Kit SSOT Patterns.
3. **Saved compositions (Patterns)** — card grid from `GET /api/site-kit/compositions` when a Collection is bound. **Collection picker deferred** until Zaoly ships Collections (same stance as Kit SK-V23): show empty / need-Collection copy; MUST NOT imply a Collections hub. Per card when present: export name, preview, Editor + Storybook actions.
4. **Atom catalog** — grouped card grid from `SITE_KIT_CATALOG` (forms · content · layout) — **global**. Per card: palette id, export label, mini preview; CTAs **Open in Kit** (`kitPlaygroundHref({ componentId })`) and **Open editor** (`editorHref({ insertType })` when in-app editor on); Storybook deep-link when configured.

## Non-goals

- Zaoly WC fixture catalog or DS Promote UI on this page (API/MCP remain; Settings may surface promote config).
- Mixing Site Kit entries into `@zaoly/ui` CATALOG.
- Live CEM parse from Zaoly monorepo.
- Treating starter Sections as durable Site Kit Patterns (Save as Pattern from the editor remains the promote path).

## Data

- Sections: `zaolyStarterSectionNavEntries` + `buildStarterSectionPlaygroundSeed` (`apps/web/lib/site-kit/zaoly-starter-sections.ts`) · catalog `zaoly-landing-section-catalog.ts`
- Compositions: `GET /api/site-kit/compositions?platformProjectId=` (optional; Collection-scoped Patterns)
- Atoms: static `SITE_KIT_CATALOG` (`packages/site-kit/src/catalog.ts`) — always global
- Storybook links: `lib/site-kit/storybook-href.ts` (`Compositions/{scope}/{Name}`)
