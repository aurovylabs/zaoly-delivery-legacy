# Editor performance & rendering — CREATION v3 (Wave 7 + 8)

**Status:** Accepted — 2026-09-01 (Wave 7) · Wave 8 rendering quality · Wave 9 expand cache · Wave 10 selection + inspector · Wave 11 write ops · Wave 12 design panel · Wave 13 design code split · Wave 14 CSS code split · Wave 15 shell banners 2026-09-02  
**Parent:** `specs/domain/editor-workspace.md` · **Board:** `specs/domain/scene-board.md`  
**Tasks:** `tasks/wave7-editor-performance.md` · `tasks/wave8-editor-rendering-quality.md` · `tasks/wave9-editor-expand-cache.md` · `tasks/wave10-selection-context-inspector-split.md` · `tasks/wave11-inspector-design-panel.md` · `tasks/wave12-inspector-design-panel.md` · `tasks/wave13-inspector-code-split.md` · `tasks/wave14-inspector-css-code-split.md` · `tasks/wave15-inspector-shell-banners.md`

## Goal

Reduce editor jank during pan/zoom and multi-page board paint without changing composition semantics or P82 selection memo rules.

## Wave A — Viewport gestures

| ID | Requirement |
|----|-------------|
| **P83** | WENN der Designer pan/zoom/marquee ausführt, DANN MUST der Editor viewport-Updates (`panX`, `panY`, `zoom`) höchstens **einmal pro Animation Frame** in React-State committen (RAF batch). |
| **P84** | WENN nur `panX`/`panY` sich ändern (Zoom unverändert), DANN MUST Selection-Handles ihre Screen-Position per **Pan-Delta-Offset** aus der letzten Messung ableiten — kein `getBoundingClientRect` pro Pan-Frame. |
| **P85** | WENN Zoom, Selection, Scene-Revision oder Artboard-Breite sich ändern, DANN MUST eine volle Selection-Bounds-Messung laufen. |
| **P86** | WENN ein Pan-Gesture endet, DANN MUST eine abschließende Bounds-Messung laufen. |
| **P87** | Viewport-State (`zoom`, `pan`, `marquee`, Hand/Space) MUST in `useEditorViewportState` leben; Document-State bleibt in `useEditorSceneState`. |

## Wave B — Board active-page-first

| ID | Requirement |
|----|-------------|
| **P88** | WENN Scene-Board-Mode aktiv ist, DANN MUST der Editor **alle** Page-Frames mit vollem Content painten (`lazyInactivePages` default **off**). Aktiver Frame behält stärkeres Chrome (`data-page-frame-active`). Opt-in: Aufrufer dürfen `lazyInactivePages: true` setzen (Chrome + Placeholder) für Perf-Experimente. |
| **P89** | `shouldLazyPaintInactiveBoardPages` MUST im Editor **false** liefern (Produkt-Default: alle Artboards sichtbar). |
| **P90** | Placeholder-Aktivierung folgt `resolveSceneBoardClick` (P81) — wenn Lazy opt-in aktiv ist, aktiviert Klick die Page und selektiert `page.root.id`. |
| **P91** | Inaktive Page-Frame-Bodies MUST `content-visibility: auto` erhalten (CSS), wo der Frame gerendert wird. |

## Wave A — Stable canvas callbacks

| ID | Requirement |
|----|-------------|
| **P92** | `EditorCanvasChrome` MUST Scene-Node-Callbacks über `useEditorCanvasCallbacks` (stable `useCallback` + Refs) an `SceneNodeView` durchreichen — keine Inline-Lambdas, die `SceneNodeView`-Memo pro Render invalidieren. |

## Wave C — Rendering quality (Wave 8)

| ID | Requirement |
|----|-------------|
| **P93** | Hub-Thumbnails (`preview-html`) und Playwright-Preview MUST dieselbe HTML-Pipeline nutzen (`serializeSiteKitComposition` + `buildScenePreviewHtml`) und Scene-Fonts als Google-Fonts-`<link>` injizieren (Literal + aufgelöste Token-Families wenn Catalog vorhanden). |
| **P94** | `useSceneGoogleFonts` MUST nur Fonts der **aktiven Page** und des **aktiven Breakpoints** laden (Breakpoint-Overrides inklusive; keine Fonts aus anderen Breakpoint-Lanes). |
| **P95** | Selection-Handles MUST Device-Pixel-Ratio-aware Größen nutzen (`--creation-selection-handle-*` CSS vars auf Canvas-Shell) — scharfe Ecken bei 125–200 % OS-Zoom / Retina. |
| **P96** | WENN `activeBreakpoint === 'print'`, DANN MUST der Canvas-Shell `data-print-channel="true"` tragen und Print-Channel-CSS (Papier-Hintergrund, Print-Artboard-Chrome) aktivieren. |

**Tasks:** `tasks/wave8-editor-rendering-quality.md` · **Preview:** `specs/domain/scene-preview.md`

## Wave D — Expand cache + layers (Wave 9)

| ID | Requirement |
|----|-------------|
| **P97** | `expandSceneTree` / `expandCompositionScene` / board paint expand MUST per Scene-Revision gecacht werden (LRU, bounded); Cache-Key = `sceneDocumentFingerprint` + Operation + Subtree-/Board-Parameter. Master-Edit variant board expand MUST also include a **paintKey** (active variant id + axis filters) because those are UI-only and do not bump the scene fingerprint — otherwise switching the active tile keeps stale active/inactive chrome. |
| **P98** | Layers-Panel MUST den Baum-Mapping-Output memoizen und Layer-Rows `content-visibility: auto` erhalten ab Editor-CSS (Scroll-Performance großer Scenes). |

