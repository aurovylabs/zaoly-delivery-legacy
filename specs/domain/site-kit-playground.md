# Site Kit Playground (`/kit`)

**Status:** Accepted · **Date:** 2026-09-12 · **Chrome CD:** 2026-10-03  
**Product:** Zaoly · Route `paths.routes.kit` = `/kit`  
**Knowledge:** `knowledge/site-kit-playground.md` · Paths: `knowledge/paths.md` · CD: `specs/domain/zaoly-corporate-design.md`  
**Related:** `specs/domain/site-kit.md` · `specs/domain/site-kit-collection-scope.md` · Coolify Storybook `knowledge/site-kit-storybook-coolify.md`

## Purpose

Provide a **CREATION-native Kit Playground**: Storybook-like nested component navigation plus **ephemeral** React/TSX editing and live preview — **without** Coolify Storybook rebuilds and **without** writing Site Kit SSOT (overrides / CSF / disk).

UX metaphor: CodePen / [Web Maker](https://github.com/chinchang/web-maker) (tree + code + preview). **Do not** vendor Web Maker or Mozilla Webmaker; implement inside CREATION with `@zaoly/ui` chrome.

## Locked decisions

1. Host = CREATION route `/kit` (same deploy, session, Collection ACL).
2. Edit model = real TSX source in Monaco; sandbox only (memory / `sessionStorage`); **Reset** restores seed.
3. Nav lists **Atoms**, **Layout**, and Collection **Patterns** (Storybook-like nesting).
4. Coolify Site Kit Storybook remains secondary for package CSF hydrate; Playground is the daily browse/try surface.

## Requirements (EARS)

1. WHERE `/kit` is open, the system MUST show a nested nav of Site Kit Atoms + Layout from `SITE_KIT_CATALOG`, **Sections (starter)** from Zaoly landing section Masters (`Composition:Landing*`), and Patterns from `GET /api/site-kit/compositions` under the active Collection.
2. WHEN no Collection is bound, Patterns MUST remain empty / gated (same fail-closed ACL as compositions list); Atoms/Layout and starter Sections MAY still be browsable for signed-in users.
2a. Starter Sections MUST be a separate nav group from Patterns; selection kind MUST be `section`; playground-source MUST seed from expanded Master trees without writing Kit SSOT and WITHOUT Collection ACL (factory seeds only).
3. WHEN the user selects a component, the system MUST seed the TSX editor from read-only sources (`generateCompositionModule` / atom stub / starter section Master / live override composition when present) via `GET /api/site-kit/playground-source`.
4. WHEN the user edits TSX, the system MUST update a sandboxed live preview (Sucrase transpile for validation + composition-tree projection) and MUST NOT call write, publish, composition-save, or Coolify deploy APIs.
5. WHEN the user clicks **Reset**, the editor and preview MUST restore the last seed for the selected `componentId`.
6. WHERE UI chrome is shown, the system MUST use `@zaoly/ui` (no MUI / `@zaoly/react`).
6a. Kit Playground chrome (`.creation-kit-*`) MUST follow Zaoly CD: **radius 0**, surfaces via `--editor-panel` / `--editor-panel-muted` / `--editor-border`. Active selection MUST be **solid** acid lime (`--editor-live`) with black ink text (`--editor-live-ink`) — WCAG; no lime tint on dark cream.
7. WHEN deep-linking with `componentId` and optional `platformProjectId` query params (`paths.kitComponentQueryParam` / `paths.activePackQueryKey`), the playground MUST select that component after load.
8. Editor Site Kit Center / menus MUST offer **Open Kit Playground** as the primary daily catalog CTA; Open Storybook remains available for Coolify CSF.

## Non-goals

- Forking/embedding Web Maker or CodePen.
- Bidirectional write-back from playground edits to overrides.
- Multiplayer pens / cloud save of sandbox state.
- Killing Coolify Storybook in the same delivery.
- One Coolify Storybook per Collection.

## Waves

| Wave | Scope |
|------|--------|
| **SK-V1** | `/kit` shell, nav tree, CompositionPreview, Collection picker, AppShell nav |
| **SK-V2** | Monaco + playground-source API + Sucrase + Reset + dirty state |
| **SK-V3** | Editor / Site Kit Center deep-links + copy demoting Storybook for daily browse |
| **SK-V4** | Polish — root props pane (ephemeral), nav search, copy share deep-link, debounced parse, sessionStorage draft, stronger JSX extract |
| **SK-V5** | Storybook demotion — `/kit` primary for daily browse; Publish/Storybook copy = package CSF; Center primary Kit CTA; copy-link feedback |
| **SK-V6** | Editor-Bridge (`insertType`) → Brandion token paint in preview → viewport presets + dirty persist hint |
| **SK-V7** | Insert-Härte tests → Pattern-flow CTAs → viewport cascade paint plumbing → further Storybook demotion |
| **SK-V8** | Pretty-print seeded TSX — multi-line JSX attrs / style when warranted (`generateCompositionModule`) |
| **SK-V9** | Code display — Monaco JSX + quiet diagnostics, draft v2, Format CTA, root style in Props pane |
| **SK-V10** | Developer Hub — Handoff pane (install / import / tokens / module copy) + extended playground-source |
| **SK-V11** | Maintainer surface — Pattern revision / kitRevision, Storybook CSF links, JSON dump, Pull hint (no write) |
| **SK-V12** | Storybook handoff links mint SK-S1 view token when Collection-bound |
| **SK-V13** | Token-faithful Kit module — Brandion paths as `var(--ds-*)` + `tokenBindings` export (no SwiftUI on `/kit`) |
| **SK-V14** | Public atom CDN (ESM+CSS) — Patterns excluded; see `site-kit-cdn.md` |
| **SK-V15** | Handoff Copy Brandion `:root { --ds-* }` CSS from active-pack / fixture |
| **SK-V16** | Kit Tokens tab embeds EditorTokenStudio; Props + Handoff visual binding boards + Copy CSS |
| **SK-V17** | Props TokenPicker HUD presets + Add binding; path-based tree select for nested nodes |
| **SK-V18** | Handoff read-only package atom source (`Button.tsx` etc.) via catalog storyFile |
| **SK-V19** | Atom source Monaco + links; Props tree node source; Atom~ kind fix |
| **SK-V20** | Handoff seed DiffEditor — catalog base playground TSX vs current (fork / dirty) |
| **SK-V21** | Resizable Kit Playground columns (nav / editor / preview) + session persist |
| **SK-V22** | Starter Sections nav group (`Composition:Landing*`) — read-only browse/handoff, not Kit SSOT |
| **SK-V23** | Usable page height (≥1200px body) + Collection picker deferred (Zaoly standalone) |

## SK-V5 requirements

14. WHERE Site Kit Center / Library / Publish chrome mentions Storybook for **daily browse**, the system MUST prefer Kit Playground CTAs and MUST describe Coolify Storybook as **package / CSF hydrate** (not the default catalog).
15. WHEN the user copies a Playground link, the UI MUST briefly confirm success (ephemeral label).
16. Site Kit Center MUST expose a primary **Open Kit Playground** control (not only a footer text link).

9. WHEN a component is selected, the playground MUST show an ephemeral **Props** pane for the composition root (string / number / boolean props). Edits MUST regenerate seed-shaped TSX and update the preview without writing SSOT.
10. WHEN the user clicks **Copy link**, the system MUST copy `kitPlaygroundHref({ componentId, platformProjectId })` to the clipboard (session still required to open).
11. WHERE the nav lists many atoms/patterns, the system MUST offer a client-side search filter.
12. WHEN the user edits TSX, parse/transpile MUST be debounced; optional `sessionStorage` draft keyed by `componentId` MAY restore within the tab until Reset or component change.
13. JSX return extraction MUST tolerate nested parentheses inside the returned tree (balanced scan), not a single non-greedy regex.

## SK-V6 requirements

17. WHEN the user clicks **Open in Editor** with a selection, the system MUST open in-app `/editor` with `platformProjectId` (when bound) and `insertType` (`Site*` atom or `Composition:{exportName}`), then insert once via palette hydrate — MUST NOT write playground TSX into Site Kit SSOT.
18. WHEN a real Collection is bound, the Playground preview MUST fetch `GET /api/brand-tokens` and resolve `tokenBindings` via `resolveNodePaintStyle` (Brandion active-pack or fixture fallback) before `CompositionPreview`.
19. WHERE the preview pane is shown, the system MUST offer Desktop / Tablet / Mobile frame widths from `EDITOR_BREAKPOINT_WIDTHS` (frame only; no breakpoint cascade matrix).
20. WHEN the sandbox is dirty, the UI MUST show a persist hint that changes are ephemeral and durable save is via Editor → Site Kit Publish.

## SK-V7 requirements

21. WHEN `/editor` boots with `insertType`, the system MUST palette-hydrate once per scene+type (idempotent across Strict Mode remounts) and MUST strip `insertType` from the URL after apply.
22. WHERE Patterns are empty or the user wants a durable Pattern, `/kit` MUST offer **Create Pattern in Editor** (Editor-only: Create Master → Save as Site Kit component) and MUST NOT write playground TSX to overrides.
23. WHEN `hint=save-pattern` is present on `/editor`, the system MUST show a dismissible one-shot banner explaining the Pattern save workflow (no auto-save).
24. WHEN the Playground viewport changes, preview paint MUST run deserialize → `cascadeNodeForBreakpoint` → `serializeSiteKitComposition` for that breakpoint (kit SSOT trees remain single-BP flattened; cascade is a no-op until a tree carries `breakpoints`).
25. WHERE Library / Site Kit Center still expose Coolify Storybook, CTAs MUST remain secondary and labeled package/CSF — daily browse stays `/kit`.

## SK-V8 requirements

26. WHEN the system seeds or regenerates Playground TSX via `generateCompositionModule`, the printer MUST emit multi-line open tags (one attribute per line) WHEN there are ≥2 attributes, OR any attribute text length ≥ 48, OR `style` has ≥2 keys; OTHERWISE short single-attribute tags MAY stay one-line.
27. WHEN formatting `style` with ≥2 keys, the printer MUST emit a multi-line style object (one `key: value` per line). Complex array/object prop values MUST pretty-print with 2-space indent WHEN serialized length ≥ 48.

## SK-V9 requirements

28. WHERE the TSX Monaco pane is shown, the system MUST enable React JSX compiler options and MUST disable semantic validation (avoid false-positive red squiggles for Site Kit imports).
29. WHEN the user clicks **Format TSX**, the system MUST regenerate the editor source from the current composition via `generateCompositionModule` (pretty-print) without writing SSOT.
30. WHERE the root composition has `style` keys, the Props pane MUST list them for ephemeral edit (same regenerate path as props).
31. Ephemeral drafts MUST use `zaoly.kit.playground.draft.v2` so pre-pretty-print session drafts do not override readable seeds.

## SK-V10 requirements (Developer Hub — Wave 1 app engineer)

32. WHERE a component is selected on `/kit`, the system MUST show a **Handoff** pane with: identity (`componentId`, kind, exportName, Collection scope), install command (`pnpm add` + `paths.siteKitPackageName`), consumer `importPath`, Brandion token pack status (from active Collection fetch), allowed root props, and copy actions for module / import / install / deep link — MUST NOT write SSOT.
33. WHEN `GET /api/site-kit/playground-source` succeeds, the payload MUST include handoff fields: `packageName`, `importPath`, `installCommand`, `usageImport`, `allowedProps` (root type), plus existing `componentId` / `kind` / `exportName` / `platformProjectId` / `source` / `composition`.
34. WHERE the selection is a Pattern with a real `platformProjectId`, `importPath` MUST be `compositionPackageImportPath(exportName, platformProjectId)` (`@zaoly/site-kit/c/{scopeKey}/{ExportName}`). Atoms and unbound Patterns MUST use `paths.siteKitPackageName`.
35. Expanded playground TSX MUST continue to import **atoms** from the Site Kit barrel so Monaco/transpile/preview work; consumer Pattern import lives in Handoff (`importPath` / `usageImport`), not as the JSX atom import path.
36. Editor Code Export (`code-export-handoff.md`) remains scene/page handoff; `/kit` Handoff is **kit component** handoff — CTAs MUST NOT merge the two surfaces.

## SK-V11 requirements (Developer Hub — Wave 2 kit maintainer)

37. WHERE a component is selected, the Handoff pane MUST show maintainer metadata when available: `updatedAt`, `kitRevision` (`override:{updatedAt}` or `catalog:{componentId}`), `storyTitle`, variant count — MUST NOT invent stale Master status without Editor scene data (fail-closed).
38. WHERE `NEXT_PUBLIC_SITE_KIT_STORYBOOK` is set, Handoff MUST offer Storybook deep-links labeled **package / CSF hydrate** (atom story, Pattern CSF story, and/or Live composition) via `storybook-href.ts` helpers — MUST NOT present Storybook as the daily browse catalog.
39. WHERE Library exists (`paths.routes.library`), Handoff MUST link **Site Kit Center / Library** for Publish workflows; Open in Editor / Create Pattern remain toolbar CTAs.
40. WHEN the user expands **Composition JSON**, the pane MUST show a read-only pretty dump of the current composition tree (copyable) without write APIs.
41. Handoff MUST include a brief Pull hint pointing maintainers to Editor **Pull from Site Kit** (`site-kit-kit-pull.md`) when comparing `kitRevision` — playground MUST NOT call Pull or mutate Masters.
42. `GET /api/site-kit/playground-source` MUST include maintainer fields: `updatedAt`, `kitRevision`, `storyTitle`, `variantCount`, `defaultVariantId` (nullable when absent).

## SK-V12 requirements (Storybook view-token handoff)

43. WHEN the user opens a Storybook CSF or Live link from Kit Handoff and a real Collection `platformProjectId` is bound, the system MUST mint an SK-S1 view token (`POST /api/site-kit/storybook-view-token`) and open the URL via `withSiteKitViewCredentials` — MUST NOT embed long-lived secrets in the static href.
44. WHEN mint fails or no Collection is bound, the system MUST still open the bare Storybook deep-link (best-effort) and MUST NOT block the click.
45. Atom Storybook links MAY open without a view token (public catalog atoms); Pattern Live/CSF SHOULD prefer a minted token when Collection-bound.

## SK-V13 requirements (token-faithful Kit module)

46. WHEN `generateCompositionModule` emits handoff TSX, for each `tokenBindings` entry on a node the printer MUST set the matching `style` key to `var(--ds-{path-with-dashes})` (Brandion CSS export grammar from `knowledge/token-layers.md`) and MUST NOT bake only resolved hex/lengths for those keys.
47. WHEN any node in the tree has `tokenBindings`, the module MUST export a `tokenBindings` const map (Brandion path SSOT keys) so consumers see which paths the component uses — Site Kit atoms forward `style` only (no token path props).
48. WHERE Kit Handoff shows Copy module, the UI MUST note that consumers load Brandion active-pack CSS (`:root { --ds-* }`) for the Collection — Brandion remains SSOT; MUST NOT invent a CREATION token store.
49. `/kit` MUST NOT add SwiftUI (or merge Editor `⌘E` multi-format export) for this wave — Editor Code Export stays scene/page; Kit Module stays Site Kit components + Brandion `--ds-*`.

## SK-V14 requirements (public atom CDN)

50. WHERE Kit Handoff selects an atom, the pane MUST offer a public CDN import snippet from `URL_SITE_KIT_CDN` / `NEXT_PUBLIC_SITE_KIT_CDN` (atoms ESM + CSS only) — see `specs/domain/site-kit-cdn.md`.
51. WHERE Kit Handoff selects a Pattern, the pane MUST NOT claim the Pattern is available on the public CDN.

## SK-V15 requirements (Brandion --ds-* CSS handoff)

52. WHERE Kit Handoff is shown with a loaded token catalog (Brandion active-pack or fixture), the pane MUST offer **Copy Brandion CSS** that emits `:root { --ds-{path-with-dashes}: <digital>; }` using the Brandion CSS export grammar (`knowledge/token-layers.md`) — MUST NOT invent a CREATION token store.
53. WHEN the current composition has `tokenBindings`, the CSS snippet MUST include at least those bound paths (resolved from the catalog); WHEN there are no bindings, the snippet MAY include the full catalog digital leaves available to the Playground.
54. Empty catalogs / unresolved paths MUST yield an empty or unavailable copy state — MUST NOT invent hex values.

## SK-V16 requirements (Kit Token Studio visual)

55. WHERE `/kit` detail tabs are shown, the system MUST offer a **Tokens** tab that embeds `EditorTokenStudio` with the same Brandion pack / catalog as preview paint — MUST NOT invent a second studio or CREATION token store.
56. WHEN the composition has `tokenBindings`, Token Studio MUST accept `highlightPaths` and MUST offer a **Used in module** filter (default on when highlights exist) that marks and prefers those paths.
57. WHERE Kit Handoff is shown, the pane MUST show a visual **Tokens in this module** board (swatch / path / `--ds-*` / preview) for bound paths and a primary **Copy Brandion CSS** control — raw CSS MAY remain collapsible.
58. Token Studio writes on `/kit` MUST use the same Brandion writable rules as the Editor (`isBrandPackPromoteWritable`); fixture packs stay read-only.
59. WHERE the Props pane shows bindable root style slots (`color`, `backgroundColor`, typography, radius, …), the system MUST offer a **TokenPicker** to set or clear `tokenBindings` (ephemeral re-paint + TSX regenerate) — MUST NOT leave those slots as plain text-only inputs when a Brandion catalog is available.

## SK-V17 requirements (Props picker harden + tree select)

60. WHERE Kit Props TokenPickers are shown for `fontSize` / `fontWeight` / `space` / `radius`, the system MUST include the same HUD CSS preset paths (`sz:` / `wt:` / `ln:`) alongside Brandion roles; picking a preset MUST write a free style literal (clearing the binding). `fontFamily` MUST also offer Google Faces as literal picks.
61. WHERE bindable slots from the Kit Props slot map are missing on the selected node, the Props pane MUST offer **Add binding** to insert an unbound TokenPicker row for that slot.
62. WHERE the composition has children, the Props pane MUST show a path-addressed **outline** (`[]` = root) so prop / style / token edits target the selected node — MUST NOT invent stable composition ids.
63. WHEN `CompositionPreview` receives optional `selectedPath` / `onSelectPath`, click MUST select that path and MAY show a light selection outline — Tokens tab / Handoff remain whole-tree.

## SK-V18 requirements (Package atom source)

64. WHERE Kit Handoff shows an **atom** (catalog id or Collection atom fork), the system MUST offer read-only **Package atom source** loaded from `@zaoly/site-kit` via catalog `storyFile` → component `.tsx` (path-confined under `src/components/`) — MUST NOT write SSOT.
65. WHEN the selection is a **Pattern**, Handoff MUST explain that Patterns have no single package atom file and MUST point to Expanded module / Composition JSON (Storybook CSF remains package hydrate).
66. `GET /api/site-kit/atom-source?componentId=` MUST be read-only and MUST reject paths outside the catalog-derived component file.

## SK-V19 requirements (Atom source harden + tree + Atom~)

67. WHERE package atom source is shown, the expanded body MUST use read-only Monaco (same JSX config as the playground seed editor) and MUST offer Copy source, Copy path, Storybook CSF (when origin available), and GitHub blob link via `siteKitGithubBlobUrl` — MUST NOT hardcode GitHub FQDNs in components.
68. WHERE the Props outline selects a catalog `Site*` node, the Props pane MUST show the shared package atom source panel for that node type.
69. WHEN classifying Kit selection kind, Collection atom forks (`Atom~…~Site*`) MUST be **atom**; only composition override ids MUST be **pattern** — MUST NOT use `includes('~')`.

## SK-V20 requirements (Seed diff catalog ↔ current)

70. WHERE Kit Handoff selects an **atom** (catalog id or `Atom~` fork), the pane MUST offer a read-only **seed diff** (Monaco DiffEditor): original = playground seed for the catalog base `Site*` type; modified = the live Handoff module source (including dirty Monaco) — MUST NOT line-diff package `Button.tsx` against composition seed.
71. WHEN the selection is a **Pattern**, the seed-diff control MUST show a note and MUST NOT fetch or invent a package/catalog base diff.
72. Seed-diff base id resolution MUST use `atomBaseTypeFromOverrideId` / catalog lookup — MUST NOT use `includes('~')`.

## SK-V21 requirements (Resizable columns)

73. WHERE `/kit` shows the three-pane body (nav / editor / preview) on desktop widths, the system MUST offer drag handles to resize the nav column and the editor↔preview split — MUST NOT require a new panel library.
74. Column sizes MUST persist in `sessionStorage` under `paths.kitPlaygroundColumnsStorageKey` for the tab session and MUST clamp to min/max limits so panes remain usable. The three-pane row MUST NOT exceed the playground body width (100% of the container) — resize math and CSS MUST keep overflow clipped / shrinkable.
75. WHERE the viewport is narrow (stacked layout), resize handles MUST be hidden.
76. WHERE `/kit` is open, the three-pane body (nav / editor / preview) MUST have a **minimum height** of `paths.kitPlaygroundBodyMinHeightPx` (**1200**). The page MAY scroll the document so the workspace stays usable on short viewports — MUST NOT clamp the kit shell to `100dvh` / `creation-app-frame--contained` (that squeezed columns unusable). Columns MAY still scroll internally inside that min-height.

## SK-V23 requirements (height + no Collection chrome)

77. `/kit` MUST NOT show a Collection / platform-project picker until Zaoly ships a real Collections product surface. Deep-link `platformProjectId` MAY still be accepted quietly for scoped pattern fetch; default is unbound (catalog atoms + starter sections only).
78. Handoff MAY omit or soften Collection metadata when unbound — MUST NOT imply a Collections hub exists.

