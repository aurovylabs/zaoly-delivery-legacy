# Zaoly Public FAQ

**Status:** Accepted · 2026-10-05  
**Product:** Zaoly standalone · **Route:** `/faq` · **Related:** `zaoly-landingpage-concept.md`, `zaoly-standalone.md`, `zaoly-token-studio.md`, `zaoly-user-management.md`

## Purpose

The public FAQ clarifies how Zaoly works for designers, developers, and teams after the landing page has introduced the product. It is an editorial explanation, not an authenticated help center or a new application surface.

## Route and navigation

1. `GET /faq` MUST be public without a database or session; other methods remain gated. The route is defined in `apps/web/lib/paths.ts`, documented in `knowledge/paths.md`, and linked from the landing header/footer.
2. The FAQ header MUST lead back to the public landing page and retain the primary Editor CTA. Its bottom CTA MUST link to `/editor` through `paths.routes.editor`.
3. The page MUST have its own title and description metadata. Questions and answers MUST be present in server-rendered markup; native disclosure elements MAY progressively reveal answers without client JavaScript.
4. The public FAQ MUST be available in German and English. Its visible language switch MUST use the shared persisted locale preference; navigation, topic index, every question and answer, CTA, accessibility labels, and metadata MUST match the selected language.

## Content contract — researched deep version

The FAQ MUST explain six groups with substantial, product-specific answers. Each answer SHOULD begin with a direct answer and then explain the workflow, scope, and material limit. Short lists or a concrete example MAY clarify multi-step features; content must remain scannable when opened.

1. **Produktmodell:** Zaoly is a standalone editor. Define the difference between an independent project, a persisted composition/scene, and pages inside that composition. Describe a first workflow from canvas to reusable component. No Collection or suite federation dependency.
2. **Editor & Kit:** Explain pages, layers, artboards, Desktop/Tablet/Mobile editing, Kit atoms, scene-local Masters/Instances, named variants, and the Kit Playground. A Master edit updates its Instances in the same composition; it is not a live shared Master across every project. The Playground's TSX draft/preview is not a package publish.
3. **Token Studio:** Explain the default starter pack, fixture/override/custom origins, value types, editing tools, and Cards/JSON/CSS views. Admin JSON import must describe dry-run preview before applying; CSS export is not CSS import. A bound token path such as `color.action.primary` resolves in the editor from the local pack; changed values are fetched when loading or refocusing the editor. External apps and already exported files are not pushed automatically.
4. **Zusammenarbeit & Verlauf:** Explain local owner/editor/viewer permissions for a shared composition, team presence, node comments, named versions, and the difference between a saved version and in-session undo. Do not imply public anonymous editing or guaranteed conflict-free merging.
5. **Übergabe & Qualität:** Distinguish editor selection/page/all-pages code export from Kit Playground component handoff. Describe React module, install/import/token context, Copy Code vs Copy pack, and the developer's integration work. Mention the editor's other export views only as separate representations, not directly portable Kit modules. Explain readiness/linter checks with concrete examples and make clear that passing them is not a production certification.
6. **Zugang & Betrieb:** Explain invite-only local accounts, admin rights for token writes, and that multi-user operation uses the Zaoly database. Do not promise self registration, SSO, automatic invitation email delivery, uptime guarantees, or external brand-pack connectivity.

No answer may promise automatic publication, live external synchronization, unlimited framework targets, self-service signup, or upstream brand-pack integration. Answers must not imply that work in the Kit Playground automatically persists as a published component.

## Product evidence used for the answers

- Product/document model: `zaoly-standalone.md`, `zaoly-composition-persistence.md`, `scene-pages.md`, `editor-workspace.md`.
- Reuse and Kit: `composition-masters.md`, `site-kit-playground.md`, `apps/web/components/kit-playground/kit-playground-handoff.tsx`.
- Tokens: `zaoly-token-studio.md`, `zaoly-starter-token-pack.md`, `apps/web/components/token-studio-hub.tsx`, `apps/web/lib/inspect/token-catalog.ts`.
- Collaboration and history: `zaoly-scene-share.md`, `editor-version-history.md`, `apps/web/components/editor-comments-panel.tsx`.
- Handoff and checks: `code-export-handoff.md`, `apps/web/components/editor-code-export-dialog.tsx`, `apps/web/lib/codegen/export-ready.ts`, `apps/web/lib/linter/scene-linter.ts`.
- Access: `zaoly-user-management.md`, `zaoly-composition-persistence.md`.

## Design and accessibility

- The page follows the landing palette and Japanese-inspired calm: warm paper, dark ink, limited cobalt, square geometry, generous spacing, and no decorative animation.
- A large typographic opening establishes the page purpose. An in-page topic index leads to six numbered groups; questions use native `details`/`summary` with visible keyboard focus and a clear open state. The first answer of each group is open on initial render so the page exposes useful substance without an interaction. Independent disclosure state follows the accessible FAQ disclosure pattern.
- Deeper answers may contain paragraphs, short lists, and one example/caveat callout. These are rendered with semantic HTML inside each disclosure, not as a wall of text or nested paragraph elements.
- Mobile uses one column without horizontal overflow. The FAQ keeps the question hierarchy and answer text readable. Any decorative symbol is hidden from assistive technology.

## Acceptance

- UI smoke checks the six groups, researched product boundaries, canonical links, and native disclosure semantics.
- Middleware contract checks public GET and gated POST for `/faq` while `/editor` stays gated.
- Specs inventory includes this file; build validation confirms both public routes render.