## Wave E — Selection context (Wave 10)

| ID | Requirement |
|----|-------------|
| **P99** | Canvas selection MUST sync into `editor-selection-store` (`ReadonlySet` + revision) via `EditorSelectionSync`; Layers/Inspector/Handles continue to consume React `selectedIds[]` SSOT from scene state. |
| **P100** | `SceneNodeView` MUST NOT receive `selectedIds` as a drilled prop. Each node reads selection via `useSceneNodeSelected(nodeId)` (selective `useSyncExternalStore` subscription). Memo compare MUST omit selection array references; only `selected: boolean` on the memo boundary. |
| **P101** | WENN die Selection zwischen zwei Descendants wechselt, DANN MUST im selben Commit nur die betroffenen Nodes (alt + neu selektiert) re-rendern — nicht der gesamte Baum. P82 Chrome/Layers/Inspector-Konsistenz bleibt unverändert. |

## Wave F — Inspector split (Wave 10)

| ID | Requirement |
|----|-------------|
| **P102** | `EditorInspector` MUST live under `components/editor-inspector/` (shell `index.tsx`). Shared field helpers in `lib/inspect/inspector-field-values.ts`; CSS tab and collapsible section primitives as separate modules. |
| **P103** | Design- vs CSS-Tab MUST lazy mount (CSS panel only when tab active; collapsible sections only render body when open — existing P64 behaviour preserved). |

## Wave G — Inspector write ops (Wave 11)

| ID | Requirement |
|----|-------------|
| **P104** | Inspect write paths (`writeProp`, `writeLiteral`, `setToken`) MUST build ops via `lib/inspect/inspector-write-ops.ts` + `useInspectorWrites` — testable, no inline op assembly in shell. |
| **P105** | Token preview helpers MUST live in `inspector-preview-helpers.ts`; design field renderer extraction tracked for follow-up wave. |

## Wave H — Inspector design panel (Wave 12)

| ID | Requirement |
|----|-------------|
| **P106** | Design-tab field rendering (`renderField`, `renderSectionFields`, grouped helpers) MUST live in `use-inspector-field-renderer.tsx`; shell MUST NOT inline field JSX. |
| **P107** | Design-tab chrome (filter, variant axes, sections, remove) MUST live in `inspector-design-panel.tsx` and mount only when the Design tab is active (P103 lazy mount preserved). |

## Wave I — Inspector code split (Wave 13)

| ID | Requirement |
|----|-------------|
| **P108** | Design tab MUST load via `next/dynamic` (`inspector-design-tab-lazy.tsx`, `ssr: false`). Shell MUST NOT statically import `use-inspector-field-renderer` or grouped inspect field modules. |
| **P109** | `InspectorDesignTab` MUST compose `useInspectorFieldRenderer` + `InspectorDesignPanel` inside the lazy chunk. Vitest MUST mock `next/dynamic` (`test/mocks/next-dynamic.tsx`) so inspector tests stay synchronous. |

## Wave J — Inspector CSS code split (Wave 14)

| ID | Requirement |
|----|-------------|
| **P110** | CSS tab MUST load via `next/dynamic` (`inspector-css-tab-lazy.tsx`, `ssr: false`). Shell MUST NOT statically import `peekResolvedCss` or `inspector-css-panel`. |
| **P111** | `InspectorCssTab` MUST compute `peekResolvedCss` + copy state inside the lazy chunk; presentational UI stays in `inspector-css-panel.tsx`. Vitest `next/dynamic` mock MUST resolve CSS and Design chunks synchronously. |

## Wave K — Inspector shell banners (Wave 15)

| ID | Requirement |
|----|-------------|
| **P112** | Promote-from-literal flow MUST live in `use-inspector-promote.ts` + `inspector-promote-dialog.tsx`; shell MUST NOT inline Brandion PATCH logic or promote dialog JSX. |
| **P113** | Site Kit save-composition banner MUST live in `inspector-site-kit-banner.tsx` with internal busy/status state; shell passes selection + catalog context only. |

## Non-goals (Wave 7–15)

- Canvas/WebGL-Umstellung
- Layers-Panel-Virtualisierung
- Full React-canvas ↔ preview-html pixel parity (Site-Kit HTML path only)

## Acceptance

1. Unit tests: RAF viewport commit, pan-delta bounds offset, lazy board paint threshold.
2. Wave 8: preview font links, breakpoint-scoped font collect, selection-handle chrome vars, print-channel attribute.
3. Wave 9: expand-cache hit tests, layers memo + content-visibility.
4. Wave 10: selection-store selective notify tests; memo without `selectedIds`; inspector imports from `editor-inspector/`.
5. Wave 11: `inspector-write-ops` unit tests; shell uses `useInspectorWrites`.
6. Wave 12: design panel + field renderer modules; shell ≤700 LOC; design tab lazy mount.
7. Wave 13: design tab dynamic import; field renderer in lazy chunk; vitest `next/dynamic` mock.
8. Wave 14: CSS tab dynamic import; `peekResolvedCss` in lazy chunk; shell ≤550 LOC.
9. Wave 15: promote dialog + Site Kit banner modules; shell ≤450 LOC.
10. `scene-board.test.ts` lazy paint + editor smoke unchanged (modulo pre-existing failures).
11. Spec inventory includes `editor-performance.md`.
